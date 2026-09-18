# Contract: Profile QR Token (P001)

**Version**: 2.0 · **Date**: 2026-09-15 (identity metadata contract; v1.2 offline-first client-minted jti 2026-09-15; v1.1 permanent tokens 2026-09-14; v1.0 2026-07-17) · **FRs**: FR-013, FR-014, FR-015, FR-034
**Owner context**: Personal Health (module `emergency_card`) · **Endpoints**: see `dotnet-api-endpoints.md` §Emergency QR Module.

Documents the **implemented** P001 token model. v2.0 renames the concept from
"emergency QR" to the patient's **profile QR**: one permanent token whose jti
is the patient's stable scannable reference for emergency, booking, and
(later) delegation flows.

## QR URL — the only thing the QR image encodes

```
https://app.balsm.health/t/{jti}#k={key}
```

- `{jti}` — the token id (below). `{key}` — the AES-256-GCM key, base64url
  without padding, **URL fragment only**: browsers never send fragments, so
  the server never sees the key.
- The path is deliberately **type-free and version-free**. A printed permanent
  QR is frozen forever, so nothing evolvable may live in the URL; versioning
  lives inside the payload and the resolve response.
- `/emergency/{jti}` is retained as a serving alias for dev-era codes. New
  mints use `/t/` only.

## Token identity (`jti`)

- `jti` is a **128-bit CSPRNG** value formatted as a UUIDv4 — **not** a
  timestamp-prefixed UUIDv7. A v7 `jti` would leak mint time and be partially
  predictable; the resolve surface is public, so the identifier must carry no
  structure.
- **The client mints the jti** for permanent tokens (offline-first): the app
  generates it on-device, renders the QR immediately, and sends it as
  `token_id` when connectivity allows. The mint endpoint is **idempotent per
  token_id** — a retry of an existing active token refreshes its ciphertext in
  place; a `token_id` owned by another user is rejected. Temporary tokens keep
  server-assigned ids (their expiry is server-enforced).
- **Everything binds to the jti.** Booking, emergency, and delegation flows
  reference the jti; the server resolves jti → patient behind authenticated,
  audited endpoints. The account `user_id` never appears in the payload, the
  envelope, or the URL — the jti is revocable, the account id is not, and
  server-side resolution is the authorization and audit chokepoint.
- One active token per user: minting revokes the prior active row in the same
  transaction (partial unique index on non-revoked rows).

## Encrypted payload (schema v1)

Sealed client-side with AES-256-GCM (`nonce || ciphertext || tag`). JSON,
snake_case, versioned:

```json
{
  "v": 1,
  "kind": "profile",
  "name": "Full Name",
  "date_of_birth": "1990-04-12",
  "gender": "female",
  "lang": "ar",
  "created_at": "2026-09-15T12:00:00Z"
}
```

- **Identity only** — no medical fields in v1. `name`, `date_of_birth`
  (ISO date), and `gender` (`male` | `female` | `other`) are all nullable; an
  empty account profile still mints a valid identity token and the refresh
  path fills fields in later.
- `v` and `kind` live INSIDE the GCM-authenticated payload so a tampered
  plaintext envelope cannot change how a decrypted payload is interpreted.
- `lang` (BCP-47 primary tag) moves into the payload; the server no longer
  stores `preferred_language` in plaintext and mint/update requests no longer
  carry it.
- A payload without a `v` field is **legacy (pre-v2.0)**: resolvers render no
  data from it, only a "re-open your app to refresh this code" hint. Devices
  self-migrate: the client's etag of the new payload differs from the stored
  etag, so the standing refresh path rewrites the ciphertext on next app
  start.
- Future medical/emergency data (blood type, allergies, contacts) is a
  **v2 payload**, opt-in per field, behind the same version gate. Not in P001.

## Resolve (public envelope)

`GET /emergency-qr/resolve/{jti}` (no auth), served to the `/t/{jti}` page:

- **Active** → `200`:

  ```json
  { "data": { "v": 1, "type": "profile", "expires_at": null, "ciphertext_base64": "…" } }
  ```

  `type` is `profile` today; a future delegation token introduces new values
  and the scanning app routes on it. `expires_at: null` means permanent.
- **Revoked, expired, or unknown** → **uniform `404`** with an identical
  error body. Deliberately indistinguishable: a distinct revoked/expired
  answer would confirm to a prober that a jti once existed. (v1.2's `410` for
  revoked/expired is retired.) The public page shows a single message: the
  code isn't valid and the owner may have replaced it.
- Resolve responses carry `Cache-Control: no-store` and are per-IP
  rate-limited (recommended NFR; also caps scan-notification noise from a
  photographed QR).

## Lifetime

- TTL is one of `{0, 3600, 21600, 86400, 604800}` seconds (permanent / 1h /
  6h / 24h / 7d); any other value → `422 InvalidTtl`.
- **`ttl_seconds = 0` mints a permanent token**: `expires_at` is `null` and
  the token resolves until revoked. At most one active token per user still
  holds — minting a permanent token revokes a temporary one and vice versa.
- A permanent token's ciphertext is replaced in place via
  `PUT /emergency-qr/{jti}/ciphertext` (owner-only, active-only), so the QR
  URL — and therefore a printed QR — never changes while a scan always
  decrypts to the current identity. The client re-encrypts with the SAME
  device-held key; the server only ever sees ciphertext. The client stores
  `{jti, key, profile_etag}` in the platform keystore and refreshes when the
  on-device payload's etag drifts (app start + share-sheet open).

## Lifecycle features (v2.0)

- **Rotate**: one action revokes the active permanent token and mints a fresh
  jti + fresh key (composition of the existing revoke + idempotent mint).
  For a leaked or photographed QR: old copies stop resolving immediately; the
  app shows the new QR at once.
- **Scan history**: the server records each successful resolve —
  `{token jti, resolved_at, client class (web page vs app), coarse
  geo (country, when available)}` — never the scanner's identity. The owner
  reads their own history via `GET /emergency-qr/scans` (authenticated,
  self-only). Failed resolves (404) are not recorded.
- **Scan push notification**: on each successful resolve the owner is
  notified. Layered on scan history; **phase 2** — ships when push
  infrastructure lands, not part of the P001 implementation.

## Confidentiality (key never reaches the server)

- The symmetric key lives ONLY in the URL fragment; the resolve endpoint
  returns ciphertext and never the key.
- `ciphertext` is capped at 16 KB at mint.
- Sentry/crash scrubbing MUST strip URL fragments so `#k=` is never captured
  (see `crash-allowlist.json`).
- The payload contains identity PHI (name, DOB): it MUST never be logged,
  and decrypted payloads never touch disk on the resolving page.

## Payload integrity / signing

- **No payload signature in P001.** Integrity rests on AES-256-GCM's
  authentication tag (tampered ciphertext fails decryption client-side) plus
  the server-side `jti` → row lookup. There is no server-issued Ed25519/JWS
  envelope over the token in P001.
- **Ed25519 token signing is explicitly OUT OF SCOPE for P001** and listed as
  a P002 candidate (a signed envelope binding `jti`, `expires_at`, and
  issuer, verified by the public page before decryption — also the answer to
  fully-offline provider-app identity verification). Any task referencing an
  `emergency-token` signature scheme belongs to P002, not P001.

## Age gate

- Mint is age-gated (FR-301b): a fail-closed `AgeGatePolicy` blocks mint when
  the user's DOB is missing, under-18, or undecryptable (`403 AgeGateBlocked`).
- The gate reads the **account** DOB (field-encrypted server-side), not the
  payload: an account that passes the gate can still mint a payload whose
  optional fields are all null. "Empty identity payload mints" and "under-18
  accounts cannot mint" are both true and do not conflict.
