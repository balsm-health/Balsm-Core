# Balsm Design

> **Balsm.health · بلسم** — open-source healthcare for Egypt and the Arabic-speaking world. Five petals · five colors · one promise: healing, locally.

This file is the **design contract** for every Balsm surface (Pharmacy, Care app, Doctor encounter, marketing, print). The canonical brand primitives — design tokens, logos, watercolor pattern, brand canvas — live flat in [brand/](brand/) in this repo. The full design *system* (long-form manual, UI kits, preview cards, care-app prototype) lives beside them in [brand/design-system/](brand/design-system/). The **`balsm-design` skill** in the shared `balsm-ai` plugin points at that directory and carries no copy of its own, so `/balsm-design` works from any Balsm repo that has Core checked out.

**Companion:** [brand/balsm-brand-canvas.md](brand/balsm-brand-canvas.md) is the **brand model canvas** — purpose, vision, audience, promise, personality, voice & tone, positioning, core values, experience. design.md says how Balsm *looks*; the canvas says what it *stands for* and how it *speaks*. Pin the canvas for any copy, UX-writing, or marketing work.

Upstream: the Claude Design project `51cdbf29-13b7-4206-9328-125fade14cc3`. Pull refreshes into [brand/design-system/](brand/design-system/) — never into the plugin skill. See that directory's `RELOCATION.md` for the deltas from upstream.

---

## 1. Where the design system lives

**Canonical brand primitives — in this repo, flat in [brand/](brand/):**

| Path | Role |
|---|---|
| [brand/colors_and_type.css](brand/colors_and_type.css) | **Tier 1–2 source of truth** — global + semantic tokens: petals, neutrals, type, spacing, radii, shadows, motion, breakpoints, containers, gutters. Import this first. |
| [brand/balsm-brand-canvas.md](brand/balsm-brand-canvas.md) | Brand canvas — mission, voice, values, positioning, experience. Source of truth for tone. |
| [brand/logo-vertical.svg](brand/logo-vertical.svg) | Official mark — five figures joined in a ring — over the bilingual wordmark. Use as-is. |
| [brand/logo-vertical-mono-white.svg](brand/logo-vertical-mono-white.svg) | Reverse lockup — white ink, for dark surfaces. (`-on-white` files are the opposite: full-colour logo baked onto a white background.) |
| [brand/balsm-background.png](brand/balsm-background.png) | Watercolor wash of the mark — hero/welcome backdrops only. |

**These files are generated.** `brand/icon.svg` (the mark) and `brand/wordmark.svg` (the type) are the only hand-authored sources; every other lockup, mono variant, social avatar, PNG, OG image, and LinkedIn banner under `brand/` comes out of [scripts/brand/build-brand-assets.py](scripts/brand/build-brand-assets.py) (`npm run brand:build`). Edit a source, re-run the build, commit the result — never hand-edit a derived file.

**Full design system — [brand/design-system/](brand/design-system/).** Holds the long-form `README.md` manual, 26 components in `components/`, the self-hosted type stack (`fonts/` + `fonts.css`), and per-token preview cards (`preview/`). The `balsm-design` skill points here; invoke `/balsm-design` in any Balsm repo that has Core checked out.

**Token tiers.** Only tiers 1–2 live in `brand/`. The upper tiers ship with the plugin / design project:

| Tier | File | Holds |
|---|---|---|
| 1–2 · global + semantic | `brand/colors_and_type.css` | petals, ink, cream, type scale, spacing, radii, shadows, motion, breakpoints, containers, gutters |
| 3 · component | `component-tokens.css` | elevation `--elev-0…4`, row density, and per-component sizing for button / input / badge / select / toast / modal |
| 4 · adaptive | `adaptive.css` | container-query helpers (`.cq*`, `.adaptive-row`, `.adaptive-split`, `.adaptive-grid`), priority column drop, touch targets, logical spacing |

A surface that only needs color and type imports tier 1–2 alone. Pull tier 3 when building components, tier 4 when a layout genuinely adapts to its own container rather than the viewport.

**Consumer caveat — utility-framework name collisions.** Tailwind v4 resolves its utilities *through* theme variables: `rounded-lg` → `var(--radius-lg)`, `ease-out` → `var(--ease-out)`, `max-w-md` → `var(--container-md)`, `shadow-md` → `var(--shadow-md)`, `tracking-tight` → `var(--tracking-tight)`. Those five families use Balsm's exact token names with different values, so importing this file verbatim silently restyles every existing utility in the consuming codebase — `max-w-md` alone jumps 448 px → 768 px. Namespace them on import (e.g. `--balsm-radius-*`) and migrate one family at a time. See the website repo's `DESIGN.md` for a worked example.

---

## 2. Product surfaces the design covers

1. **Balsm Pharmacy — standalone.** Local server, POS, inventory, customer profiles, paper-Rx attachment. UI kit complete.
2. **Balsm Care — the full care loop.** Care app, doctor profile, appointments, encounters, digital Rx (QR) → links to the Balsm Pharmacy POS. Care app prototype complete; doctor encounter is net-new design territory.
3. **Balsm Network.** Paid cloud tier — online booking, cross-entity sharing, centralized care recipient identity. No UI yet.

---

## 3. Brand non-negotiables

1. **Name.** Always `Balsm.health` in product (`.health` one weight lighter, smaller). Arabic: `بلسم` — plain spelling, no diacritics.
2. **Mark.** Five figures joined in a ring, in **five distinct hues** — aqua, emerald, blue, mint, violet. Never recolor to a single hue except in the documented mono / reverse lockups (§7).
3. **No medical-cliché iconography** for brand symbols (no cross, syringe, heart). Lucide `pill` / `stethoscope` / `syringe` are fine **inside** the product, never as a logo replacement.
4. **No emoji in product UI.** The mark is our emoji. Marketing decks may use a single `🌿` sparingly.
5. **Arabic is first-class.** Every surface must work with `dir="rtl"` and `--font-arabic`. `[dir="rtl"]` selectors swap fonts automatically.
6. **Voice.** Calm, second-person, sentence case. `"Saved locally. Will sync when you reconnect."` — not `"Oops! Saved! ✨"`.
7. **Egyptian formatting.** Dates `DD/MM/YYYY`, currency `LE 245.00` (non-breaking space), phones `+20 1X XXXX XXXX`, national ID 14-digit grouped `2 9912 22 12345 6`.

---

## 4. Color — the five petals

The brand has **no single primary color.** The mark carries five hues, one per figure; the design system treats them as a categorical palette. Reach for one when you need a category (modules, departments, charts). Use all five together only in brand moments (hero, loading, watermark).

| Token | Hex | Role |
|---|---|---|
| `--petal-aqua` | `#02BBB5` | Accent · healing surfaces · "Balsm-feeling" moments |
| `--petal-emerald` | `#01C4A2` | Eyebrow labels · success-adjacent affordances |
| `--petal-blue` | `#1283FF` | **Primary action** — CTAs, links, focus rings |
| `--petal-mint` | `#55D77F` | **Success** — sale completed, vitals normal, synced |
| `--petal-violet` | `#724DD0` | **Controlled substance** — Schedule II/III flags |

Each petal has `-600` (hover/pressed) and `-50` (soft wash background) siblings. Aliases: `--balsm-primary` (blue), `--balsm-accent` (aqua).

**Wordmark color:** `--balsm-wordmark #1F2D3D` — navy slate, matching `brand/logo-*.svg` and `brand/wordmark.svg`. The `.health` TLD sits one weight lighter in `--balsm-wordmark-tld #526174` — the same hue at a second lightness, so the two always move together. On dark surfaces the wordmark knocks out to white per the reverse lockup (§7) — navy slate scores ≈1.5:1 on ink and must never be used there.

*Was `#254B45` (pine green), and before that `#6B6B60` (warm olive gray). The olive ramp is fully retired: `--balsm-ink-*` was re-keyed to the navy-slate wordmark, so `ink-800` **is** the wordmark and `ink-600` **is** the `.health` TLD. Only the creams stay warm — cool ink on warm paper.*

**Cream:** `--balsm-cream-100 #F4F3EC` — warm document surface for receipts, prescriptions, marketing decks, print. Never substitute cool gray.

**Semantic clinical state:**
- Success = `--petal-mint`
- Warning = `#E5B428` (sun) — low stock, approval needed
- Danger = `#D44A3C` (warm desaturated red — never fire-engine, which reads as panic)
- Info = `--petal-blue`
- Controlled substance = `--petal-violet`
- Expiring soon = `#D97A20`

Full token list: [brand/colors_and_type.css](brand/colors_and_type.css).

---

## 5. Typography

| Role | Family | Weights |
|---|---|---|
| Display / UI headings | **Montserrat** | 600, 700, 800 |
| Body / data / UI text | **IBM Plex Sans** | 400, 500, 600, 700 |
| Arabic (RTL) | **IBM Plex Sans Arabic** primary; **Cairo** for display headlines | 400, 600, 700 |
| Numeric / barcodes / IDs | **IBM Plex Mono** | 400, 500, 600 |

- Scale: `--fs-xs` 12 → `--fs-6xl` 72 (16px base, ~1.25 modular).
- Classes: `.h-display`, `.h1`–`.h5`, `.p`, `.p-sm`, `.meta`, `.code`, `.eyebrow`, `.wordmark`, `.wordmark-ar`.
- Eyebrows: `text-transform: uppercase; letter-spacing: 0.16em`.
  **⚠ The specified emerald fails WCAG AA.** `--petal-emerald #01C4A2` at the 12-px eyebrow size scores **2.23:1 on white** and **2.00:1 on cream** — against a 4.5:1 requirement. Use a darkened emerald for eyebrow *text*: `#017560` clears AA on white (5.65), cream (5.08) and `#FAFAF7` (5.41). On dark surfaces the full-strength `#01C4A2` is the accessible one (7.68:1) and `#017560` fails (3.03:1) — so this token must flip by theme, not be a single value.
  This applies to the petals generally: they are calibrated as *fills*, not as text colors. Drawing small text in any raw petal on a light surface will fail AA.
- **RTL eyebrows:** Arabic has no uppercase (so `text-transform` is a no-op) and letter-spacing **breaks the cursive joins**. Under `[dir="rtl"]`, eyebrows must reset `letter-spacing: 0`, `text-transform: none`, and swap to `--font-arabic` — an explicit `font-family` on the class otherwise beats the inherited RTL swap.
- Wordmark default: Montserrat 700 (closest free analog to the custom-set SVG wordmark). Swap `--font-display` if a custom wordmark face is later commissioned.

**Substitution flags (open with product team):**
- Fonts loaded from Google Fonts CDN. The Balsm Pharmacy offline installer needs the 20 MB TTF bundle unzipped into `assets/fonts/`. See [Balsm-Draft](https://github.com/balsm-health/Balsm-Draft).
- **Lucide** is a deliberate icon substitute — Balsm ships no own icon set.

---

## 6. Spacing · radii · shadows · motion

**Spacing** (4-px base): `--space-1` 4 → `--space-24` 96. Page gutters ramp `--gutter` 16 (phone) → `--gutter-md` 24 (tablet, ≥768) → `--gutter-lg` 48 (desktop, ≥1024); see the §6.5 table. Card padding 24 (standard) / 32 (hero). Form rhythm 12 (label↔input), 16 (field↔field). Dense tables: 12-px row, 16-px horizontal cell padding.

The `--space-*` scale is intentionally identical to Tailwind's default 4-px scale — a Tailwind consumer needs no spacing override at all.

**Radii:** `sm` 6 (chips), `md` 10 (buttons / inputs), `lg` 14 (**card default**), `xl` 20 (hero / modal), `2xl` 28 (squircle app icon), `pill` 999.

**Shadows.** Warm, soft `rgba(20, 32, 43, 0.06–0.10)` — never crisp drop shadows.
- `--shadow-sm` default · `--shadow-md` hero · `--shadow-lg` modal
- `--shadow-brand` (blue-tinted) for primary CTAs
- `--shadow-petal` (violet-tinted) for controlled-substance surfaces and brand moments

**Motion.** Default ease `cubic-bezier(0.16, 1, 0.3, 1)` — calm, never bouncy. Healthcare deserves stillness.
- Durations 120 / 200 / 320 ms.
- Hover: tint shift one step, or opacity 0.85. **Never scale-up on hover** for clinical surfaces.
- Press: primary CTAs tint darker + shrink to 0.98. Secondary just tint-shift.
- Page transitions: 200ms cross-fade. No slides, no rotations.
- Brand loader: the mark rotates slowly (4s linear).

**Transparency.** Sticky headers `backdrop-filter: blur(12px)` over 92% white. Modal scrim `rgba(20, 32, 43, 0.4)`. **No glassmorphism / frosted-glass cards** — reads consumer-flashy, not clinical.

---

## 6.5 Responsive & adaptive design

Balsm spans many viewport classes — phone, tablet, desktop POS, web admin, OS widgets, print. Two distinct strategies, picked per surface:

- **Responsive** — fluid reflow across a continuous size range. Marketing web, admin UI.
- **Adaptive** — distinct layouts swapped at a class boundary. Care app phone↔tablet, POS desktop↔compact, and the fixed widget/lock-tile surfaces. Not a shrunk phone — a different layout.

**Breakpoint tokens** (min-width, mobile-first; drives the gutter ramp in §6):

| Token | Min width | Class | Primary gutter |
|---|---|---|---|
| (base) | 0 | phone | 16 |
| `--bp-xs` | 375 | small phone | 16 |
| `--bp-sm` | 480 | large phone | 16 |
| `--bp-md` | 768 | tablet portrait | 24 |
| `--bp-lg` | 1024 | tablet landscape / small laptop / POS | 48 |
| `--bp-xl` | 1280 | desktop | 48 |
| `--bp-2xl` | 1536 | wide desktop | 48 |

These are the values in `brand/colors_and_type.css`, and they are the contract. An earlier revision of this section listed a Material-derived scale (600 / 905 / 1240 / 1640) that never matched the token file; it is superseded.

Note the values deliberately align with **Tailwind's own defaults** at `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536, so a Tailwind consumer only has to override `sm` (640 → 480) and add `xs` (375). Do not treat the `sm` override as free: it shifts every existing `sm:` utility in a codebase, so migrate it deliberately.

CSS custom properties cannot be used inside `@media`, so the `--bp-*` tokens are unitless numbers for JS consumption; media queries reference the literal values.

Per-stack mapping: Flutter `LayoutBuilder` / `MediaQuery.sizeOf` against these values · Tailwind `screens` overrides to match · CSS `@media (min-width: …)` and `@container` reading the same numbers. One scale, all stacks.

**Container widths** (`--container-*`): xs 480 · sm 640 · md 768 · lg 1024 · **xl 1200 (page default)** · 2xl 1440.

**Surface inventory:**

| Surface | Strategy | Notes |
|---|---|---|
| Care app | Adaptive | Phone single-column → tablet two-pane. Foldable = treat as tablet. |
| iOS widget / Android lock tile | Fixed | OS-dictated sizes. Own micro-layouts, not in the breakpoint scale. |
| Pharmacy POS | Adaptive | Desktop full table → compact (tablet) drops columns by priority. |
| Admin UI | Responsive | Sidebar collapses to drawer below `--bp-md`. |
| Marketing / web | Responsive | Full fluid reflow, phone → wide. |
| Print | Fixed | Thermal roll (~58/80 mm) vs A4 are separate non-responsive targets. |

**Touch vs pointer.** Touch hit targets ≥ 44 px (POS, care app, tablet). Hover affordances are pointer-only — the §6 motion rules (tint shift, never scale-up) apply to pointer surfaces; touch surfaces use press states only.

**Dense tables** (POS, encounter timeline — §9 density). Define column priority; drop low-priority columns narrow→wide, never horizontal-scroll the primary table on touch. Reflow dropped data into a row-detail expansion.

**RTL × responsive.** §3.5 RTL is mandatory at every breakpoint. Use logical properties (`inline-start/end`, `margin-inline`) not `left/right`, so gutters and column drop mirror correctly under `dir="rtl"`. Test each breakpoint in both directions.

**Out of scope (per §11).** Balsm Network — no UI. Doctor encounter — responsive intent noted, layout unspecified until the UI is designed.

---

## 7. Brand mark — lockup family

| Use | Treatment |
|---|---|
| **Primary** — app icon, web, marketing, storefront | Full 5-color mark + bilingual wordmark |
| **Reverse** — dark UI, splash, photos, signage | All-white knockout (mark + wordmark) |
| **Mono ink** — receipts watermark, stamps, fax, 16-px favicon | Single `--balsm-wordmark #1F2D3D`, or solid `--petal-blue` |
| **Mono brand** — single color but on-brand | Solid `--petal-emerald #01C4A2` — closest to historic "Balsm green," most legible single hue |

Mark usage: app icon (squircle-clipped, ink or cream bg) · loading spinner (4s linear rotate) · empty-state hero (centered, 96px) · prescription/receipt watermark (8–10% opacity) · hero backdrop (over the watercolor pattern).

**Backgrounds.** Dominant surface = white; cream is the warm complement. Watercolor petal pattern (`brand/balsm-background.png`) is the brand environment — translucent petal blobs in the five hues over a near-white wash. Used on landing hero, local-server welcome screen, full-bleed print covers. **Never inside product chrome.** No repeating geometric patterns. No hand-drawn illustrations. No stock-photo people. No generic medical stock photography.

---

## 8. Iconography

[Lucide](https://lucide.dev) — outline, geometric, calm stroke weight.

- Stroke 1.75 px default; 2 px for emphasis.
- Color inherits `currentColor`.
- Sizes 16 / 20 / 24 px. 16-px reserved for inline-with-text.
- Comprehensive medical + commerce coverage: `pill`, `stethoscope`, `syringe`, `scan`, `package`, `barcode`.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="pill"></i>
<script>lucide.createIcons();</script>
```

**Emoji policy.** None in product UI. Unicode arrows (`→ ← ↑ ↓`) and bullets (`•`) OK in copy; anything that reads as an icon must be Lucide or the brand mark.

---

## 9. Voice & copy

Calm · professional · human · second-person. Balsm is the care recipient's quiet ally, the pharmacist's reliable counter, the doctor's tidy notebook. Never salesy, never clinical-cold.

> Full voice spec — 14 brand words, two registers (clinical/technical · product/community), what Balsm never sounds like — lives in [brand/balsm-brand-canvas.md §6](brand/balsm-brand-canvas.md). This section is the design-surface summary; the canvas is the source of truth for tone.

**Casing.** Sentence case for all UI (buttons, menu items, headings, page titles). Title Case only on marketing landing-page heroes. ALL CAPS only for eyebrow labels at `letter-spacing: 0.16em`.

**Address.** EN: "you". AR: **`أنت`** for direct affordances (`سجّل الدخول`); **`نحن / "we"`** sparingly when Balsm itself is speaking (`نحن نحفظ بياناتك محلياً`). Avoid corporate `the system` / `النظام`.

**Tone examples — do:**
- "Stock is low. Reorder soon."
- "Saved locally. Will sync when you reconnect."
- "This medication is a controlled substance. Pharmacist sign-off required."
- `حُفظ محلياً — سيتم المزامنة عند الاتصال.`

**Tone examples — don't:**
- "Oops! Something went wrong 😬"
- "Failure: SYNC_QUEUE_FLUSH_001"
- "Click here to learn more!!"

**Density.** Balsm tolerates dense data tables (POS, encounter timeline), but every dense surface is wrapped in generous 24–32 px outer padding and a warm cream framing so density feels intentional, not crammed.

---

## 10. How to use this design

1. **Drop the tokens** into any new artifact:
   ```html
   <link rel="stylesheet" href="brand/colors_and_type.css">
   <link rel="icon" type="image/svg+xml" href="brand/logo-vertical.svg">
   ```
2. **Use semantic tokens** (`var(--fg1)`, `var(--balsm-primary)`, `var(--balsm-success)`) in component code, not raw petal hex. Petals are the palette; semantic tokens are the contract.
3. **Headings:** `.h1`–`.h5`. Body inherits from `<body>`.
4. **Arabic / RTL:** set `dir="rtl"` on the root; font swap happens via `[dir="rtl"]`.
5. **Lift components** from [brand/design-system/components/](brand/design-system/components/) — 26 of them, covering pharmacy/admin surfaces and care-recipient mobile alike.
6. **Sources:** every new component should cite a preview card from the skill's `preview/` and a UI-kit element it derives from.

For the Figma MCP HTML-to-Design capture workflow (mockup → Figma → Flutter), see [agents/rules/UI_DESIGN.md](agents/rules/UI_DESIGN.md).

---

## 11. Open questions / caveats

- **Fonts.** Substituted to Google Fonts CDN. For the offline installer, drop the 20 MB TTF bundle from [Balsm-Draft](https://github.com/balsm-health/Balsm-Draft) into `assets/fonts/`.
- **Icons.** Lucide is a substitute; no Balsm-bespoke set exists.
- **Wordmark face.** Montserrat is the closest free analog to the official SVG-set wordmark. Swap `--font-display` if a custom wordmark is commissioned.
- **Doctor encounter UI** is unbuilt — no source UI exists. Net-new design, not recreation.
- **Balsm Network** has no UI yet.
- **Egypt-specific** formatting (currency, dates, IDs, controlled-substance schedules) is baked in. Saudi (NPHIES) or other markets need their own pass.

---

## 12. Reference repos

| Repo | Why |
|---|---|
| [balsm-health/assets](https://github.com/balsm-health/assets) | Canonical brand pack (logo, watercolor pattern). |
| [balsm-health/Balsm-Draft](https://github.com/balsm-health/Balsm-Draft) | Roadmap, market research, business-feature spec, controlled-substance + RTL requirements. |
| [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | Offline-first / local-first reference. |
| [ClickUp](https://clickup.com) | Ops-dashboard density, sidebars, module switchers. |
| [OHC Care Core](https://ohc.network/product/care-core) | Clinical data model + open-source healthcare patterns. |
