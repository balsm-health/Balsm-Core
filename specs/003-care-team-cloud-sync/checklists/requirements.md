# Requirements checklist — 003 Care Team Cloud Sync

Every FR-500..FR-515 mapped to the code that implements it and the test that proves it.
Verified 2026-09-24.

## Storage

| FR | Where | Proven by |
|---|---|---|
| FR-500 both DBs | `Balsm.CareTeam.Infrastructure` (cloud) + `care_provider` in `_phiSchema` (local) | `CareProviderPersistenceTests`, `care_team_sync_service_test.dart` |
| FR-501 local is the write path, nothing blocks on network | `DriftCareProvidersDataSource.put/delete` enqueue *after* the local write | `care_team_outbox_test.dart` — "the local row is written even though a push is queued", "without an outbox the data source still writes locally" |
| FR-502 nine encrypted columns, dedicated key | `CareTeamEncryptionService`, `CareProviderConfiguration` | `CareProviderEncryptionTests` (7), `CareProviderSyncTests.Pull_RoundTripsEveryOptionalField` |
| FR-503 ids/type/timestamps plaintext | `CareProviderConfiguration` | generated migration inspected: `type varchar(16)`, `user_id`/`health_profile_id` `uuid`, timestamps `timestamptz` |
| FR-504 audit every decryption | `CareTeamAuditLog`, `PullCareProvidersHandler` | `CareTeamAuditTests` (4), incl. "records row count not row content" and "empty pull writes no audit row" |

## Sync protocol

| FR | Where | Proven by |
|---|---|---|
| FR-505 device-minted id is PK both sides | `CareProvider.Create`, `CareProviderConfiguration` (no default), `CareProviderId.uuid()` | `CareProviderEntityTests.Create_WithClientId_KeepsThatId`, `CareProviderSyncTests.Upsert_SameIdTwice_IsIdempotent` |
| FR-506 durable outbox, retried, survives restart | `sync_outbox` table, `SyncOutboxDao` | `sync_outbox_dao_test.dart` (8), `care_team_sync_service_test.dart` — "a failed entry records the attempt for retry" |
| FR-507 tombstones; no resurrection | `CareProvider.Tombstone`, `UpsertCareProviderHandler` refuses tombstoned ids | `CareProviderSyncTests.Upsert_OnTombstonedId_ReturnsTombstonedError`, `Pull_IncludesTombstones`; client: "applies a tombstone as a local delete" |
| FR-508 incremental cursor + row-level LWW | `PullCareProvidersHandler`, `CareTeamSyncService._merge` | "overwrites when remote updated_at is newer", "leaves the local row alone when older", `Pull_WithSinceCursor_ReturnsOnlyNewerRows` |
| FR-509 sign-in / foreground / manual refresh | `shell.dart` listen + `didChangeAppLifecycleState`; `SubScreen.onRefresh` | `care_team_sync_wiring_test.dart` — "pulling the care team list down triggers a sync" |
| FR-510 scoped to user + health profile | handlers filter on both | `CareProviderSyncTests.Pull_ScopedToHealthProfile_ExcludesOtherProfiles`, `CareTeamControllerTests.Pull_PassesProfileScopeThrough` |

## Lifecycle + compliance

| FR | Where | Proven by |
|---|---|---|
| FR-511 residency-correct provisioning | **NOT MET — see below** | — |
| FR-512 purge on account deletion | `DeletionPurgeJob.PurgeCareTeamAsync` | `CareTeamPurgeTests` (3) — live + tombstoned rows and the audit trail, for that user only |
| FR-513 pre-confirm names care team both ways | `DeleteAccountScreen._deleted` / `._wiped` | `delete_account_disclosure_test.dart` |
| FR-514 ADR-10 + posture amended | `architecture/decisions/ADR-10-amendment-care-team.md`, `personal-health.md:9` | doc review |
| FR-515 data-safety + disclosure updates | **NOT MET — see below** | — |

## Outstanding

**FR-511 is not met and cannot be met by this feature.** It requires residency-correct
provisioning per FR-049. That routing does not exist anywhere in the .NET backend — RR-003
records that it lived only in the removed Supabase `auth-gate`, and the API runs a single
EU-region PostgreSQL. Care-team PHI is EU-resident for EG, KSA and UAE patients today,
exactly like the DOB ciphertext. Building a residency router is its own piece of work
(P002 per RR-003), not a line in this feature. Tracked as RR-005.

**FR-515 is a filing task, not a code task.** App-store data-safety declarations and the
disclosure text must be updated to declare health-data collection linked to identity, and
marketing copy claiming "Balsm servers hold zero PHI" must be corrected. Requires the
compliance owner; RR-005 carries it.

**A DPIA refresh is required before GA.** Balsm now processes health data as controller
beyond a single date field. Not costed in this feature.

## Out of scope, by design

`care_provider_file` attachment rows are not synced — the paths are vault-relative and the
bytes live in the patient's encrypted file store, so syncing rows alone would give a
restored device dangling references. A restored device shows the provider with no
attachments. Uploading attachment blobs needs object storage.
