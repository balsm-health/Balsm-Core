# .NET API Contract — P001 Consumer Patient App

**Version**: 1.0 · **Date**: 2026-06-17
**Replaces**: Supabase Edge Function interface map (removed per 2026-06-17 pivot).
**Base URL**: `{BALSM_API_BASE_URL}` (dev: `http://localhost:5000`, staging/prod: TBD at deployment phase)
**Auth**: `Authorization: Bearer <access_token>` (JWT, 15-min expiry). Refresh via `POST /auth/refresh`.

**Token signing / key management**: access tokens carry a `kid` header and the validator keeps a dual-key (current + previous) window so signing keys can rotate without a flag day. Signing keys load from a managed secret store (never a committed env file). Access tokens also carry a `session_id` claim bound to an `ActiveSession` row; the auth middleware rejects (401) a token whose session was revoked, so revocation takes effect within one request rather than waiting out the 15-min expiry. The recovery-token signing key (see `/auth/recovery/claim`) is a DISTINCT key with its own `typ`, never the access-token key.

All responses follow:
```json
{ "data": <payload>, "error": null }
{ "data": null, "error": { "code": "...", "message": "...", "correlationId": "..." } }
```

---

## Auth Module

### `POST /auth/otp/request`
Request email OTP. Rate-limited: 3/10min per email, 10/60min per IP, 10k/60min global.
```json
Request:  { "email": "user@example.com", "country_code": "EG", "captcha_token": "..." }
Response: { "data": { "expires_in_seconds": 600 } }
Errors:   429 TooManyRequests (per-email/IP/global), 403 GeofenceBlocked
```

### `POST /auth/otp/verify`
Verify OTP and issue JWT pair.
```json
Request:  { "email": "user@example.com", "code": "123456", "device_id": "<uuid>", "device_label": "iPhone 15" }
Response: { "data": { "access_token": "...", "refresh_token": "...", "user_id": "<uuid>", "is_new_user": true } }
Errors:   400 InvalidCode, 410 CodeExpired, 423 AccountLocked (+ Retry-After header)
```

### `POST /auth/google`
Exchange Google ID token for Balsm JWT.
```json
Request:  { "id_token": "<google_id_token>", "device_id": "<uuid>", "device_label": "..." }
Response: { "data": { "access_token": "...", "refresh_token": "...", "user_id": "<uuid>", "is_new_user": true } }
Errors:   400 InvalidToken, 403 GeofenceBlocked, 423 AccountLocked
```

### `POST /auth/apple`
Exchange Apple ID token for Balsm JWT. Accepts `hide-my-email` relay.
```json
Request:  { "id_token": "<apple_id_token>", "authorization_code": "...", "device_id": "<uuid>", "device_label": "..." }
Response: { "data": { "access_token": "...", "refresh_token": "...", "user_id": "<uuid>", "is_new_user": true } }
```

### `POST /auth/refresh`
Refresh access token using refresh token. **Rotation semantics (mandatory)**: refresh is single-use — the presented token is revoked atomically as the new pair is issued; presenting an already-rotated (superseded) token is reuse-detection and MUST return `401 TokenRevoked` AND revoke the entire token family for that `device_id` (the device is re-authenticated from scratch). `refresh_token` is stored server-side only as a SHA-256 hash of a ≥256-bit random value.
```json
Request:  { "refresh_token": "...", "device_id": "<uuid>" }
Response: { "data": { "access_token": "...", "refresh_token": "..." } }
Errors:   401 TokenExpired, 401 TokenRevoked (includes reuse-of-rotated-token → family revoked)
```

### `POST /auth/sign-out`
Revoke refresh token for current device.
```json
Request:  {} (auth header required)
Response: { "data": { "signed_out": true } }
```

### `POST /auth/recovery/claim` *(unauthenticated — account-takeover surface; hardened)*
Claim a support-issued recovery token (FR-046c). This endpoint transfers the account to `new_email` and re-keys DOB, so it is the platform's highest-value takeover target and MUST enforce:
- `recovery_token` is a ≥128-bit random value, signed with a signing key/`typ` DISTINCT from the access-token key, TTL ≤72h (support tooling issues 1h by default).
- **Single-use**: the token's `jti` is persisted and burned on first successful claim; a replay of a burned/used token returns `401 TokenReplayed`.
- Rate-limited per-IP and globally (same policy family as OTP); excess → `429`.
- Every attempt (success and failure) writes an audit row; on success a security notification is sent to the quarantined (old) identity.
```json
Request:  { "recovery_token": "...", "new_email": "...", "device_id": "<uuid>", "device_label": "..." }
Response: { "data": { "access_token": "...", "refresh_token": "..." } }
Errors:   400 InvalidToken, 401 TokenReplayed, 410 TokenExpired, 409 CoolingOffActive, 429 TooManyRequests
```

---

## Account Module

### `GET /account/self`
Get current user account. Returns the stored **derived** `dob_year` column (persisted at DOB-set time) — it does NOT decrypt the DOB ciphertext on every call. Full-DOB decryption (and its FR-048 audit row) happens only where the actual date is needed (age-gate evaluation), keeping key usage and audit volume bounded.
```json
Response: { "data": { "user_id": "...", "handle": "...", "display_name": "...", "country_code": "EG", "preferred_language": "ar-EG", "deletion_state": "ACTIVE", "dob_year": 1990 } }
```

### `POST /account/handle/claim`
Claim a globally-unique handle (FR-002, FR-003).
```json
Request:  { "handle": "noor.health" }
Response: { "data": { "handle": "noor.health", "claimed_at": "..." } }
Errors:   409 HandleTaken, 409 HandleReserved, 422 HandleInvalidFormat
          (on 409 HandleTaken: suggestions array with 3 alternatives per FR-008)
```

### `POST /account/handle/check` *(auth required)*
Check handle availability. Requires a valid bearer token (handle claim happens post-signup, so the caller is always authenticated) and is per-user + per-IP rate-limited with uniform response timing — otherwise it is an unauthenticated oracle for enumerating the handle namespace (`available=false` ⇒ account exists).
```json
Request:  { "handle": "noor.health" }
Response: { "data": { "available": true } }
Errors:   401 Unauthorized, 429 TooManyRequests
```

### `POST /account/dob`
Set date of birth (encrypted at .NET layer before insert, FR-047).
```json
Request:  { "date_of_birth": "1990-03-15" }
Response: { "data": { "dob_set": true } }
Errors:   422 UnderEighteen (soft-block per FR-301a)
```

### `PATCH /account/country`
Change country (requires re-auth via `reauth_token` from prior OTP/OIDC verify, FR-302).
```json
Request:  { "country_code": "SA", "reauth_token": "...", "disclosure_acceptance_id": "..." }
Response: { "data": { "country_code": "SA" } }
Errors:   401 ReauthRequired, 409 DisclosureNotAccepted
```

### `PATCH /account/language`
Change preferred language (no re-auth, FR-301).
```json
Request:  { "preferred_language": "ar-SA" }
Response: { "data": { "preferred_language": "ar-SA" } }
```

---

## Emergency QR Module

### `POST /emergency-qr/mint`
Mint a new QR token. Revokes prior active token. Age-gated (FR-301b). `jti` is a 128-bit CSPRNG value (UUIDv4 — NOT a timestamp-prefixed UUIDv7). `ciphertext` is capped at 16 KB (reject larger → 422) to prevent storage abuse. `ttl_seconds: 0` mints a **permanent** token — `expires_at` comes back `null` and the token resolves until revoked. `token_id` is the offline-first path: a client-generated CSPRNG UUIDv4; the call is idempotent per token_id (retry refreshes the ciphertext of the existing active token), and another user's token_id is rejected.
```json
Request:  { "ciphertext": "<base64, ≤16KB>", "profile_etag": "<hex8>", "ttl_seconds": 86400, "token_id": "<uuid, optional>" }
Response: { "data": { "token_id": "<uuid>", "expires_at": "...|null" } }
Errors:   403 AgeGateBlocked, 422 InvalidTtl, 422 CiphertextTooLarge
```

### `PUT /emergency-qr/{jti}/ciphertext`
Replace an active token's encrypted snapshot in place (permanent-QR data refresh — the QR URL never changes while scans decrypt to current data). Owner-scoped; the client re-encrypts with the same device-held key, so the server still sees ciphertext only.
```json
Request:  { "ciphertext": "<base64, ≤16KB>", "profile_etag": "<hex8>" }
Response: { "data": { "updated": true } }
Errors:   404 NotFound (unknown/not-owned jti), 409 TokenInactive (revoked or expired)
```

### `GET /emergency-qr/active`
Get current user's active QR token summary. `expires_at` is `null` for a permanent token (`ttl_seconds: 0`).
```json
Response: { "data": { "token_id": "...", "expires_at": "...|null", "ttl_seconds": 86400 } | null }
```

### `POST /emergency-qr/{jti}/revoke`
Revoke a QR token. Owner-scoped: a `jti` not owned by the caller returns `404` (not 403) so it cannot be used to probe token existence.
```json
Response: { "data": { "revoked": true } }
Errors:   404 NotFound (unknown or not-owned jti)
```

### `GET /emergency-qr/resolve/{jti}` *(public, no auth)*
Resolve a QR token for the public `/t/{jti}` page (spec v2.0 envelope). Per-IP rate-limited (unauthenticated scraping/DoS guard) and returns `Cache-Control: no-store` so the ciphertext is never cached by intermediaries. The AES key is never in this response — it lives only in the URL fragment the server never receives. Revoked, expired, and unknown tokens all answer a **uniform 404** with an identical body, so a prober cannot learn that a jti once existed. Language is inside the encrypted payload — the server no longer stores or returns it.
```json
Response: { "data": { "v": 1, "type": "profile", "expires_at": "...|null", "ciphertext_base64": "<base64>" } }
Errors:   404 NotFound (unknown, revoked, or expired — indistinguishable), 429 TooManyRequests
```

### `GET /emergency-qr/scans`
Owner's own scan history (spec v2.0): each successful public resolve as {when, coarse client class, country when geo is configured} — never the scanner's identity. Newest first, capped at 50. Failed resolves are not recorded.
```json
Response: { "data": { "scans": [ { "token_id": "<uuid>", "resolved_at": "2025-01-01T00:00:00Z", "client": "web", "country": null } ] } }
Errors:   401 Unauthorized
```

---

## Sessions Module

### `GET /sessions`
List active sessions for the current user (FR-035).
```json
Response: { "data": [ { "session_id": "...", "device_id": "...", "device_label": "...", "device_type": "phone", "first_seen_at": "...", "last_activity_at": "...", "is_current": true } ] }
```

### `DELETE /sessions/{session_id}`
Revoke a session (FR-035). Owner-scoped: a `session_id` not owned by the caller returns `404` (not 403) to prevent existence probing. Revoking a session invalidates its in-flight access tokens within one request via the `session_id` claim check (see Auth key-management note).
```json
Response: { "data": { "revoked": true } }
Errors:   400 CannotRevokeCurrentSession (use sign-out instead), 404 NotFound (unknown or not-owned session)
```

### `DELETE /sessions`
Revoke all sessions except current (FR-036).
```json
Response: { "data": { "revoked_count": 3 } }
```

---

## Deletion Module

### `POST /deletion/intake`
Enter deletion grace period (FR-031, FR-032). Requires a fresh server-validated `reauth_token` (from a recent OTP/OIDC verify) — a bare access token is not sufficient, so a stolen token alone cannot schedule deletion. **NOT age-gated**: account erasure is a data-subject right (PDPL) and MUST NOT be blocked by the age gate or by a missing/undecryptable DOB. Revokes QR tokens immediately (FR-034).
```json
Request:  { "reauth_token": "..." }
Response: { "data": { "deletion_state": "DELETION_REQUESTED", "grace_until": "...", "apple_revoke_queued": true } }
Errors:   401 ReauthRequired
```

### `POST /deletion/cancel`
Cancel deletion during grace period (FR-032).
```json
Request:  {} (auth required — user signed back in)
Response: { "data": { "deletion_state": "ACTIVE" } }
Errors:   409 GracePeriodExpired
```

---

## Disclosure Module

### `POST /disclosure/accept`
Record a disclosure acceptance (cloud mirror, FR-040).
```json
Request:  { "disclosure_id": "onboarding_consolidated", "version": "2.1.0", "country_code": "EG", "supervisory_authority_name": "PDPC", "preferred_language": "ar-EG" }
Response: { "data": { "accepted_at": "..." } }
```

---

## Geofence

Geofence check is enforced server-side at auth endpoints (not a standalone endpoint). Returns `403 GeofenceBlocked` with `{ "country_code": "IR", "reason": "ofac" }` when signup attempted from a denied country.
