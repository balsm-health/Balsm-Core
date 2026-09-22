#!/usr/bin/env python3
"""Regenerate every derived file in brand/ from the two canonical sources.

    brand/icon.svg      the mark  — five ribbons joined in a ring
    brand/wordmark.svg  the type  — بلسم / Balsm.health

Everything else under brand/ is output: mono variants, lockups, social
avatars, PNG renders, OG images, the background wash, and the LinkedIn
banner set. Change a source, re-run this, commit the result.

    python3 scripts/brand/build-brand-assets.py            # everything
    python3 scripts/brand/build-brand-assets.py svg png    # a subset
    python3 scripts/brand/build-brand-assets.py --check    # verify, write nothing

Groups: svg png og background linkedin components

Requires rsvg-convert (brew install librsvg) for SVG→PNG, and Google
Chrome for the two compositions that contain live text (the banners).
"""

from __future__ import annotations

import math
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / "brand"
FONTS = BRAND / "design-system" / "fonts"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# ── Geometry ──────────────────────────────────────────────────────────
# Ink bounding boxes, measured with getBBox(). Lockups are laid out from
# the ink box, not the viewBox, so padding stays optical rather than
# inherited from whatever the source file happened to be exported with.
MARK_INK = (18.24, 11.42, 712.52, 683.39)        # ink box inside brand/icon.svg
# Rendered ink (rsvg, 16x), not getBBox: the old getBBox box was 0.025 narrow and
# 0.012 high, which left the lockups 0.06 tighter on the wordmark side.
WORD_INK = (3.9989, 4.0057, 112.5619, 46.5559)   # inside brand/wordmark.svg

MARK_AR = MARK_INK[2] / MARK_INK[3]              # 1.0426
WORD_AR = WORD_INK[2] / WORD_INK[3]              # 2.4178

# The ring turns about (374.5, 383), which is 29.88 below the ink-box centre:
# the heads set the box, the top one alone sets its top edge, and the two lower
# ones sit closer to the horizontal. Frames centre the INK BOX, so the padding
# is equal on each axis; centring the rotation axis instead would give the top
# head less room than the sides and read as a mistake.
MARK_RING_CENTRE = (374.5, 383.0)
MARK_RING_RADIUS = 371.570                       # enclosing circle about that centre
MARK_RING_OFFSET = MARK_RING_CENTRE[1] - (MARK_INK[1] + MARK_INK[3] / 2)        # 29.88

# Lockup metrics carried over from the previous mark so the two lockups
# keep their established proportions — only the mark's own aspect moved.
H_PAD, H_GAP, H_ICON_H, H_WORD_H = 16.0, 30.0, 174.168, 139.680
V_CANVAS, V_GAP, V_ICON_H, V_WORD_H = 270.93331, 12.595, 174.166, 63.322
SOCIAL_BOX, SOCIAL_ICON_H = 512.0, 336.85

INK_900 = "#14202B"
PINE = "#254B45"        # OG plate — the one surface still on retired pine
CREAM_100 = "#F4F3EC"
WORDMARK_INK = "#1F2D3D"
WORDMARK_TLD = "#526174"

# The mark's five hues, clockwise from the top, read straight out of
# icon.svg so they cannot drift from it: each ribbon's base stop (the
# gradient's zero, at offset 0.435) and its head's two ends.
HUE_ORDER = ["aqua", "blue", "emerald", "violet", "mint"]


def _hues() -> dict[str, str]:
    found = dict(re.findall(
        r'<linearGradient id="gradient-(\w+)"[^>]*>.*?offset="0\.435" '
        r'stop-color="(#[0-9A-Fa-f]{6})"', MARK_SRC, flags=re.S))
    assert set(found) == set(HUE_ORDER), f"icon.svg hues changed: {sorted(found)}"
    return {k: found[k] for k in HUE_ORDER}


def _head_hues() -> dict[str, tuple[str, str]]:
    """Each head's gradient, light end first — the dot colours."""
    found = {name: (light, dark) for name, light, dark in re.findall(
        r'<linearGradient id="head-(\w+)"[^>]*>\s*<stop offset="0" stop-color="(#[0-9A-Fa-f]{6})"/>'
        r'\s*<stop offset="1" stop-color="(#[0-9A-Fa-f]{6})"/>', MARK_SRC)}
    assert set(found) == set(HUE_ORDER), f"icon.svg head gradients changed: {sorted(found)}"
    return found


def _toward_white(hex_colour: str, t: float) -> str:
    c = [int(hex_colour[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join(f"{round(v + (255 - v) * t):02X}" for v in c)


BAR_ORDER = HUE_ORDER


# ── Source parsing ────────────────────────────────────────────────────
def _inner(svg_text: str) -> str:
    return re.search(r"<svg[^>]*>(.*)</svg>", svg_text, re.S).group(1).strip()


def _reprefix(markup: str, prefix: str) -> str:
    """Namespace every id in a fragment so two marks can share a page."""
    ids = set(re.findall(r'\bid="([^"]+)"', markup))
    for old in sorted(ids, key=len, reverse=True):
        markup = markup.replace(f'id="{old}"', f'id="{prefix}{old}"')
        markup = markup.replace(f"url(#{old})", f"url(#{prefix}{old})")
        # <use href> and gradient href inheritance must follow the rename too
        markup = markup.replace(f'href="#{old}"', f'href="#{prefix}{old}"')
    return markup


def _strip_editor_cruft(markup: str) -> str:
    """Drop Inkscape/Sodipodi attributes — outputs declare no such namespace."""
    markup = re.sub(r'\s(?:inkscape|sodipodi):[\w-]+="[^"]*"', "", markup)
    return re.sub(r"<(?:inkscape|sodipodi):[^>]*>", "", markup)


def _strip_comments(markup: str) -> str:
    """Drop XML comments.

    icon.svg carries a long block explaining the mark to whoever edits it.
    That belongs in the source, not copied into every generated file — the
    background wash alone would embed it six times.
    """
    return re.sub(r"<!--.*?-->\s*", "", markup, flags=re.S)


MARK_SRC = _strip_comments(_inner((BRAND / "icon.svg").read_text()))
WORD_SRC = _strip_comments(_strip_editor_cruft(_inner((BRAND / "wordmark.svg").read_text())))


# ── Ribbon geometry ───────────────────────────────────────────────────
# icon.svg draws one #ribbon path five times, turned 72° about
# MARK_RING_CENTRE. Its 14 cubics, by role (see JOINS & SEAMS in icon.svg):
#   0     leading cap     outer join → inner join
#   1-5   inner edge      inner join → the next copy's inner join
#   6     trailing wedge  inner join → outer join (= the next copy's cap)
#   7-13  outer edge      outer join → the previous copy's outer join
Cubic = tuple[tuple[float, float], ...]
CAP, INNER, WEDGE, OUTER = slice(0, 1), slice(1, 6), slice(6, 7), slice(7, 14)


def _cubics(d: str) -> list[Cubic]:
    """A 'M x y C … Z' path as (p0, c1, c2, p3) cubics."""
    n = [float(v) for v in re.findall(r"-?\d+\.?\d*(?:e-?\d+)?", d)]
    segs: list[Cubic] = []
    cur = (n[0], n[1])
    for i in range(2, len(n) - 5, 6):
        segs.append((cur, (n[i], n[i + 1]), (n[i + 2], n[i + 3]), (n[i + 4], n[i + 5])))
        cur = segs[-1][3]
    return segs


def _rot(p: tuple[float, float], deg: float) -> tuple[float, float]:
    cx, cy = MARK_RING_CENTRE
    t = math.radians(deg)
    x, y = p[0] - cx, p[1] - cy
    return (cx + x * math.cos(t) - y * math.sin(t), cy + x * math.sin(t) + y * math.cos(t))


def _path_d(loops: list[list[Cubic]]) -> str:
    out = []
    for loop in loops:
        out.append(f"M{loop[0][0][0]:.3f} {loop[0][0][1]:.3f}")
        out += [f"C{c1[0]:.3f} {c1[1]:.3f} {c2[0]:.3f} {c2[1]:.3f} {p[0]:.3f} {p[1]:.3f}"
                for _, c1, c2, p in loop]
        out.append("Z")
    return "".join(out)


RIBBON = _cubics(re.search(r'<path id="ribbon" d="([^"]+)"', MARK_SRC).group(1))
assert len(RIBBON) == 14, "icon.svg #ribbon changed shape; update the role slices"
# The trailing wedge is the next copy's cap, control point for control point.
for _a, _b in zip([p for s in RIBBON[WEDGE] for p in s],
                  [_rot(p, 72) for s in reversed(RIBBON[CAP]) for p in reversed(s)]):
    assert math.dist(_a, _b) < 0.01, "icon.svg seams no longer coincide"


def _ring_union_d() -> str:
    """The five ribbons as one path — an outer loop and an inner loop.

    Each copy's outer edge ends exactly where the previous copy's begins (the
    outer join) and each inner edge where the next copy's begins (the inner
    join), so the union outline is those edges chained around the ring; the
    caps and wedges lie inside it. One path, one fill, no anti-aliased seam.
    """
    def turned(k: int, segs: list[Cubic]) -> list[Cubic]:
        return [tuple(_rot(p, 72 * k) for p in s) for s in segs]
    outer = [s for k in (0, 4, 3, 2, 1) for s in turned(k, RIBBON[OUTER])]
    inner = [s for k in (0, 1, 2, 3, 4) for s in turned(k, RIBBON[INNER])]
    return _path_d([outer, inner])


RING_UNION_D = _ring_union_d()


def mark(x: float, y: float, height: float, *, mono: str | None = None,
         prefix: str = "m-", opacity: float | None = None) -> str:
    """The mark, its ink box placed at (x, y) and scaled to `height`."""
    s = height / MARK_INK[3]
    body = MARK_SRC
    if mono:
        # One colour, one shape. Five abutting <use> ribbons sharing a fill
        # leave a faint anti-aliased line along every seam, so swap them for
        # the union outline and drop the gradients.
        body = re.sub(r'<g id="ring">.*?</g>',
                      f'<path id="ring" d="{RING_UNION_D}" fill-rule="evenodd" fill="{mono}"/>',
                      body, flags=re.S)
        body = re.sub(r'<path id="ribbon"[^>]*/>\s*', "", body)
        body = re.sub(r"<(?:linear|radial)Gradient\b.*?</(?:linear|radial)Gradient>\s*",
                      "", body, flags=re.S)
        body = re.sub(r'fill="url\([^)]*\)[^"]*"', f'fill="{mono}"', body)
        # Nothing is stroked today; kept for any future stroke paint.
        body = re.sub(r'stroke="url\([^)]*\)[^"]*"', f'stroke="{mono}"', body)
    body = _reprefix(body, prefix)
    tx, ty = x - s * MARK_INK[0], y - s * MARK_INK[1]
    op = f' opacity="{opacity}"' if opacity is not None else ""
    return (f'<g transform="translate({tx:.4f},{ty:.4f}) scale({s:.6f})"'
            f' aria-label="Balsm"{op}>\n{body}\n</g>')


def wordmark(x: float, y: float, height: float, *, mono: str | None = None) -> str:
    """The wordmark, its ink box placed at (x, y) and scaled to `height`."""
    s = height / WORD_INK[3]
    body = WORD_SRC
    if mono:
        body = body.replace(f'fill="{WORDMARK_INK}"', f'fill="{mono}"')
        body = body.replace(f'fill="{WORDMARK_TLD}"', f'fill="{mono}"')
    tx, ty = x - s * WORD_INK[0], y - s * WORD_INK[1]
    return f'<g transform="translate({tx:.4f},{ty:.4f}) scale({s:.6f})">\n{body}\n</g>'


GENERATED_NOTE = ("<!-- Generated from brand/icon.svg and brand/wordmark.svg by "
                  "scripts/brand/build-brand-assets.py. Do not edit: edit a source "
                  "and re-run. -->")


def svg_doc(w: float, h: float, body: str, *, px_w: float | None = None,
            px_h: float | None = None, label: str = "Balsm") -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{px_w or w:g}" '
        f'height="{px_h or h:g}" viewBox="0 0 {w:g} {h:g}" version="1.1" '
        f'role="img" aria-label="{label}">\n{GENERATED_NOTE}\n{body}\n</svg>\n'
    )


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    print(f"  {path.relative_to(ROOT)}")


# ── Lockups ───────────────────────────────────────────────────────────
def horizontal(mono: str | None = None, prefix: str = "h-") -> str:
    icon_w = H_ICON_H * MARK_AR
    word_w = H_WORD_H * WORD_AR
    w = H_PAD + icon_w + H_GAP + word_w + H_PAD
    h = H_PAD + H_ICON_H + H_PAD
    body = "\n".join([
        mark(H_PAD, H_PAD, H_ICON_H, mono=mono, prefix=prefix),
        wordmark(H_PAD + icon_w + H_GAP, (h - H_WORD_H) / 2, H_WORD_H, mono=mono),
    ])
    return svg_doc(round(w, 4), round(h, 4), body, label="Balsm.health · بلسم")


def vertical(mono: str | None = None, prefix: str = "v-") -> str:
    icon_w = V_ICON_H * MARK_AR
    word_w = V_WORD_H * WORD_AR
    content_h = V_ICON_H + V_GAP + V_WORD_H
    top = (V_CANVAS - content_h) / 2
    body = "\n".join([
        mark((V_CANVAS - icon_w) / 2, top, V_ICON_H, mono=mono, prefix=prefix),
        wordmark((V_CANVAS - word_w) / 2, top + V_ICON_H + V_GAP, V_WORD_H, mono=mono),
    ])
    return svg_doc(V_CANVAS, V_CANVAS, body, px_w=1024, px_h=1024,
                   label="Balsm.health · بلسم")


def social(white_plate: bool) -> str:
    icon_w = SOCIAL_ICON_H * MARK_AR
    s = SOCIAL_ICON_H / MARK_INK[3]
    # Platforms mask this to a circle. The ink box is centred, so the ring
    # centre sits MARK_RING_OFFSET below the frame centre: the enclosing
    # circle has to fit from there.
    assert s * (MARK_RING_RADIUS + MARK_RING_OFFSET) <= SOCIAL_BOX / 2, \
        "social mark too wide for a circular mask"
    plate = (f'<rect x="0" y="0" width="{SOCIAL_BOX:g}" height="{SOCIAL_BOX:g}" '
             f'fill="#FFFFFF" />\n' if white_plate else "")
    body = plate + mark((SOCIAL_BOX - icon_w) / 2, (SOCIAL_BOX - SOCIAL_ICON_H) / 2,
                        SOCIAL_ICON_H, prefix="s-" if not white_plate else "sw-")
    return svg_doc(SOCIAL_BOX, SOCIAL_BOX, body)


def square_icon(size: float, *, mono: str | None = None, fill_frac: float = 0.96,
                prefix: str = "q-") -> str:
    """The mark alone in a square frame — app-icon shaped.

    The ink box is centred, so left == right and top == bottom. The mark is
    wider than tall (MARK_AR), so each top/bottom margin is larger than each
    side margin by (w - h) / 2; no head-up placement can make all four equal.
    """
    h = size * fill_frac / MARK_AR if MARK_AR > 1 else size * fill_frac
    w = h * MARK_AR
    body = mark((size - w) / 2, (size - h) / 2, h, mono=mono, prefix=prefix)
    return svg_doc(size, size, body)


def _svg_outputs() -> dict[Path, str]:
    """Every SVG this script generates, path -> the exact text it should hold.

    Kept as data so `--check` can compare without writing anything.
    """
    return {
        BRAND / "logo-horizontal.svg": horizontal(),
        BRAND / "logo-horizontal-mono-black.svg": horizontal(INK_900, "hb-"),
        BRAND / "logo-horizontal-mono-white.svg": horizontal("#FFFFFF", "hw-"),
        BRAND / "logo.svg": horizontal(prefix="l-"),      # alias of horizontal
        BRAND / "logo-vertical.svg": vertical(),
        BRAND / "logo-vertical-mono-black.svg": vertical(INK_900, "vb-"),
        BRAND / "logo-vertical-mono-white.svg": vertical("#FFFFFF", "vw-"),
        BRAND / "icon-mono-black.svg": square_icon(1024, mono=INK_900, prefix="ib-"),
        BRAND / "icon-mono-white.svg": square_icon(1024, mono="#FFFFFF", prefix="iw-"),
        BRAND / "icon-social.svg": social(False),
        BRAND / "icon-social-white.svg": social(True),
    }


def build_svg() -> None:
    print("svg")
    for path, text in _svg_outputs().items():
        write(path, text)


# ── Rasterising ───────────────────────────────────────────────────────
def _whole_px(text: str, px_w: int) -> tuple[str, int]:
    """Pad the viewBox equally top and bottom so `px_w` wide is a whole number of
    pixels tall. Without it the rounding lands entirely on the bottom edge."""
    root = re.search(r"<svg\b[^>]*>", text).group(0)
    vx, vy, vw, vh = [float(v) for v in
                      re.search(r'viewBox="([^"]+)"', root).group(1).replace(",", " ").split()]
    k = px_w / vw
    px_h = round(vh * k)
    nh = px_h / k
    new = re.sub(r'viewBox="[^"]+"', f'viewBox="{vx:.6f} {vy - (nh - vh) / 2:.6f} {vw:.6f} {nh:.6f}"', root)
    new = re.sub(r'\swidth="[^"]*"', f' width="{px_w}"', new)
    new = re.sub(r'\sheight="[^"]*"', f' height="{px_h}"', new)
    return text.replace(root, new, 1), px_h


def rsvg(src: Path, out: Path, *, width: int | None = None,
         height: int | None = None, background: str | None = None) -> None:
    if width and not height:
        text, px_h = _whole_px(src.read_text(), width)
        with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False,
                                         dir=src.parent) as fh:
            fh.write(text)
            tmp = Path(fh.name)
        try:
            cmd = ["rsvg-convert", str(tmp), "-o", str(out), "-w", str(width), "-h", str(px_h)]
            if background:
                cmd += [f"--background-color={background}"]
            subprocess.run(cmd, check=True)
        finally:
            tmp.unlink()
        print(f"  {out.relative_to(ROOT)}")
        return
    cmd = ["rsvg-convert", str(src), "-o", str(out)]
    if width:
        cmd += ["-w", str(width)]
    if height:
        cmd += ["-h", str(height)]
    if width and height:
        pass  # both given: exact box, source aspect already matches
    else:
        cmd += ["-a"]
    if background:
        cmd += [f"--background-color={background}"]
    subprocess.run(cmd, check=True)
    print(f"  {out.relative_to(ROOT)}")


def rsvg_text(markup: str, out: Path, **kw) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".svg", delete=False) as fh:
        fh.write(markup)
        tmp = Path(fh.name)
    try:
        rsvg(tmp, out, **kw)
    finally:
        tmp.unlink()


def build_png() -> None:
    print("png")
    rsvg_text(square_icon(1024, prefix="p-"), BRAND / "icon.png", width=1024, height=1024)
    rsvg(BRAND / "icon-mono-black.svg", BRAND / "icon-mono-black.png", width=1024, height=1024)
    rsvg(BRAND / "icon-mono-white.svg", BRAND / "icon-mono-white.png", width=1024, height=1024)

    for name in ("icon-social", "icon-social-white"):
        rsvg(BRAND / f"{name}.svg", BRAND / f"{name}.png", width=1024, height=1024)
        rsvg(BRAND / f"{name}.svg", BRAND / f"{name}-400.png", width=400, height=400)

    rsvg(BRAND / "wordmark.svg", BRAND / "wordmark.png", width=1600)

    for name in ("logo-horizontal", "logo-horizontal-mono-black",
                 "logo-horizontal-mono-white", "logo"):
        rsvg(BRAND / f"{name}.svg", BRAND / f"{name}.png", width=1600)
    rsvg(BRAND / "logo-horizontal.svg", BRAND / "logo-horizontal-on-white.png",
         width=1600, background="white")

    for name in ("logo-vertical", "logo-vertical-mono-black", "logo-vertical-mono-white"):
        rsvg(BRAND / f"{name}.svg", BRAND / f"{name}.png", width=1536, height=1536)
    rsvg(BRAND / "logo-vertical.svg", BRAND / "logo-vertical-on-white.png",
         width=1536, height=1536, background="white")


# ── OG images ─────────────────────────────────────────────────────────
OG_W, OG_H, OG_LOCKUP_W = 1200, 630, 705


def og_plate(background: str, mono: str | None, prefix: str) -> str:
    icon_w = H_ICON_H * MARK_AR
    word_w = H_WORD_H * WORD_AR
    lock_w = H_PAD + icon_w + H_GAP + word_w + H_PAD
    s = OG_LOCKUP_W / lock_w
    x, y = (OG_W - OG_LOCKUP_W) / 2, (OG_H - (H_ICON_H + 2 * H_PAD) * s) / 2
    inner = "\n".join([
        mark(H_PAD, H_PAD, H_ICON_H, mono=mono, prefix=prefix),
        wordmark(H_PAD + icon_w + H_GAP,
                 ((H_ICON_H + 2 * H_PAD) - H_WORD_H) / 2, H_WORD_H, mono=mono),
    ])
    body = (f"{background}\n<g transform=\"translate({x:.3f},{y:.3f}) "
            f"scale({s:.6f})\">\n{inner}\n</g>")
    return svg_doc(OG_W, OG_H, body, label="Balsm.health · بلسم")


def build_og() -> None:
    print("og")
    solid = f'<rect width="{OG_W}" height="{OG_H}" fill="{PINE}" />'
    rsvg_text(og_plate(solid, "#FFFFFF", "og1-"), BRAND / "og-image.png",
              width=OG_W, height=OG_H)

    white = f'<rect width="{OG_W}" height="{OG_H}" fill="#FFFFFF" />'
    rsvg_text(og_plate(white, None, "og2-"), BRAND / "og-image-alt-white.png",
              width=OG_W, height=OG_H)

    grad = (
        '<defs><linearGradient id="og-sweep" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#02BBB5"/>'
        '<stop offset="0.6" stop-color="#1283FF"/>'
        '<stop offset="1" stop-color="#724DD0"/></linearGradient></defs>'
        f'<rect width="{OG_W}" height="{OG_H}" fill="url(#og-sweep)" />'
    )
    rsvg_text(og_plate(grad, "#FFFFFF", "og3-"), BRAND / "og-image-alt-gradient.png",
              width=OG_W, height=OG_H)


# ── Background wash ───────────────────────────────────────────────────
BG_W, BG_H = 1500, 500

# Scattered marks, right-weighted: (centre x, centre y, height, rotation, opacity)
BG_MARKS = [
    (1250, 110, 470, -12, 0.11),
    (1490, 340, 620, 18, 0.085),
    (1075, 430, 380, 8, 0.07),
    (1345, 545, 300, -24, 0.055),
    (1500, 30, 250, -6, 0.05),
]


def build_background() -> None:
    print("background")
    parts = [
        '<defs><linearGradient id="bg-wash" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#FBFCFD"/>'
        '<stop offset="1" stop-color="#F2F8FF"/></linearGradient>'
        '<filter id="bg-soft" x="-10%" y="-10%" width="120%" height="120%">'
        '<feGaussianBlur stdDeviation="2.5"/></filter>'
        f'<clipPath id="bg-clip"><rect width="{BG_W}" height="{BG_H}"/></clipPath></defs>'
        f'<rect width="{BG_W}" height="{BG_H}" fill="url(#bg-wash)"/>',
        '<g clip-path="url(#bg-clip)" filter="url(#bg-soft)">',
    ]
    for i, (cx, cy, h, rot, op) in enumerate(BG_MARKS):
        w = h * MARK_AR
        parts.append(
            f'<g transform="rotate({rot},{cx},{cy})">'
            + mark(cx - w / 2, cy - h / 2, h, prefix=f"bg{i}-", opacity=op)
            + "</g>"
        )
    parts.append("</g>")
    rsvg_text(svg_doc(BG_W, BG_H, "\n".join(parts), label="Balsm background"),
              BRAND / "balsm-background.png", width=BG_W, height=BG_H)


# ── LinkedIn banners ──────────────────────────────────────────────────
BANNERS = [
    {
        "slug": "1-identity",
        "accent": "aqua",
        "eyebrow": "Community-Owned Healthcare OS",
        "arabic": "مفتوح. عربي. موثوق.",
        "english": "Healthcare infrastructure built here, for here — and shared freely with the world.",
        "foot": 'Open source · github.com/balsm-health <span class="dot">•</span> <span class="url">balsm.health</span>',
    },
    {
        "slug": "2-openness-sovereignty",
        "accent": "blue",
        "eyebrow": "Openness + Sovereignty",
        "arabic": "بياناتك. بنيتك. قواعدك.",
        "english": "No vendor between you and your care. Nothing held hostage.",
        "foot": "Self-hosted on your own servers",
    },
    {
        "slug": "3-community",
        "accent": "emerald",
        "eyebrow": "Community",
        "arabic": "المنظومة تدوم أطول من أي منتج.",
        "english": "A community with a platform — not a company with users.",
        "foot": "Free to own and run, forever",
    },
    {
        "slug": "4-arabic-first",
        "accent": "violet",
        "eyebrow": "Arabic-First",
        "arabic": "العربية ليست ترجمة — هي الأصل.",
        "english": "Every clinical term designed in Arabic, not localized after the fact.",
        "foot": "PDPL-compliant · Egypt-localized",
    },
    {
        "slug": "5-resilience-excellence",
        "accent": "mint",
        "eyebrow": "Resilience + Excellence",
        "arabic": "أينما تكون — نفس بلسم، نفس الموثوقية.",
        "english": "Reliable wherever you need it. Healthcare deserves better than good enough.",
        "foot": "Offline-first by design",
    },
]

BANNER_W, BANNER_H = 4200, 700

BANNER_HTML = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<style>
@font-face{{font-family:'Montserrat';font-weight:100 900;src:url('{fonts}/Montserrat-VariableFont_wght.ttf') format('truetype')}}
@font-face{{font-family:'IBM Plex Sans';font-weight:100 700;src:url('{fonts}/IBMPlexSans-VariableFont_wdth_wght.ttf') format('truetype')}}
@font-face{{font-family:'IBM Plex Sans Arabic';font-weight:600;src:url('{fonts}/IBMPlexSansArabic-SemiBold.ttf') format('truetype')}}
@font-face{{font-family:'IBM Plex Sans Arabic';font-weight:700;src:url('{fonts}/IBMPlexSansArabic-Bold.ttf') format('truetype')}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px;overflow:hidden}}
body{{background:{cream};font-family:'IBM Plex Sans',sans-serif;position:relative}}

.plate{{position:absolute;inset:0 auto 0 0;width:1100px;
  background:linear-gradient(100deg,rgba(255,255,255,.62),rgba(255,255,255,.18));
  border-right:2px solid #E7E5DA;overflow:hidden}}
.plate svg{{position:absolute;left:-150px;top:50%;transform:translateY(-50%);
  height:760px;width:auto;opacity:.24}}

.content{{position:absolute;left:1265px;top:0;height:100%;
  display:flex;flex-direction:column;justify-content:center;gap:0}}

.eyebrow{{display:flex;align-items:center;gap:26px;margin-bottom:34px}}
.eyebrow i{{display:block;width:58px;height:7px;border-radius:4px;background:{accent}}}
.eyebrow span{{font-family:'Montserrat',sans-serif;font-weight:700;font-size:36px;
  letter-spacing:.17em;text-transform:uppercase;color:#526174}}

.arabic{{font-family:'IBM Plex Sans Arabic',sans-serif;font-weight:700;font-size:108px;
  line-height:1.28;color:#14202B;direction:rtl;unicode-bidi:isolate;text-align:left;
  margin-bottom:26px}}
.english{{font-size:52px;font-weight:400;color:#384756;letter-spacing:-.005em;margin-bottom:34px}}
.foot{{font-size:38px;font-weight:500;color:#526174}}
.foot .dot{{color:#9BA4AD;padding:0 14px}}
.foot .url{{font-family:'IBM Plex Sans',monospace;font-weight:600;color:{blue}}}

.sign{{position:absolute;right:180px;top:50%;transform:translateY(-50%);
  display:flex;flex-direction:column;align-items:flex-end;gap:44px}}
.sign img{{width:390px;display:block}}
.bars{{display:flex;flex-direction:column;gap:22px;align-items:flex-end}}
.bars i{{display:block;height:9px;border-radius:5px}}
</style></head>
<body>
  <div class="plate">{mark}</div>
  <div class="content">
    <div class="eyebrow"><i></i><span>{eyebrow}</span></div>
    <div class="arabic">{arabic}</div>
    <div class="english">{english}</div>
    <div class="foot">{foot}</div>
  </div>
  <div class="sign">
    <img src="{wordmark}" alt="Balsm.health">
    <div class="bars">{bars}</div>
  </div>
</body></html>
"""


def build_linkedin() -> None:
    print("linkedin")
    if not Path(CHROME).exists():
        sys.exit(f"Chrome not found at {CHROME} — needed to render the banners.")
    out_dir = BRAND / "linkedin"
    out_dir.mkdir(parents=True, exist_ok=True)
    bar_widths = [200, 168, 200, 150, 182]
    hues = _hues()
    bars = "".join(
        f'<i style="width:{w}px;background:{hues[k]}"></i>'
        for k, w in zip(BAR_ORDER, bar_widths)
    )
    mark_svg = svg_doc(MARK_INK[2], MARK_INK[3],
                       mark(0, 0, MARK_INK[3], prefix="bn-")).replace(
        f'viewBox="0 0 {MARK_INK[2]:g} {MARK_INK[3]:g}"',
        f'viewBox="0 0 {MARK_INK[2]:g} {MARK_INK[3]:g}"')

    with tempfile.TemporaryDirectory() as tmp:
        tmpd = Path(tmp)
        for spec in BANNERS:
            html = BANNER_HTML.format(
                w=BANNER_W, h=BANNER_H, cream=CREAM_100,
                fonts=FONTS.as_uri(), wordmark=(BRAND / "wordmark.svg").as_uri(),
                accent=hues[spec["accent"]], blue=hues["blue"],
                mark=mark_svg, bars=bars, eyebrow=spec["eyebrow"],
                arabic=spec["arabic"], english=spec["english"], foot=spec["foot"],
            )
            page = tmpd / f"{spec['slug']}.html"
            page.write_text(html)
            out = out_dir / f"banner-{spec['slug']}.png"
            shot = tmpd / "shot.png"
            subprocess.run(
                [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                 "--allow-file-access-from-files", "--force-device-scale-factor=1",
                 "--virtual-time-budget=6000",
                 f"--window-size={BANNER_W},{BANNER_H}",
                 f"--screenshot={shot}", page.as_uri()],
                check=True, capture_output=True,
            )
            shutil.move(shot, out)
            print(f"  {out.relative_to(ROOT)}")


# ── Entry ─────────────────────────────────────────────────────────────
# ── Design-system components ──────────────────────────────────────────
# Two components draw the mark in JSX rather than loading an SVG, because
# they animate its parts: AnimatedLogo moves each ribbon separately, and
# ProSidebar draws a 40 px stylisation. Their geometry and colour are
# generated from icon.svg here so they cannot drift from it again.
COMPONENTS = BRAND / "design-system" / "components"
RIBBON_ROLES = ["top", "right", "lower-right", "lower-left", "left"]
LOGO_PAD = 32.0          # viewBox padding, so the reveal transforms have room
LOGO_REACH = 220.0       # 'magnetic' fly-in distance, unchanged from before


def _animated_logo_data() -> str:
    hues, heads = _hues(), _head_hues()
    head = re.search(r'<circle id="head" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', MARK_SRC)
    hc = (float(head.group(1)), float(head.group(2)))
    hr = float(head.group(3))

    rows = []
    for k, (role, hue) in enumerate(zip(RIBBON_ROLES, HUE_ORDER)):
        d = _path_d([[tuple(_rot(p, 72 * k) for p in s) for s in RIBBON]])
        dot = _rot(hc, 72 * k)
        rows.append(f"  {{ name: '{role}', grad: '{hue}', "
                    f"dot: [{dot[0]:.2f}, {dot[1]:.2f}, {hr:g}], d: '{d}' }},")

    dirs = []
    for k in range(5):
        p = _rot(hc, 72 * k)
        vx, vy = p[0] - MARK_RING_CENTRE[0], p[1] - MARK_RING_CENTRE[1]
        L = math.hypot(vx, vy)
        dirs.append(f"  [{vx / L * LOGO_REACH:.0f}, {vy / L * LOGO_REACH:.0f}],"
                    f"   // {RIBBON_ROLES[k]}")

    vb = (MARK_INK[0] - LOGO_PAD, MARK_INK[1] - LOGO_PAD,
          MARK_INK[2] + 2 * LOGO_PAD, MARK_INK[3] + 2 * LOGO_PAD)
    grad = "\n".join(
        f"  {h}:{' ' * (8 - len(h))}['{hues[h]}', '{_toward_white(hues[h], 0.30)}', "
        f"'{_toward_white(hues[h], 0.78)}']," for h in HUE_ORDER)
    dots = "\n".join(
        f"  {h}:{' ' * (8 - len(h))}['{heads[h][0]}', '{heads[h][1]}']," for h in HUE_ORDER)

    return f"""const B_LOGO_RING_CLIP = '{RING_UNION_D}';

// DOM order clockwise from the top — {', '.join(RIBBON_ROLES)}.
// Each d is #ribbon from icon.svg turned by rotate(72k); every dot is the
// one #head circle turned the same way, so all five are identical.
const B_LOGO_RIBBONS = [
{chr(10).join(rows)}
];

// Ribbon fill: the hue's base stop, then mixed 30% and 78% toward white.
const B_LOGO_GRAD_STOPS = {{
{grad}
}};
// Dot fill: the head gradient's two ends, straight from icon.svg.
const B_LOGO_DOT_STOPS = {{
{dots}
}};
const B_LOGO_GLOW = ['{hues["aqua"]}', '{hues["blue"]}'];

// Hub = the mark's rotation centre. viewBox = its ink box padded {LOGO_PAD:g}
// units a side, so a ribbon flying in from off-mark is not clipped.
const B_LOGO_HUB = [{MARK_RING_CENTRE[0]:g}, {MARK_RING_CENTRE[1]:g}];
const B_LOGO_VIEWBOX = '{vb[0]:.2f} {vb[1]:.2f} {vb[2]:.2f} {vb[3]:.2f}';

// Each ribbon's outward unit-vector × {LOGO_REACH:g}, DOM order — used by the
// 'magnetic' reveal so every ribbon flies in from its own side.
const B_LOGO_DIRS = [
{chr(10).join(dirs)}
];"""


BEGIN = "// ── generated from brand/icon.svg — do not edit by hand ──"
END = "// ── end generated ──"


def _spliced(text: str, block: str, first_anchor: str, last_anchor: str) -> str:
    """Return `text` with the generated region replaced, marking it if absent."""
    body = f"{BEGIN}\n// Re-run: python3 scripts/brand/build-brand-assets.py components\n{block}\n{END}"
    if BEGIN in text:
        return re.sub(re.escape(BEGIN) + r".*?" + re.escape(END), lambda _: body, text, flags=re.S)
    start = text.index(first_anchor)
    end = text.index(last_anchor, start) + len(last_anchor)
    text = text[:start] + body + text[end:]
    # on that first splice the old DIRS array's closing bracket is left behind
    return re.sub(re.escape(END) + r"\n(?:\s*\[-?[\d.]+, -?[\d.]+\],.*\n)*\];\n", END + "\n", text)


def _component_outputs() -> dict[Path, str]:
    """Each JSX component, path -> the text it should hold.

    Pure: reads the files but writes nothing, so `--check` can compare. Applying
    it to an already-generated file reproduces that file exactly.
    """
    logo = COMPONENTS / "AnimatedLogo" / "AnimatedLogo.jsx"
    text = _spliced(logo.read_text(), _animated_logo_data(),
                    "const B_LOGO_RING_CLIP", "const B_LOGO_DIRS = [")
    # the glow's fallback stops are outside the generated block, so patch them
    text = text.replace("stopColor={color || '#00C8D2'}", "stopColor={color || B_LOGO_GLOW[0]}")
    text = text.replace("stopColor={color || '#1283FF'}", "stopColor={color || B_LOGO_GLOW[1]}")

    hues = _hues()
    sidebar = COMPONENTS / "ProSidebar" / "ProSidebar.jsx"
    sidebar_text = re.sub(
        r"// Clockwise from the top:[^\n]*\nconst _MARK_HUES = \[[^\]]*\];",
        "// Clockwise from the top: " + ", ".join(HUE_ORDER) + " — generated from the mark.\n"
        "const _MARK_HUES = [" + ", ".join(f"'{hues[h]}'" for h in HUE_ORDER) + "];",
        sidebar.read_text(), count=1)
    return {logo: text, sidebar: sidebar_text}


def build_components() -> None:
    print("components")
    for path, text in _component_outputs().items():
        write(path, text)


def check() -> None:
    """Fail if any generated text file is out of date with the mark.

    Covers the SVGs and the two JSX components — everything whose content is
    derived and deterministic. PNGs are left out: they go through a rasteriser
    (and, for the banners, a browser), so byte equality is not a fair test.
    """
    print("check")
    stale: list[Path] = []
    for path, expected in {**_svg_outputs(), **_component_outputs()}.items():
        actual = path.read_text() if path.exists() else None
        rel = path.relative_to(ROOT)
        if actual == expected:
            print(f"  ok     {rel}")
        else:
            stale.append(path)
            why = "missing" if actual is None else "out of date"
            print(f"  STALE  {rel}  ({why})")
    if stale:
        sys.exit(f"\n{len(stale)} file(s) no longer match brand/icon.svg. "
                 f"Run: python3 {Path(__file__).relative_to(ROOT)}")
    print("  all generated files match the mark")


GROUPS = {
    "svg": build_svg,
    "png": build_png,
    "og": build_og,
    "background": build_background,
    "linkedin": build_linkedin,
    "components": build_components,
}


def main(argv: list[str]) -> None:
    args = argv[1:]
    if "--check" in args:
        check()
        return
    wanted = args or list(GROUPS)
    unknown = [g for g in wanted if g not in GROUPS]
    if unknown:
        sys.exit(f"unknown group(s): {', '.join(unknown)}\nknown: {', '.join(GROUPS)}")
    if not shutil.which("rsvg-convert"):
        sys.exit("rsvg-convert not found — brew install librsvg")
    for group in wanted:
        GROUPS[group]()


if __name__ == "__main__":
    main(sys.argv)
