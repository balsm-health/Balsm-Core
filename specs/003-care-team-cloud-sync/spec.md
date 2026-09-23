# Feature Specification: Care Team Cloud Sync

**Feature Branch**: `003-care-team-cloud-sync`
**Created**: 2026-09-23
**Status**: Draft
**Input**: Directive — "care team should be synced to the balsm cloud API database, and stored in cloud database and the local database."

> **Why a new feature and not an edit to 001**: P001 shipped `care_provider` as on-device-only PHI (`balsm_app/packages/core/lib/src/db/app_database.dart:248`, `modules/profile/lib/src/domain/entities/care_provider.dart:6`). Those tasks are `[x]`. Adding a cloud mirror is a new capability plus a constitution amendment, not a correction to 001 — it gets its own spec → plan → tasks → implement cycle.

> **This feature amends ADR-10.** ADR-10 ("PHI never on Supabase") and `architecture/bounded-contexts/personal-health.md:9` ("Balsm servers hold zero PHI — sole exception: `date_of_birth`") both currently forbid what this feature builds. The amendment is in scope and is a deliverable here (FR-514), not an obstacle to route around. Rationale for the change is the product owner's: a patient's care team must survive device loss and be present on every device the patient signs into, through Balsm's own infrastructure rather than the patient's Google/Apple cloud.

---

## Context: what exists today

| Concern | Current state |
|---|---|
| Local store | `care_provider` + `care_provider_file` tables, SQLCipher drift, `app_database.dart:248-273` |
| Domain entity | `CareProvider` — `modules/profile/.../domain/entities/care_provider.dart` |
| Port | `HealthProfilesDataSource` — `listProviders`, `watchProviders`, `addProvider`, `updateProvider`, `removeProvider`, file attach/detach |
| UI | `app/lib/balsm_app/screens/care_team_screen.dart`, reads `careTeamProvider` (drift stream) |
| Existing backup | Whole-DB AES-256-GCM blob → user's Google Drive `appDataFolder`. Covers `care_provider` (`snapshot_service.dart:32`). **Unavailable to email-OTP and Apple users** — `DriveBackupAdapter` throws `BackupUnavailableException` with no Google session (`drive_backup_adapter.dart:9-13`). iCloud adapter deferred. |
| Cloud PHI precedent | `UserAccount.date_of_birth_ciphertext` — AES-256-GCM app-layer field encryption via `Balsm.Infrastructure/Encryption/DobEncryptionService.cs`, key from `DobEncryption:Key`; decrypt audited to `user_account_audit_log` (FR-047/FR-048) |
| Opaque-ciphertext precedent | `EmergencyQrToken.Ciphertext` — `byte[]` column Balsm cannot read, versioned by `ProfileEtag` |
| Cloud sync of structured PHI | **None.** No PHI write endpoint exists in `packages/balsm_api/lib/src/api_routes.dart`. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Care team survives device loss (Priority: P1)

A patient who has entered six providers loses their phone. They install Balsm on a replacement device and sign in with the same account. Their care team is there.

**Why this priority**: The whole point of the feature. Today this only works for Google-signed-in users who completed backup onboarding and kept their recovery code; every email-OTP and Apple user loses the roster permanently.

**Independent Test**: Sign in on device A, add providers, wipe app data, sign in on a clean device B, confirm the roster matches.

**Acceptance Scenarios**:

1. **Given** a patient with providers synced from device A, **When** they sign in on device B, **Then** the full roster appears in `CareTeamScreen` after the first pull completes.
2. **Given** a patient who signed up with email OTP (no Google session), **When** they add a provider, **Then** it reaches the cloud — the Drive dependency does not gate cloud sync.
3. **Given** a provider removed on device A, **When** device B next pulls, **Then** that provider is gone from device B and does not resurrect on a later pull.

### User Story 2 — Adding a provider works offline (Priority: P1)

A patient in a clinic basement with no signal adds the doctor they just saw. It saves instantly and appears in their list. It reaches the cloud when signal returns.

**Why this priority**: ADR-11 (local-first) is not amended by this feature. Cloud sync is a mirror, never the write path. A design where the add blocks on a network call is a regression.

**Independent Test**: Airplane mode → add provider → confirm it renders immediately → restore connectivity → confirm it lands server-side without user action.

**Acceptance Scenarios**:

1. **Given** no connectivity, **When** the patient adds a provider, **Then** the drift write and UI update happen with no network call and no error surface.
2. **Given** queued offline changes, **When** connectivity returns, **Then** they drain to the API automatically and `SyncStatusNotifier` reports `synced`.
3. **Given** a failed push, **When** the app restarts, **Then** the queued change is retried and never silently dropped.

### User Story 3 — Deleting the account deletes the cloud roster (Priority: P1)

A patient deletes their account. The pre-confirm screen tells them, truthfully, that their care team is deleted from Balsm's servers as well as wiped from the phone.

**Why this priority**: FR-031's pre-confirm screen is a compliance artifact — it must exhaustively and accurately list what goes where. It currently lists care team only under "wiped from this phone". Shipping cloud sync without updating it makes an existing compliance statement false.

**Independent Test**: Delete account, wait out the 7-day window, query the cloud table for that `user_id`, confirm zero rows including tombstones.

**Acceptance Scenarios**:

1. **Given** the deletion pre-confirm screen, **When** it renders, **Then** care team appears in the "deleted from cloud" list *and* the "wiped from this phone" list.
2. **Given** a completed purge, **When** `care_provider` is queried for that `user_id`, **Then** no rows remain — live or tombstoned.

---

## Functional Requirements *(mandatory)*

**Storage (FR-500..FR-504)**

- **FR-500**: The patient's care team MUST be stored in both the on-device SQLCipher database (primary, offline-authoritative) and the Balsm cloud database (mirror).
- **FR-501**: The on-device database MUST remain the write path and the source the UI reads. No care-team read or write may block on a network call.
- **FR-502**: Cloud `care_provider` free-text columns (`name`, `specialty`, `phone`, `phone2`, `email`, `clinic`, `address`, `map_url`, `notes`) MUST be stored field-level-encrypted at rest using the existing AES-256-GCM app-layer pattern (`DobEncryptionService`), under a key distinct from `DobEncryption:Key`. Key MUST rotate at least annually, matching FR-047.
- **FR-503**: `type`, `health_profile_id`, `user_id`, and the timestamp columns MAY be stored in plaintext — they are needed for filtering and sync cursors and carry no free-text PHI.
- **FR-504**: Every decryption of care-team ciphertext MUST append an audit row capturing actor, source IP, correlation ID, and timestamp, matching the FR-048 pattern for DOB.

**Sync protocol (FR-505..FR-510)**

- **FR-505**: Record ids MUST remain device-generated (`CareProviderId`) and MUST be the primary key on both sides. No server-side id assignment, no id remapping on sync.
- **FR-506**: Local writes MUST enqueue to a durable local outbox and drain to the API asynchronously. A failed drain MUST be retried on reconnect and MUST survive app restart.
- **FR-507**: Deletes MUST propagate via server-side tombstones (`IsDeleted` / `deleted_at`). A tombstoned id MUST NOT be re-inserted by a later pull from another device.
- **FR-508**: Pull MUST be incremental via an `updated_at` cursor. Merge MUST be last-writer-wins per row, compared on `updated_at`: a pulled row overwrites the local row only when its `updated_at` is strictly newer. Insert-only union-by-PK is insufficient because `updateProvider` exists — an edit on device A must reach device B.
- **FR-509**: Pull MUST run on sign-in, on app foreground, and on explicit user refresh.
- **FR-510**: Sync MUST be scoped to the signed-in `user_id` and partitioned by `health_profile_id`, so a dependant profile's roster stays separate (P00X profile-switching).

**Lifecycle + compliance (FR-511..FR-515)**

- **FR-511**: Cloud care-team rows MUST be provisioned on the residency-correct project per FR-049, following the same per-country routing as `user_account`.
- **FR-512**: Account deletion MUST purge all cloud care-team rows for that `user_id`, tombstones included. `DeletionPurgeJob` MUST be extended to cover the new context.
- **FR-513**: The FR-031 deletion pre-confirm screen MUST list care team under both "deleted from cloud" and "wiped from this phone".
- **FR-514**: ADR-10 and `architecture/bounded-contexts/personal-health.md` PHI-posture line MUST be amended to record that care team is a second cloud-PHI category alongside encrypted DOB, with the rationale and the encryption/audit controls that bound it.
- **FR-515**: App-store data-safety declarations and the disclosure text MUST be updated to reflect health-data collection by Balsm, in every jurisdiction covered by FR-049.

---

## Data model

### Cloud — new table `care_provider` (module `CareTeam`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | device-generated, FR-505 |
| `user_id` | uuid, indexed | owner |
| `health_profile_id` | uuid, indexed | FR-510 partition |
| `type` | text | plaintext, FR-503 |
| `name_ct` … `notes_ct` | bytea | nine encrypted columns (`name`, `specialty`, `phone`, `phone2`, `email`, `clinic`, `address`, `map_url`, `notes`), FR-502 |
| `created_at` | timestamptz | device clock, carried from local |
| `updated_at` | timestamptz | server clock, sync cursor |
| `deleted_at` | timestamptz null | tombstone, FR-507 |

Index on `(user_id, updated_at)` for the incremental pull.

### Cloud — new table `care_team_audit_log`

Mirrors `user_account_audit_log` shape. Actor, source IP, correlation id, timestamp, row id, operation. FR-504.

### Local — migration to `care_provider`

Add `updated_at INTEGER NOT NULL`, `deleted_at INTEGER NULL`. Current schema carries `created_at` only (`app_database.dart:248-261`).

### Local — new table `sync_outbox`

`id`, `entity` (`care_provider`), `entity_id`, `op` (`upsert` | `delete`), `payload`, `created_at`, `attempts`, `last_error`. `upsert` covers both add and update — the server handler is idempotent on `id`, so the client never needs to distinguish them. Generic by design so later entities reuse it, but this feature populates it only for care team.

---

## API contract

New module `src/Modules/CareTeam/`, mirroring the `Account` module layout (Domain / Application / Infrastructure / Api / Infrastructure.Migrations.Sqlite), `CareTeamDbContext : BaseDbContext`, MediatR handlers, FluentValidation, `[Authorize]` controller with `SelfOnly`-equivalent authorization.

| Route | Purpose |
|---|---|
| `GET /care-team/providers?since=<iso8601>` | Incremental pull; returns live rows and tombstones since the cursor |
| `POST /care-team/providers` | Upsert one provider (idempotent on `id`) |
| `DELETE /care-team/providers/{id}` | Tombstone |

Routes registered in `packages/balsm_api/lib/src/api_routes.dart` under a `_care_team` group. Client surface at `packages/balsm_api/lib/src/care_team/` (api, dio impl, requests, responses), following the `account` and `disclosure` modules.

---

## Design decisions

**Outbox + pull-merge, local primary.** Local drift stays the single source the UI reads; changes queue and drain. Rejected alternatives: server-authoritative read-through (breaks ADR-11 — offline add would fail); extending the existing encrypted blob backup to a Balsm endpoint (stores an opaque blob, not the queryable cloud rows the directive calls for).

**Row-level last-writer-wins.** `HealthProfilesDataSource` exposes `updateProvider` alongside add and remove, so edits must converge. Conflict resolution is whole-row LWW on `updated_at` — not per-field merge. Two devices editing the same provider between syncs means the later write wins outright and the earlier edit is lost; this is accepted, because the entity is a small patient-entered contact card, concurrent edits to one provider are rare, and per-field merge would need a column-level clock the local schema does not carry.

**Attachments stay device-local.** `care_provider_file.path` is vault-relative; the bytes live in the user's encrypted file store, never the database. Syncing the path rows alone would give a new device dangling references to photos it does not have. This feature does not sync `care_provider_file`. A restored device shows the provider with no attachments. Uploading attachment blobs needs object storage and is out of scope.

**Blob backup keeps running.** The Drive path is not removed. Google-signed-in users keep it; it covers tables this feature does not sync.

---

## Out of scope

- Syncing any other PHI table (`medications`, `dose_events`, `check_in`, `allergy`, `chronic_condition`, `emergency_contact`) — the outbox is built generic, but only care team is wired.
- Attachment blob upload / object storage.
- Live push (websockets, FCM-triggered pull). Pull is on sign-in / foreground / manual refresh.
- Provider-side visibility — no clinician reads this data; it stays patient-scoped.
- Retiring the Drive/iCloud blob backup.
- Edit-a-provider capability.

---

## Success criteria

- A patient who signs up with email OTP, adds providers on device A, and signs in on device B sees the identical roster — with no Google account and no recovery code.
- Adding a provider offline renders in under 100 ms and reaches the cloud unattended once connectivity returns.
- Account deletion leaves zero care-team rows, tombstones included, on the residency-correct project.
- No care-team plaintext is readable in a database dump.
- Every cloud decryption is attributable from the audit log.

---

## Risks

| Risk | Note |
|---|---|
| Privacy positioning | "Balsm servers hold zero PHI" is a stated differentiator in marketing and in `personal-health.md`. After this feature it is false as written. FR-514/FR-515 make the change explicit rather than silent; marketing copy needs the same pass. |
| Regulatory surface | Health data on Balsm infrastructure expands obligations under the jurisdictions tracked in `spec.md` §compliance (EG PDPL, KSA PDPL, UAE). A DPIA refresh is likely required and is not costed here. |
| Key management | A second field-encryption key to provision, rotate, and back up. Loss of key = loss of every patient's cloud roster (local copies survive). |
| Clock skew | `created_at` comes from the device clock and is untrusted; `updated_at` is server-assigned so the sync cursor stays monotonic. |
