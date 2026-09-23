# Personal Health — Bounded Context

| | |
|---|---|
| **Plane** | Consumer (patient-owned PHI) |
| **Classification** | **Core Domain** — viral hooks (emergency card, lock-screen widget) and the patient-owned-data privacy story are Balsm's consumer differentiation |
| **Phases** | P001 (profile, reminders, emergency card), P002 (records, timeline, cloud sync), P021 (triage, PROs) |
| **Repo mapping** | `balsm_app`: `profile`, `medications`, `emergency_card` packages; Supabase: `public.emergency_qr_tokens` (token surface only) |
| **PHI posture** | Full PHI on device (SQLCipher drift) + optional user-owned Drive/iCloud sync. Balsm servers hold **two** PHI categories only: (1) `date_of_birth`, encrypted + audit-logged (FR-047/FR-048); (2) the patient's **care team** (`care_provider` rows), AES-256-GCM encrypted per column under a dedicated key and audit-logged on every decryption (FR-502/FR-504, spec 003 — see [ADR-10 amendment](../decisions/ADR-10-amendment-care-team.md)). Everything else — records, medications, dose history, check-ins, allergies, conditions, emergency contacts — stays device-only, and the device remains the write path (ADR-11). Both cloud categories are EU-resident today: FR-049 residency routing does not exist (RR-003/RR-005). Unlike the emergency QR, the care-team key is server-side, so Balsm **can** read it. |

## Purpose

The patient's own longitudinal health record, fully usable offline, owned and controlled by the patient. Everything here survives without any Balsm server: local SQLite is the primary store (ADR-11), Drive/iCloud is an optional user-owned sync target (ADR-10), and the append-only timeline is the substrate that provider-plane data mirrors *into* (ADR-12).

## Ubiquitous Language

| Term | Meaning in this context |
|---|---|
| Health Profile | The patient's self-maintained clinical summary: blood type, allergies, chronic conditions, emergency contacts |
| Timeline Entry | One immutable, append-only fact in the patient's health history (self-reported or mirrored) |
| Mirror Entry | A timeline entry translated from a provider-plane event, tagged `external_source` — never editable, never merged with self-reported data |
| Emergency Card | The unlock-free, read-only snapshot (blood type, allergies, contacts, conditions) shown on lock screen / via QR |
| Dose Event | An append-only record of a medication dose taken, skipped, or rescheduled |
| Ledger | The NDJSON export of the timeline synced to Drive/iCloud |

"Record" here = patient-owned ledger entry. The provider plane's "record" (encounter log) is a different concept — it enters this context only as a Mirror Entry through the ACL.

## Aggregates

| Aggregate Root | Contents | Key invariants |
|---|---|---|
| `HealthProfile` | blood type, allergies (structured tags + free text), chronic conditions, emergency contacts | One per family-profile root; edits versioned |
| `TimelineEntry` | kind, payload, `external_source?`, occurred-at, UUID v7 | Append-only; immutable after submission; self-reported entries labeled as such |
| `VaccinationRecord` | vaccine, date, dose number, clinic, next due, photo ref | Photo stored to user's cloud, never Balsm's |
| `MedicationSchedule` | name, dose, schedule (daily/weekly/custom) + `DoseEvent` children | Dose events append-only; reminders fire fully offline |
| `EmergencyCardSnapshot` | frozen card payload + `EmergencyToken` (signed, TTL) | Readable without app unlock; QR resolves via `balsm.health/emergency/{token}`; P001 = device-signed compact payload, P002 = signed Drive/iCloud URL |
| `RecordDocument` | type (lab/prescription photo/notes/imaging/vaccination), file ref, active flag | Append-only — mark inactive, never delete |

## Domain Events (internal)

`TimelineEntryAppended`, `DoseRecorded`, `DoseMissed`, `EmergencyTokenMinted`, `ProfileUpdated`, `BackupSyncCompleted`

## Integration Events

**Consumed** (through ACL, become Mirror Entries): `EncounterFinalized`, `PrescriptionIssued`, `PrescriptionDispensed`, `ResultReleased`, `VaccinationAdministered` (Clinical Records / Prescriptions / Labs — from P010 onward).

**Published:** `EmergencyTokenMinted` (to Supabase token table), `AccountDataWiped` (deletion flow, to Identity & Access).

## Published Language / OHS

- Emergency QR payload schema (signed, TTL-bound, read-only) — consumed by `balsm.health/emergency/{token}`.
- NDJSON ledger schema — restore/validation contract for Drive/iCloud backups (P002 exit criterion: validates on restore).

## Relationships

| With | Direction | Pattern | Contract |
|---|---|---|---|
| Clinical Records / Prescriptions / Labs | downstream | C-S + **ACL** | Provider events translated to Mirror Entries with `external_source` (ADR-12); provider models never imported raw |
| Identity & Access | downstream | C-S | Auth/session context; deletion FSM triggers immediate local wipe; family-profile guardianship lives in Identity |
| Google Drive / iCloud | downstream of external | **ACL** | `BackupAdapter` port (`DriveBackupAdapter`, `iCloudBackupAdapter` in `core`); platform clouds never shape the domain model; Android↔iOS cross-sync unsupported (ADR-10) |
| Messaging & Notifications | upstream | C-S | Reminder scheduling emits `NotificationRequested`; local notifications work offline |

## Boundary Notes

- Each family profile (P003) is its own Personal Health root keyed by its own UUID v7; profile switch = context re-bind, never data merge. Guardianship/consent is Identity & Access.
- Deletion: local SQLite wiped immediately on confirm; user-owned `Balsm/records/` folder left intact with on-screen manual-deletion guidance — never silently destroy user-owned PHI (P001).
- P021 digital triage and PRO instruments (PHQ-9, GAD-7, EQ-5D) join as self-reported modules here — informational, not clinical.

## Feature Reference

| Phase | Deliverable |
|---|---|
| P001 | Health profile: blood type, allergies (structured + free text), chronic conditions, emergency contacts — local SQLite |
| P001 | Emergency health card: lock-screen/share-sheet access without unlock; scannable QR `balsm.health/emergency/{token}` (TTL, device-signed compact payload) |
| P001 | Medication reminders: offline local notifications; daily/weekly/custom schedules; missed-dose reschedule/skip; history log |
| P001 | Immediate local PHI wipe on account-deletion confirm |
| P002 | Medical records: lab results, prescription photos, doctor notes, imaging reports, vaccinations — append-only, mark-inactive only |
| P002 | Drive/iCloud sync: `Balsm/records/` folder / private CloudKit container; OAuth revocation stops sync; ≤30 s sync-on-network |
| P002 | Vaccination records: manual entry, photo attachment, PDF card export (Arabic RTL) |
| P002 | Health timeline: append-only NDJSON ledger, schema-validated on restore |
| P002 | Emergency QR upgrade: signed Drive/iCloud URL resolution; phone-dead trusted-contact link |
| P021 | Digital triage (symptom checker → routing); PRO instruments (PHQ-9, GAD-7, EQ-5D); health timeline & case roadmap |

Modules: Flutter `profile`, `medications`, `emergency_card` (planned); .NET `Modules/EmergencyQr`.

## Open Questions

- Encryption key derivation + loss-of-device restore UX (flagged in ADR-10/11).
- Phone-dead emergency fallback: pre-generated long-lived trusted-contact link (P002) — TTL policy TBD.
