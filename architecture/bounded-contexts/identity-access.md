# Identity & Access — Bounded Context

| | |
|---|---|
| **Plane** | Cross-plane (single identity truth across consumer, provider, platform) |
| **Classification** | Generic — standard auth patterns; buy/lean on Supabase Auth, custom PBAC layer on top |
| **Phases** | P001 (consumer auth + deletion), P004 (cloud-first auth + local fallback), P010 (JWT bridge), P014 (permissions engine) |
| **Repo mapping** | Supabase: `auth.users`, `public.profiles`, `public.deletion_log`; `Balsm-API-DotNet`: `Modules/Identity`, Supervisor admin auth (`FileCredentialStore`); `balsm_app`: `auth`, `sessions`, `account`, `deletion`, `disclosure`, `geofence_block` packages; Balsm Cloud Auth API (P004) |
| **PHI posture** | None. Identity metadata only: username, display_name, bio, avatar, `dob_year`. Phone/email live in `auth.users` for login only. `deletion_log` stores hashed user_id + reason code (2-year retention). |

## Purpose

One source of identity truth for every plane. Supabase issues the JWTs; everything else — the .NET cloud API (P016), the local server (P010, cached public key, offline-capable) — validates them. No auth migration, ever (ADR-03). Wraps workspace membership, device registry, roles → full permissions engine (P014), account deletion lifecycle, geo-fencing (ADR-09), and caregiver/guardianship for family profiles.

## Ubiquitous Language

| Term | Meaning in this context |
|---|---|
| Username | `@handle`, 3–30 chars `[a-z0-9_.]`, globally unique case-insensitive, business data in `public.profiles` (ADR-07) — not a Supabase Auth concern |
| Session | One authenticated device binding, remotely revocable |
| Deletion Request | The 7-day-grace FSM: confirm → logged out + queued → day-7 purge (or cancel via re-login) |
| Workspace Membership | A user's role binding inside a workspace (Owner/Admin/Member; custom roles at P014) |
| Caregiver / Guardianship | The consent relationship allowing one account to manage a dependent's profile |
| Invite Code | One-time 6-char alphanumeric workspace join token, configurable expiry |

## Aggregates

| Aggregate Root | Contents | Key invariants |
|---|---|---|
| `UserAccount` | profile row (username, display_name, bio, avatar, dob_year), reserved-name check | Username from reserved blocklist unregisterable; released back to pool only on final purge |
| `Session` / `Device` | device registry, tokens, last-seen | Revocation immediately blocks API calls (P004 exit criterion) |
| `DeletionRequest` | state (requested → grace → purged / cancelled), reason code, re-auth proof | Re-auth before queue; Apple token revoke on confirm; purge ≤30 days (PDPL); grace = locked out, login = cancel flow only |
| `WorkspaceMembership` | user ↔ workspace, role | One workspace per server (P000) |
| `Role` / `PermissionGroup` | P004: 3 hard-coded roles; P014: custom groups, per-action grants | Permission lookup abstraction swappable (P004) → engine (P014); every endpoint checks permission |
| `Guardianship` | guardian ↔ dependent profile, consent record | Full dependent management (legal guardianship, audit) at P014 |
| `InviteCode`, `GeofencePolicy`, `DisclosureAcceptance` | join codes; ADR-09 Egypt-only signup fence; on-device canonical disclosure acceptance | Brute-force lockout: 5 fails → 15 min |

## Integration Events

**Published:** `UserRegistered`, `SessionRevoked`, `AccountDeletionConfirmed` (→ Personal Health local wipe), `AccountPurged` (→ username release, Supabase row hard-delete), `MembershipGranted`.

**Consumed:** `AccountDataWiped` (Personal Health confirms local wipe).

## Published Language / OHS

- **JWT bridge (ADR-03):** Supabase-signed JWT + published public keys. Validated by local .NET server (P010, cached key — offline after first sync) and .NET cloud (P016). This is the platform's single most important published language.
- Cloud Auth API (P004): `register` / `token` / `refresh` / `logout`; offline registrations queue and sync on reconnect.

## Relationships

| With | Direction | Pattern | Contract |
|---|---|---|---|
| Every context | upstream | OHS/PL | JWT + permission checks |
| Customer Relations | upstream | C-S | Claim matching (phone/email/national ID → `supabase_user_id`) |
| Personal Health | upstream | C-S | Deletion FSM orders local wipe; guardianship gates family-profile access |
| Supabase / Apple / Google sign-in | downstream of external | ACL | Auth SDKs wrapped; `auth.users` is a foreign model — ours is `profiles` + sessions |

## Feature Reference

| Phase | Deliverable |
|---|---|
| P001 | Registration: email/phone + password, Google, Apple; username (@handle, reserved blocklist); multi-device sessions + remote logout |
| P001 | Account deletion: in-app + web entry, re-auth, 7-day grace, Apple token revoke, purge ≤30 days, deletion_log retention, username release |
| P001 | Egypt geo-fence at signup (ADR-09); disclosure acceptances |
| P004 | Balsm Cloud Auth API: register/token/refresh; PostgreSQL registry; growth dashboard |
| P004 | Local fallback auth: cached-credential JWT issuance offline; queued registrations sync on reconnect |
| P004 | Device registry + revocation; invite codes; brute-force lockout (5 → 15 min); 3 hard-coded roles; secure token storage (Keychain/EncryptedSharedPreferences/keyring) |
| P010 | Supabase JWT validation in local .NET server (cached public key, offline-capable); no re-registration at clinics |
| P014 | Full permissions engine: custom roles, per-action grants at every endpoint, group templates (Receptionist, Nurse, Pharmacist, Branch Manager, Department Head) |

Modules: .NET `Account`, `Auth`, `Sessions`, `Deletion`, `Disclosure`, `Geofence`, `Identity`; Flutter `auth`, `sessions`, `account`, `deletion`, `disclosure`, `geofence_block` (planned); Supabase `auth.users`, `public.profiles`, `public.deletion_log`.

## Boundary Notes

- Dual-mode auth (P004): cloud-first, local JWT fallback with cached credentials — one context, two deployments; queued offline registrations reconcile to cloud.
- 100% test coverage constitutional for auth endpoints, both paths.
- Web deletion entry (`balsm.health/account/delete`) is part of this context's surface (Google Play requirement).

## Family linking (P002 — mapped ahead of implementation)

The patient app already carries a **preview** of family/caregiver linking
(add member by scanning their profile QR → outgoing `pending` link request →
approval in the other person's app). Domain home: **this context** —
`Caregiver` / `Guardianship` aggregates own the link request lifecycle
(`FamilyLinkStatus: pending → linked`), binding to the profile-QR `jti`
(never an account id; emergency-token spec v2.0 §Token identity).

Current state (P001): client-side preview only — `FamilyMemberPreview` /
`FamilyLinkRequest` live in the app shell with local state, the shared value
object `FamilyLinkStatus` lives in the Flutter core domain layer, and no
server surface exists. The P002 deliverable is the link-request API in this
context (create by jti / list incoming / approve / decline) plus the app
model's migration out of the shell into a module mapped here.
