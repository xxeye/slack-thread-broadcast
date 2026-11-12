"""打包上架用 ZIP：只放白名單裡的檔案，並確認 manifest 引用的檔案都在包裡。用法：python pack.py"""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent
FILES = [
    "manifest.json",
    "js/content.js",
    "popup.html",
    "popup.js",
    "popup.css",
    "_locales/en/messages.json",
    "_locales/zh_TW/messages.json",
]
OUTPUT = ROOT / "dist" / "thread-broadcast.zip"


def main():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    files = FILES + sorted(set(manifest.get("icons", {}).values()))
    refs = [js for cs in manifest.get("content_scripts", []) for js in cs.get("js", [])]
    missing = [f for f in refs if f not in files] + [f for f in files if not (ROOT / f).is_file()]
    if missing:
        raise SystemExit(f"缺檔或沒列進白名單：{missing}")
    OUTPUT.parent.mkdir(exist_ok=True)
    with ZipFile(OUTPUT, "w", ZIP_DEFLATED) as z:
        for name in files:
            info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))  # 固定時間，同樣內容打出同樣的包
            info.compress_type = ZIP_DEFLATED
            z.writestr(info, (ROOT / name).read_bytes())
    print(f"{OUTPUT.relative_to(ROOT)}：{len(files)} 個檔案，版本 {manifest['version']}")
    if "icons" not in manifest:
        print("⚠️ manifest 還沒有 icons，上架前要補")


if __name__ == "__main__":
    main()
