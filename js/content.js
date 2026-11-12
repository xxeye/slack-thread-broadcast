/*
	Thread Broadcast for Slack
	Based on slack-thread-to-channel-checker by Adam Pritchard (BSD 3-Clause, see LICENSE).

	兩個功能，各自可在 popup 開關（chrome.storage.sync，預設都開；使用者 2026-11-12）：
	1. autoBroadcast：討論串回覆框（頻道、私訊都算）的「也傳送到…」沒勾就幫忙勾。
	   使用者自己取消（滑鼠或鍵盤），這則就不勾；回覆框從有字變空（送出）後恢復自動勾。
	2. forwardCurrent：打開「轉寄此訊息」時，收件對象自動選目前所在的頻道；使用者可以自己移除。

	Slack 的 DOM（2026-11-12 查）：
	- 勾選框 input[data-qa="threads_footer_broadcast_checkbox"]，在 [data-qa="reply_container"] 裡。
	- 回覆框 [data-qa="message_input"] 裡的 .ql-editor；空白時有 ql-blank。
	- 要用 click() 才會改到 Slack 的狀態，直接設 checked 沒用。
	- 轉寄視窗：[data-qa="share_dialog_channel_picker"] 裡的 combobox
	  [data-qa="share_dialog_channel_picker-input"]（contenteditable）；輸入文字後出現
	  [role=listbox] [role=option]，選項 HTML 裡有頻道 ID；選好後出現 [data-qa="multi_select_token_wrapper"]。
	- 目前的頻道：網址 /client/<工作區>/<頻道 ID>；名稱取自分頁標題「名稱 (頻道) - …」。

	原版失效的原因：等 window 'load' 才開始，但 content script 預設在 document_idle 注入，
	常常已經過了 load，計時器就沒啟動。
*/
(() => {
	const CHECKBOX = 'input[data-qa$="_broadcast_checkbox"]';
	const CONTAINER = '[data-qa="reply_container"]';
	const EDITOR = '[data-qa="message_input"] [contenteditable="true"]';
	const PICKER = '[data-qa="share_dialog_channel_picker"]';
	const PICKER_INPUT = '[data-qa="share_dialog_channel_picker-input"]';
	const PICKER_TOKEN = '[data-qa="multi_select_token_wrapper"]';
	const INTERVAL_MS = 300;
	const OPTION_WAIT_MS = 3000;

	const settings = { autoBroadcast: true, forwardCurrent: true };
	// 設定讀完才開始（避免使用者關掉的功能在讀到設定前先動作一次）
	const loadSettings = (callback) => {
		let started = false;
		const done = () => {
			if (!started) {
				started = true;
				callback();
			}
		};
		try {
			chrome.storage.sync.get({ ...settings }, (saved) => {
				for (const key of Object.keys(settings)) settings[key] = saved?.[key] !== false;
				done();
			});
			chrome.storage.onChanged.addListener((changes, area) => {
				if (area !== 'sync') return;
				for (const key of Object.keys(settings)) {
					if (changes[key]) settings[key] = changes[key].newValue !== false;
				}
			});
		} catch (e) {
			done(); // 讀不到設定就用預設（都開）
		}
	};

	// ---- 1. 自動勾「也傳送到…」 ----

	// 每個回覆框：{ optOut: 使用者這則取消了, hadText: 目前有沒有字 }
	const states = new WeakMap();
	const stateOf = (container) => {
		let s = states.get(container);
		if (!s) {
			s = { optOut: false, hadText: false };
			states.set(container, s);
		}
		return s;
	};

	const hasText = (container) => {
		const editor = container.querySelector(EDITOR);
		return Boolean(editor) && !editor.classList.contains('ql-blank') && editor.textContent.trim() !== '';
	};

	// 回覆框內容一變就更新（不靠定時取樣：快速貼上送出、送出後馬上續寫都抓得到；GPT 審查 af21f81 F1）
	// 有字 → 沒字：送出了（或使用者清空），下一則恢復自動勾
	const syncText = (container) => {
		const s = stateOf(container);
		const text = hasText(container);
		if (s.hadText && !text) s.optOut = false;
		s.hadText = text;
	};

	// 每個回覆框的編輯器各掛一個 MutationObserver（Slack 送出後清空編輯器也是 DOM 變動）
	const watched = new WeakSet();
	const watch = (container) => {
		const editor = container.querySelector(EDITOR);
		if (!editor || watched.has(editor)) return;
		watched.add(editor);
		syncText(container);
		new MutationObserver(() => syncText(container)).observe(editor, {
			childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'],
		});
	};

	// 使用者自己改勾選（滑鼠、鍵盤都是 isTrusted；我們的 click() 不是）
	// 先用當下內容更新 hadText，之前的清空才不會把這次取消當成舊狀態清掉（GPT 審查 af21f81 F2）
	document.addEventListener('change', (event) => {
		const box = event.target;
		if (!event.isTrusted || !(box instanceof HTMLInputElement) || !box.matches(CHECKBOX)) return;
		const container = box.closest(CONTAINER);
		if (container) syncText(container);
		stateOf(container || box).optOut = !box.checked;
	}, true);

	const broadcastTick = () => {
		for (const box of document.querySelectorAll(CHECKBOX)) {
			const container = box.closest(CONTAINER);
			if (container) watch(container);
			const s = stateOf(container || box);
			if (!box.checked && !box.disabled && !s.optOut) box.click();
		}
	};

	// ---- 2. 轉寄時自動選目前的頻道 ----

	const currentConversation = () => {
		const id = location.pathname.split('/')[3] || '';
		const name = document.title.replace(/\s+\([^)]*\)\s+-\s.*$/, '').trim();
		// 頻道 C…、私人頻道 G…；私訊（D…）的選項是對方的使用者 ID，對不到就不選
		return /^[CG][A-Z0-9]+$/.test(id) && name && name !== document.title ? { id, name } : null;
	};

	const handledPickers = new WeakSet();
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	const pickCurrent = async (picker) => {
		handledPickers.add(picker); // 每個轉寄視窗只試一次，使用者移除後不再加回
		const target = currentConversation();
		const input = picker.querySelector(PICKER_INPUT);
		if (!target || !input || picker.querySelector(PICKER_TOKEN) || input.textContent.trim()) return;
		input.focus();
		document.execCommand('insertText', false, target.name);
		// 等待中每一輪都重新確認：功能還開著、視窗還在、搜尋字沒被使用者改、還沒選人（GPT 審查 ec63169 F1）
		const stillOurs = () => settings.forwardCurrent && picker.isConnected && input.isConnected
			&& !picker.querySelector(PICKER_TOKEN) && input.textContent.trim() === target.name;
		// 只看這個 combobox 的選單（aria-controls／aria-owns）；有指定但還沒出現就當沒有選項、繼續等，
		// 只有完全沒指定才退回整頁（GPT 審查 242091f R2 F1）
		const optionsOf = () => {
			const listId = input.getAttribute('aria-controls') || input.getAttribute('aria-owns');
			const root = listId ? document.getElementById(listId) : document;
			return root ? [...root.querySelectorAll('[role="option"]')] : [];
		};
		const deadline = Date.now() + OPTION_WAIT_MS;
		let option = null;
		while (!option && Date.now() < deadline && stillOurs()) {
			await sleep(100);
			if (!stillOurs()) return;
			option = optionsOf().find((o) => o.outerHTML.includes(target.id)) || null;
		}
		if (option && stillOurs()) {
			option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
			option.click();
		} else if (picker.isConnected && input.textContent.trim() === target.name) {
			// 找不到就把打進去的字清掉，恢復原狀
			input.focus();
			document.execCommand('selectAll');
			document.execCommand('delete');
		}
	};

	const forwardTick = () => {
		for (const picker of document.querySelectorAll(PICKER)) {
			if (!handledPickers.has(picker)) pickCurrent(picker);
		}
	};

	const tick = () => {
		if (settings.autoBroadcast) broadcastTick();
		if (settings.forwardCurrent) forwardTick();
	};

	loadSettings(() => {
		setInterval(tick, INTERVAL_MS);
		tick();
	});
})();
