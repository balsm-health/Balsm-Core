# Balsm — Responsive layer (Tier 5 · window classes)

Companion to `README.md` §Responsive & Adaptive and `adaptive.css` (§6.5). This layer sits **above** them: it decides shell, containment, panes, overlays, modality and density per *window class*. It never restates a token — every number below is either a window-class token from `responsive.css` or a reference to an existing one.

Code: `responsive.css` · Specimens: `preview/responsive-*.html` (Design System tab → **Responsive**).

## 0 · Window classes

| Class | Width | Reference | Token |
| --- | --- | --- | --- |
| compact | < 600 | 390 × 844 | `--wc-compact-max` 599 |
| medium | 600 – 1023 | 834 × 1194 | `--wc-medium-min/max` |
| expanded | 1024 – 1439 | 1280 × 800 | `--wc-expanded-min/max` |
| wide | ≥ 1440 | 1440 × 900 · 1920 × 1080 | `--wc-wide-min` |
| **short** (modifier) | height ≤ 700 | 1280 × 600 · 800 × 600 | `--wc-short-max` |

- **Minimum window 800 × 600** (`--wc-min-w/h`). The app root is `.wc-app` — `min-width: 320px`, `overflow: auto`, never `overflow: hidden`. Below 800 × 600 the window scrolls in both axes; nothing is clipped, nothing is `position: fixed` taller than 600 − `--shell-topbar-h`.
- Rules are **continuous**: every class rule is a `min-width` range, never a fixed size. Fluid pieces inside a class use `minmax(0,1fr)`, `clamp()`, and `.fluid-*`.
- Relationship to `--bp-*`: those (375 / 480 / 768 / 1024 / 1280 / 1536) remain the **container-query and utility** thresholds (`.adaptive-*`, `.container`, `.grid`, `.card-grid`, `.col-p*`, type escalation). Window classes decide *where things go*; `--bp-*` decide *how a component reflows inside its slot*. 1024 is shared on purpose.
- Detection in JS: `matchMedia('(min-width: 600px)')` etc.; the tokens are unitless px for parity with Flutter `LayoutBuilder`.

## 1 · Navigation shell

Slot: `.wc-shell` → `.wc-shell__nav` + `.wc-shell__main`. Nav sits **below** at compact, **inline-start** column from medium up. Top bar `.wc-topbar` = `--shell-topbar-h` 56 (48 when short).

| Class | Nav | Component | Labels | Icons | Badges |
| --- | --- | --- | --- | --- | --- |
| compact | Bottom bar, `--shell-bottombar-h` 64 + `.safe-bottom`; ≤ 5 destinations | **GAP** — none exists | `--fs-xs` under icon, one line, no ellipsis; drop labels only if 5 items × 390 leave < 64 each (never at ref) | Lucide 24 / 1.75 stroke | Badge dot on icon; count only when ≤ 99 |
| medium | Rail, `--shell-rail-w` 72, full height, inline-start | **GAP** — `ProSidebar` has no rail mode | `--fs-xs` under icon, 2 lines max | 24 | Dot only |
| expanded | Rail 72 | **GAP** (same). Interim: `ProSidebar` at 240 — 1280 − 240 = 1040 ≥ `--container-lg`, acceptable | as rail | 24 | Dot only |
| wide | Sidebar `--shell-sidebar-w` 240 = `ProSidebar` default `width` | `ProSidebar` (unchanged) | Full labels (`ProSidebar` item label 14 / 500, ellipsis) | `ProSidebar` 18 | `ProSidebar` `count` pill (Plex Mono 11) |

**Height-constrained collapse (short):** topbar → 48; `ProSidebar` nav region already scrolls (`overflowY: auto`); group eyebrows stay (collapsing them to dividers is a **gap** — no prop). Workspace switcher and account footer are never scrolled away. Bottom bar never collapses — height is not its constraint.

**Resize across a class boundary:** the active destination is preserved; focus moves to the equivalent item in the new nav component (or to the topbar title if none).

## 2 · Content containment

- **Single column max = `--content-max` = `--container-md` (768).** 840 was the starting point; the type scale argues down: `.fluid-body` caps measure at 68ch ≈ 612–650 px at `--fs-md` 18 px, and 768 − 2 × `--gutter-lg` 48 = 672 holds it exactly. 840 would leave 744 inner — text would float in its own container.
- **Alignment:** `margin-inline: auto` (centred) at expanded and wide; full-bleed within gutters at compact and medium. Gutters = `--gutter` (16 → 24 → 48, escalates in `colors_and_type.css`).
- **Remaining space (expanded/wide):** `.wc-canvas` painted `--balsm-cream-50`. Empty. No pattern (watercolour never inside product chrome), no decorative rules. At 1920 with sidebar 240: (1920 − 240 − 768) / 2 = 456 per side.
- **Multi-column grid `.wc-grid`:**

| Class | Columns | Gap | Gutter | Max |
| --- | --- | --- | --- | --- |
| compact | 4 (`--cols-mobile`) | `--space-4` 16 | `--gutter` 16 | fluid |
| medium | 8 (`--cols-tablet`) | `--space-6` 24 | 24 | fluid |
| expanded | 12 (`--cols-desktop`) | `--space-8` 32 | 48 | fluid |
| wide | 12 | `--space-8` 32 | 48 | `--content-max-grid` = `--container-xl` 1200, centred |

Column spans inside `.wc-grid`: card decks 4 / 4 / 4 / 3 (→ 1, 2, 3, 4 cards per row — same rhythm as `.card-grid`). `MetricCard` never narrower than 4 columns at compact.

## 3 · Pane behaviour

Slot: `.wc-panes` with children `data-pane="list|detail|inspector"`; `data-focus="list|detail"` on the container records which pane the user is in.

| Class | Layout | List width | Ratio at reference |
| --- | --- | --- | --- |
| compact | Stacked. Detail is a pushed route (200 ms cross-fade, `--dur-base`). Back restores list scroll offset. | 100% | — |
| medium | Two-pane | `--pane-list-md` = `--pane-aside` 18rem (288) | 288 : 546 ≈ 35 : 65 at 834 |
| expanded | Two-pane | `--pane-list-lg` 20rem (320) | 320 : 960 = 25 : 75 at 1280 (interim with sidebar 240: 320 : 720) |
| wide | Two-pane, or three-pane `.wc-panes--3` | `--pane-list-xl` 22rem (352), inspector `--pane-inspector` 22rem (352) | 352 : 496 : 352 at 1440 − 240 sidebar; 352 : 976 : 352 at 1920 |

- List never below `--pane-list-min` (288) and never above 40 % of the pane container; detail is always the flexible track (`minmax(0,1fr)`).
- **Focus on resize:** the pane containing `document.activeElement` keeps it. Shrinking into compact with `data-focus="detail"` shows detail alone (list hidden); with `data-focus="list"` shows list. Growing into medium re-shows both; focus does not move. Removing the inspector (wide → expanded) moves its content into a collapsed section at the end of detail and focus to detail's heading.
- **Three-pane is wide-only.** Below 1440 the inspector never renders as a column — it folds into detail (above) or opens as an overlay per Layer 4.
- Short windows: no pane rule changes; pane headers use the topbar height rule (48).

## 4 · Overlay resolution

Component: `Modal` (`components/Modal`). Sizes canonical in `components.css`: sm 380 · md 460 · lg 640 · xl 860 (max-width); max-height `calc(100vh − 48px)`; body scrolls, header/footer pinned; Escape + scrim + × dismiss; focus trap and restore.

| Class | Treatment | Dimensions | Anchor | Dismiss |
| --- | --- | --- | --- | --- |
| compact | Bottom sheet — `Modal`'s built-in `@media (max-width: 520px)` mode | width 100 %, max-height 92vh, radius `--radius-xl` top corners only | bottom, `.safe-bottom` | scrim tap · × · Escape (hardware keyboard). Swipe-down: **gap** |
| medium | Side sheet — **GAP** (no component). Interim: centred `Modal` md | spec: width `--sheet-side-w` 400 (min(400, 100vw − 2 × `--gutter-md`)), full height | inline-end (mirrors in RTL) | scrim · × · Escape |
| expanded | Centred `Modal` | by `size`; lg/xl for forms and pickers | viewport centre; scrim padding 24 | scrim · × · Escape |
| wide | Centred `Modal` | same; never wider than 860 regardless of window | centre | same |

- **520 vs 600:** `Modal` switches to sheet at 520, not at the compact boundary. Windows 521–599 get a centred 460 dialog with 24 px scrim padding — it fits, but the class boundary is inconsistent. Logged as a gap; not changed here.
- **Short windows:** `Modal` max-height already `100vh − 48`; at 600 tall that is 552 — lg/xl bodies scroll internally. Never let a sheet exceed 92vh.
- **`closeOnScrim={false}`** flows (dispense confirmation, controlled-substance sign-off) keep that setting in every class.

## 5 · Input modality

Modality is **detected**, never inferred from width. Query: `(pointer: fine) and (hover: hover)` → pointer; `(pointer: coarse)` → touch; `(any-pointer: fine)` on a coarse primary → hybrid (touch targets, hover allowed). Listen with `matchMedia().addEventListener('change')` — a tablet gaining a trackpad, or a 2-in-1 folding, switches live without reload.

| Class | Assumed primary | Target | Hover | focus-visible | Scrollbars | Text selection | Right-click |
| --- | --- | --- | --- | --- | --- | --- | --- |
| compact | touch | 48 (`.touch-target` under `pointer: coarse`) | off — gated by `@media (hover:hover) and (pointer:fine)` in `adaptive.css` | keyboard-only (`:focus-visible` on every component) | hidden (`.wc-scroll` on coarse) | `.wc-prose` on, `.wc-chrome` off; buttons/checks/switch already `user-select: none` | none — **gap** (no context-menu component; long-press undefined) |
| medium | **detected** (see above); default to touch until the first fine-pointer event | 48 on coarse, component intrinsic on fine (`--btn-h-md` 38, `--row-h-default` 40; icon-only buttons 44) | pointer only | keyboard-only | hidden on coarse, `scrollbar-gutter: stable` on fine | as compact | browser default on fine — **gap** |
| expanded | pointer + keyboard | intrinsic; 44 for icon-only | on (component `:hover` states) | on | visible, gutter stable | as compact | browser default — **gap** |
| wide | pointer + keyboard | same | on | on | same | same | same |

State references: `Button` hover/active/focus-visible/disabled (`components.css` §Button), `Card` `interactive` hover/active/focus-visible, `Table` `hover` row tint, `Select`/`DatePicker` trigger `:hover`/`:focus-visible`, `Checkbox`/`Switch` focus ring on the input's sibling. No component defines a touch-specific pressed state beyond `:active` — acceptable.

## 6 · Density

Resolved into `--row-h` (`responsive.css`); components read that instead of picking a `--row-h-*` token directly.

| Class | Default | Reason |
| --- | --- | --- |
| compact | comfortable · `--row-h-comfortable` 52 | touch |
| medium | comfortable on coarse · default (`--row-h-default` 40) on fine | detected modality, Layer 5 |
| expanded | default 40 | pointer baseline |
| wide | default 40 | same — wide is more *width*, not more *rows* |

**Override:** `data-density="compact|default|comfortable"` on the app root (user or workspace setting) wins over the class default. **Floor:** on `pointer: coarse`, `compact` (32) is raised to `default` (40) — a 32 px row cannot hold a 44/48 target. `Table` maps `density="dense|md|roomy"` ↔ compact / default / comfortable (naming mismatch → gap).

## 7 · RTL layout rules

Everything in `responsive.css` uses logical properties; set `dir="rtl"` on the root and the shell, panes and overlays mirror without extra rules. Existing rules referenced, not repeated: `[dir="rtl"]` font swap and `.chevron-end` mirror (`colors_and_type.css`), logical helpers `.mis-auto/.mie-auto/.ps-gutter/.pe-gutter` (`adaptive.css`), `ProSidebar` `borderInlineEnd` + `textAlign: start`, `Switch` thumb travel, `DatePicker`/`TimePicker` Arabic month/period labels, `Input` icon slots.

**Mirrors:** shell nav column (inline-start → visually right), bottom-bar item order, list pane (inline-start), inspector pane (inline-end), side sheet anchor (inline-end), Modal × (inline-end) and footer alignment (confirm at inline-end; `footerBetween` swaps), badge pills after labels, `Steps` direction, progress fill direction, directional chevrons (`.chevron-end`), back arrows.

**Does not mirror:** bottom sheet and centred dialog position, the ring mark and wordmark lockup, numerals and codes (Plex Mono, `direction: ltr` inline — NID, phone, batch, `LE 245.00`), time-axis charts (time flows left→right), media/playback controls, clock faces, `Progress` ring rotation, non-directional icons (search, settings, pill, user).

## Gaps found

1. **Bottom bar** — no compact navigation component. Blocks Layer 1 at compact.
2. **Nav rail / collapsed `ProSidebar`** — no 72 px icon-only mode; blocks medium and expanded. Labels-to-dividers collapse for short windows also unavailable.
3. **Side sheet** — no medium overlay component; `Modal` has no `placement`.
4. **`Modal` sheet threshold 520 ≠ compact 600** — 521–599 windows get a dialog.
5. **`Modal` size tokens stale** — `component-tokens.css` `--modal-max-w-sm/md/lg` (480/600/800) disagree with `components.css` + `Modal.d.ts` (380/460/640/860); the latter renders, so it is canonical here. Retire or retune the tokens.
6. **Density naming** — three tokens (`compact/default/comfortable`) vs `Table` `dense/md/roomy`. One vocabulary needed.
7. **Context menu** — no component; right-click and long-press undefined.
8. **Text selection** — no system rule before this layer; `.wc-chrome`/`.wc-prose` are the first.
9. **Icon-mirroring list** — only `.chevron-end` exists; no enumerated list of which Lucide icons flip in RTL.
10. **Bottom-sheet swipe-to-dismiss** — not implemented in `Modal`.
11. **Legacy README breakpoint table** (`xs…2xl`) describes layout contexts ("sidebar nav at lg") that now belong to window classes; should point here.
