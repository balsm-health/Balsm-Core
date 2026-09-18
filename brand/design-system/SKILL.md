---
name: balsm-design
description: Use this skill to generate well-branded interfaces and assets for Balsm.health (بلسم) — the community-owned healthcare OS for the Arab world. Includes the official five-petal flower mark, the five-color petal palette, cool navy-slate neutrals, type system (Montserrat / IBM Plex Sans / IBM Plex Sans Arabic / Cairo / IBM Plex Mono), Lucide iconography, a Balsm Pharmacy POS UI kit, and a Balsm Care app prototype. Brand promise: "Your care. Your data. Your system." Three words: Open. Arab. Trusted.
user-invocable: true
---

## How to use this skill

Read `README.md` first — it is the canonical map of the design system, brand canvas, voice, values, and UI kits. For brand decisions, also read `../balsm-brand-canvas.md` (locked, v1.0).

Minimum starter for any new artifact:
```html
<link rel="stylesheet" href="path/to/colors_and_type.css">
```

For production code, copy `colors_and_type.css` into the codebase — it is the single source of truth for all design tokens.

---

## Key files

| File | What it is |
|---|---|
| `README.md` | Design system manual + brand canvas summary. Read first. |
| `../balsm-brand-canvas.md` | **Canonical brand reference (locked).** Mission, vision, promise, personality, voice, values, positioning, experience standard. |
| `colors_and_type.css` | Every CSS token — petals, neutrals, type, spacing, radii, shadows, motion. |
| `../logo-vertical.svg` | The Balsm mark — five figures joined in a ring — over the bilingual wordmark. Use as-is; do not redraw. |
| `../balsm-background.png` | Signature watercolor petal pattern — hero/welcome backdrops only. |
| `components/` | 26 components — Button, Input, Select, Table, Modal, Card, Avatar, Checkbox, Switch, DatePicker, TimePicker, Toast… |
| `fonts/` + `fonts.css` | Self-hosted webfonts — the type stack never touches the network. |

---

## Non-negotiables

1. **Brand promise** — every care-recipient-facing surface must embody: "Your care. Your data. Your system." Care recipient data sovereignty is non-negotiable. Never imply data goes anywhere the user didn't choose.

2. **Brand name** — `Balsm.health` in product surfaces (`.health` one weight lighter). Arabic: `بلسم` — plain spelling, no diacritics.

3. **The mark has FIVE colors** — aqua, emerald, blue, mint, violet. Never recolor to a single hue.

4. **No medical-cliché iconography** for brand symbols (no cross, syringe, heart as logo). Lucide `pill` / `stethoscope` are fine inside the product; never as logo replacement.

5. **No emoji in product UI.** The Balsm mark is our emoji. Unicode arrows/bullets in copy are fine.

6. **Arabic is first-class.** Every surface must work with `dir="rtl"` and `--font-arabic`. Not localized after the fact — designed Arabic-first.

7. **Voice passes all three experience tests before shipping:**
   - **Frictionless** — does it just work without asking the user to think about infrastructure?
   - **Warm** — does it feel like a trusted colleague, not a cold system?
   - **Trustworthy** — does it reinforce or erode confidence in Balsm?

8. **Two voice registers — use the right one:**
   - 🩺 **Clinical/technical:** precise, one meaning per sentence, never softens hard truths, error messages explain and never blame. Active words: Trustworthy · Reliable · Honest · Clear.
   - 🌿 **Product/care-recipient/community:** warm colleague tone, sovereignty language (the care recipient is always in control), optimism is earned not assumed. Active words: Warm · Caring · Empowering · Human.

9. **Sovereignty language in care-recipient-facing copy:**
   - ✅ "On your device, by design." / "Syncs only when you choose."
   - ✅ "Your details. Yours alone."
   - ❌ "Saved locally. Will sync when you reconnect." *(apologetic framing)*
   - ❌ "A copy reaches your doctor…" *(implies automatic data transfer)*

10. **What Balsm never sounds like:** cold & corporate · hyped & startup-bro · preachy & self-righteous · timid & apologetic.

11. **Egyptian formatting:** dates `DD/MM/YYYY` · currency `LE 245.00` · phones `+20 1X XXXX XXXX` · NID 14-digit grouped `2 9912 22 12345 6`.

12. **No glassmorphism, no frosted-glass cards, no bouncy animations.** Healthcare deserves stillness. `--ease-out cubic-bezier(0.16,1,0.3,1)` only.

13. **All designs must be adaptive and responsive for every device.** No fixed-width-only outputs. Every artifact must work and look intentional on:
   - 📱 **Mobile** (320px–480px) — full-viewport, touch targets ≥44px, safe-area insets
   - 📱 **Large phone** (480px–768px) — same, more breathing room
   - 📟 **Tablet portrait** (768px–1024px) — 2-column layouts, side panels emerge
   - 💻 **Desktop** (1024px+) — sidebar nav, multi-column grids, hover states
   - 🖥 **Wide desktop** (1280px+) — max-width containers, generous whitespace

   Use `colors_and_type.css` responsive utilities (`.container`, `.grid`, `.card-grid`, `.row-md`, `.show-mobile`/`.hide-mobile`). Use `clamp()` for fluid type. For mobile-app prototypes (care app, phone flows): show the iOS/Android frame on tablet/desktop, full-viewport on real phones. Never leave desktop a broken stretched mess of a phone layout.

---

## Brand personality quick-check

Before writing copy or making a visual decision, ask:
- Is this context **clinical** (be serious, precise, trustworthy) or **care-recipient/community** (be warm, empowering, optimistic)?
- Does this reinforce that the user — not Balsm, not a vendor — is in control?
- Does this feel like something a trusted healthcare professional would say?
- Would this land the same in Arabic as it does in English?

---

## When the user invokes this skill with no other guidance

Ask what they want to build:
- Which surface — Balsm Pharmacy POS · Balsm Care app · Doctor encounter · Balsm Network? All are now built from `components/`; the standalone kits were retired upstream.
- What format — deck, clickable prototype, marketing page, single-screen mock, production code?
- English, Arabic, or bilingual?
- Do you have real content, or use placeholder data from the UI kit / care app?

Then act as an expert designer who outputs HTML artifacts (or production code if requested). Pull tokens from `colors_and_type.css`, components from the UI kits, and the flower mark from `../` (Balsm-Core/brand/). Stay calm in tone, generous in spacing, warm in surface treatment — and always pass the frictionless + warm + trustworthy test.
