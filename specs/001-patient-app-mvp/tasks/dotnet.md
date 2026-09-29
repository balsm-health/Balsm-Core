---
description: "P001 tasks — .NET backend track (Balsm-API-DotNet)"
---

# P001 Tasks — .NET Backend Track

> **Module & Context Scope**: Identity & Access → `src/Modules/{Auth, Account, Sessions, Deletion, Disclosure, Geofence}`; Personal Health → `src/Modules/EmergencyQr` (PHI-free token surface only). Full mapping: [../tasks.md §Module & Context Scope](../tasks.md) / [../plan.md](../plan.md). Tasks outside these modules require a plan.md mapping update first.


Filtered from `../tasks.md`. Phase + section headers preserved. Only `[DotNet]` rows kept.

> **Replaces the former `tasks/supabase.md`** (2026-06-17 pivot). Backend is ASP.NET Core 10 + EF Core 10 + Npgsql. Auth = custom JWT + OTP + Google/Apple OIDC. Authorization = ASP.NET Core policies (no RLS). DOB = AES-256-GCM at the application layer. See `../research.md §26–§33` + `../contracts/dotnet-api-endpoints.md`.

> **Repo (2026-06-17 clarification): the .NET backend lives in the sibling repo `Balsm-API-DotNet`, NOT inside `Balsm-Core`.**
> Paths: `../Balsm-API-DotNet/` is the API repo, a sibling of this one in the workspace. `../data-model.md`, `../research.md`, `../contracts/` resolve inside this spec folder (`specs/001-patient-app-mvp/`).

Format: `[ID] [P?] [Story?] [DotNet] Description with file path`

## Repo conventions (already established — DO NOT recreate)

The patient-app backend is **added to the existing `Balsm-API-DotNet` modular monolith**, reusing its conventions:

- **`global.json`** pins SDK `10.0.101` (`rollForward: latestFeature`) — already exists, do not change.
- **`Directory.Build.props`** sets `net10.0`, nullable, implicit usings, `TreatWarningsAsErrors`, central package management, lock files — already exists.
- **`Directory.Packages.props`** is the single source of NuGet versions (`<PackageVersion>`); module csproj files carry only `<PackageReference Include>` with no version.
- **`Balsm.API.slnx`** is the solution (XML `.slnx`, not `.sln`). New projects are added as `<Project Path>` entries.
- **Per-module 4-project DDD split** (mirror `src/Modules/Identity/`): `Balsm.{Module}.Api` (Controllers + `ModuleRegistration.cs` → `Add{Module}Module()`), `Balsm.{Module}.Application` (Commands/Queries/Handlers/DTOs/Validators + `DependencyInjection.cs` → `Add{Module}Application()` + `AssemblyReference.cs`), `Balsm.{Module}.Domain` (entities deriving `Balsm.SharedKernel.Domain.{BaseEntity,AggregateRoot}`, `Repositories/`, `Exceptions/`, `I{Module}UnitOfWork.cs`, `AssemblyReference.cs`), `Balsm.{Module}.Infrastructure` (`Data/{Module}DbContext.cs : BaseDbContext`, `Configuration/`, `Migrations/`, `Repositories/`, `DependencyInjection.cs` → `Add{Module}Infrastructure(IConfiguration)`).
- **Per-module `DbContext`** derives `Balsm.Infrastructure.Data.BaseDbContext(options, IDomainEventDispatcher)` and is registered AND re-exposed as `DbContext` (`AddScoped<DbContext>(sp => sp.GetRequiredService<{Module}DbContext>())`) so the existing `MigrationRunner` auto-migrates it on boot. Cross-module references are by `Guid` only — no navigation properties across module boundaries.
- **Host wiring** in `src/Balsm.API/Program.cs`: add `builder.Services.Add{Module}Module();`, `builder.Services.Add{Module}Infrastructure(builder.Configuration);`, and `.AddApplicationPart(typeof(Balsm.{Module}.Api.ModuleRegistration).Assembly)`.
- **Reuse existing cross-cutting**: `src/Balsm.Infrastructure/Middleware/{CorrelationIdMiddleware,ExceptionHandlingMiddleware,AuditEnricherMiddleware}.cs` and `src/Balsm.SharedKernel/Results/{Result,Error}.cs` already exist — extend, do not duplicate.
- **Existing repo modules** (`Customer, Entity, Identity, Inventory, POS, Prescription`) belong to the standalone-server product and are **out of scope** for P001; do not modify them.

---

## Phase 1: Setup — Project Initialization

### 1.1 Packages + solution

- [X] T001 [P] [DotNet] Add the patient-app NuGet versions to `../Balsm-API-DotNet/Directory.Packages.props` (`<PackageVersion>` only — central management): `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.*, `Microsoft.IdentityModel.Tokens` + `System.IdentityModel.Tokens.Jwt` 8.*, `Google.Apis.Auth` 1.*, `Testcontainers.PostgreSql` 4.* (test only). `global.json` (SDK 10.0.101) and `Directory.Build.props` already exist — do not recreate. Resend (email) + reCAPTCHA Enterprise are called via `HttpClient`, no package.

### 1.2 Module + DbContext scaffolding

- [X] T002 [P] [DotNet] Scaffold the 7 patient-app bounded-context modules under `../Balsm-API-DotNet/src/Modules/` mirroring `Modules/Identity`: `Auth`, `Account`, `EmergencyQr`, `Sessions`, `Deletion`, `Disclosure` as full 4-project sets (`Balsm.{Module}.{Api,Application,Domain,Infrastructure}.csproj`); `Geofence` as `Domain`+`Infrastructure` only (no public endpoints). Add every new csproj to `../Balsm-API-DotNet/Balsm.API.slnx`, and add `Balsm.API` ProjectReferences to each module's `Api` + `Infrastructure`.
- [X] T003 [P] [DotNet] For each module create `ModuleRegistration.cs` (`Add{Module}Module()`), `Application/DependencyInjection.cs` (`Add{Module}Application()` — MediatR + FluentValidation from `AssemblyReference.Assembly`), `Infrastructure/DependencyInjection.cs` (`Add{Module}Infrastructure(IConfiguration)`), and `AssemblyReference.cs` in Application + Domain — all mirroring `Modules/Identity`. Wire all into `../Balsm-API-DotNet/src/Balsm.API/Program.cs` (`Add{Module}Module()` ~L221, `Add{Module}Infrastructure(builder.Configuration)` ~L229, `.AddApplicationPart(...)` ~L247).
- [X] T004 [P] [DotNet] Create one `{Module}DbContext : BaseDbContext` per module under `Balsm.{Module}.Infrastructure/Data/` (Npgsql provider) + one `IEntityTypeConfiguration<T>` per owned cloud table under `Infrastructure/Configuration/` (exact columns/constraints/indexes from `../data-model.md §1`). Register each context and re-expose as `DbContext` for `MigrationRunner`. Table ownership: **Auth** → `user_identities` (§1.1), `account_lockout` (§1.4); **Account** → `user_account` (§1.2, incl. `date_of_birth_ciphertext`, `deletion_state`, `country_code`, `preferred_language`), `username_reservation` (§1.5), `reserved_handle_blocklist` (§1.8); **Sessions** → `active_session` (§1.3); **EmergencyQr** → `emergency_qr_token` (§1.6); **Deletion** → `deletion_log` (§1.7); **Disclosure** → `disclosure_acceptance` (§1.9); **Geofence** → `denied_country_blocklist` (§1.10). Then `dotnet ef migrations add InitialSchema` per module context (output to that module's `Infrastructure/Migrations/`).
- [X] T004a [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.Infrastructure/Audit/UserAccountAuditLogContext` config + entity for `user_account_audit_log` (§1.12) in the shared Infrastructure project (written by `DobEncryptionService` on every DOB decrypt, FR-048). Add to an existing or new shared `DbContext` exposed for migration.
- [X] T004b [DotNet] Make provider selection explicit so the shared host runs SQLite (existing server modules) and Npgsql (patient-app modules) side by side without `MigrationRunner` cross-applying migrations: extend `Balsm.Infrastructure.Configuration.DatabaseOptions` + `ConfigureDatabase` with a per-context `Provider` (`Sqlite`|`Npgsql`) + connection-string key, bind each patient `{Module}DbContext` to the Npgsql connection (`Balsm:Cloud:ConnectionString`), and scope `MigrationRunner` to migrate each context against its own provider/connection only. Blocks T004 registration. Per repo coexistence constraint.

- [X] T005 [P] [DotNet] Seed static rows via `HasData` in the owning module configs: `denied_country_blocklist` (CU/IR/KP/SY, reason `ofac`) in `Balsm.Geofence.Infrastructure`; `reserved_handle_blocklist` (admin/balsm/support/api/help/null/health) in `Balsm.Account.Infrastructure`.

### 1.3 Cross-cutting host pieces

- [X] T006 [P] [DotNet] Create authorization policies under `../Balsm-API-DotNet/src/Balsm.API/Authorization/` — `SelfOnlyPolicy`, `ActiveAccountPolicy`, `NotLockedOutPolicy`, `AgeGatePolicy` (placeholder handler). Register all in `Program.cs` `AddAuthorization`. Replaces Supabase RLS (research §28).
- [X] T007 [P] [DotNet] Reuse the existing `src/Balsm.Infrastructure/Middleware/CorrelationIdMiddleware.cs` + `ExceptionHandlingMiddleware.cs`; extend `ExceptionHandlingMiddleware` to emit the `{ data, error: { code, message, correlationId } }` envelope (contract §top) instead of bare ProblemDetails. Do NOT add a second correlation middleware.
- [X] T008 [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.SharedKernel/Api/ApiResponse.cs` (`ApiResponse<T>` + `ApiError` matching the contract envelope), mapping from the existing `SharedKernel/Results/{Result,Error}.cs`.

### 1.7 Clarification absorption — Q1-Q5 (Session 2026-06-17)

- [X] T035az [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.Infrastructure/RateLimit/OtpRateLimitPolicies.cs` — `OtpPerEmail` (3/10min), `OtpPerIp` (10/60min), `OtpGlobal` (10000/60min + pause + alert). Register in `Program.cs` via `AddRateLimiter`. Replaces `_shared/throttle.ts`. Per Q2 FR-045a/b.
- [X] T035ba [P] [DotNet] In `Balsm.Auth.Application/Commands/RequestOtpCommand.cs` apply the three rate-limit policies; validate optional `CaptchaToken` against reCAPTCHA Enterprise (`HttpClient`) when burst-rate detected (24h window via `account_lockout`/OTP-attempt store). Per Q2 FR-045a/b/c.
- [X] T035bb [P] [DotNet] In `Balsm.Auth.Application/Commands/VerifyOtpCommand.cs` read `dob` on first verify; if <18 return `403 ageGateRejected` (no PHI); else `DobEncryptionService.Encrypt` + store `user_account.date_of_birth_ciphertext`. Per Q1 FR-301a.
- [X] T035bc [P] [DotNet] Fill `../Balsm-API-DotNet/src/Balsm.API/Authorization/AgeGatePolicy.cs` — `IAuthorizationHandler` decrypts DOB, requires ≥18; apply `[Authorize(Policy="AgeGate")]` to mint / deletion-intake endpoints. Per Q1 FR-301b.
- [X] T035bd [P] [DotNet] Create `Balsm.Auth.Api/Controllers/AuthController.RecoveryClaim` (`POST /auth/recovery/claim`, no auth) + `Balsm.Auth.Application/Commands/RecoveryClaimCommand.cs` — validate support token, quarantine original identity 30d, re-key DOB, issue JWT. Replaces `account-recover-claim`. Per Q5 FR-046c/d/e.
- [X] T035bo [P] [DotNet] [US1] Create 4 localized OTP templates at `../Balsm-API-DotNet/src/Balsm.Infrastructure/Auth/Templates/auth-otp/{en,ar-EG,ar-SA,ar-AE}.html`. Loaded + sent by `OtpService` via Resend. Per Q5 FR-001a.
- [X] T035br [DotNet] Create `../Balsm-Core/docs/runbooks/account-recovery.md` — support-staff recovery runbook (lives in the planning repo, not the API repo). Per Q5 (research §24).

## Phase 2: Foundational — .NET infrastructure services (blocking)

- [X] T035bt [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.Infrastructure/Auth/JwtService.cs` — issue/validate/rotate/revoke access (15min) + refresh (30d) tokens (HS256 per contract). Per research §26.
- [X] T035bu [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.Infrastructure/Auth/OtpService.cs` — generate+send (HMAC hash, 10-min expiry, Resend template) + verify (constant-time, single-use). Per research §26 + Q5.
- [X] T035bv [P] [DotNet] Create `GoogleOidcValidator.cs` + `AppleOidcValidator.cs` at `../Balsm-API-DotNet/src/Balsm.Infrastructure/Auth/` — validate ID tokens against provider JWKS; accept Apple `hide-my-email`. Per research §26.
- [X] T035bw [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.Infrastructure/Encryption/DobEncryptionService.cs` — AES-256-GCM encrypt/decrypt/rotate; every decrypt writes `user_account_audit_log`. Per research §30 + FR-047/FR-048.
- [X] T035bx [P] [DotNet] Create `../Balsm-API-DotNet/src/Balsm.API/Middleware/PhiLeakGuardMiddleware.cs` — scrub non-allowlisted field names from logs/Sentry per `../contracts/crash-allowlist.json`. Per SC-006/SC-016.
- [X] T035by [DotNet] Create `../Balsm-API-DotNet/tests/Balsm.API.IntegrationTests/Balsm.API.IntegrationTests.csproj` — xUnit + `WebApplicationFactory` + `Testcontainers.PostgreSql` + `TestWebAppFactory` fixture; add to `Balsm.API.slnx`. Per Constitution §VI.

## Phase 3: US1 — Signup & Auth (Priority: P1)

### 3.1 .NET: Auth module + endpoints

- [X] T071 [P] [DotNet] [US1] `Balsm.Auth.Application/Commands/RequestOtpCommand.cs` + `Balsm.Auth.Api/Controllers/AuthController.RequestOtp` (`POST /auth/otp/request`) — geofence (403) + lockout (423) + rate-limit + `OtpService.GenerateAndSend`. Per FR-001/005/007/045.
- [X] T072 [P] [DotNet] [US1] `../Balsm-API-DotNet/src/Modules/Geofence/Balsm.Geofence.Infrastructure/GeofenceService.cs` (+ `IGeofenceService` in `Balsm.Geofence.Domain`) — `Check(countryCode)` against `denied_country_blocklist` (`AsNoTracking`). Replaces `geofence-check`. Per FR-005/218.
- [X] T073 [P] [DotNet] [US1] `../Balsm-API-DotNet/src/Modules/Auth/Balsm.Auth.Infrastructure/Services/AccountLockoutService.cs` — record/check/reset; 5/10min → 15min lock. Replaces `auth-attempt-record`. Per FR-007/SC-011.
- [X] T073a [P] [DotNet] [US1] `Balsm.Auth.Application/Commands/VerifyOtpCommand.cs` + `AuthController.VerifyOtp` (`POST /auth/otp/verify`) — verify → create/load account+identity → JWT pair + session; on fail record lockout. Per FR-001/004.
- [X] T073b [P] [DotNet] [US1] `ExchangeGoogleTokenCommand` + `ExchangeAppleTokenCommand` (`Balsm.Auth.Application/Commands/`) + `AuthController.Google`/`Apple` — OIDC validate, geofence, create/load, JWT pair. Per FR-001/004.
- [X] T073c [P] [DotNet] [US1] `RefreshTokenCommand` + `SignOutCommand` (`Balsm.Auth.Application/Commands/`) + `AuthController.Refresh`/`SignOut`. Per research §26.
- [X] T073d [DotNet] [US1] `../Balsm-API-DotNet/tests/Modules/Balsm.Auth.Tests/AuthFlowTests.cs` — OTP issue, 6th-attempt 423, denied 403, OIDC single account. Add project to `Balsm.API.slnx`. Per Constitution §VI.

### 3.4 .NET: disclosure cloud mirror endpoint

- [X] T091a [P] [DotNet] [US1] `Balsm.Disclosure.Application/Commands/AcceptDisclosureCommand.cs` + `Balsm.Disclosure.Api/Controllers/DisclosureController.Accept` (`POST /disclosure/accept`) — insert `disclosure_acceptance` (unique on user/disclosure/version). Per FR-040.

### 3.8 .NET: account self endpoint

- [X] T104a [P] [DotNet] [US1] `Balsm.Account.Api/Controllers/AccountController.GetSelf` (`GET /account/self`, SelfOnly) + `Balsm.Account.Application/Queries/GetSelfQuery.cs` — return account fields; decrypt DOB (writes audit log) → `dob_year`. Per FR-006/048.

## Phase 4: US1a — Handle Claim & Health Profile (Priority: P2)

### 4.1 .NET: handle + DOB endpoints

- [X] T106 [P] [DotNet] [US1a] `Balsm.Account.Application/Queries/CheckHandleQuery.cs` + `AccountController.CheckHandle` (`POST /account/handle/check`) — format + reserved + uniqueness → `{ available }`. Replaces `reserved-handle-check`. Per FR-002/003.
- [X] T107 [P] [DotNet] [US1a] `Balsm.Account.Application/Commands/ClaimHandleCommand.cs` + `AccountController.ClaimHandle` (`POST /account/handle/claim`, ActiveAccount) — insert `username_reservation` + update handle in one tx; 409 + 3 suggestions on conflict. Replaces `handle-claim`. Per FR-002/008/304.
- [X] T108 [P] [DotNet] [US1a] `../Balsm-API-DotNet/src/Modules/Account/Balsm.Account.Application/Services/HandleSuggestionService.cs` — 3 available suggestions. Replaces `handle-suggest`. Per FR-008.
- [X] T108a [P] [DotNet] [US1a] `Balsm.Account.Application/Commands/SetDobCommand.cs` + `AccountController.SetDob` (`POST /account/dob`, ActiveAccount) — `DobEncryptionService.Encrypt`; `422 UnderEighteen` soft-block. Per FR-047/301a.

## Phase 5: US2 — Emergency Card & QR (Priority: P2)

### 5.1 .NET: EmergencyQr endpoints

- [X] T119 [P] [DotNet] [US2] `Balsm.EmergencyQr.Application/Commands/MintEmergencyQrCommand.cs` + `EmergencyQrController.Mint` (`POST /emergency-qr/mint`, AgeGate) — revoke prior active + insert new token (ttl CHECK). Replaces `emergency-token-mint`. Per FR-013/014.
- [X] T120 [P] [DotNet] [US2] `Balsm.EmergencyQr.Application/Commands/RevokeEmergencyQrCommand.cs` + `EmergencyQrController.Revoke` (`POST /emergency-qr/{jti}/revoke`, SelfOnly). Replaces `emergency-token-revoke`. Per FR-015/034.
- [X] T121 [P] [DotNet] [US2] `Balsm.EmergencyQr.Application/Queries/ResolveEmergencyQrQuery.cs` + `EmergencyQrController.Resolve` (`GET /emergency-qr/resolve/{jti}`, no auth) — ciphertext + preferred_language only when active; never the key. Replaces `emergency-token-resolve`. Per FR-015/216.
- [X] T121a [P] [DotNet] [US2] `EmergencyQrController.GetActive` (`GET /emergency-qr/active`, SelfOnly) + `GetActiveQrQuery`. Per FR-014.
- [X] T121b [DotNet] [US2] `../Balsm-API-DotNet/tests/Modules/Balsm.EmergencyQr.Tests/QrLifecycleTests.cs` — mint→resolve, revoke→410, second-mint-revokes-first. Add to `Balsm.API.slnx`. Per SC-014.

## Phase 7: US4 — Self-Service Deletion (Priority: P3)

### 7.1 .NET: deletion endpoints + purge job

- [X] T146 [P] [DotNet] [US4] `Balsm.Deletion.Application/Commands/IntakeDeletionCommand.cs` + `DeletionController.Intake` (`POST /deletion/intake`, AgeGate) — set DELETION_REQUESTED + 7d grace + `deletion_log` + revoke QR tokens. Replaces `account-delete-intake`. Per FR-031/032/034.
- [X] T147 [P] [DotNet] [US4] `../Balsm-API-DotNet/src/Modules/Deletion/Balsm.Deletion.Infrastructure/Services/AppleRevokeService.cs` — Apple `/auth/revoke` + update `apple_revoke_status`. Replaces `account-delete-confirm` + `apple-revoke`. Per FR-031.
- [X] T148 [P] [DotNet] [US4] `Balsm.Deletion.Application/Commands/CancelDeletionCommand.cs` + `DeletionController.Cancel` (`POST /deletion/cancel`) — restore ACTIVE; 409 if grace expired. Replaces `account-delete-cancel`. Per FR-032.
- [X] T149 [P] [DotNet] [US4] `../Balsm-API-DotNet/src/Modules/Deletion/Balsm.Deletion.Infrastructure/Jobs/DeletionPurgeJob.cs` (`IHostedService`, nightly) — purge past-grace accounts (cascade), release handles, retain `deletion_log` 2y. Replaces `account-delete-purge`. Per FR-032.
- [X] T150 [DotNet] [US4] `../Balsm-API-DotNet/tests/Modules/Balsm.Deletion.Tests/DeletionFsmTests.cs` — intake/cancel/purge. Add to `Balsm.API.slnx`. Per FR-031/032.

### 7.4 .NET: sessions endpoint

- [X] T164a [P] [DotNet] [US4] `Balsm.Sessions.Api/Controllers/SessionsController` (`GET /sessions`, `DELETE /sessions/{id}`, `DELETE /sessions`, SelfOnly) + `Balsm.Sessions.Application` query+commands — list/revoke/revoke-all (revokes `active_session` + linked refresh token). Per FR-035/036/SC-013.

## Phase 8: US5 — Account Lockout & Sessions (Priority: P4)

- [X] T167a [DotNet] [US5] `../Balsm-API-DotNet/tests/Modules/Balsm.Auth.Tests/LockoutWindowTests.cs` — verify rolling window + 15-min lock + reset-on-success (service from T073). Per FR-007/SC-011.
- [X] T167b [P] [DotNet] [US5] `../Balsm-API-DotNet/src/Modules/Sessions/Balsm.Sessions.Infrastructure/Jobs/StatusHealthJob.cs` (`IHostedService`) + `Balsm.Sessions.Api/Controllers/StatusController` (`GET /status`, no auth) — health + incident feed. Per Q4 FR-046b.

## Phase 9: US6 — Country & Language Change (Priority: P4)

### 9.1 .NET: country/language endpoints

- [X] T168 [P] [DotNet] [US6] `Balsm.Account.Application/Commands/ChangeCountryCommand.cs` + `AccountController.ChangeCountry` (`PATCH /account/country`) — re-auth + disclosure gate; update `country_code` ONLY (no DOB migration — comment RR-001). Replaces `country-change`. Per FR-302/044.
- [X] T169 [P] [DotNet] [US6] `Balsm.Account.Application/Commands/ChangeLanguageCommand.cs` + `AccountController.ChangeLanguage` (`PATCH /account/language`, no re-auth). Replaces `language-change`. Per FR-301.

## Phase 10: Polish & Cross-Cutting Concerns

- [X] T175a [P] [DotNet] `../Balsm-API-DotNet/tests/Balsm.API.IntegrationTests/PhiLeakGuardTests.cs` — ≥50 synthetic PHI payloads through `PhiLeakGuardMiddleware`, assert no leak. Per SC-006/016.
- [X] T182 [P] [DotNet] `../Balsm-API-DotNet/.github/workflows/p001-api-ci.yml` — restore (locked), build `-warnaserror`, test (Testcontainers), `ef migrations script` dry-run per module context, `dotnet format --verify-no-changes`. Replaces the Supabase CI.

## Security Remediation (2026-07-17 review)

New, unchecked follow-ups from the security review. The tasks above are executed ([X]); these capture required changes to the .NET backend without rewriting completed history. Endpoint behaviors are specified in the amended `contracts/dotnet-api-endpoints.md`.

- [ ] SEC-D01 [DotNet] [HIGH] Recovery claim: harden `POST /auth/recovery/claim` — recovery token ≥128-bit, signed with a key/`typ` DISTINCT from the access-token key, TTL ≤72h, `jti` persisted + burned on first use (replay → `401 TokenReplayed`), per-IP + global rate limit (extend `OtpRateLimitPolicies`), audit row per attempt, security notification to the quarantined identity.
- [ ] SEC-D02 [DotNet] [HIGH] Refresh-token store ownership: assign `user_refresh_token` (token_hash = SHA-256 of ≥256-bit random) to the Auth module, own its EF migration, and add it to the module table-ownership list; ensure sign-out / session-revoke / `401 TokenRevoked` are backed by real rows.
- [ ] SEC-D03 [DotNet] [MEDIUM] Refresh rotation + reuse detection: `POST /auth/refresh` is single-use — revoke the presented token atomically on issue; reuse of a rotated token returns `401 TokenRevoked` AND revokes the whole device token family.
- [ ] SEC-D04 [DotNet] [MEDIUM] Session-bound access tokens: embed a `session_id` claim; the auth middleware validates it against a live `ActiveSession` each request so revoke takes effect ≤2s (SC-013). Add a per-request session-touch update to `active_session.last_activity_at`.
- [ ] SEC-D05 [DotNet] [MEDIUM] Key management: load all signing/encryption keys from a managed secret store (never committed env files); JWT gains a `kid` header + dual-key validation window; `DobEncryptionService` uses a master key + per-user HKDF subkey + random 96-bit per-encryption nonce stored with the ciphertext + a `dob_key_version` column with rotate-on-read. Persist the derived `dob_year` at set-time so `GET /account/self` never decrypts on read.
- [ ] SEC-D06 [DotNet] [MEDIUM] Deletion intake: require a fresh server-validated `reauth_token`; REMOVE the age gate from `POST /deletion/intake` (erasure is a data-subject right). Add a `deletion_log` expiry sweep to `DeletionPurgeJob` (drop rows past `purge_at`).
- [ ] SEC-D07 [DotNet] [MEDIUM] Targeted-lockout DoS: a failed attempt from an unverified source requires passing CAPTCHA before it counts toward per-identifier lockout; a lockout event MUST NOT shift `deletion_grace_until`.
- [ ] SEC-D08 [DotNet] [MEDIUM] Trusted proxy: configure `ForwardedHeadersMiddleware` (trust only the tunnel hop) so audit `source_ip`, rate-limit keys, and lockout keys use the real client IP, never the proxy address.
- [ ] SEC-D09 [DotNet] [LOW] Endpoint hardening per `contracts/dotnet-api-endpoints.md`: `/account/handle/check` requires auth + rate limit + uniform timing; `/emergency-qr/resolve` per-IP rate limit + `Cache-Control: no-store`; mint `ciphertext` ≤16 KB; owner-scoped `/emergency-qr/{jti}/revoke` and `DELETE /sessions/{id}` return 404 (not 403) for non-owned ids; OTP verify gets a per-IP limiter and the OTP HMAC pepper loads from the secret store distinct from `JWT_SIGNING_KEY`.
