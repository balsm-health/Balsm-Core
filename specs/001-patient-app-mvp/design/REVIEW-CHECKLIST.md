# P001 Design Review Checklist (6-pillar)

> Use this per-screen during D022 review session. Run once for the **base** LTR-en-light variant, then spot-check RTL + dark + state variants. Findings file findings to `findings/<date>.md`.

## How to use
- Open `prototype/index.html` in browser.
- For each screen in the screen-inventory, walk through all 6 pillars.
- Mark each item ✅ pass / ⚠️ minor / ❌ blocker / ➖ N/A.
- Capture screenshots for findings.

---

## Pillar 1 — Visual Hierarchy & Brand

- [ ] Title is unmistakable on first glance (size + weight + position)
- [ ] Primary CTA is visually dominant; exactly one per screen
- [ ] Secondary actions are subordinate (ghost, smaller, lower contrast)
- [ ] Tertiary/destructive actions spatially separated from primary
- [ ] Balsm hues used semantically (blue=action, mint=success, danger=error); never all 5 outside hero
- [ ] Logo, wordmark, brand colors match `brand/colors_and_type.css` exactly
- [ ] No AI-purple/pink gradients; no neon
- [ ] Eyebrow text used sparingly, never above h1

## Pillar 2 — Motion & Interaction

- [ ] All animations express cause→effect (no decorative motion)
- [ ] Page-transition direction matches navigation forward/back
- [ ] Press feedback within 100ms of tap
- [ ] Spring/ease-out for entering; ease-in for exiting
- [ ] Exit ≈70% of enter duration
- [ ] No animation > 500ms unless system-initiated (boot, sync)
- [ ] Reduced-motion disables decorative animations
- [ ] Interruptible — tap cancels in-progress animation
- [ ] Loading state appears within 300ms if op exceeds 300ms

## Pillar 3 — Accessibility (WCAG AA)

- [ ] Body text ≥16px on mobile
- [ ] Text contrast ≥4.5:1 (normal) / 3:1 (large) in both themes
- [ ] Touch targets ≥44×44pt with ≥8pt spacing
- [ ] Focus rings visible 3px on all interactive elements
- [ ] No icon-only buttons without aria-label
- [ ] Forms have visible labels (never placeholder-only)
- [ ] Errors near field + role="alert"
- [ ] Color is never the only signal (icon + text companion)
- [ ] Tab order matches visual order
- [ ] Headings sequential (no h1→h3 skip)
- [ ] Dynamic Type 200% — layout wraps, doesn't truncate
- [ ] Screen reader: hero content announced clearly

## Pillar 4 — RTL & Localization

- [ ] Layout fully mirrored in `ar-*` (nav order, icons, chevrons)
- [ ] Directional icons flip (back, chevron, arrow)
- [ ] Non-directional icons stay (clock, heart, lock, QR, mail)
- [ ] Tabular figures used for prices, OTP, timers (no layout shift on RTL/LTR switch)
- [ ] Arabic numerals normalized on input; respect display preference
- [ ] Cairo + IBM Plex Sans Arabic loaded; falls back gracefully
- [ ] All 4 first-class locales (`en`, `ar-EG`, `ar-SA`, `ar-AE`) render
- [ ] Supervisory authority name correct per country
- [ ] Date/phone format country-aware

## Pillar 5 — States & Edge Cases

- [ ] Empty state has clear message + recovery action
- [ ] Loading state (skeleton, not spinner, if > 1s)
- [ ] Error state with cause + fix in one sentence
- [ ] Success state with visual confirm (toast, checkmark)
- [ ] Offline state messaged (banner or screen variant)
- [ ] Long-content state (overflow → wrap, not truncate)
- [ ] Small-screen state (375pt) tested
- [ ] Large-screen state (430pt) tested
- [ ] Landscape orientation operable
- [ ] Disabled state visually distinct + non-interactive

## Pillar 6 — Privacy, Safety & Trust

- [ ] PHI sections have lock icon + "On-device only" affordance
- [ ] `date_of_birth` shows shield-check icon (Path-ii FR-047)
- [ ] No PHI in toast text, notification body, error message, or analytics event
- [ ] Emergency QR has explicit TTL chip + countdown
- [ ] Revoke action immediate + confirmed
- [ ] Deletion shows retained/deleted/wiped breakdown (FR-031)
- [ ] Deletion grace period clearly communicated
- [ ] Re-auth required for sensitive actions (delete, country change)
- [ ] Lockout messaging firm but non-punishing
- [ ] Supervisory authority + privacy URL accessible from disclosure

---

## Findings template

For each finding, log under `findings/YYYY-MM-DD.md`:

```markdown
### Finding F-001 — `screen-id` — Pillar X
- **Severity**: blocker / minor / nit
- **What**: <one-line problem>
- **Where**: <screen + element>
- **Why it matters**: <one-line impact>
- **Fix**: <one-line remediation>
- **Status**: open / resolved / deferred
- **Screenshot**: <file path>
```

## Reviewer roles
- **PM**: Tone, copy, conversion-path clarity
- **Design lead**: Visual hierarchy, brand fidelity, motion
- **Eng lead**: Component contract feasibility, token consistency
- **Compliance lead**: Privacy affordances, disclosure accuracy, PHI separation
