# Thread Broadcast for Slack

A Chrome extension that checks **"Also send to channel"** for you when you reply in a Slack thread, so your replies also show up in the channel.

- Works in Slack in your browser (`app.slack.com`). After installing, reload any Slack tab that was already open.
- Uncheck the box when a reply should stay in the thread. The extension leaves that box alone from then on.
- No settings, no sign-in, no data collected. See [PRIVACY.md](PRIVACY.md).

## Install

- Chrome Web Store: 【coming soon】
- From source: open `chrome://extensions`, turn on Developer mode, click **Load unpacked** and pick this folder.

## Development

```bash
python pack.py              # build dist/thread-broadcast.zip for the store
python tools/make_assets.py # regenerate icons and promo images (needs Pillow)
```

## Credits and license

Based on [slack-thread-to-channel-checker](https://github.com/adam-p/slack-thread-to-channel-checker) by Adam Pritchard, under the BSD 3-Clause License (see [LICENSE](LICENSE)).

Not affiliated with or endorsed by Slack Technologies. Slack is a trademark of Slack Technologies, LLC.

---

# Thread Broadcast for Slack（繁體中文）

Chrome 擴充功能：在 Slack 討論串回覆時，自動幫你勾好「同時傳送到頻道」，回覆也會出現在頻道裡。

- 用在瀏覽器版 Slack（`app.slack.com`）。剛安裝的話，已經開著的 Slack 分頁要重新整理一次。
- 某則回覆只想留在討論串，取消勾選就好，之後這個勾選框不會再被自動勾上。
- 不用設定、不用登入、不收集資料，見 [PRIVACY.md](PRIVACY.md)。

安裝：Chrome 商店【上架後補】；或 `chrome://extensions` 開啟開發人員模式 →「載入未封裝項目」選這個資料夾。

改寫自 Adam Pritchard 的 [slack-thread-to-channel-checker](https://github.com/adam-p/slack-thread-to-channel-checker)（BSD 3-Clause，見 [LICENSE](LICENSE)）。與 Slack Technologies 無關，也未獲其認可。
