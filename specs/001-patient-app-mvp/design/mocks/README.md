# P001 Mocks — canonical source index

> **Reconciled 2026-07-01.** The `design/mocks/` tree was empty (see `GAPS.md §1`). The canonical, renderable designs now live in the imported design-system project at
> `brand/design-system/` at the repo root (history in `design/_ds/balsm-design-system-51cdbf29-.../IMPORT-LOG.md`).
> This index maps each P001 flow to its canonical source rather than duplicating it as lower-fidelity static HTML.

## Filled here

| Path | What it is |
|---|---|
| `mocks/system/loading-and-progress.html` | Live component gallery — Progress, Spinner (mark), Skeleton, Steps, ProgressButton, TopLoadingBar, SegmentedProgress, LoadingOverlay; determinate/indeterminate + offline-sync + RTL. Self-contained (React+Babel CDN). |

## Covered by the imported `balsm_app/` prototype (Balsm Care)

Open `brand/design-system/balsm_app/Care App.html` (runnable, from the repo root). It is the canonical mock for:

| Mock flow | Screen(s) in the prototype |
|---|---|
| `mocks/auth/` | Welcome · Phone · OTP · Profile setup (`auth.jsx`) |
| `mocks/home/` | Home dashboard · Trends · Meds · daily self-report flow (`home.jsx`, `report.jsx`) |
| `mocks/profile/` | Profile + language toggle (`home.jsx` → `ProfileScreen`) |

Component-level design references: `_ds/.../components/` (17 components, `jsx` + `d.ts`) and the token layers in `_ds/.../*.css`.

## Still OUTSTANDING (no mock yet — carry on the GAPS list)

The P001 governance screens are **not** in the imported `balsm_app/` (Balsm Care is a consumer self-report prototype). These still need dedicated mocks per `SCREEN-INVENTORY.md`:

- `mocks/disclosure/` — consolidated disclosure / re-disclosure
- `mocks/deletion/` — pre-confirm · confirm (typed DELETE) · cancelled · post-deletion-login
- `mocks/sessions/` — active sessions list + revoke
- `mocks/emergency_card/` — emergency QR mint / public resolve / lock-screen card
- `mocks/medications/` — add · today · dose history · schedule format · tz-shift confirm
- `mocks/country_lang/` — country + language selection
- `mocks/auth_states/` — lockout · blocked · recovery claim/explainer
- `mocks/home/` — `home-empty` state (empty-state variant not in prototype)

> A dedicated mock pass should build these against the imported tokens (`_ds/.../colors_and_type.css`) and components (`_ds/.../components/`).
