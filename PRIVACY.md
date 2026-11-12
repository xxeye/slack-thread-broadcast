# Privacy Policy — Thread Broadcast for Slack

Last updated: 2026-11-12

Thread Broadcast for Slack does two small things in Slack in your browser: it checks the "Also send to channel" box when you reply in a thread, and it picks the channel you are in when you forward a message.

- It does not collect or send any data: no messages, no account details, no usage statistics.
- It makes no network requests and has no server.
- It runs only on `https://app.slack.com/client/*`, and only touches the "Also send to channel" checkbox and the recipient box of the forward dialog. It does not read your messages.
- It saves two on/off settings (one per feature) with Chrome sync storage, so they follow your Chrome profile. Nothing else is stored.

The source code is short and public: https://github.com/xxeye/slack-thread-broadcast

Questions: https://github.com/xxeye/slack-thread-broadcast/issues

---

# 隱私政策 — Thread Broadcast for Slack

最後更新：2026-11-12

Thread Broadcast for Slack 在瀏覽器版 Slack 做兩件小事：回覆討論串時幫你勾「也傳送到頻道」，轉寄訊息時幫你選目前所在的頻道。

- 不收集、不傳送任何資料，包括訊息、帳號資料、使用統計。
- 不連線到任何地方，也沒有伺服器。
- 只在 `https://app.slack.com/client/*` 執行，只動「也傳送到頻道」勾選框和轉寄視窗的收件對象，不讀你的訊息。
- 只儲存兩個開關設定（每個功能一個），存在 Chrome 同步儲存空間，跟著你的 Chrome 帳號；其他什麼都不存。

程式碼很短，公開在：https://github.com/xxeye/slack-thread-broadcast

問題回報：https://github.com/xxeye/slack-thread-broadcast/issues
