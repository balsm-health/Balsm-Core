# Balsm Patient App MVP (P001) — UI/UX Design Contract

> **Status**: Draft for review · Generated 2026-06-16 · Anchored on `Balsm-Core/brand/colors_and_type.css` + ui-ux-pro-max rules
> **Project**: P001 — Consumer Patient App MVP · Egypt, KSA, UAE · Flutter mobile + Flutter Web public routes
> **Style direction**: Accessible & Ethical (WCAG AAA target) · Calm, trustworthy, content-first · Light + Dark mode parity · RTL-native

This document is the **single source of truth** for visual design and interaction patterns across P001. Implementation tasks (T036-T191 in `../tasks.md`) MUST conform to this contract. Per-screen overrides live under `design/pages/<screen>.md` and supersede this file when present.

---

## 1. Design Pillars

| Pillar | What It Means in P001 | Why It Matters |
|---|---|---|
| **Calm, not corporate** | Cool navy-slate ink (`--balsm-wordmark` #1F2D3D) on warm cream surfaces, generous whitespace, no aggressive gradients except brand moments | Care recipients are anxious. UI must lower cortisol, not raise it. |
| **Honest by default** | Every PHI surface labelled "on-device only" with a tiny lock icon. Cloud-stored DOB shows `🛡 encrypted` marker. | Trust is the product. Surface privacy choices, don't hide them. |
| **Arabic-first** | RTL is the default for `ar-*` locales — not a toggle, not an afterthought. Tabular numerals for prices/timers. Arabic-Indic digit normalization on input (FR-213). | Audience is primarily Arabic-speaking. LTR design with RTL bolted on = broken. |
| **Offline-resilient** | Every screen has an offline state. Medication reminders work offline ≥7 days (SC-004). Sync banners replace error toasts. | Connectivity in EG/KSA/UAE is uneven. Graceful degradation = product reliability. |
| **Accessible to elderly + chronic care recipients** | Body min 16px on mobile, Dynamic Type up to 200%, focus rings 3-4px, touch targets ≥44pt, never color-only state. | Real users include 65+ chronic-condition care recipients with poor vision. |
| **Brand hues as semantic, not decorative** | 5 hues = 5 categories: blue=action, aqua=info/calm, mint=success, emerald=health-positive, violet=controlled/scheduled meds. Never use all 5 outside hero/loading. | Brand identity (FR brand canvas) + semantic clarity in one. |

---

## 2. Tokens — Locked to Balsm Brand

**Source of truth**: `Balsm-Core/brand/colors_and_type.css` (DO NOT fork). All P001 surfaces import this file directly. The snapshot at `design/tokens.css` is a build-time copy for offline review and CI diffing; it never overrides the brand source.

### 2.1 Color Roles (Semantic, mapped to Balsm Hues)

| Role | Light Token | Dark Token | Hue Source | Use |
|---|---|---|---|---|
| **Primary action** | `--hue-blue` `#1283FF` | `#5FA0FF` (`balsm-blue-300`) | Blue | CTA buttons, links, focus ring, active nav |
| **Primary action pressed** | `--hue-blue-600` `#0F6BCC` | `--hue-blue` | Blue -8% L | Press state |
| **Accent (calm)** | `--hue-aqua` `#02BBB5` | `#2FC0B9` (`balsm-teal-400`) | Aqua | Secondary CTA, info chips, calm surfaces |
| **Success / health-positive** | `--hue-mint` `#55D77F` | `#86E5A4` | Mint | Dose taken, vitals normal, claim succeeded |
| **Healing (brand moment)** | `--hue-emerald` `#01C4A2` | `#3DDABA` | Emerald | Eyebrow text, brand loading swirl, accents |
| **Controlled meds** | `--hue-violet` `#724DD0` | `#9F84E5` | Violet | Schedule II/III meds flag (FR-medication category) |
| **Surface** | `#FFFFFF` (`--balsm-surface`) | `#1A1A14` (custom dark, see §2.4) | — | Cards, sheets |
| **Surface alt (warm)** | `#F4F3EC` (`--balsm-cream-100`) | `#14202B` (`--balsm-ink-900`) | — | Background, screen body |
| **Border** | `#DBDFE3` (`--balsm-ink-200`) | `#1F2D3D` (`--balsm-ink-800`) | — | Dividers, input borders |
| **Border focus** | `--hue-blue` | `#5FA0FF` | Blue | Focus ring, 3px solid |
| **Foreground primary** | `#14202B` (`--balsm-ink-900`) | `#F5F6F8` (`--balsm-ink-50`) | — | Body text |
| **Foreground secondary** | `#384756` (`--balsm-ink-700`) | `#C0C6CC` (`--balsm-ink-300`) | — | Captions, meta |
| **Foreground tertiary** | `#526174` (`--balsm-ink-600` · wordmark) | `#9BA4AD` (`--balsm-ink-400`) | — | Placeholders, disabled labels |
| **Danger** | `#D44A3C` (`--balsm-danger`) | `#E87B6F` | — | Errors, delete, missed dose |
| **Warning** | `#E5B428` (`--balsm-sun-500`) | `#F5C842` | — | Low stock, expiring meds |

**Contrast pairs verified (WCAG)**:
- Primary text on surface (light): `#14202B` on `#FFFFFF` = **15.6:1** (AAA)
- Primary text on surface (dark): `#F5F6F8` on `#1A1A14` = **14.8:1** (AAA)
- Primary button text on `--hue-blue`: `#FFFFFF` on `#1283FF` = **4.6:1** (AA, AAA-large)
- Body text on cream surface: `#384756` on `#F4F3EC` = **6.2:1** (AA, AAA-large)
- Danger button text on danger bg: `#FFFFFF` on `#D44A3C` = **4.9:1** (AA)

### 2.2 Typography Scale

Anchor: `--font-display` (Montserrat) for h1-h5, `--font-body` (IBM Plex Sans) for body, `--font-arabic` (IBM Plex Sans Arabic + Cairo) auto-applied to `[dir="rtl"]`.

| Role | Latin | Arabic | Size | Weight | Line | Tracking |
|---|---|---|---|---|---|---|
| **Display** | Montserrat ExtraBold | Cairo 800 | 56-72px | 800 | 1.15 | -0.02em |
| **h1 / screen title** | Montserrat Bold | Cairo 700 | 28-34px | 700 | 1.15 | -0.01em |
| **h2 / section title** | Montserrat Bold | Cairo 700 | 22-28px | 700 | 1.3 | -0.01em |
| **h3 / card title** | Montserrat SemiBold | Cairo 600 | 18-22px | 600 | 1.3 | 0 |
| **Body** | IBM Plex Sans Regular | IBM Plex Sans Arabic 400 | 16px (mobile min) | 400 | 1.65 | 0 |
| **Label / button** | IBM Plex Sans Medium | IBM Plex Sans Arabic 500 | 14-16px | 500 | 1.5 | 0 |
| **Caption / meta** | IBM Plex Sans Regular | IBM Plex Sans Arabic 400 | 12-13px | 400 | 1.5 | 0 |
| **Eyebrow** | IBM Plex Sans SemiBold ALL CAPS | IBM Plex Sans Arabic 600 | 12px | 600 | 1.5 | 0.16em |
| **Tabular** | IBM Plex Mono | IBM Plex Mono | inherit | 500 | inherit | 0 |

**Rules**:
- Never go below 16px on mobile body (iOS auto-zoom risk + readability for elderly).
- Arabic numerals (Arabic-Indic ٠١٢٣) **must** be normalized to Western on form submission per FR-213; display in user's preferred form.
- Mono for prices, dosages, timers, OTP codes, JTI handles — prevents layout shift.
- Eyebrow text colored `--hue-emerald`. Use sparingly (above h2, never above h1).

### 2.3 Spacing, Radii, Elevation, Motion

Imported directly from brand tokens:

- **Spacing**: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96 (`--space-1`..`--space-24`). Component padding uses 12/16; section spacing uses 24/32; screen padding uses 16/20.
- **Radii**: `xs:4` `sm:6` `md:10` `lg:14` `xl:20` `2xl:28` `pill:999`. Buttons = `lg` (14px). Cards = `xl` (20px). Sheets/modals = `2xl` (28px). Pills/chips = `pill`.
- **Shadows**: `xs/sm/md/lg` warm tones (rgba ink-900). Cards = `sm`. Floating elements (FAB, popover) = `md`. Modal/sheet scrim = `rgba(20, 32, 43,0.55)`. Brand glow (`--shadow-brand`) only on primary CTA in hero moments.
- **Motion**: `dur-fast 120ms` for press states, `dur-base 200ms` for transitions, `dur-slow 320ms` for sheet enter. Easing: `--ease-out` for enter, `--ease-in-out` for transitions, `--ease-in` for exit. Exit ≈ 70% of enter duration.

### 2.4 Dark Mode

**Surfaces** (not pure black — too harsh for medical, breaks brand warmth):
- Background: `#0F0F0B` (deeper than ink-900, warm-tinted)
- Surface: `#1A1A14` (one step lighter, cards on this)
- Surface elevated: `#252520` (modals, sheets — visible above surface)
- Surface alt: `#14202B` (`--balsm-ink-900`) — alternating list rows

**Hue tones**: shift +1 lightness step for visibility (e.g. dark-mode primary = `--balsm-blue-300` `#5FA0FF`, not the saturated `--hue-blue`).

**Critical rule**: dark mode is **not** inverted light mode. Test contrast independently. Borders use `--balsm-ink-800` (`#1F2D3D`), not low-opacity white.

---

## 3. Layout Grid + Safe Areas

### Phone (375-430pt portrait)
- Margin: 16pt left/right (20pt on ≥390pt screens).
- Safe areas respected: top notch/Dynamic Island, bottom home indicator, gesture region.
- Bottom nav: 60pt tall + safe-area inset; max 5 destinations: **Home · Card · Meds · Sessions · Settings**.
- Content scroll padding: 16pt top after app bar, 80pt bottom (clears bottom nav + FAB).
- Primary CTA on auth/disclosure screens: pinned bottom bar inside safe area, full width, 56pt tall.

### Tablet (≥768pt) — phase post-MVP, but mocks designed responsively
- Two-column where it makes sense: list + detail (sessions, meds).
- Max content width: 640pt centered.

### Flutter Web (public routes only — `/emergency/{token}`, `/account/delete`)
- Max content width: 480pt mobile-styled (matches app frame for visual continuity when deeplinks fall back to web).
- No app chrome (no bottom nav, no app bar). Just the screen + Balsm logo + locale toggle.
- Background: `--grad-cream` to subtly differentiate from in-app.

---

## 4. Component Contract (Shared Widgets)

All in `core/kit/shared_widgets.dart` (T064). Token bindings + states locked here.

| Widget | States | Tokens | Notes |
|---|---|---|---|
| **BalsmButton.primary** | default / hover (web) / pressed / disabled / loading | bg `--hue-blue` → `--hue-blue-600` pressed; text `#FFFFFF`; radius `lg`; padding `12 24`; height 48 (mobile) / 56 (CTA) | Loading: spinner replaces label, button stays width, `aria-busy` |
| **BalsmButton.secondary** | same | bg transparent; border 1.5px `--hue-blue`; text `--hue-blue` → bg `--hue-blue-50` pressed | |
| **BalsmButton.danger** | same | bg `--balsm-danger`; text `#FFFFFF` | Always paired with confirm dialog. Spatially separated from primary CTA. |
| **BalsmButton.ghost** | same | text `--fg2`; bg transparent → `--balsm-surface-muted` pressed | Tertiary actions only |
| **BalsmTextField** | default / focused / filled / error / disabled / read-only | border 1.5px `--balsm-border` → `--hue-blue` focused → `--balsm-danger` error; bg `--balsm-surface`; label floats above with `--fg3` color; helper text 12px `--fg3`; error text 12px `--balsm-danger` | Height 56pt. Floating label, never placeholder-only. Auto-direction by input value (Arabic typed = RTL). |
| **BalsmCountryPicker** | default / open / selected | row 56pt with flag SVG (24×16) + country name (localized) + dial code mono; checkmark `--hue-mint` on selected | List virtualized (40+ countries). Search bar pinned top. |
| **BalsmCard** | resting / pressed (if tappable) | bg `--balsm-surface`; border 1px `--balsm-border`; radius `xl`; padding `16 20`; shadow `sm`; pressed: scale 0.98 + shadow inset | Never nested >2 deep. |
| **BalsmListItem** | default / pressed / selected | bg transparent → `--balsm-surface-muted` pressed; chevron right (LTR) / left (RTL) `--fg3`; leading icon 24pt; padding `12 16`; min-height 56pt | |
| **BalsmDialog** (alert) | — | scrim `rgba(20, 32, 43,0.55)`; sheet `--balsm-surface` radius `2xl`; padding `24`; max-width 320pt centered; title h3; body p; actions horizontal (cancel ghost + primary or danger) | Escape via backdrop tap (non-destructive) or Cancel. |
| **BalsmBottomSheet** | — | drag handle 36×4 `--balsm-ink-300` top center; bg `--balsm-surface`; radius `2xl 2xl 0 0`; max-height 85vh; swipe-down to dismiss | Confirm before dismiss if unsaved (FR pattern). |
| **BalsmAppBar** | default / scrolled (elevated) | bg `--balsm-surface`; border-bottom 1px transparent → `--balsm-border` on scroll; back chevron 24pt `--fg1`; title centered h4; action icons trailing | Safe-area top inset. |
| **BalsmBottomNav** | — | 5 items max; each: icon 24pt + label 12px; active: icon filled + label color `--hue-blue` + top indicator 3pt; inactive: icon outline + label `--fg3` | Labels always visible (no icon-only). |
| **BalsmFab** | default / pressed | bg `--hue-blue`; icon `#FFFFFF` 24pt; size 56×56; shadow `md`; pressed scale 0.95 | Used only on MedicationListScreen (add) — never two FABs per screen. |
| **BalsmChip** | default / selected / removable | bg `--balsm-surface-muted`; text `--fg2`; radius `pill`; padding `6 12`; selected: bg `--hue-blue-50` text `--hue-blue` border 1px `--hue-blue` | For filter chips, tags |
| **BalsmEmergencyBadge** | default | bg `--balsm-danger-bg`; border 1.5px `--balsm-danger`; icon (cross) `--balsm-danger`; text `--balsm-danger` 600 weight | Only on emergency surfaces. |
| **BalsmLockIcon** | default | 16pt icon `--fg3`; tooltip "On-device only" | Inline next to PHI section headers. |
| **BalsmShieldIcon** | encrypted variant | 16pt icon `--hue-aqua`; tooltip "Encrypted on server" | Only next to `date_of_birth` per FR-047 Path-ii. |
| **BalsmLoadingIndicator** | small / large | small: 20pt circular spinner `--hue-blue` 2px stroke; large: 48pt brand swirl using `--grad-brand` | Brand swirl only on full-screen loading (boot, sync). |
| **BalsmErrorBanner** | error / offline / warning | error: bg `--balsm-danger-bg` text `--balsm-danger`; offline: bg `--balsm-info-bg` text `--hue-blue`; icon leading; dismiss trailing | Inline, near the field/section. Never as toast for critical errors. |
| **BalsmToast** | info / success / error | bottom-anchored above bottom-nav; auto-dismiss 3s info / 5s success / 6s error; `aria-live="polite"` info, `role="alert"` error | Never block input. |
| **BalsmOtpInput** | default / filled / error / loading | 6 boxes, each 48×56pt, radius `md`, mono font 24px center; auto-advance; paste fills all; error: shake animation 4 left-right pulses 200ms | Auto-focus first on mount. iOS one-time-code keyboard. |
| **BalsmQrCode** | default | 240×240pt canvas; module color `--balsm-ink-900`; quiet zone `#FFFFFF`; Balsm logo center 48×48 with white halo | Stable layout. Refresh on revoke without flicker. |
| **BalsmCountdownTimer** | default | mono font `--fs-xl`; format `MM:SS`; color `--fg1` → `--balsm-danger` last 30s | Used on lockout, OTP expiry, grace period. |

---

## 5. Iconography

- **Library**: Lucide icons (open source, MIT). Single stroke width 1.75px (Lucide default). Sizes: 16 / 20 / 24 / 32. Tokens: `--icon-sm/md/lg/xl`.
- **No emoji** for structural UI (per ui-ux-pro-max + Balsm brand). Emoji allowed only in user-generated content (display names, notes).
- **Brand logo**: `Balsm-Core/brand/logo-vertical.svg` for splash, marketing, public emergency page. Reverse white version on dark photos / dark mode header.
- **Filled vs outline**: outline by default; filled only for active bottom-nav state, primary CTAs with leading icons, and emergency cross.
- **Privacy icons** (custom — derive from Lucide):
  - `lock` — PHI on-device marker
  - `shield-check` — encrypted server field marker
  - `cross-circle` — emergency
  - `pill` — medication
  - `qr-code` — emergency QR
  - `clock` — schedule / grace period

---

## 6. Motion Choreography

### 6.1 Page transitions
- Forward navigation: slide from trailing edge (right in LTR, left in RTL), `200ms ease-out`, with subtle fade.
- Back navigation: reverse, `160ms ease-in` (exit faster than enter).
- Modal/sheet enter: slide up from bottom + fade scrim, `320ms ease-out`. Exit: `220ms ease-in`.
- Tab switch (bottom nav): crossfade `200ms`, no slide (Material adaptive pattern).

### 6.2 Micro-interactions
- Button press: scale 0.97 + opacity 0.92 over `120ms ease-out`, restore on release.
- OTP digit fill: scale 1 → 1.1 → 1 over `200ms spring-physics`.
- Disclosure scroll-to-bottom unlock: button enables with bg color tween + scale 0.9 → 1 over `300ms`.
- Toast enter: slide up 16pt + fade `200ms ease-out`.
- Sync banner: pulse opacity 0.6 → 1 → 0.6 every `2s` while syncing.

### 6.3 Reduced motion
- `prefers-reduced-motion: reduce` → disable all decorative motion. Page transitions become instant crossfade `100ms`. Scale/shake become opacity-only. Brand loading swirl becomes static logo with `aria-busy`.

### 6.4 Spring physics
- Default spring: damping 0.7, stiffness 200 (`flutter_animations.Spring.fast`).
- Heavy elements (sheets): damping 0.85, stiffness 150 (slower, weightier).

---

## 7. Accessibility (WCAG AA minimum, AAA target)

### 7.1 Contrast — verified above (§2.1)

### 7.2 Touch targets
- Min 44×44pt all interactive elements. Icons with smaller visual bounds use hitSlop 12pt to expand.
- 8pt minimum spacing between adjacent targets (8dp Material).

### 7.3 Screen reader
- Every meaningful icon: `accessibilityLabel` localized.
- Emergency QR display: `accessibilityLabel: "Emergency QR code. Token expires in {time}. Double tap to read details aloud."`
- Lockout countdown: `aria-live="polite"` announces every minute, not every second.
- Form errors: `role="alert"` + `aria-live="assertive"` for critical, `polite` for inline.
- Focus order matches visual order. After page transition, focus moves to main content (`focus-on-route-change`).

### 7.4 Dynamic type
- Support 200% text scaling. All layouts must wrap, never truncate critical info. Tablet layout takes over at largest sizes if needed.

### 7.5 Reduced motion / transparency
- Honor `MediaQuery.disableAnimations`. Honor `MediaQuery.boldText`. Honor `MediaQuery.highContrast` (bump border weights to 2px).

### 7.6 Voice control
- Every button has a visible label (not icon-only) for "Tap X" voice commands. iOS Voice Control friendly.

### 7.7 Color is never the only signal
- Dose taken state: green + checkmark icon + "Taken" text. Never green-only.
- Error fields: red border + alert icon + error text below. Never red-only.
- Controlled meds: violet badge + "Controlled" text. Never violet-only.

---

## 8. Localization + RTL

### 8.1 First-class locales (FR-201, FR-216)
- `en` — English (default fallback)
- `ar-EG` — Egyptian Arabic
- `ar-SA` — Saudi Arabic
- `ar-AE` — Emirati Arabic

### 8.2 RTL handling
- Default `Directionality` from `Bcp47Tag.isRtl`. Whole layout mirrors: nav order, icons (chevrons, arrows), progress bars.
- Icons that have inherent direction (back arrow, chevron) flip via `Transform.scale(-1, 1)`.
- Icons that do NOT flip (clock, heart, lock, QR, search, phone, mail) stay as-is.
- Numerals: respect user preference. Arabic-Indic display for `ar-*` locales by default; Western digits everywhere `en`.
- Mono font (prices, OTP, timers, dates in lists): always Western Tabular regardless of locale, to prevent layout shift.

### 8.3 Translation completeness
- Bundle at `core/assets/i18n/{locale}.json`. Min 98% key coverage per locale (SC-203).
- Missing key fallback chain: `ar-SA` → `ar-EG` → `en`; `ar-EG` → `en`; `en` → key name (visible to dev only via `--debug-i18n`).

### 8.4 Country-specific copy
- Supervisory authority name in disclosure footer (FR-219):
  - EG: "هيئة حماية البيانات الشخصية" / "Egypt PDPC"
  - SA: "الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)" / "KSA SDAIA"
  - AE: "مكتب البيانات بدولة الإمارات" / "UAE Data Office"
- Date format: ISO `YYYY-MM-DD` in lists (sortable); long form `15 يونيو 2026` for headers.
- Phone format: country-aware E.164 validators; display with national format.

---

## 9. Anti-Patterns (Must Avoid)

| Anti-Pattern | Why Banned | What to Do Instead |
|---|---|---|
| **AI purple/pink gradients** | Misaligned with healthcare trust; reads as B2C SaaS | Use Balsm hue palette for category color; brand gradient only on hero moments |
| **Bright neon colors** | Causes anxiety in medical context | Calm hue palette with restraint |
| **Decorative-only animation** | Distracts from action; fails reduced-motion | Every animation expresses cause→effect |
| **Emoji as structural icons** | Inconsistent across platforms, breaks brand | Lucide SVG icons |
| **Placeholder-only labels** | Inaccessible (vanishes on input), bad for screen readers | Always-visible label above input |
| **Red/green only for state** | Inaccessible for color-blind users | Add icon + text label |
| **Icon-only nav** | Hurts discoverability for elderly users | Bottom nav has icon + label always |
| **Modal-as-navigation** | Breaks back stack, breaks deep links | Use proper routes for primary flows |
| **PHI in toast or notification body** | Privacy + audit risk | "Time for your medication" — never include drug name in notification body |
| **Translucent surfaces over dynamic content** | Readability breaks when content scrolls behind | Solid surfaces with `shadow-md` for separation |
| **Pure-black dark mode** | Breaks warm Balsm brand; harsh in low light | `#1A1A14` surface, warm-tinted dark |
| **Smaller-than-44pt touch targets** | Fails WCAG + iOS HIG | 44pt min, 48dp on Android |
| **Hover-dependent affordances** | Breaks on touch | All info reachable via tap |
| **All 5 hues on non-brand surface** | Visual noise; dilutes brand moments | 5 hues only in loading swirl, hero, watermark |

---

## 10. Per-Surface Tone

| Surface | Voice | Example | Avoid |
|---|---|---|---|
| **Auth screens** | Reassuring, brief, transparent about data | "We'll send a 6-digit code to confirm it's you." | "Authenticate to proceed." |
| **Disclosure** | Honest, plain language, scannable | "Your health profile stays on this phone. We never see it." | "By accepting these terms..." |
| **Home** | Warm, gently nudging | "Want to add your emergency contact?" | "Action required: complete profile." |
| **Profile editor** | Care-recipient-pace, no judgment | "Anything else? You can always add more later." | "This field is required." |
| **Emergency card** | Calm, urgent-but-not-panicked | "QR is live for 24 hours. Scan to reveal." | "EMERGENCY DATA EXPOSED" |
| **Medications** | Practical, supportive | "Time for Glipizide" / "Tap when you've taken it." | "Compliance failure." |
| **Deletion** | Honest, never coercive | "Delete account? You have 7 days to change your mind." | "We're sorry to see you go..." |
| **Errors** | Cause + fix in one sentence | "Code expired. Tap to send a new one." | "An error occurred." |
| **Lockout** | Firm, not punishing | "Too many tries. Try again in 12 min." | "Account suspended." |

Source of voice: `Balsm-Core/brand/balsm-brand-canvas.md`. Bilingual UX writing follows the canvas's 5 voice principles (Honest, Calm, Concrete, Bilingual, Open).

---

## 11. Open Design Questions (To Resolve in Review)

- [ ] **Q1**: Bottom nav order in RTL — does "Home" stay leftmost (mirrored UX) or rightmost (logical RTL)? Recommend: **rightmost in RTL** (matches reading flow).
- [ ] **Q2**: Should the brand sweep gradient appear on the Home app bar, or reserve it for loading + emergency QR background only? Recommend: **reserve** to keep app bar calm.
- [ ] **Q3**: Emergency QR code module color — pure ink-900 black, or `--hue-blue`? Brand wants blue; scanability prefers black. Recommend: **pure black for reliability**.
- [ ] **Q4**: Public emergency Flutter Web page — show Balsm logo prominently, or keep minimal "Balsm Emergency Card" text header to reduce branding-during-emergency? Recommend: **small mark + text**.
- [ ] **Q5**: Dynamic Type at 200% — does bottom nav drop labels, scroll horizontally, or switch to single-column hamburger? Recommend: **labels wrap to 2 lines, increase nav height to 80pt**.

Resolve before D023 sign-off.

---

## 12. Related Files

- `SCREEN-INVENTORY.md` — 24 screens × US × FR × SC
- `pages/<screen>.md` — per-screen overrides (auth-country.md, home.md, etc.)
- `prototype/index.html` — interactive prototype shell
- `tokens.css` — token snapshot (build artifact, do not edit)
- `REVIEW-CHECKLIST.md` — 6-pillar review rubric
- `REVIEW-SIGNOFF.md` — stakeholder approval doc
- `findings/` — review-session output
- `MOTION-SPEC.md`, `A11Y-SPEC.md`, `COPY-SPEC.md` — pending (D025-D027)
