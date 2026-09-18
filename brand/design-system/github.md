repo: balsm-health/Balsm-Core
branch: 002-patient-app-security-hardening
path: brand

## Last sync
date: 2026-08-12T12:21:58Z
commit: (see branch head — no commit sha resolved)

### Updated in this project
- **Wordmark recolored again**: navy slate `#1F2D3D` (was pine green `#254B45`) — shares hue with the `.health` TLD (267°/268°) at two lightnesses. Updated in root + `care_app/colors_and_type.css` and README.
- Pulled updated `logo.svg/.png`, `logo-horizontal*`, `logo-vertical*`, `wordmark.svg/.png` — refreshed to match new wordmark color. Petal geometry itself unchanged.
- Refreshed `care_app/assets/logo-vertical.svg`.

### Diverges from upstream (needs a push)
- `brand/colors_and_type.css` — the neutral ink scale was retuned locally from warm olive-gray to cool navy siblings of the `#1F2D3D` wordmark (`ink-900 #2B2B25`→`#14202B`, `ink-600 #6B6B60`→`#526174`, `ink-50 #F6F6F2`→`#F5F6F8`, shadows `rgba(43,43,37)`→`rgba(20,32,43)`). The old olive scale was keyed to the retired pine/olive wordmark. Push this upstream so the repo and this project don't drift.

### Previously updated (2026-08-12 sync, wordmark recolor)
- **Vertical lockup** — redrawn pinwheel/overlapping-petal geometry (`logo-vertical.svg/.png` + `-mono-black/-mono-white/-on-white`).
- **Mono-lockup family** — `icon-mono-black/white`, `logo-horizontal-mono-black/white`, `-on-white` variants, `logo.svg/.png` alias — all present under `brand/`.
- **Wordmark TLD** — `--balsm-wordmark-tld #526174` (slate gray) in root + `care_app/colors_and_type.css` and README.
- **Reverse-lockup naming** — `logo-{vertical,horizontal}-white.png` renamed to `-mono-white.png` throughout (preview card, docs).
- Fonts and `--petal-*` tokens confirmed unchanged from `brand/colors_and_type.css`.

### Note
The `--petal-*` design tokens (aqua/emerald/blue/mint/violet — used across buttons, badges, charts) are intentionally UNCHANGED from the new logo artwork's bespoke 5-color palette. Worth confirming with the Balsm-Core team whether the two should eventually be reconciled.

## Screen map
| Screen/asset | Repo source |
|---|---|
| `components/AnimatedLogo/AnimatedLogo.jsx`, `thumbnail.html` | `brand/icon.svg` (mark geometry + colors) |
| `preview/brand-logo.html` (4 panels) | `brand/logo-vertical.svg`, `brand/logo-vertical-mono-white.png`, `brand/wordmark.svg` |
| `brand/logo-vertical*.{svg,png}` (incl. `-mono-black/white`, `-on-white`) | `brand/logo-vertical*.{svg,png}` |
| `brand/logo-horizontal*.{svg,png}` (incl. `-mono-black/white`, `-on-white`) | `brand/logo-horizontal*.{svg,png}` |
| `brand/icon*.{svg,png}` (incl. `-mono-black/white`) | `brand/icon*.{svg,png}` |
| `brand/logo.{svg,png}` | `brand/logo.{svg,png}` (alias of logo-horizontal) |
| `brand/balsm-background.png` | `brand/balsm-background.png` |
| `colors_and_type.css`, `care_app/colors_and_type.css` (wordmark tokens) | `brand/colors_and_type.css` |
| `balsm-brand-canvas.md` (root, diverged — locked content, not synced) | `brand/balsm-brand-canvas.md` |

## Sync history
- 2026-08-29 — **new mark.** The five-petal flower is retired; the mark is now five figures joined in a ring (`brand/icon.svg`, imported from the `circle` concept set). Every other file under `brand/` is now *generated* from `brand/icon.svg` + `brand/wordmark.svg` by `scripts/brand/build-brand-assets.py` — do not hand-edit them. `AnimatedLogo` and `ProSidebar`'s inline mark were redrawn to match; `--petal-*` tokens and the `PetalSpinner` name are unchanged.
- 2026-08-12T12:21:58Z — wordmark recolor #254B45→#1F2D3D (navy slate) + refreshed logo/wordmark files.
- 2026-08-12T10:16:22Z — pulled new `icon-social*` and `og-image*` assets; icon geometry/colors confirmed unchanged.
- 2026-08-06T16:19:46Z — full re-check (repo-wide + brand/ scoped): no changes beyond what's already pulled; github.md consolidated.
- 2026-08-06T16:13:44Z — re-pulled `logo-vertical*` family (branch head moved again; byte-level re-export, same visual result).
- 2026-08-06T16:10:39Z — vertical lockup geometry redraw (pinwheel/overlapping petals) pulled for `logo-vertical*` files only; horizontal + icon untouched.
- 2026-08-06T15:50:18Z — wordmark-tld recolor (#98A2B3→#526174) + full mono-lockup icon family pulled from `brand/`; fonts/petals/spacing confirmed unchanged.
- 2026-08-06T09:34:38Z — added `brand/wordmark.svg/.png`; confirmed design.md tokens (now superseded by the tld fix above).
- 2026-08-05T20:21:00Z — logo redraw + wordmark recolor pulled from this branch.
- 2026-08-05T20:18:07Z — no changes found (checked `main`, before switching to this branch).
- 2026-08-05T20:07:32Z — logo asset refresh from `main` (superseded — `main` didn't have the real update yet).
