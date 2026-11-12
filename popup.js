// popup：兩個功能的開關，存在 chrome.storage.sync（預設都開）；content script 監聽變更，不用重新整理 Slack。
const DEFAULTS = { autoBroadcast: true, forwardCurrent: true };

for (const el of document.querySelectorAll('[data-i18n]')) {
  el.textContent = chrome.i18n.getMessage(el.dataset.i18n);
}

chrome.storage.sync.get(DEFAULTS, (saved) => {
  for (const key of Object.keys(DEFAULTS)) {
    const box = document.getElementById(key);
    box.checked = saved[key] !== false;
    box.addEventListener('change', () => chrome.storage.sync.set({ [key]: box.checked }));
  }
});
