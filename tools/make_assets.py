"""產生圖示與商店宣傳圖（Pillow，4 倍取樣再縮小）。用法：python tools/make_assets.py
輸出：icons/icon16|32|48|128.png、docs/store-assets/promo-small-440x280.png、promo-marquee-1400x560.png。
不用 Slack 的 logo、配色；字型用 Windows 內建的 Segoe UI。"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path("C:/Windows/Fonts")
SS = 4  # 超取樣倍率

BG_TOP = (52, 105, 220)     # 藍
BG_BOTTOM = (34, 74, 176)
WHITE = (255, 255, 255)
MARK = (34, 74, 176)        # 勾號用背景色
BACK = (255, 255, 255, 110)  # 後面那個氣泡（討論串）


def gradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", size, top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        d.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    return img


def glyph(size, simple=False):
    """透明底：氣泡＋勾號；simple（16px）時拿掉後面的氣泡。回傳 RGBA。"""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = s / 96  # 以 96 格設計
    if not simple:
        d.rounded_rectangle([30 * u, 8 * u, 90 * u, 52 * u], radius=12 * u, fill=BACK)
    # 前面的氣泡（含尾巴）
    d.rounded_rectangle([6 * u, 24 * u, 74 * u, 74 * u], radius=14 * u, fill=WHITE)
    d.polygon([(18 * u, 70 * u), (16 * u, 90 * u), (36 * u, 72 * u)], fill=WHITE)
    # 勾號
    w = round((9 if simple else 8) * u)
    d.line([(22 * u, 49 * u), (34 * u, 61 * u), (58 * u, 37 * u)], fill=MARK, width=w, joint="curve")
    for x, y in [(22, 49), (58, 37)]:
        r = w / 2
        d.ellipse([x * u - r, y * u - r, x * u + r, y * u + r], fill=MARK)
    return img


def icon(size):
    """圓角方塊底＋圖案。128 依官方建議：圖案 96、四周留 16 透明邊。"""
    s = size * SS
    pad = round(s * (16 / 128)) if size >= 48 else 0
    inner = s - 2 * pad
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bg = gradient((inner, inner), BG_TOP, BG_BOTTOM).convert("RGBA")
    mask = Image.new("L", (inner, inner), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, inner - 1, inner - 1], radius=round(inner * 0.22), fill=255)
    out.paste(bg, (pad, pad), mask)
    g = glyph(size, simple=size <= 16)
    gs = round(inner * 0.72)
    g = g.resize((gs, gs), Image.LANCZOS)
    off = pad + (inner - gs) // 2
    out.alpha_composite(g, (off, off + round(inner * 0.02)))
    return out.resize((size, size), Image.LANCZOS)


def promo(size, path):
    w, h = size
    k = h / 280  # 以 440×280 的比例放大
    img = gradient((w * SS, h * SS), BG_TOP, BG_BOTTOM).convert("RGBA")
    d = ImageDraw.Draw(img)
    gs = round(110 * k * SS)
    g = glyph(96).resize((gs, gs), Image.LANCZOS)
    bold = ImageFont.truetype(str(FONTS / "segoeuib.ttf"), round(30 * k * SS))
    reg = ImageFont.truetype(str(FONTS / "segoeui.ttf"), round(19 * k * SS))
    small = ImageFont.truetype(str(FONTS / "segoeui.ttf"), round(14 * k * SS))
    gap = round(22 * k * SS)
    lines = ["• Thread replies to the channel", "• Forward to the current channel"]
    text_w = max([d.textlength("Thread Broadcast", font=bold)] + [d.textlength(s, font=small) for s in lines])
    gx = round((w * SS - (gs + gap + text_w)) / 2)  # 圖案＋文字整組置中
    img.alpha_composite(g, (gx, (h * SS - gs) // 2))
    tx = gx + gs + gap
    cy = h * SS / 2
    d.text((tx, cy - round(46 * k * SS)), "Thread Broadcast", font=bold, fill=WHITE, anchor="ls")
    d.text((tx, cy - round(14 * k * SS)), "for Slack", font=reg, fill=(220, 230, 255), anchor="ls")
    d.text((tx, cy + round(26 * k * SS)), lines[0], font=small, fill=WHITE, anchor="ls")
    d.text((tx, cy + round(48 * k * SS)), lines[1], font=small, fill=WHITE, anchor="ls")
    img.convert("RGB").resize(size, Image.LANCZOS).save(path, optimize=True)


def main():
    (ROOT / "icons").mkdir(exist_ok=True)
    for size in (16, 32, 48, 128):
        icon(size).save(ROOT / "icons" / f"icon{size}.png", optimize=True)
    assets = ROOT / "docs" / "store-assets"
    assets.mkdir(parents=True, exist_ok=True)
    promo((440, 280), assets / "promo-small-440x280.png")
    promo((1400, 560), assets / "promo-marquee-1400x560.png")
    # 預覽：各尺寸圖示並排（不進包）
    prev = Image.new("RGBA", (16 + 32 + 48 + 128 + 100, 148), (245, 245, 245, 255))
    x = 20
    for size in (16, 32, 48, 128):
        prev.alpha_composite(Image.open(ROOT / "icons" / f"icon{size}.png"), (x, 10))
        x += size + 20
    prev.convert("RGB").save(assets / "icon-preview.png")
    print("完成：icons/、docs/store-assets/")


if __name__ == "__main__":
    main()
