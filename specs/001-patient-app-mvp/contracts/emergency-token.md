# Contract: Emergency QR Token (P001)

**Version**: 1.1 · **Date**: 2026-09-14 (permanent tokens added; v1.0 2026-07-17) · **FRs**: FR-013, FR-014, FR-015, FR-034
**Owner context**: Personal Health (module `emergency_card`) · **Endpoints**: see `dotnet-api-endpoints.md` §Emergency QR Module.

Documents the **implemented** P001 token model. Referenced by `tasks/flutter.md` T133a and the emergency-QR mint/resolve tasks.

## Token identity (`jti`)

- `jti` is a **128-bit CSPRNG** value formatted as a UUIDv4 — **not** a timestamp-prefixed UUIDv7. A v7 `jti` would leak mint time and be partially predictable; the resolve surface is public, so the identifier must carry no structure.
- One active token per user: minting revokes the prior active row in the same transaction (partial unique index on non-revoked rows; see `supabase-schema.sql`).

## Lifetime

- TTL is one of `{0, 3600, 21600, 86400, 604800}` seconds (permanent / 1h / 6h / 24h / 7d); any other value → `422 InvalidTtl`.
- **`ttl_seconds = 0` mints a permanent token** (v1.1): `expires_at` is `null` and the token resolves until revoked. At most one active token per user still holds — minting a permanent token revokes a temporary one and vice versa.
- A permanent token's ciphertext can be replaced in place via `PUT /emergency-qr/{jti}/ciphertext` (owner-only, active-only), so the QR URL — and therefore a printed QR — never changes while a scan always decrypts to the current profile. The client re-encrypts with the SAME device-held key; the server still only ever sees ciphertext. The client stores `{jti, key, profile_etag}` in the platform keystore and refreshes when the on-device snapshot's etag drifts (app start + share-sheet open).
- Resolve returns `410` when the token is revoked OR expired; `404` when the `jti` is unknown. Revocation is immediate (explicit revoke, new mint, or account-deletion intake per FR-034). `expires_at` in all responses is nullable — `null` means permanent.

## Confidentiality (key never reaches the server)

- The emergency payload is sealed client-side with **AES-256-GCM**. The symmetric key lives ONLY in the URL fragment (`{BASE_URL}/emergency/<jti>#k=<key>`); browsers never send the fragment to the server, so the resolve endpoint returns ciphertext + `preferred_language` and never the key.
- `ciphertext` is capped at 16 KB at mint. Resolve responses carry `Cache-Control: no-store` and are per-IP rate-limited.
- Sentry/crash scrubbing MUST strip URL fragments so `#k=` is never captured (see `crash-allowlist.json`).

## Payload integrity / signing

- **No payload signature in P001.** Integrity of the resolved record rests on AES-256-GCM's authentication tag (tamper of the ciphertext fails decryption client-side) plus the server-side `jti` → row lookup. There is no server-issued Ed25519/JWS envelope over the token in P001.
- **Ed25519 token signing is explicitly OUT OF SCOPE for P001** and listed as a P002 candidate (a signed envelope binding `jti`, `expires_at`, and issuer, verified by the public page before decryption). Any task referencing an `emergency-token` signature scheme belongs to P002, not P001.

## Age gate

- Mint is age-gated (FR-301b): a fail-closed `AgeGatePolicy` blocks mint when the user's DOB is missing, under-18, or undecryptable (`403 AgeGateBlocked`).
