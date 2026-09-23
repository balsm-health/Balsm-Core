# ADR-10 amendment — care team is cloud-mirrored PHI

**Date**: 2026-09-24
**Status**: Accepted
**Amends**: ADR-10 ("PHI never on Supabase" — canonical text lives outside this repo; see
`architecture/bounded-contexts/personal-health.md` for the posture it produced)
**Implements**: `specs/003-care-team-cloud-sync/spec.md` FR-514

---

## What changed

Before: Balsm servers held exactly one PHI field — `date_of_birth`, field-encrypted and
audited (FR-047/FR-048). Everything else in the Personal Health context lived on the
device (SQLCipher drift), with an optional encrypted whole-database blob in the patient's
*own* Google Drive.

After: the patient's **care team** — `care_provider` rows, the doctors, pharmacies and labs
they entered themselves — is also mirrored to Balsm's own database.

Nothing else moved. Records, medications, dose history, check-ins, allergies, conditions
and emergency contacts remain device-only, and the device remains the write path (ADR-11
is not amended).

## Why

The existing backup path does not reach most patients. `DriftBackupAdapter` writes to the
Google Drive `appDataFolder` and needs a Google session; the iCloud adapter is deferred.
A patient who signed up with email OTP or Apple therefore has **no backup at all** — a lost
phone means a permanently lost care team. It also cannot cross platforms: the blob lives in
the patient's platform cloud, so Android↔iOS is unsupported.

The product decision is that a patient's care team must survive device loss and appear on
every device they sign into, through Balsm's own infrastructure.

## What bounds it

- **Field-level encryption at rest.** Nine free-text columns (`name`, `specialty`, `phone`,
  `phone2`, `email`, `clinic`, `address`, `map_url`, `notes`) are AES-256-GCM encrypted via
  `CareTeamEncryptionService` under `CareTeamEncryption:Key` — deliberately a *different*
  key from `DobEncryption:Key`, so rotating or compromising one does not reach the other.
  Ids, `type` and timestamps stay plaintext: the sync cursor needs them and they carry no
  free text.
- **Every decryption is attributable.** A pull that decrypts rows appends one
  `care_team_audit_log` row — actor, source IP, correlation id, row count. It records how
  much was read, never what.
- **Scoped and unprobeable.** Reads filter on `user_id` AND `health_profile_id`, so a
  dependant's roster cannot leak into the self profile. An id owned by another user answers
  `404`, never a distinguishable `403`.
- **Erased on account deletion.** `DeletionPurgeJob` hard-deletes both tables for the
  purged `user_id`, tombstones included.
- **Disclosed to the patient.** The FR-031 pre-confirm screen now names care team under
  *Deleted* (from Balsm's servers) as well as *Wiped* (from the phone).

## What this does NOT buy

**Balsm can read this PHI.** This is the material difference from `EmergencyQr`, where the
key never leaves the device and a database dump yields only ciphertext. Here the key is
server-side, so encryption at rest defends against a stolen dump or backup — **not** against
Balsm itself, an insider, or anyone holding the key. That is the deliberate cost of a roster
that restores without the patient having kept a recovery code.

Any public claim that "Balsm servers hold zero PHI" is false as of this amendment and must
be corrected wherever it appears, including marketing copy.

## Known gap carried forward

FR-511 in spec 003 requires residency-correct provisioning per FR-049. **That routing does
not exist** — see RR-003: the per-region routing lived only in the removed Supabase
`auth-gate`, and the .NET backend runs a single EU-region PostgreSQL. Care-team PHI for
EG, KSA and UAE patients is therefore EU-resident today, exactly like the DOB ciphertext.

This amendment does not create that gap, but it **widens its blast radius**: the data now
subject to it is health data about named providers, not a single date. Tracked as RR-005.

## Consequences

- A DPIA refresh is required before GA (RR-005).
- App-store data-safety declarations must be updated to declare health-data collection
  linked to identity, in every jurisdiction (FR-515).
- A second field-encryption key enters the rotation, backup and recovery procedures. Loss of
  `CareTeamEncryption:Key` makes every patient's cloud roster unreadable; the on-device
  copies survive, since local is still the source of truth.
- `DeletionPurgeJob` hardcodes every context it purges. Any future module that stores user
  data must be added there, or its rows outlive the account.
