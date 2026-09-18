# Feature Specification: P001 — Consumer Patient App MVP

**Feature Branch**: `001-patient-app-mvp`
**Created**: 2026-06-16
**Status**: Draft — **reconstructed from derived artifacts** (data-model.md, tasks.md, design/MASTER.md, research.md, design/SCREEN-INVENTORY.md, contracts/). Replaces a prior unrecoverable spec.md (no git history). All FR/SC/US identifiers used by derived artifacts are preserved in this reconstruction.
**Input**: User description: "Consumer patient app MVP for Egypt, KSA, UAE. Multi-locale (Arabic + English) RTL-native. Single global account across countries. Passwordless 3-channel auth (email OTP + Google + Apple). Health profile on-device. Emergency QR with TTL. Medication reminders offline. Self-service deletion. Active sessions management. Country + language change post-signup. Mobile + Flutter Web public routes."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sign up and reach home (Priority: P1)

A first-time patient downloads the app, picks their country (Egypt by default if device-locale matches), enters their email, receives a 6-digit code, enters the code, accepts a consolidated privacy disclosure tied to their country's supervisory authority, and lands on the home screen with a personalized greeting and nudges to complete their profile and emergency card. Alternative path: same flow via Google or Apple sign-in (one tap, no code).

**Why this priority**: Without signup, no other story works. This is the MVP boundary — implementing only this delivers a viable demonstrable product (basic onboarded user with a home screen).

**Independent Test**: Fresh install → app opens → country picker → enter email → receive OTP code in inbox within 30 seconds → enter OTP → consolidated disclosure → tap "Accept and continue" → home renders with display name within 90 seconds total wall time on a 4G connection (SC-001a).

**Acceptance Scenarios**:

1. **Given** a user in Egypt with an installed app and an email account, **When** they enter their email and complete OTP verification within 10 minutes, **Then** they reach the home screen.
2. **Given** a user in a denied country (Iran, North Korea, Cuba, Syria — OFAC + store-policy combined list), **When** they pick their country, **Then** the app shows a localized "not yet available here" screen with a "notify me" option and no signup form.
3. **Given** a user who taps Google or Apple sign-in, **When** the OS sign-in sheet completes, **Then** the user proceeds to disclosure without an OTP step.
4. **Given** a user with Apple `hide-my-email` enabled, **When** they sign in with Apple, **Then** the obfuscated relay address is accepted and the account is created.
5. **Given** a returning user signing in to a new device after restoring their backup (see US1b), **When** they enter OTP, **Then** the app prompts to restore the on-device backup blob before reaching home.

---

### User Story 1a — Claim handle and complete health profile (Priority: P2)

A signed-in patient claims a globally-unique handle (`@noor.health` style — letters, numbers, `_`, `.`, 3–30 chars), and fills out their health profile: blood type, allergies (with severity), chronic conditions (with ICD-10 code), emergency contacts (with name + phone + relationship). All profile data lives on-device only — the app never sends it to Balsm servers.

**Why this priority**: The handle is the patient's portable identity across countries (FR-303). The health profile is the core data set the emergency card and medication reminders read from. Without a profile, the emergency card is empty and the medication scheduler can't run.

**Independent Test**: Complete US1 → from home, tap "Claim your handle" → enter `noor.health` → see "Available" → tap "Claim @noor.health" → return to home → tap "Complete your profile" → fill blood type + 1 allergy + 1 condition + 1 contact → save → close app → reopen → data persists.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they request handle `noor.health`, **Then** the system checks reserved-handle blocklist and uniqueness against the global namespace and shows "available" or "taken" within 1 second.
2. **Given** an available handle, **When** the user claims it, **Then** their account is updated and the handle becomes their portable identifier across any country they later switch to.
3. **Given** a profile editor screen, **When** the user adds an allergy with severity "severe", **Then** that severity is preserved verbatim for the emergency card display.
4. **Given** a user enters Arabic-Indic digits (٠–٩) into a phone-number field, **When** they submit, **Then** the system normalizes to Western digits at save while preserving the user's preferred display form (FR-213).
5. **Given** the user closes the app after saving the profile, **When** they reopen, **Then** all profile data renders identically (on-device persistence).

---

### User Story 1b — Restore profile on a new device (Priority: P2)

A patient who already has an account on phone A signs into the app on phone B (lost phone, upgrade, second device). After OTP success, the app detects an encrypted backup blob in the user's own cloud (iCloud Drive on iOS, Google Drive on Android) and offers to restore. On acceptance, the on-device drift database is rehydrated and the user sees their handle, profile, medications, and dose history.

**Why this priority**: Without this, every new device = empty account = lost medication schedules + missed doses. The patient population includes 65+ chronic patients who replace devices and cannot re-enter 14 medications from memory. This was clarified in Session 2026-06-16 Q1.

**Independent Test**: Complete US1 + US1a on phone A → backup blob uploaded to iCloud/Drive within 60 seconds of profile save → sign out → install fresh app on phone B → complete OTP → see "Restore from your backup?" prompt → accept → all data appears within 30 seconds (SC-002a).

**Acceptance Scenarios**:

1. **Given** a user signed in on phone A who has saved their profile, **When** their session is alive, **Then** an encrypted backup blob is uploaded to their cloud-of-record (iCloud on iOS, Google Drive on Android) within 60 seconds.
2. **Given** the same user installs the app on phone B and completes OTP, **When** the app detects a backup blob in their cloud, **Then** a non-blocking prompt offers restore with a clear "Restore" / "Skip" choice.
3. **Given** the user accepts restore, **When** the blob downloads and decrypts, **Then** the drift database is fully rehydrated within 30 seconds P50.
4. **Given** the user declines restore, **When** they continue, **Then** they reach an empty home (treated as a fresh device with the existing account).
5. **Given** Balsm servers, **When** any operation runs, **Then** Balsm never holds the backup blob plaintext, the encryption key, or the user's iCloud/Drive credentials.

---

### User Story 2 — Emergency QR and public bystander page (Priority: P2)

A patient mints an emergency QR code from their emergency card. The QR encodes a URL like `{BASE_URL}/emergency/<token>#k=<key>`. A bystander (rescuer, paramedic, ER nurse) scans the QR with any phone camera, opens the URL, and sees a localized emergency card (blood type, allergies, chronic conditions, current medications, emergency contact name + phone with tap-to-call). The TTL is configurable (1h / 6h / 24h / 7d) and the patient can revoke at any time. iOS Lock Screen widget and Android Quick Settings tile expose a frequently-used summary.

**Why this priority**: The "emergency on a locked phone" promise is the single most distinctive value of this product. Without a working QR roundtrip, the brand promise collapses.

**Independent Test**: Complete US1 → tap "Finish card" nudge from home → fill emergency card → mint QR with TTL 24h → scan QR with a second device (camera app) → public page opens within 5 seconds → revoke QR from phone → scan again → "This QR has expired" page renders within 2 seconds of revoke (SC-014).

**Acceptance Scenarios**:

1. **Given** a patient with a complete profile, **When** they mint a QR with TTL 24 hours, **Then** the QR is scannable for exactly 24 hours from mint time.
2. **Given** an active QR, **When** the patient taps "Revoke", **Then** any subsequent scan within 2 seconds shows "expired" — Balsm servers reject the resolve request.
3. **Given** a bystander scans the QR, **When** the public page loads, **Then** the page displays the patient's `preferred_language` content (RTL-aware) with tap-to-call phone, blood type emphasized, and severe allergies in danger color.
4. **Given** the public page, **When** decryption happens, **Then** the URL fragment (`#k=...`) is never sent to Balsm — the page decrypts client-side using the fragment key.
5. **Given** iOS 16+ device with the app installed, **When** the patient enables the Lock Screen widget, **Then** the widget shows blood type, top 3 allergies, top 2 conditions, and primary emergency contact name.

---

### User Story 3 — Medication reminders offline (Priority: P3)

A patient adds medications with daily, weekly, or custom-day schedules. The app fires local notifications at the scheduled times. Notifications work offline for at least 7 days. The patient marks doses as taken / skipped / snoozed; missed doses are detected automatically on next app foreground. Dose events are append-only (no edit, no delete) — corrections create a new linked event.

**Why this priority**: Chronic patients (diabetes, hypertension, controlled-substance schedules) need reliable reminders. Off-network reliability is non-negotiable. Without this, the product is a static info card.

**Independent Test**: Add 3 medications (daily 08:00, weekly Fri 19:00, every-other-day 14:00) → enable airplane mode → advance device clock to next 08:00 → notification fires within ±60 seconds → tap notification → "meds.today" screen highlights the due Glipizide dose → tap "Taken" → status updates to "Taken at 08:14".

**Acceptance Scenarios**:

1. **Given** a patient adds a daily 08:00 medication, **When** 08:00 arrives even if the device has been offline for 6 days, **Then** the notification fires within ±60 seconds.
2. **Given** a fired notification, **When** the patient reads the body on the lock screen, **Then** the body shows only a localized generic string — drug name does NOT appear (Q2 resolution).
3. **Given** 3 medications scheduled at the same time, **When** notification taps deep-link the user into the app, **Then** the "today" screen highlights all 3 due doses.
4. **Given** a medication marked controlled (Schedule II/III by user or pre-seeded list), **When** displayed in the list, **Then** a violet "Controlled" badge appears alongside the name.
5. **Given** a dose event recorded as "taken", **When** the patient tries to delete it, **Then** the system refuses; the only correction path is recording a new linked correction event.
6. **Given** the device timezone shifts (user travels), **When** the app foregrounds, **Then** a confirmation modal asks whether to recompute reminder times based on the new timezone (FR-023).

---

### User Story 4 — Self-service deletion (Priority: P3)

A patient navigates from Settings to "Delete account" in two taps. The app shows exactly what gets deleted (cloud records), wiped (on-device PHI), and retained (anonymous 2-year regulator-required deletion log). The patient re-authenticates, types "DELETE", and confirms. They have 7 days to cancel by signing back in. After 7 days, a cron-driven purge cascades all account state.

**Why this priority**: Apple/Google app-store policy requires self-service deletion reachable without contacting support. PDPL (EG/SA/UAE) reinforces user rights. Without this, store rejection on submission.

**Independent Test**: From Settings → Account → "Delete account" within 2 taps → see retained/deleted/wiped breakdown → tap "Continue to confirm" → re-auth via email OTP → type "DELETE" → tap "Permanently delete my account" → app signs out → sign in within 7 days → see only the cancel-deletion flow → cancel → all data preserved.

**Acceptance Scenarios**:

1. **Given** a signed-in user at Settings, **When** they navigate to "Delete account", **Then** they reach the pre-confirm screen in exactly 2 taps from Settings root (SC-012).
2. **Given** the pre-confirm screen, **When** the patient reads it, **Then** they see three separate cards: "Deleted now" (red), "Wiped from this phone" (neutral), "Retained 2 years" (info) — exhaustive list of what falls into each.
3. **Given** the patient confirms with re-auth + OTP + typed "DELETE", **When** they tap the final danger CTA, **Then** the account enters `DELETION_REQUESTED` state and a deletion log entry is appended (no name, no email — only anonymized regulator-required fields).
4. **Given** the user signs back in during the 7-day grace, **When** they reach the cancel-deletion screen, **Then** they can cancel and resume normal use without data loss.
5. **Given** the 7-day grace expires without cancellation, **When** the purge cron runs, **Then** all `user_account`-cascading rows are deleted within 24 hours and the deletion log is retained for 2 years.
6. **Given** an Apple-Sign-In account, **When** deletion confirms, **Then** Apple's `/auth/revoke` endpoint is called and the result is recorded in the deletion log.

---

### User Story 5 — Account lockout and active sessions (Priority: P4)

After 5 failed sign-in attempts in a rolling 10-minute window, the account is locked for 15 minutes. The locked screen shows a countdown and a support contact. From a separate Sessions screen, the patient sees all currently-active devices (with last seen + approximate location) and can revoke individual sessions or sign out everywhere except the current device.

**Why this priority**: Lockout prevents credential stuffing. Sessions screen is a privacy hygiene primitive. Neither is daily-use but both unlock peace-of-mind value.

**Independent Test**: Sign in with the wrong OTP 5 times within 10 minutes → "Locked for a few minutes" screen renders with a 15-minute countdown and `mailto:support@balsm.health` + status page link → wait 15 minutes → sign in successfully → from Settings → Devices, see this iPhone + (separately) any past-sessions device → tap "Revoke" on past device → session is revoked.

**Acceptance Scenarios**:

1. **Given** 5 wrong OTP attempts in 10 minutes, **When** the 6th attempt is made, **Then** the server returns 423 (locked) with `Retry-After` header and the app renders a countdown.
2. **Given** a locked account, **When** the patient taps "Contact support", **Then** the device mail client opens with `support@balsm.health` pre-filled — no app auth required.
3. **Given** a locked account, **When** the patient navigates to the public status page, **Then** they see current Supabase health and any active incident announcements.
4. **Given** a Sessions list, **When** the patient taps "Revoke" on a non-current device, **Then** that session token is invalidated within 2 seconds and the device is removed from the list.
5. **Given** the patient taps "Sign out everywhere except this device", **When** they confirm, **Then** all other sessions are revoked and only the current device remains.

---

### User Story 6 — Country and language change post-signup (Priority: P4)

A patient who signed up in Egypt later switches their country to Saudi Arabia (real relocation, work visa, etc.). The change triggers re-authentication and re-acceptance of the destination country's privacy disclosure (different supervisory authority). Separately, the language picker offers all 4 first-class locales (`en`, `ar-EG`, `ar-SA`, `ar-AE`) with live RTL preview; choosing a new locale instantly re-renders the entire UI.

**Why this priority**: Single global account (FR-300..FR-305) means a user is one account across countries. Without the change flow, the user is stuck on signup country forever. Lower priority because most users don't move countries during P001 lifespan.

**Independent Test**: Sign up in EG → Settings → Country → KSA → see notice "Switching country requires re-authentication" → re-auth → re-disclosure with SDAIA authority → confirm → account country is `SA`, all data preserved. Separately: Settings → Language → tap `العربية — السعودية` → entire UI flips to RTL with Saudi Arabic strings within 200ms.

**Acceptance Scenarios**:

1. **Given** an Egypt-registered user, **When** they pick Saudi Arabia in country settings, **Then** they re-authenticate before the change takes effect.
2. **Given** re-auth succeeds, **When** the new country's disclosure renders, **Then** the supervisory authority name reflects KSA SDAIA, not Egypt PDPC.
3. **Given** the user accepts re-disclosure, **When** the change persists, **Then** `user_account.country_code` updates to `SA` and a fresh `disclosure_acceptance` row is recorded — prior acceptance preserved in audit history.
4. **Given** the language picker, **When** the patient selects `ar-SA`, **Then** the UI re-renders RTL with Saudi Arabic strings within 200ms.
5. **Given** a user who switches country from EG to AE (UAE), **When** the change persists, **Then** the user-facing country/authority updates BUT the encrypted DOB row remains at its original residency (Q3 documented gap — no cross-project row migration in P001).

---

### Edge Cases

- **Denied-country signup attempt**: Country picker shows blocked-country rows as disabled (not hidden); on tap, a contextual sheet explains why and offers "Notify me when available".
- **Device locale mismatch with signup country**: When device locale is `ar-AE` but user picks Egypt, app honors user choice for country + preferred_language, but soft-warns once if device-locale country has different residency implications (UAE specifically — see Q3).
- **OTP expired during slow input**: 10-minute OTP expiry; on expiry, "Resend code" enabled with a soft "Code expired — tap to send a new one" inline message. Avoid alarm copy.
- **Network drop during emergency QR mint**: Operation is server-side (token row + ciphertext upload). On network failure, retry once with exponential backoff; on second failure show inline error with "Try again" — never partial state in user's view.
- **Apple Sign In revocation during grace period**: If user revokes Apple Sign In via Apple Settings while in deletion grace, the sign-in-to-cancel path is blocked. App falls back to email OTP for the same email-of-record.
- **Country change between first-class language regions**: Egypt user picks `ar-EG` → switches to KSA → preferred_language stays `ar-EG` unless user changes it (no automatic forced change). Display reflects user choice.
- **Lock screen widget without app open**: iOS WidgetKit + Android Quick Settings tile must read snapshot from shared app group / SharedPreferences — must NOT trigger app launch on widget render.
- **Locked-out user during a medication dose time**: Notifications fire from local scheduler regardless of cloud-auth state. Lockout never blocks medication reminders.
- **Multi-dose collision at same minute**: 3+ doses at 08:00 — single notification with localized generic body; tap deep-links to today screen showing all 3 due doses.
- **Backup blob in user's cloud lost or expired**: Restore prompt does not appear; user reaches empty home and uses fresh-device flow.
- **User signs in on phone B without iCloud/Drive permission**: Backup restore skipped silently; user reaches empty home with a banner reminding them backups are available.
- **Public emergency page accessed from a non-Balsm browser**: Renders correctly without app install (Flutter Web); locale resolved from `Accept-Language` header + token's `preferred_language` snapshot, preferring token snapshot.
- **404 — Page not found**: Localized 404 with brand mark and "Take me home" CTA; preserves any in-progress flow if possible.

---

## Clarifications

### Session 2026-06-16

> Migrated from `data-model.md §5b` after spec.md regeneration on 2026-06-16. All 5 resolutions remain authoritative; `data-model.md §5b` may be removed once this section is committed.

- **Q1: Multi-device sign-in PHI restore behavior** → User-owned encrypted backup. iOS uses iCloud Drive (`Documents/balsm/backup.blob.aes` in iCloud document container), Android uses Google Drive (`AppDataFolder` scope). Balsm client encrypts the drift export with a key derived from `Argon2id(user_otp_token || device_secret)` and uploads ciphertext. New-device sign-in prompts "Restore from your backup?" after first OTP success. Balsm servers never see plaintext or key.
  - Adds FR-009a (multi-device restore via user-owned cloud) and FR-009b (restore is explicit opt-in, default off).
  - Adds SC-002a (restore completes ≤30s P50 on second-device sign-in).
- **Q2: Medication reminder notification body content** → Strict privacy. Body fixed to localized generic string ("Time for your medication" / "موعد دوائك" etc.). Drug name, dose, schedule never appear in notification body/title/subtitle/summary/watchOS preview/Wear card. Multi-dose collision resolved via deep-link to `meds.today` screen.
  - Refines FR-018; adds FR-018a (deep-link payload routes to today screen with due-dose highlighted).
  - Refines SC-004 measurement to OS-delivery time, not drug-name visibility.
- **Q3: Country change after Path-ii encrypted DOB stored** → No migration. Encrypted DOB stays on the originally-provisioned Supabase project regardless of `country_code` changes. ⚠ **Documented compliance gap** vs UAE Federal Law 2/2019. Risk register entry RR-001 required at `docs/compliance-risks.md`; UAE Apple/Google data-safety filings must disclose. Revisit in P002.
  - Refines FR-049 (residency pinned at signup, not mutable).
  - Refines FR-302 (country-change updates country_code only).
  - Adds mitigations: durable-residency copy on country picker, soft UAE-mismatch warning.
- **Q4: Lockout escape path / support contact channel** → Two channels reachable without app auth: `mailto:support@balsm.health` + public status page at `{BASE_URL}/status` (Flutter Web route alongside `/emergency/{token}` and `/account/delete`). Both wired from `auth-lockout`, `auth-blocked`, `not-found`.
  - Adds FR-046a (all hard-blocking screens MUST expose a support channel reachable without app auth).
  - Adds FR-046b (public `/status` route MUST exist with current service health + incident feed).
  - Adds SC-011a (support email or status page reachable in ≤2 taps from lockout).
- **Q5: OTP delivery provider** → Resend.com via custom domain `noreply@balsm.health`. SPF/DKIM/DMARC aligned. EU region default. Localized HTML templates at `supabase/templates/auth-otp/{en,ar-EG,ar-SA,ar-AE}.html`.
  - Refines FR-001 (OTP delivery via Resend; not Supabase default SMTP).
  - Adds FR-001a (OTP email rendered from versioned localized template; subject + body + sender match user's `preferred_language`).
  - Adds SC-001a OTP-delivery-to-inbox: ≤30s P50, ≤90s P99.

### Session 2026-06-17

- **Q1: Age-gate enforcement mechanism** → Self-declared DOB at signup is validated against the cloud-side encrypted DOB (Path-ii infrastructure) on every age-gated action. If declared <18, signup soft-blocks with a localized "Balsm requires a parent/guardian account in P002 — we'll notify you when it's available" screen. Logs the rejection cause to a denial counter feeding P002 backlog priority. No parental-consent flow in P001.
  - Adds FR-301a (System MUST collect DOB at signup, validate ≥18, and soft-block under-18 signups with a localized P002-waitlist screen).
  - Adds FR-301b (System MUST validate the in-app DOB declaration against the cloud-side encrypted DOB on every age-gated action — emergency-card mint, medication add, deletion intake — failing closed if mismatch).
  - Adds SC-301a (100% of signup attempts where declared DOB indicates <18 produce a localized soft-block; zero proceed to home).
  - Refines Assumptions: "Adult patients aged 18+" becomes enforced rule, not just target audience.
  - Affected tasks: `auth-gate` Edge Function reads DOB during signup intake; `age-gate-check` Edge Function validates on age-gated ops (already in task list); new client screen `auth-under-eighteen.dart`.

- **Q2: OTP-bombing DoS defense** → Layered throttle with defense in depth: (i) per-email — 3 OTP requests per rolling 10-minute window (existing FR-045), (ii) per-IP — 10 OTP requests per IP per rolling 60-minute window, (iii) global — 10,000 OTP requests per Resend project per rolling 60-minute window, with auto-pause + Slack alert on hit, (iv) reCAPTCHA Enterprise (invisible challenge) injected on the email signup form when per-email or per-IP rate is exceeded within the previous 24 hours.
  - Refines FR-045 (rate-limit now layered with IP + global caps in addition to per-email).
  - Adds FR-045a (System MUST throttle OTP requests per source IP at 10/hour rolling window).
  - Adds FR-045b (System MUST cap global OTP delivery at 10,000/hour with auto-pause + alert on breach).
  - Adds FR-045c (System MUST invoke an invisible CAPTCHA assessment on the email signup form when per-email or per-IP rate has been exceeded within the previous 24 hours).
  - Adds SC-016a (≥99.5% of legitimate signup attempts complete without ever encountering a CAPTCHA challenge; remaining 0.5% complete with a single invisible-mode CAPTCHA assessment).
  - Adds sub-processor: Google reCAPTCHA Enterprise — disclose in privacy notice + Apple/Google data-safety filings.
  - Affected tasks: `auth-gate` Edge Function adds per-IP + global throttle; new shared library `_shared/throttle.ts` keyed on `(scope, identifier)`; `auth-gate` adds optional `captcha_token` field validated against reCAPTCHA assessment; client signup form lazy-loads reCAPTCHA SDK only when challenge required.

- **Q3: Notification permission denied — medication reminder fallback** → Smart degradation. On first permission decline at the OS prompt, app shows a localized brief banner once: "Heads up: without notifications you won't get medication reminders. The Today screen will still show what's due — open the app to check." On every 3rd app open over a 14-day rolling window, app surfaces a non-blocking sheet with a value-framed re-request CTA — never blocks the app. The `meds.today` screen becomes the primary fallback surface, always reachable from home + bottom nav. No SMS / email reminder fallback (would defeat Q2 strict-privacy policy on drug names).
  - Refines FR-017 (notifications + offline ≥7 days behavior unchanged when permission granted; when denied, fallback is in-app Today surface).
  - Adds FR-017a (System MUST detect notification-permission state on app foreground and emit a domain event `NotificationPermissionChanged(granted, denied, provisional)`).
  - Adds FR-017b (System MUST surface a non-blocking re-request sheet at most once per 14-day rolling window when permission is denied AND the user has added at least 1 medication).
  - Adds FR-017c (`meds.today` MUST be reachable in ≤1 tap from home regardless of notification permission state — primary fallback surface).
  - Adds SC-004a (≥80% of users with medications added complete a dose-marked-taken event within ±60 minutes of scheduled time whether notifications are granted OR denied).
  - Adds Edge Case: "Patient declines notification permission at first launch; medication added later; app re-requests permission once on 3rd open after med-added event, never repeats more than once per 14-day window."
  - Affected tasks: T138 medication scheduler — read permission state before scheduling; T139 missed-dose detector — applies more aggressively when notifications denied; T144 home medication nudge — link directly to today screen; new domain event + provider for permission state.

- **Q4: Backup blob refresh cadence + concurrent-device conflict resolution** → Backup-on-write with 1-hour debounce + force upload on app background, sign-out, and critical events (dose marked taken, medication added, deletion request). Conflict resolution: aggregates (HealthProfile, Medication) use last-writer-wins keyed on `updated_at`; DoseEvent stream is append-only and merges from all devices with duplicate-detection UI hint on `(medication_id, scheduled_at, outcome)` collisions within ±5 min. Backup blob retention: at most 1 active blob per user per device-cloud-of-record; prior blobs overwritten in place.
  - Refines FR-009a (multi-device restore via user-owned cloud — backup cadence now specified).
  - Adds FR-009c (System MUST debounce backup uploads to 1 per hour during steady-state mutation; MUST force upload on app background, sign-out, and critical events).
  - Adds FR-009d (System MUST resolve concurrent aggregate edits with last-writer-wins keyed on the aggregate's `updated_at` timestamp; MUST preserve all DoseEvent entries from all devices with duplicate-collision UI hint).
  - Adds FR-009e (System MUST detect dose-event duplicates within ±5 minutes of identical `(medication_id, scheduled_at, outcome)` and present a non-blocking dedup banner on the meds-today screen).
  - Adds SC-002b (Backup blob upload completes in ≤10s P95 on Wi-Fi for a typical blob size of ~50KB).
  - Adds SC-002c (≥99% of post-restore drift databases pass aggregate-invariant checks; failing 1% trigger an inline "Some data was rebuilt — review your today screen" banner).
  - Affected tasks: new tasks under `core/backup/` — debouncer + critical-event-trigger; `health_profile` + `medication` aggregates expose `updated_at`; `medication_dose_event` table gets `(medication_id, scheduled_at, outcome)` composite index for dedup; `meds.today` gets dedup banner widget.

- **Q5: Account recovery — long-tail when user loses email access + all devices** → Manual recovery via `support@balsm.health` with verification + 30-day cooling-off. Verification requires the user to provide at minimum any 2 of: prior `handle`, signup `country_code`, approximate signup month/year, last-known partial email (first + last character of local part). Support manually issues a recovery token bound to a NEW email address provided by the user; the original email of record is added to a 30-day quarantine. The recovery flow re-keys `date_of_birth_ciphertext` to the new key derivation but does NOT restore on-device PHI — that lives in the user's own cloud and recovery cannot reach it (the user keeps the original Argon2id-derived key by definition). User MUST sign in within 30 days of token issuance to claim. If the original owner reaches out during the 30 days proving identity through any channel (mailto + original email), the recovery is reversed.
  - Adds FR-046c (System MUST provide a manual support-mediated account recovery path requiring identity verification with a minimum of 2 of: prior handle, signup country_code, approximate signup date, last-known partial email).
  - Adds FR-046d (Account recovery MUST enforce a 30-day cooling-off window; original email of record is quarantined for 30 days; original owner MAY reverse the recovery by proving identity during that window).
  - Adds FR-046e (Account recovery MUST NOT restore on-device PHI — only cloud-side non-PHI plus a re-keyed encrypted DOB; user is informed in the recovery email that backup-restore from their own cloud requires them to retain their original OTP-token-derived key, which recovery does not provide).
  - Adds SC-011b (≥95% of legitimate recovery requests complete the 30-day cycle without an original-owner reversal; <5% reverse rate indicates verification floor is correctly calibrated).
  - Adds Edge Case: "User completes recovery, loses access to NEW email within 30 days, support issues a second recovery token resetting the cooling-off — recovery iterations capped at 3 per 6-month rolling window per encrypted-DOB row".
  - Compliance note: support-mediated recovery is a manual process; staff handling MUST follow PDPL data-minimization (verify identity, then act, then forget the verification claims). Add to compliance-risks.md as informational entry (not a gap).
  - Affected tasks: new client screens `auth-recovery-claim.dart` (entered via deep link from support email) and `auth-recovery-explainer.dart` (linked from lockout / 404); new Edge Function `account-recover-claim` (validates support-issued token, re-keys DOB, returns auth session); operational runbook for support team.

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Account (FR-001..FR-008)**

- **FR-001**: System MUST authenticate users via 3 channels: email OTP (6-digit code, 10-minute expiry), Google Sign-In, Apple Sign-In. NO phone OTP. NO password.
- **FR-001a**: System MUST deliver OTP emails via Resend.com with `noreply@balsm.health` sender. Email subject + body + sender lockup MUST match the user's `preferred_language`; localized templates for `en`, `ar-EG`, `ar-SA`, `ar-AE`.
- **FR-002**: System MUST allow users to claim a globally-unique handle matching regex `^[a-z0-9_.]{3,30}$`, case-insensitive uniqueness.
- **FR-003**: System MUST reject handles in the reserved-handle blocklist (`admin`, `balsm`, `support`, `api`, `help`, `null`, `health` + curated extensions).
- **FR-004**: System MUST accept Apple `hide-my-email` relay addresses as valid email-of-record.
- **FR-005**: System MUST refuse signup from countries in the denied-country blocklist (OFAC + Apple/Google denied lists) at the `geofence-check` boundary.
- **FR-006**: Users MUST land on a personalized home screen after signup, showing their display name and nudges for incomplete sections.
- **FR-007**: System MUST limit failed sign-in attempts to 5 per email/sub in a rolling 10-minute window; subsequent attempts within 15 minutes MUST return locked status.
- **FR-008**: System MUST suggest 3 alternative handles when a chosen handle is taken or reserved.

**Health Profile & PHI (FR-009..FR-013)**

- **FR-009**: All clinical PHI (health profile, allergies, conditions, contacts, medications, dose events) MUST live on-device only. Balsm servers MUST NEVER receive PHI plaintext.
- **FR-009a**: System MUST support multi-device restore via user-owned encrypted backup (iCloud Drive on iOS, Google Drive on Android). Balsm MUST NEVER hold the backup plaintext or encryption key.
- **FR-009b**: Backup restore MUST be explicit opt-in (default OFF on first-device-pairing; offered on second-device-sign-in).
- **FR-009c**: System MUST debounce backup uploads to at most 1 per hour during steady-state mutation; MUST force upload on app background, sign-out, and critical events (dose marked taken, medication added, deletion request). *(Q4, 2026-06-17)*
- **FR-009d**: System MUST resolve concurrent aggregate edits across devices with last-writer-wins keyed on `updated_at`; MUST preserve all DoseEvent entries from all devices with duplicate-collision detection. *(Q4, 2026-06-17)*
- **FR-009e**: System MUST detect dose-event duplicates within ±5 minutes of identical `(medication_id, scheduled_at, outcome)` and present a non-blocking dedup banner on `meds.today`. *(Q4, 2026-06-17)*
- **FR-010**: System MUST support: blood type (9 enum values incl. Unknown), allergies (max 50, with severity {severe, moderate, mild}), chronic conditions (with optional ICD-10 code + onset year), emergency contacts (name + relationship + phone, no max).
- **FR-011**: Emergency card snapshot MUST surface: blood type, allergies, conditions, current medications (drug name + dose), primary emergency contact.
- **FR-013**: Emergency QR token MUST encode an Ed25519-signed JTI + AES-256-GCM-encrypted profile payload. Encryption key MUST be generated client-side per token and MUST NEVER reach Balsm servers (carried in URL fragment).

**Emergency QR (FR-014..FR-015)**

- **FR-014**: System MUST allow patients to mint QR tokens with TTL of {0, 3600, 21600, 86400, 604800} seconds (permanent, 1h, 6h, 24h, 7d), with at most one active token per user. *(Amended 2026-09-14: TTL 0 added — a permanent token never expires, its URL never changes, and its ciphertext is refreshed in place so scans always show current data; see `contracts/emergency-token.md` v1.1.)*
- **FR-015**: System MUST allow patients to revoke active QR tokens; subsequent public resolves MUST return "expired" within 2 seconds of revocation.

**Medications & Dose Tracking (FR-016..FR-023)**

- **FR-016**: System MUST support medications with daily / weekly (day-of-week selection) / custom / as-needed schedule shapes.
- **FR-017**: System MUST fire local notifications at scheduled times offline for at least 7 days from last app foreground.
- **FR-017a**: System MUST detect notification-permission state on app foreground and emit a domain event `NotificationPermissionChanged(granted | denied | provisional)`. *(Q3, 2026-06-17)*
- **FR-017b**: System MUST surface a non-blocking permission re-request sheet at most once per 14-day rolling window when permission is denied AND the user has added at least 1 medication. *(Q3, 2026-06-17)*
- **FR-017c**: `meds.today` MUST be reachable in ≤1 tap from home regardless of notification permission state — it is the primary medication-reminder fallback surface. *(Q3, 2026-06-17)*
- **FR-018**: Notification body MUST be a localized generic string. Drug name, dose, schedule MUST NEVER appear in notification body/title/subtitle/summary/watchOS preview/Wear card.
- **FR-018a**: Notification tap MUST deep-link into `meds.today` with the due-dose highlighted; multi-dose-at-same-minute MUST render all due doses in the today list.
- **FR-019**: Dose events MUST be append-only (outcomes: taken, skipped, snoozed, missed, correction). UPDATE and DELETE MUST be prevented at the storage layer.
- **FR-020**: Medications MUST support an optional "controlled substance" flag (user-marked in P001; pre-seeded list deferred to P002).
- **FR-022**: Corrections to past doses MUST be recorded as new linked events (with `parent_event_id`), never as edits.
- **FR-023**: System MUST detect timezone shifts on app foreground and present a confirmation modal asking whether to recompute reminder times.

**Deletion (FR-031..FR-036)**

- **FR-031**: Self-service deletion MUST present a pre-confirm screen exhaustively listing: data deleted now (cloud), data wiped from this phone (on-device PHI), data retained 2 years (anonymous deletion log).
- **FR-032**: Deletion MUST enter a 7-day grace period before purge; user MAY cancel by signing back in within grace.
- **FR-034**: Emergency QR tokens MUST be revoked immediately on deletion request.
- **FR-035**: System MUST list active sessions (device label, type, first-seen, last-activity, approximate location) with per-session revoke.
- **FR-036**: System MUST support "Sign out everywhere except this device" with single confirmation.

**Disclosure & Consent (FR-040..FR-044)**

- **FR-040**: Disclosure acceptance MUST record snapshots of: `country_code`, `supervisory_authority_name`, `preferred_language`, `disclosure_version`, `accepted_at`.
- **FR-041**: Disclosure MUST be scrollable to bottom before the "Accept" CTA enables.
- **FR-044**: Country change MUST trigger fresh disclosure acceptance with the destination country's authority.

**Auth Hardening (FR-045..FR-048)**

- **FR-045**: OTP attempts MUST be rate-limited (3 requests / 10-minute per email).
- **FR-045a**: System MUST throttle OTP requests per source IP at 10 per rolling 60-minute window. *(Q2, 2026-06-17)*
- **FR-045b**: System MUST cap global OTP delivery at 10,000 per rolling 60-minute window with auto-pause + on-call alert on breach. *(Q2, 2026-06-17)*
- **FR-045c**: System MUST invoke an invisible CAPTCHA assessment on the email signup form when per-email or per-IP rate has been exceeded within the previous 24 hours. *(Q2, 2026-06-17)*
- **FR-046**: Lockout MUST display countdown + support contact. Lockout pause-clock MUST be capped at 14 days absolute (prevents indefinite-extension attack via grace-pause loop).
- **FR-046a**: All hard-blocking screens (lockout, geofence-blocked, 404, network-error) MUST expose at least one support channel reachable without app auth.
- **FR-046b**: Public status page at `{BASE_URL}/status` MUST exist and display current service health + recent incident feed.
- **FR-046c**: System MUST provide a manual support-mediated account recovery path requiring identity verification with a minimum of 2 of: prior `handle`, signup `country_code`, approximate signup month/year, last-known partial email (first + last character of local part). *(Q5, 2026-06-17)*
- **FR-046d**: Account recovery MUST enforce a 30-day cooling-off window; original email of record is quarantined for 30 days; original owner MAY reverse the recovery by proving identity during that window. Recovery iterations capped at 3 per 6-month rolling window per encrypted-DOB row. *(Q5, 2026-06-17)*
- **FR-046e**: Account recovery MUST NOT restore on-device PHI — only cloud-side non-PHI plus a re-keyed encrypted DOB. User is informed in the recovery email that backup-restore from their own cloud requires retaining the original OTP-token-derived key, which recovery does not provide. *(Q5, 2026-06-17)*
- **FR-047**: Cloud `user_account.date_of_birth_ciphertext` MUST be field-level-encrypted via pgcrypto pgp_sym. Server key MUST rotate at least annually.
- **FR-048**: Every decryption of `date_of_birth_ciphertext` MUST append a row to `user_account_audit_log` capturing actor, source IP, correlation ID, timestamp.

**Residency (FR-049)**

- **FR-049**: UAE-resident user signup MUST provision rows on a UAE-resident Supabase project. ⚠ **Known gap (Q3, 2026-06-16)**: encrypted DOB residency is pinned at signup and does NOT migrate on country-change. EG-signed-up user relocating to UAE retains EU-resident encrypted DOB. Documented in `docs/compliance-risks.md` RR-001; disclosed in UAE Apple/Google data-safety filings.

**Localization (FR-201..FR-219)**

- **FR-201**: System MUST support 4 first-class locales: `en`, `ar-EG`, `ar-SA`, `ar-AE`. Other locales MUST fall back to `en`.
- **FR-203**: Country change MUST trigger fresh re-auth + fresh disclosure-version acceptance.
- **FR-205**: Translation catalog MUST achieve ≥98% key coverage per first-class locale at every release.
- **FR-207**: Default-class locales (non-first-class) MUST fall back to `en` without UI breakage.
- **FR-209**: Phone-number country hint MUST default to user's `country_code` (+20 / +966 / +971 / open).
- **FR-210**: Emergency-contact phone field MUST accept any international format.
- **FR-211**: National-ID field, when present (P002 surface), MUST apply country-aware validators: Egypt 14-digit + governorate, KSA Luhn 10, UAE 784-checksum.
- **FR-213**: Numeric input MUST accept Latin AND Eastern-Arabic-Indic digits; normalize to Latin at save while preserving user's display preference.
- **FR-216**: Public emergency page MUST resolve `preferred_language` from token's snapshot first, then `Accept-Language` header second.
- **FR-218**: Country picker MUST show denied-country rows as disabled with explanatory copy on tap.
- **FR-219**: Disclosure copy MUST cite the correct supervisory authority per country: Egypt PDPC, KSA SDAIA (سدايا), UAE Data Office.

**Single Global Account (FR-300..FR-305)**

- **FR-300**: One account per email/sub identity MUST exist globally — no per-country accounts.
- **FR-301**: Language MUST be changeable at any time without re-authentication.
- **FR-301a**: System MUST collect date-of-birth at signup, validate the user is ≥18 years old, and soft-block under-18 signups with a localized "Balsm requires a parent/guardian account in P002" waitlist screen. *(Q1, 2026-06-17)*
- **FR-301b**: System MUST validate the in-app DOB declaration against the cloud-side encrypted DOB on every age-gated action — emergency-card mint, medication add, deletion intake — failing closed if mismatch. *(Q1, 2026-06-17)*
- **FR-302**: Country change MUST be allowed post-signup and MUST trigger re-auth + re-disclosure. Country change MUST NOT migrate encrypted DOB residency (see FR-049 / Q3).
- **FR-303**: Handle (when claimed) MUST be portable across all supported countries — same handle survives country change.
- **FR-304**: Handle uniqueness MUST be enforced globally, not per-country.
- **FR-305**: Active sessions MUST be unified across countries (a session created in EG persists if user switches to KSA, until revoked).

### Certification Compliance

| Standard | Applies? | Obligation |
|---|---|---|
| HL7 FHIR R4 | No | P001 ships no FHIR surfaces. Free-text clinical fields preserved verbatim for lossless P002 SNOMED/RxNorm enrichment. `/metadata` CapabilityStatement update NOT required in P001. |
| LOINC | No | No lab observations in P001. |
| SNOMED CT | No | Conditions stored as free text + optional ICD-10 code in P001; P002 may add SNOMED. |
| ICD-10 | Yes (limited) | Chronic conditions MAY carry an optional ICD-10 code. No billing context in P001. |
| RxNorm | No | Medications stored as free text + dose + unit in P001; P002 may add RxNorm. |
| DPG Standard | Yes | Personal data collected (email, country, language, encrypted DOB). Health profile, medications, dose events count as personal-but-on-device. Backup blob in user's own cloud — not Balsm's holding. Data exportable: deferred to P002 per 2026-06-15 directive (no in-app data export in P001). |
| Egypt PDPL (Law 151/2020) | Yes | New personal data collected. Consent captured via disclosure acceptance with PDPC authority name + version snapshot. Cross-border: cloud non-PHI in EU; encrypted DOB residency pinned at signup. |
| KSA PDPL (Royal Decree M/19) | Yes | SDAIA controller obligations met via disclosure acceptance snapshot. Data residency: KSA users on KSA-resident Supabase project (FR-049). |
| UAE PDPL (Fed. Decree-Law 45/2021) + Health Data Law (Fed. Law 2/2019) | Yes | UAE residency satisfied at signup. ⚠ Q3 documented gap on residency-after-country-change. MOHAP/DHA/DOH ADHICS controls met for in-scope P001 surfaces. Riayati/Malaffi integration deferred to P002. |

**New compliance obligations this feature introduces**:
- Privacy-notice + data-safety filings for: Resend (Q5 sub-processor), iCloud Drive + Google Drive (Q1 sub-processors), encrypted-DOB-residency-pinning gap (Q3).
- Risk-register doc `docs/compliance-risks.md` MUST be created with entry RR-001 (Q3 residency).
- UAE app-store filing MUST explicitly disclose the Q3 residency-pinning gap.
- Annual key rotation for `app.dob_key` (Supabase secret).
- 2-year retention of anonymous `deletion_log` per regulator-required mandate.

### Key Entities

- **User Account**: Cloud-side, non-PHI except encrypted DOB. Attributes: handle, display name, bio, country code, preferred language, deletion state, deletion timestamps, encrypted DOB. One per real-world identity (email/sub).
- **Active Session**: Cloud-side. Per-device login state with first-seen, last-activity, revoked-at. One device may have at most one active session per user.
- **Account Lockout**: Cloud-side, ephemeral. Per-identifier failed-attempt counter with rolling-window start and locked-until timestamps.
- **Username Reservation**: Cloud-side. Globally-unique handle reservation with claim and release timestamps.
- **Reserved Handle Blocklist**: Cloud-side, seed-data. Curated list of unclaimable handles.
- **Emergency QR Token**: Cloud-side. JTI + ciphertext + profile etag + TTL + expires-at + revoked-at. Server holds ciphertext + revocation state, never the key.
- **Deletion Log**: Cloud-side, anonymous, 2-year retention. Hashed user-id + country-at-deletion + reason code + Apple-revoke status + timestamps.
- **Disclosure Acceptance**: Both cloud (mirror) and on-device (canonical). Snapshot of country, authority name, language, version, accepted-at.
- **Denied Country Blocklist**: Cloud-side, seed-data. Country code + source (OFAC, Apple-denied, Google-denied, manual).
- **User Account Audit Log**: Cloud-side. Append-only log of every encrypted-DOB decryption — target user, actor user, IP, correlation ID, timestamp.
- **Health Profile**: On-device aggregate. Holds embedded Allergy (severity + name), Chronic Condition (name + ICD-10 + onset year), Emergency Contact (name + relationship + phone) entities.
- **Medication**: On-device aggregate. Drug name + dose + unit + schedule shape + days + times + start/end dates + controlled flag.
- **Dose Event**: On-device, append-only. Medication ID + scheduled-at + outcome (taken/skipped/snoozed/missed/correction) + recorded-at + optional parent_event_id for corrections.
- **Emergency Card Snapshot**: On-device. PHI summary read by emergency_card aggregate to produce the QR payload.
- **Backup Blob**: User's cloud-of-record (iCloud Drive / Google Drive). Encrypted drift database export. Balsm never holds plaintext or key.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Signup & Onboarding**

- **SC-001a**: 95% of users successfully complete signup-to-home flow in ≤90 seconds on a stable 4G connection (measured from app launch to home-screen render).
- **SC-001b**: OTP email arrives in user's inbox in ≤30 seconds P50 and ≤90 seconds P99 (measured from "Send code" tap to inbox arrival).
- **SC-002**: 90% of users who reach home complete their health profile (blood type + ≥1 allergy + ≥1 contact) in their first session.
- **SC-002a**: Multi-device restore-from-backup completes in ≤30 seconds P50 from "Restore" tap to home-screen render with rehydrated data.
- **SC-002b**: Backup blob upload completes in ≤10 seconds P95 on Wi-Fi for a typical ~50 KB encrypted blob. *(Q4, 2026-06-17)*
- **SC-002c**: ≥99% of post-restore drift databases pass aggregate-invariant checks; the failing 1% trigger an inline "Some data was rebuilt — review your today screen" banner. *(Q4, 2026-06-17)*

**Emergency Card & QR**

- **SC-003**: 80% of users with a complete profile mint at least one QR within their first week.
- **SC-014**: QR token revocation propagates to the public-page resolver in ≤2 seconds (measured from "Revoke" tap to "Expired" page render on a fresh scan).
- **SC-202**: Public emergency page renders content in the patient's `preferred_language` (matched against token snapshot) in 100% of cases when JS is available.

**Medications**

- **SC-004**: Medication reminders fire within ±60 seconds of scheduled time in ≥99% of cases with the device offline for up to 7 days.
- **SC-004a**: ≥80% of users with medications added complete a dose-marked-taken event within ±60 minutes of scheduled time whether notifications are granted OR denied — measures the effectiveness of the `meds.today` fallback surface. *(Q3, 2026-06-17)*

**Deletion & Sessions**

- **SC-011**: 95% of locked-out users successfully unlock and sign in on first attempt after the 15-minute wait.
- **SC-011a**: 100% of locked-out users reach support email or the public status page within ≤2 taps from the lockout screen.
- **SC-011b**: ≥95% of legitimate manual recovery requests complete the 30-day cooling-off cycle without an original-owner reversal; <5% reverse rate indicates verification floor is correctly calibrated. *(Q5, 2026-06-17)*
- **SC-012**: Self-service deletion is reachable in ≤2 taps from Settings root in 100% of cases.
- **SC-013**: Active session revocation propagates to the revoked device's next request in ≤2 seconds.

**Localization**

- **SC-203**: Translation catalog covers ≥98% of keys in each of the 4 first-class locales at every release. CI blocks releases below this threshold.
- **SC-205**: 100% of disclosure acceptance records carry valid `country_code` + `supervisory_authority_name` + `preferred_language` snapshots.
- **SC-209**: Numeric inputs in Arabic-Indic form normalize correctly to Latin in 100% of cases without user-perceived display change.

**Single Global Account**

- **SC-301**: 100% of language changes apply within ≤200 milliseconds of selection (UI re-render).
- **SC-301a**: 100% of signup attempts where the declared DOB indicates <18 produce a localized soft-block; zero proceed to home. *(Q1, 2026-06-17)*
- **SC-302**: 100% of country changes succeed within ≤5 seconds end-to-end (re-auth + re-disclosure + persist).
- **SC-306**: Encrypted DOB decryption events generate 100% audit-log coverage.
- **SC-307**: Annual key rotation for `app.dob_key` is completed within ≤24 hours of the scheduled rotation date.

**Privacy & Security**

- **SC-006**: PHI never appears in any of: server logs, error reports, crash breadcrumbs, analytics events, AI prompts, commit messages, test fixtures, notification body/title/subtitle. Verified by PHI-leak fuzz test exercising ≥50 synthetic PHI corpus through Sentry beforeSend and the Dio interceptor.
- **SC-016**: Sentry `beforeSend` allowlist + Dio PHI-leak interceptor reject ≥99.9% of non-allowlisted field names in fuzz testing.
- **SC-016a**: ≥99.5% of legitimate signup attempts complete without ever encountering a CAPTCHA challenge; the remaining 0.5% complete with a single invisible-mode assessment. *(Q2, 2026-06-17)*
- **SC-404**: All 404 / not-found responses serve localized content in 100% of cases.

---

## Assumptions

- **Target audience**: Adult patients aged 18+ in Egypt, KSA, UAE. Primarily Arabic-speaking with English as secondary preference. Includes elderly chronic-condition patients (65+) and tech-comfortable younger users (18-45).
- **Device baseline**: iPhone 14-class or newer (iOS 16+) for emergency Lock Screen widget; older iPhones get app-only functionality. Android 13+ (SDK 33+) for predictive back + Quick Settings tile.
- **Connectivity**: Users have intermittent 4G/Wi-Fi; offline operation MUST work for at least 7 days for medication reminders.
- **Email provider**: Users have a functioning email account that they check at least once per signup attempt within 10 minutes.
- **User cloud of record**: iOS users have an Apple ID with iCloud Drive enabled; Android users have a Google account with Drive access. Backup-restore opt-in respects users who decline.
- **No clinical-decision-support**: P001 ships zero medical advice. No dosage recommendations, no symptom checker, no drug-interaction warnings. The app is a self-management tool, not a clinician.
- **No FHIR/SNOMED in P001**: Clinical fields are free-text. Verbatim preservation enables lossless P002 enrichment but P001 does not enforce coded values.
- **No data export in P001**: Patient data export (FHIR Bundle / CSV / JSON) deferred to P002 per 2026-06-15 directive.
- **No telemedicine in P001**: No appointments, no encounter records, no Rx generation. P001 is patient self-service only.
- **No clinician/provider surfaces**: Doctor + pharmacy surfaces are separate phases (P003+).
- **No multi-locale national-ID input in P001**: National-ID field deferred to P002 per Q3 clarification (Session 2026-06-15).
- **No payments / monetization in P001**: Free consumer app. Cost recovery model deferred.
- **Egypt-primary launch market**: KSA + UAE supported but launch volume expected concentrated in Egypt.
- **Existing brand + design assets**: `Balsm-Core/brand/` provides logo, watercolor pattern, color tokens, typography. No new brand work required for P001.
- **No AI in P001 product surface**: Some AI tooling used during development (this skill) but no in-product AI inference.
- **Public-route hosting**: Flutter Web public routes (`/emergency/{token}`, `/account/delete`, `/status`) hosted on Firebase Hosting or Cloudflare Pages (decision deferred to deployment phase).
- **Sentry self-hosted**: AGPL-compatible deployment on Hetzner Frankfurt; not Sentry SaaS.
- **Resend.com selected as OTP delivery provider** (Q5 clarification, Session 2026-06-16). DPA signed before production launch.
- **iCloud Drive + Google Drive selected as backup destinations** (Q1 clarification, Session 2026-06-16). Sub-processor disclosures required.

---

## Out of Scope (P001)

Explicit non-goals to prevent scope creep:

- Telemedicine, appointments, encounters
- Doctor / clinician / pharmacist surfaces
- Prescription generation
- Lab results integration
- FHIR / SNOMED / RxNorm coded values
- Drug-interaction checking
- Symptom checker
- AI-assisted features in-product
- Multi-language Arabic dialects beyond `ar-EG`, `ar-SA`, `ar-AE`
- Hijri calendar
- Avatar uploads (use initials of first + last name instead)
- Data export (deferred to P002)
- National-ID badge / duplicate-prevention (deferred to P002 with account merging)
- Cross-country encrypted-DOB row migration (Q3 documented gap; revisit P002)
- Payment / subscription / monetization
- Insurance integration
- Wearable + watchOS-native + WearOS apps (lock-screen widgets only)
- Multi-account-per-device (one user per device install)
- Marketing landing page (separate website repo)
- Public API for third-party integrations
- Family / dependent profiles
