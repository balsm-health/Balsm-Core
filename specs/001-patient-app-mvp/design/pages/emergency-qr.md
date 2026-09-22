# Page Override: `emergency-qr`

> Per-screen deviations from `../MASTER.md`. If empty, MASTER applies.

## Tokens

- **QR module color**: `#14202B` (`--balsm-ink-900`), NOT `--hue-blue` (Q3 resolution: scanability beats brand)
- **QR quiet-zone**: pure white `#FFFFFF` even in dark mode (camera reliability — never tint)
- **Card padding**: 24px on the QR card (`--space-6`), not standard 20px — extra breathing room
- **Countdown color shift**: `--fg1` → `--balsm-danger` when remaining < 5 min, not 30s like other screens

## Components

- `BalsmQrCode` variant `large`: 240×240pt canvas with center logo 48×48 + 4px white halo
- Brand mark uses `--grad-brand` core (not the full ring; QR center hole is small)

## Motion

- TTL chip selection: pulse on selection (scale 1.0 → 1.05 → 1.0 over 200ms) to confirm choice — exception to MASTER's "spring on press only"
- QR regenerate: crossfade old → new over 320ms, NO slide
- Revoke confirmation: shake (`--anim-shake`) before destroy

## Copy

- TTL chips localized: `1h` / `6h` / `24h` / `7d` (translate "hour"/"day" suffixes per locale)
- Don't use "Q.R. code" anywhere — use just "QR"

## Privacy notes

- Token JTI hash displayed at bottom in mono `--fs-xs` `--fg4`, allows audit traceability without exposing full token
- Fragment key NEVER shown in UI (security)

## Open questions

- [ ] Should regenerate require re-auth? Recommendation: no (current device + alive session is enough; revoke remains immediate)
- [ ] Should TTL include "Until I revoke" indefinite option? Recommendation: no for MVP (forces hygiene)
