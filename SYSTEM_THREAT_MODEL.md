# Balsm — System Threat Model

> **Scope:** Comprehensive threat model covering cybersecurity, application security, and AI/ML security across the entire Balsm platform.
> **Applies to:** All phases of the Balsm platform (Tiers A–D, phases 1–21)
> **Maintenance rule:** Review this catalog when (a) a new phase introduces a new attack surface, (b) a new external integration is added, (c) the deployment topology changes (e.g., self-hosted, federation, marketplace), (d) the AI provider or model changes, or (e) a security incident occurs.

***

## How to Use This Document

* General cybersecurity and application-security threats are organised by [STRIDE](https://en.wikipedia.org/wiki/STRIDE_model): **S**poofing, **T**ampering, **R**epudiation, **I**nformation Disclosure, **D**enial of Service, **E**levation of Privilege.
* AI/ML-specific threats are catalogued in their own section ([§ AI/ML](#aiml-specific-threats-ai)) because their attack vectors and mitigations are conceptually distinct from STRIDE; they map to STRIDE where useful.
* `BLOCKING` mitigations must be implemented before the affected phase ships.
* `REQUIRED` mitigations must be referenced in the phase's `plan.md` and have tasks in `tasks.md`.
* Each phase spec must list the threat IDs in scope for that phase and confirm `BLOCKING` mitigations are covered (see [Phase Coverage Matrix](#phase-coverage-matrix)).
* Patient-safety, data-privacy, and integrity impacts are scored independently of likelihood — priority combines both.

***

## System Context Recap

Trust boundaries that this model considers:

1. **Device ↔ Local Server** (LAN): mobile/desktop apps connect to a local Balsm server via mDNS or manual URL.
2. **Local Server ↔ Cloud (Balsm Network)**: outbox-based sync; cloud is optional, never a prerequisite.
3. **Local Server ↔ Local Server (Federation)**: instance-to-instance data exchange (Phase 14+).
4. **Workspace ↔ Workspace (Multi-tenant Cloud)**: row-level entity isolation.
5. **Platform ↔ External Integrations**: payment gateways, SMS/email, LIS/PACS, insurance, MoH/SFDA reporting, BYOK AI providers.
6. **Platform ↔ Marketplace Add-ons** (Phase 20): sandboxed plugins with declared permissions.
7. **Platform ↔ Public API Consumers** (Phase 21): OAuth 2.0 with entity-scoped or patient-authorised tokens.
8. **Patient ↔ Platform** (Phase 8): self-service patient app with weaker assumed trust.

PHI categories at risk: prescriptions, allergies, diagnoses (ICD-10), lab results (LOINC), imaging (DICOM), vitals, clinical notes, AI-derived suggestions. PII categories: Egyptian national ID (14-digit, embeds DOB/governorate/gender), phone, address, family relationships. Financial: card tokens, insurance policy numbers, invoice/POS data. See [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md) §4 for the full inventory.

***

## Threat Catalog

### Spoofing (S) — Identity Verification

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| S01 | Credential stuffing / password brute force                          | Reused/leaked passwords replayed against `/api/auth/login`; weak passwords guessed offline against captured hashes                                            | MEDIUM         | CRITICAL     | HIGH      | CRITICAL |
| S02 | Device impersonation via stolen tokens                              | Refresh token or `X-Device-Id` exfiltrated from device storage and replayed from attacker's machine; offline-cached credentials extracted from SQLite         | MEDIUM         | CRITICAL     | HIGH      | CRITICAL |
| S03 | Invite-code guessing / enumeration                                  | Short or low-entropy invite codes (default 6-char) brute-forced via `/api/invites/redeem`; codes leaked through screenshots, chat, or email forwarding        | LOW            | HIGH         | MEDIUM    | HIGH     |
| S04 | Rogue server on LAN (mDNS spoofing)                                 | Attacker on the same LAN advertises `balsm.local` and harvests credentials, prescriptions, or POS traffic before the legitimate server responds               | HIGH           | CRITICAL     | HIGH      | CRITICAL |
| S05 | Patient impersonation / unclaimed profile claiming fraud            | Attacker enumerates phone or national ID, then "claims" an unclaimed pharmacy-created patient profile with a colliding identifier                             | HIGH           | CRITICAL     | HIGH      | CRITICAL |
| S06 | Prescription QR-code forgery                                        | Attacker generates a QR code that mimics the digital-prescription format and presents it at a pharmacy that does not validate signature/state                 | CRITICAL       | MEDIUM       | HIGH      | CRITICAL |
| S07 | Telemedicine prescriber credential spoofing                         | Doctor without licence in the patient's jurisdiction issues a cross-border prescription; uploaded "credentials" are forged                                    | CRITICAL       | LOW          | HIGH      | HIGH     |
| S08 | Self-hosted server impersonation in federation                      | Compromised or attacker-controlled self-hosted instance joins the federation graph and impersonates a partner pharmacy/clinic                                 | MEDIUM         | CRITICAL     | HIGH      | HIGH     |
| S09 | Test-only auth bypass reaching a real environment                   | A fixed OTP (`Otp:DevCode`) configured for staging is accepted for any address, or leaks into production config, letting anyone sign in as — or reset the password of — an account knowing only its email | HIGH           | CRITICAL     | CRITICAL  | CRITICAL |

### Tampering (T) — Unauthorised Modification

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| T01 | Local database file tampering                                       | Attacker with file-system access to the local server modifies SQLite directly, bypassing application-layer audit and authorisation                            | HIGH           | HIGH         | CRITICAL  | HIGH     |
| T02 | Sync outbox / inbox poisoning                                       | Forged sync record injected into a peer's queue; duplicated or replayed records cause double-dispense or double-charge                                        | HIGH           | MEDIUM       | CRITICAL  | CRITICAL |
| T03 | Conflict-resolution abuse (last-write-wins)                         | Attacker sets system clock forward and pushes a "newer" record that overwrites a legitimate clinical or POS record                                            | HIGH           | LOW          | CRITICAL  | HIGH     |
| T04 | Clinical record ghost-edits                                         | Late edit of an immutable clinical note (SOAP, prescription) is performed without an addendum; original content is overwritten in storage                     | CRITICAL       | LOW          | CRITICAL  | CRITICAL |
| T05 | Prescription lifecycle state-machine bypass                         | Direct API call moves a prescription from `Cancelled` or `Dispensed` back to `Issued`, enabling re-dispense; recurring-rx auto-issue abused                   | CRITICAL       | LOW          | CRITICAL  | CRITICAL |
| T06 | Controlled-substance inventory manipulation                         | Pharmacist edits stock levels or expiry to conceal narcotic diversion; pre-tagged "controlled" flag is unset on a barcode-scan record                         | CRITICAL       | LOW          | CRITICAL  | CRITICAL |
| T07 | Invoice / payment tampering                                         | Invoice line items altered post-payment to enable refund fraud; insurance claim fields rewritten before submission                                            | LOW            | MEDIUM       | CRITICAL  | HIGH     |
| T08 | Backup file tampering                                               | Backup file modified offline and used for restore, reintroducing deleted records or rolling back audit entries                                                | HIGH           | HIGH         | CRITICAL  | HIGH     |
| T09 | DICOM / lab-result tampering at integration boundary                | LIS/PACS payload modified in transit; result attached to wrong patient; "draft → released" workflow circumvented by direct DB write                           | CRITICAL       | HIGH         | CRITICAL  | CRITICAL |
| T10 | Webhook payload tampering                                           | Replayed or forged webhook from "insurance" or "payment gateway" sets policy/payment status; HMAC signature absent or weak                                    | LOW            | MEDIUM       | HIGH      | HIGH     |
| T11 | Configuration / deployment-mode tampering                           | Attacker switches mode from `Self-hosted` to `Cloud-Federated` to enable outbound sync; JWT signing key replaced; allowlists weakened                         | MEDIUM         | CRITICAL     | CRITICAL  | HIGH     |

### Repudiation (R) — Accountability Evasion

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| R01 | Audit-log suppression or post-hoc deletion                          | Attacker with DB-level access deletes/edits audit rows after a malicious action; admin uses retention purge to hide an incident                               | HIGH           | HIGH         | CRITICAL  | CRITICAL |
| R02 | Clock manipulation to forge timestamps                              | System clock changed to backdate clinical entries, prescriptions, or audit events; offline device sets a false `UpdatedAt` that wins last-write-wins          | HIGH           | LOW          | CRITICAL  | HIGH     |
| R03 | Shared / generic accounts hide individual accountability            | Multiple staff use a "Pharmacy" or "Reception" login; controlled-substance dispense cannot be attributed to a specific person                                 | HIGH           | MEDIUM       | CRITICAL  | HIGH     |
| R04 | Deniable offline actions                                            | Action performed offline never reaches the cloud (device factory-reset, sync queue cleared) — no immutable trail outside the local server                     | HIGH           | MEDIUM       | HIGH      | HIGH     |
| R05 | AI-suggestion accept/reject log gaps                                | AI suggestion influenced a clinical decision, but the accept/reject event was not recorded; clinician can later deny seeing the suggestion                    | HIGH           | LOW          | HIGH      | MEDIUM   |
| R06 | Cross-server attribution loss in federation                         | Federation record arrives without verifiable origin signature; "who created this prescription" is ambiguous after sync                                        | HIGH           | MEDIUM       | CRITICAL  | HIGH     |

### Information Disclosure (I) — Unauthorised Access

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| I01 | Cross-entity (tenant) data leakage                                  | Missing `WHERE EntityId = @currentEntityId` filter, mis-scoped cache, or shared prepared statement returns another entity's patients/prescriptions/POS        | MEDIUM         | CRITICAL     | HIGH      | CRITICAL |
| I02 | PHI written to logs or error responses                              | Stack traces include patient name/ID; structured logger receives raw entity instead of an ID; error response echoes request body                              | LOW            | CRITICAL     | LOW       | HIGH     |
| I03 | PII exposure via search and autocomplete                            | Phone/national-ID/name search returns full patient summary cards; autocomplete used to enumerate the patient base across an entity                            | LOW            | CRITICAL     | LOW       | HIGH     |
| I04 | Re-identification via small-N analytics                             | Anonymised partner analytics, charitable case lists, or population-health dashboards expose subgroups small enough to reverse-engineer to individuals         | MEDIUM         | CRITICAL     | LOW       | HIGH     |
| I05 | Backup or export-file leakage                                       | Unencrypted backup copied to USB / cloud drive; FHIR export emailed; restore from backup performed on a workstation outside the trust boundary                | MEDIUM         | CRITICAL     | MEDIUM    | HIGH     |
| I06 | PHI on stolen / lost mobile device                                  | Encrypted-cache key extracted from compromised OS keystore; jailbroken/rooted device reads database directly; offline session never revoked                   | MEDIUM         | CRITICAL     | LOW       | HIGH     |
| I07 | Excess disclosure via unauthenticated `/server-info`                | Endpoint reveals platform ID, version, capabilities, and entity name — enabling targeted vulnerability scanning and social engineering                        | LOW            | MEDIUM       | LOW       | MEDIUM   |
| I08 | LAN traffic eavesdropping                                           | HTTP allowed for "local-only" addresses; attacker on the same WiFi captures prescriptions, POS data, JWTs                                                     | HIGH           | CRITICAL     | HIGH      | HIGH     |
| I09 | Federation oversharing                                              | Default sharing scope broader than entity admin understood; patient records cross trust boundaries without dual consent                                       | MEDIUM         | CRITICAL     | MEDIUM    | HIGH     |
| I10 | DICOM metadata PHI leakage                                          | DICOM files exported with patient name, DOB, accession number, and institution embedded in tags; shared with research/3rd-parties without de-identification   | LOW            | CRITICAL     | LOW       | HIGH     |
| I11 | Prescriber analytics → kickback exposure                            | Per-prescriber analytics expose individuals beneath the 50-rx / 10-prescriber anonymity threshold; violates Egypt/Saudi anti-corruption rules                 | LOW            | HIGH         | LOW       | HIGH     |
| I12 | Cross-border data transfer without consent                          | Self-hosted instance ships PHI to cloud without entity opt-in; AI BYOK call exfiltrates context outside the patient's jurisdiction                            | LOW            | CRITICAL     | LOW       | HIGH     |
| I13 | Add-on / marketplace plugin reads out-of-scope data                 | Marketplace add-on declared narrow scope but reads beyond declared permissions; sandbox does not enforce row-level entity isolation                           | MEDIUM         | CRITICAL     | MEDIUM    | HIGH     |

### Denial of Service (D) — Availability

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| D01 | Account-lockout DoS                                                 | Attacker triggers 5-failed-attempt lockout for legitimate accounts to halt pharmacy/clinic operations during peak hours                                       | HIGH           | LOW          | LOW       | HIGH     |
| D02 | API resource exhaustion                                             | Unbounded query (e.g., search "%"), large file upload, or N+1 endpoint exhausts CPU/memory on the local server                                                | HIGH           | LOW          | LOW       | HIGH     |
| D03 | Sync-queue flooding                                                 | Compromised device or peer pushes millions of small records; outbox grows unbounded, sync stalls, disk fills                                                  | HIGH           | LOW          | MEDIUM    | HIGH     |
| D04 | SQLite WAL bloat / disk-fill                                        | Long-running read transaction prevents WAL checkpoint; disk fills; server enters read-only mode mid-shift                                                     | HIGH           | LOW          | MEDIUM    | HIGH     |
| D05 | Ransomware on the local server                                      | Endpoint malware encrypts the SQLite file and backups; offline pharmacy cannot dispense or bill                                                               | CRITICAL       | HIGH         | CRITICAL  | CRITICAL |
| D06 | Cloud-outage cascade into local fallback                            | Cloud auth issues a token that the local server cannot validate offline; mode switch fails; staff locked out                                                  | HIGH           | LOW          | LOW       | HIGH     |
| D07 | Webhook / integration retry storm                                   | A misbehaving 3rd-party endpoint causes outbound retries to consume worker pool; legitimate POS/clinical writes back up                                       | MEDIUM         | LOW          | LOW       | MEDIUM   |
| D08 | Patient-app abuse                                                   | Public registration / appointment endpoints flooded by bots, exhausting SMS/email quotas and saturating the queue                                             | LOW            | LOW          | LOW       | MEDIUM   |

### AI/ML-Specific Threats (AI)

These threats apply only to phases that introduce an AI/ML feature (CDSS, ambient scribing, conversational assistants, predictive analytics, etc.). Each row's STRIDE column maps the threat back to the closest classical category for cross-reference.

| ID   | STRIDE | Threat                                                                       | Attack Vector                                                                                                                                                                   | Patient Safety                                            | Data Privacy                                      | Integrity                                    | Priority |
| ---- | ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- | -------- |
| AI01 | T / E  | Prompt injection                                                             | User submits crafted text in a clinical note, chat message, or form field that escapes the system prompt context and redirects AI behaviour                                   | HIGH                                                      | HIGH                                              | HIGH                                          | CRITICAL |
| AI02 | T      | Indirect prompt injection                                                    | AI reads a patient-submitted document, OCR output, or third-party API response that contains embedded instructions                                                              | HIGH                                                      | HIGH                                              | HIGH                                          | CRITICAL |
| AI03 | I      | Context bleed / tenant isolation failure                                     | Shared model context window, misconfigured session scoping, or caching error causes cross-tenant data leakage in AI responses                                                  | MEDIUM                                                    | CRITICAL                                          | HIGH                                          | CRITICAL |
| AI04 | T      | Adversarial clinical input                                                   | Crafted edge-case clinical values trigger false drug-interaction clearances, missed allergy flags, or incorrect dosage recommendations                                          | CRITICAL                                                  | LOW                                               | MEDIUM                                        | CRITICAL |
| AI05 | E      | Jailbreak / guardrail bypass                                                 | Role-playing prompts, encoding tricks, or multi-turn sequences convince the AI to ignore its scope and output dangerous or off-scope content                                    | HIGH                                                      | MEDIUM                                            | MEDIUM                                        | HIGH     |
| AI06 | I      | Model inversion                                                              | Repeated queries to a clinical AI extract statistical patterns that reconstruct individual patient records or training data                                                     | LOW                                                       | CRITICAL                                          | MEDIUM                                        | HIGH     |
| AI07 | I      | Model extraction / IP theft                                                  | High-volume API queries reconstruct the AI model's weights or behaviour outside the platform                                                                                    | LOW                                                       | LOW                                               | LOW                                           | MEDIUM   |
| AI08 | T      | Training-data poisoning                                                      | Attacker or compromised integration submits systematically incorrect clinical data to influence future model training                                                           | CRITICAL                                                  | MEDIUM                                            | HIGH                                          | CRITICAL |
| AI09 | T      | Supply chain — third-party AI model                                          | BYOK provider, add-on AI component, or upstream model update introduces malicious behaviour, backdoors, or data exfiltration                                                    | HIGH                                                      | HIGH                                              | HIGH                                          | HIGH     |
| AI10 | D      | AI denial of service                                                         | Flooded inference endpoints consume compute budget or quotas, degrading clinical-support response time                                                                          | MEDIUM                                                    | LOW                                               | HIGH                                          | HIGH     |
| AI11 | E      | Unauthorised capability escalation                                           | Through prompt manipulation or misconfigured tool-calling, the AI writes patient records, sends messages, or executes actions it should only suggest                            | CRITICAL                                                  | HIGH                                              | CRITICAL                                      | CRITICAL |
| AI12 | R      | AI audit-trail tampering                                                     | Logs are falsified or omitted to hide that an AI suggestion was accepted, or to suppress accountability for AI-assisted actions                                                 | MEDIUM                                                    | HIGH                                              | CRITICAL                                      | HIGH     |
| AI13 | I      | Data leakage via AI response                                                 | Misconfigured system prompt or over-permissive context injection causes AI to include patient IDs, medication history, or schemas in responses                                  | LOW                                                       | CRITICAL                                          | MEDIUM                                        | HIGH     |
| AI14 | S      | Session hijack via AI chat                                                   | Token theft, missing expiry, or insecure websocket allows an attacker to read or inject into a live AI clinical conversation                                                    | HIGH                                                      | CRITICAL                                          | HIGH                                          | CRITICAL |
| AI15 | —      | Bias-induced clinical harm                                                   | Model trained on non-representative data produces lower-quality or systematically incorrect suggestions for specific demographics                                               | CRITICAL                                                  | MEDIUM                                            | MEDIUM                                        | HIGH     |
| AI16 | S      | AI-assisted social engineering                                               | Attacker uses Balsm's writing/summarisation features to craft convincing phishing or impersonation messages                                                                     | MEDIUM                                                    | HIGH                                              | HIGH                                          | HIGH     |

### Elevation of Privilege (E) — Capability Gain

| ID  | Threat                                                              | Attack Vector                                                                                                                                                 | Patient Safety | Data Privacy | Integrity | Priority |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------ | --------- | -------- |
| E01 | Permission-override misuse                                          | Workspace owner grants an explicit permission that overrides a deny intended by the entity admin (e.g., `clinical.prescription.write` to a cashier)           | CRITICAL       | HIGH         | CRITICAL  | HIGH     |
| E02 | Permission-group escalation                                         | Member of "Receptionists" group is silently added to "Doctors" group via a UI flow that does not require multi-step admin confirmation                        | CRITICAL       | HIGH         | CRITICAL  | HIGH     |
| E03 | Invite redemption privilege carry-over                              | Invite code created for "Cashier" is redeemed and then used to claim "Pharmacist" because role binding happens after redemption                               | HIGH           | HIGH         | HIGH      | HIGH     |
| E04 | Stale access after offboarding                                      | Revoked staff member retains an offline session on a personal device and continues to dispense / write notes for hours                                        | HIGH           | HIGH         | HIGH      | HIGH     |
| E05 | OAuth scope escalation (Phase 21)                                   | Public-API client requests broader scopes mid-flow; mis-validated `scope` parameter grants `clinical.write` when only `clinical.read` was authorised          | HIGH           | CRITICAL     | HIGH      | HIGH     |
| E06 | Marketplace add-on sandbox escape                                   | Plugin reaches application internals via reflection, deserialisation, or shared in-process state; gains entity-wide read/write                                | HIGH           | CRITICAL     | CRITICAL  | HIGH     |
| E07 | Federation trust-boundary escalation                                | Self-hosted instance accepted into federation gains write paths it should not have (e.g., issues prescriptions on behalf of a partner clinic)                 | HIGH           | HIGH         | CRITICAL  | HIGH     |
| E08 | SQL injection / ORM safe-list bypass                                | Dynamic LINQ / raw SQL constructed from search filters bypasses entity scoping and reaches `WHERE 1=1`                                                        | MEDIUM         | CRITICAL     | CRITICAL  | CRITICAL |
| E09 | Service-to-service mTLS misconfiguration                            | Internal service skips peer-cert verification; attacker on the cluster network impersonates a peer service and issues privileged calls                        | MEDIUM         | CRITICAL     | CRITICAL  | HIGH     |
| E10 | Patient-app horizontal escalation                                   | Patient A modifies a request parameter and reads/writes Patient B's family-linkage, appointments, or prescriptions                                            | HIGH           | CRITICAL     | HIGH      | CRITICAL |

***

## Required Mitigations

Mitigations are grouped by threat. `BLOCKING` controls must be in place before the affected phase ships; `REQUIRED` controls must be planned and tracked in the phase's `tasks.md`.

### S01 — Credential Stuffing & Brute Force (BLOCKING)

* passwords must use bcrypt (cost 12+) or a constant-time equivalent; pepper stored separately from the DB
* per-account and per-IP throttling at the auth endpoint; 5 failed attempts → 15-minute lockout (matches NFR §3.7); lockouts must be observable to the user as "locked" not as "wrong password" to prevent silent stuffing
* breached-password screening (HIBP-style k-anonymity check) at signup and password change
* MFA must be available for all roles and **mandatory for Owner/Admin and any role with controlled-substance, prescription, or financial-write permissions**
* the auth endpoint must not differentiate timing or response between "user not found" and "wrong password"

### S09 — Test-Only Auth Bypass (BLOCKING)

`Otp:DevCode` lets a fixed code stand in for a delivered one so staging is
testable without a mailbox. It is an authentication bypass, and `DevOtpCodePolicy`
fences it on three sides — all must hold, or the code is refused:

1. **Staging or a developer machine only.** Gated on `Deployment:Environment`,
   which must read `staging` — not on `ASPNETCORE_ENVIRONMENT`, which
   `docker-compose.yml` sets to `Production` for every deployment and therefore
   cannot tell staging from production. Unset, misspelt, or `production` all
   fail closed. Configuration discipline is not a control; a stray key must
   land on the safe side.
2. **Allowlisted addresses only.** `Otp:DevCodeEmails` lists address suffixes
   testing owns. With no allowlist configured the bypass is refused outright in
   any deployed environment, so the unfenced form cannot exist there; a
   `Development` host is the one exemption, being a laptop with no users on it.
   Never list an address a real patient uses: anyone who knows the fixed code
   can sign in as it or reset its password. A reserved TLD (`@balsm.test`) can
   never be a real mailbox, which makes it the safest thing to list.
3. **A code must have been requested.** Both `VerifyOtpHandler` and
   `ResetPasswordHandler` resolve the live challenge first and accept the fixed
   code only in place of the delivered one, so rate limits, lockouts and
   single-use consumption all still apply.

Every acceptance logs at warning with the environment name. Both keys are
`forbidden_in: [production]` in `config/manifest.yaml`.

### S02 — Stolen Token / Device Impersonation (BLOCKING)

* refresh tokens rotated on every use; previous token immediately invalidated server-side (NFR §3.5)
* `X-Device-Id` validated against the device registry on every request; mismatch ⇒ session revoked and the user notified on all other devices
* tokens stored only in platform-native secure storage (Keychain / EncryptedSharedPreferences / OS keyring); never in plain `localStorage`, `SharedPreferences`, or files
* device-binding: refresh tokens cryptographically bound to a device key generated in secure enclave where available; replay from another device fails the binding check
* offline-cached credentials must expire (default ≤ 7 days) and require online re-auth thereafter

### S03 — Invite Code Brute Force (BLOCKING)

* invite codes ≥ 8 characters from a 32-character alphabet (≥ 40 bits entropy); single-use, default 24 h expiry
* per-IP and per-workspace redemption rate limiting; 10 failed redemptions ⇒ workspace-wide 1-hour cool-down
* invite codes must be one-time-display (server stores hash only), revocable, and tied to the inviting user
* role assignment is bound at code creation, not at redemption (mitigates E03)

### S04 — Rogue Server on LAN (BLOCKING)

* discovery payloads must include the server's certificate fingerprint; clients pin the fingerprint on first connect (TOFU) and warn on change
* HTTPS required for all non-loopback addresses; HTTP permitted only for `127.0.0.1` and `::1` (NFR §3.8 already says HTTPS for non-local — close the LAN gap explicitly)
* server identity (workspace ID + entity ID + signed nonce) verified during initial enrolment, not just URL
* QR-code enrolment payloads must include the certificate fingerprint and a short-lived (≤ 60 s) one-time token

### S05 — Patient Identity / Unclaimed Profile Fraud (BLOCKING)

* claiming an unclaimed profile requires **two of**: matching national ID + DOB, SMS/email OTP to the recorded phone/email, or in-person verification by the originating entity
* phone/national-ID search must not auto-link — it must surface candidate matches and require explicit human confirmation by a staff member with `patient.identity.confirm` permission
* claim attempts are rate-limited per identifier (≤ 3 attempts / 24 h) and audited; repeated mismatches lock the profile pending entity admin review

### S06 — Prescription QR Forgery (BLOCKING)

* prescription QR codes carry a digital signature (Ed25519 or ECDSA P-256) from the issuing server's key
* dispensing pharmacy verifies signature, issuer, lifecycle state (`Issued` / `Partially Dispensed`), and not-expired status before every action
* offline pharmacies validate against a cached issuer-key bundle; bundle refresh required at least every 24 h online
* QR payloads are short-lived references (e.g., `prescriptionId + nonce + sig`), not full payloads — actual data is fetched and re-validated server-side at dispense

### S07 — Telemedicine Cross-Border Licensing (REQUIRED)

* prescriber jurisdiction recorded at credential upload and verified against MOH/SFDA / Pharmacy Syndicate registers where APIs are available; manual review otherwise
* cross-jurisdiction prescription must be blocked or warning-flagged at the issuing step, not at dispense
* see [COMPLIANCE_REVIEW.md](../Balsm-Draft/COMPLIANCE_REVIEW.md) §HR-05

### S08 — Federation Server Identity (BLOCKING when federation activates — Phase 14)

* every federation peer authenticated via mTLS with a Balsm-Network-issued certificate; certificate revocation propagated within 1 hour
* federation join workflow requires entity admin **on both sides** to approve before any data flows
* peer fingerprint and signature included on every federated record (mitigates R06)

### T01 — Local DB Tampering (BLOCKING)

* SQLite database file encrypted at rest using SQLCipher (or equivalent) with the key wrapped by the OS keystore; raw `.db` file useless without the device
* per-row HMAC over critical clinical / financial fields, keyed by a server-generated secret; tamper detection at read time on hot paths
* file-system permissions: DB readable only by the Balsm service account; documented hardening checklist for self-hosted operators

### T02 — Sync Outbox / Inbox Poisoning (BLOCKING)

* every sync record signed by the originating server; receivers validate signature before applying
* idempotency keys (UUID v7 + sequence number) deduplicate replays at the application layer (NFR §6 sync architecture already mandates monotonic sequences — extend with rejection on out-of-order or duplicated keys)
* clinical and financial entities require server-authoritative conflict resolution, never last-write-wins (NFR §6.3 — codify the "device cannot win clinical conflicts" rule)
* sync endpoints rate-limited per device and per workspace; anomalous batch sizes flagged

### T03 — Conflict-Resolution Abuse (REQUIRED)

* `UpdatedAt` is stamped server-side on receipt for clinical/financial entities; client-supplied timestamps used only for non-clinical operational data and bounded to ±5 minutes of server clock
* devices with a clock skew > 5 minutes refuse to enqueue clinical writes until NTP-synced
* skew detected at the local server triggers an admin warning

### T04 — Clinical Record Ghost-Edits (BLOCKING)

* clinical records (SOAP, prescriptions, lab orders, imaging orders) are append-only — corrections require an **addendum** referencing the original; the original is never overwritten
* every read returns the original + addenda; UI must render both
* attempts to update an already-finalised clinical record via the API are rejected at the framework layer

### T05 — Prescription Lifecycle Bypass (BLOCKING)

* prescription state transitions enforced by an explicit state machine on the server; allowed transitions: `Draft → Issued`, `Issued → Partially Dispensed → Dispensed`, `Issued → Cancelled`, `Issued → Expired`. Reverse transitions rejected, no exceptions
* recurring-rx auto-issue is gated by clinician sign-off per cycle (configurable: monthly / quarterly), never indefinite
* every transition writes an immutable audit row including actor, device, timestamp, and reason

### T06 — Controlled-Substance Inventory Manipulation (BLOCKING)

* `IsControlled` flag is server-derived from the substance schedule, not user-editable
* every controlled-substance dispense and inventory adjustment requires `pharmacist` role + reason + (where regulation requires) attached paper-Rx scan
* daily reconciliation report compares dispenses to inventory delta; divergence ⇒ entity admin alert
* see [COMPLIANCE_REVIEW.md](../Balsm-Draft/COMPLIANCE_REVIEW.md) Egypt Law 182/1960

### T07 — Invoice / Payment Tampering (BLOCKING when POS ships — Phase 5)

* invoices are append-only once finalised; refunds and corrections create new linked documents
* daily Z-reports cryptographically chain (each day's report includes the prior day's hash) so silent retroactive edits are detectable
* payment confirmations from gateways verified by HMAC signature and replay-protected by nonce + timestamp

### T08 — Backup Tampering (REQUIRED)

* backups encrypted with a key separate from the runtime DB key; restore requires admin re-entry of the key
* every backup carries a manifest with a tree-hash; restore validates the manifest before applying
* restore from backup is itself audited and triggers a re-validation pass over hot tables

### T09 — DICOM / Lab Tampering at Boundary (BLOCKING when Phase 15/16 ships)

* HL7/FHIR/DICOM payloads received over mTLS only; payload integrity verified via signature where the source supports it (LIS/PACS-specific)
* result lifecycle (Draft → Verified → Released) enforced server-side; only the verifying clinician can transition to Released
* patient-binding hash (patientId + accessionNumber + instanceUID) checked before attaching any DICOM/lab result; mismatch ⇒ quarantine

### T10 — Webhook Tampering (BLOCKING for any phase that consumes webhooks)

* every webhook validated against an HMAC signature using a per-integration secret; rotation supported
* nonce + timestamp window (±5 min) prevents replay
* webhook handlers are idempotent — same event ID applied twice produces the same state

### T11 — Configuration Tampering (REQUIRED)

* deployment-mode changes (Local ↔ Cloud ↔ Self-hosted Federated) require Owner credential + MFA + a signed admin acknowledgement; trigger an audit event and an alert to all workspace Owners
* JWT signing-key rotation goes through a key-management workflow (NFR §4.4) and never via direct file edit; previous keys honoured for the access-token lifetime only
* settings files monitored for unauthorised change (file-integrity monitoring) on managed deployments

### R01 — Audit-Log Suppression (BLOCKING)

* audit table is append-only — no `UPDATE` or `DELETE` paths exposed by the application layer; DB user lacks `DELETE` privilege on audit tables
* audit rows are hash-chained (each row contains the SHA-256 of the prior row) so silent deletion is detectable on verification
* a daily verifier emits an alert if the chain breaks; verification covers the full retention window (7 years per NFR §5.3)
* purge for retention is performed only by a separate, audited maintenance routine that itself records what was purged

### R02 — Clock Manipulation (REQUIRED)

* server clocks NTP-synced; drift > 30 s logged and alerted
* device clock skew handled per T03; clinical writes always carry the server's receipt timestamp as authoritative
* audit rows record both server-receipt time and client-claimed time; mismatch beyond threshold flagged

### R03 — Shared / Generic Accounts (REQUIRED)

* role policy forbids shared logins for any role with `controlled-substance.*`, `prescription.write`, `clinical.write`, or financial-write permissions; enforced at user-creation time
* concurrent-session detection: same user logging in from two devices simultaneously triggers a banner and admin notification
* periodic admin review surfaces accounts with implausibly high activity (proxy for sharing)

### R04 — Deniable Offline Actions (REQUIRED)

* every clinical / financial action records actor + device + entity + server-receipt time on the local server before acknowledging
* local audit rows hash-chained per R01 even before sync; sync of audit rows is non-skippable and prioritised
* devices that wipe local state without syncing are logged at the cloud upon next enrolment ("device returned without offload")

### R05 — AI Suggestion Audit Gaps (REQUIRED)

* every AI suggestion shown for a clinical decision creates an audit row including suggestion hash, model ID, accept/reject/ignore, and the action ultimately taken
* see also AI12 below for the immutable-record requirements that apply to AI audit entries

### R06 — Federation Attribution (BLOCKING when federation activates)

* federated records carry an origin signature (server cert + signed payload); receivers persist and display origin alongside the record
* origin verification failure ⇒ record quarantined; never silently merged

### I01 — Cross-Tenant Leakage (BLOCKING)

* every query against a tenant-scoped table goes through a repository that injects `EntityId = @currentEntityId` from the authenticated context; raw SQL/dynamic-LINQ that bypasses this is a P0 defect (constitution §44)
* automated test in CI: two parallel users from different entities exercise every read endpoint; any cross-entity result fails the build
* row-level security (PostgreSQL RLS) enabled on cloud as a defence-in-depth layer
* entity-isolation tests are part of the phase definition-of-done from Phase 1 onward

### I02 — PHI in Logs (BLOCKING)

* structured logger configured with deny-list (no full entity payloads, no raw request/response bodies for clinical endpoints); only IDs, action types, and outcomes
* error-handler scrubs known PHI/PII patterns (national ID, phone, email) before serialising; outbound log shipper validates the same on egress
* developer guide and review checklist explicitly call this out

### I03 — Search / Autocomplete Disclosure (REQUIRED)

* patient search returns minimal fields (display name, last 4 of national ID, photo if present); full record requires explicit open + audit row
* search rate-limited per user (≤ 60 q/min); high-cardinality enumeration patterns alerted
* national-ID and phone search require ≥ 6-digit prefix to prevent wildcard enumeration

### I04 — Re-identification via Small-N Analytics (BLOCKING for Phase 19/20)

* anonymous aggregates suppressed below the threshold defined in [COMPLIANCE_REVIEW.md](../Balsm-Draft/COMPLIANCE_REVIEW.md) §CR-02 (≥ 50 prescriptions, ≥ 10 prescribers; equivalent thresholds for charitable cases and population-health cells)
* k-anonymity check runs at query time, not just at dataset build; partner-API responses redact bins below threshold
* differential-privacy noise on long-tail demographic dashboards where applicable

### I05 — Backup / Export Leakage (BLOCKING)

* backups always encrypted with a separate key (T08)
* FHIR/CSV exports require `data.export` permission, are watermarked with operator + entity + timestamp, and trigger a high-severity audit row
* exports of more than N records (configurable, default 100) require a second admin approval

### I06 — Mobile Device Loss (REQUIRED)

* PHI cache on mobile encrypted; key stored in OS-secure storage and rotated on every login
* remote-revoke from device registry wipes the local cache on next launch and during periodic check-in (every ≤ 1 h online)
* idle-timeout lock (default 5 min); cache cleared on explicit logout
* root/jailbreak detection where available — clinical writes blocked on detected devices

### I07 — Public `/server-info` Disclosure (REQUIRED)

* the unauthenticated endpoint returns only fields strictly required for app pairing: platform ID, protocol version, capability flags. Workspace name, entity name, version build hash, and operator email are **not** exposed unauthenticated
* response bodies reviewed in every phase that touches `/server-info`

### I08 — LAN Eavesdropping (BLOCKING)

* HTTPS required for all non-loopback addresses (closes the "local-only HTTP" loophole — tighten NFR §3.8)
* self-signed certificates accepted only with TOFU pinning (S04); plain HTTP refused with a clear error
* docs and onboarding flow walk operators through certificate generation

### I09 — Federation Oversharing (BLOCKING when federation activates)

* default sharing scope is `none`; every shared data class is opt-in per entity admin
* patient records cross trust boundaries only with explicit dual consent (entity admin + patient) per constitution §46
* entity admin sees a "what is shared with whom" dashboard at all times

### I10 — DICOM PHI in Metadata (BLOCKING for Phase 16)

* DICOM export pipeline strips/redacts the [DICOM PS3.15 Basic Confidentiality Profile](https://dicom.nema.org/medical/dicom/current/output/html/part15.html) tags before any external share
* on-device viewers respect the redaction layer; export-to-disk requires `radiology.export` permission

### I11 — Prescriber Analytics Anti-Kickback (BLOCKING for any partner-analytics phase)

* see I04 thresholds; per-prescriber dashboards are forbidden in partner-facing surfaces
* internal-only views require justification recorded in audit

### I12 — Cross-Border Data Transfer (BLOCKING)

* outbound calls (cloud sync, BYOK AI) classified by data residency; calls to a region disallowed by the entity's residency policy are blocked at the egress layer
* BYOK AI keys carry a region tag; the AI gateway refuses to send PHI to a provider region the entity has not approved (see AI09 for supply-chain controls on the providers themselves)

### I13 — Marketplace Add-on Out-of-Scope Reads (BLOCKING for Phase 20)

* add-ons run via a permission-scoped API, not direct DB access; every API call passes through the same `EntityId` and RBAC checks as user calls
* declared permissions are enforced at the gateway, not by the add-on itself
* add-on review pipeline includes a static-analysis pass for permission misuse before marketplace approval

### D01 — Account-Lockout DoS (REQUIRED)

* lockout policy distinguishes "lock the attacker, not the user": progressive throttle for the IP / device, not just the account; legitimate user retains a recovery path (MFA, admin unlock)
* admin "force unlock" available offline

### D02 — API Resource Exhaustion (BLOCKING)

* per-user, per-IP, and per-entity rate limits at the gateway (NFR §3.7 — extend with concurrent-request limits)
* unbounded queries paginated by default; `LIMIT` enforced server-side; "search everything" disallowed
* upload size caps with streaming and a cgroup/process-level memory limit on the worker

### D03 — Sync Queue Flooding (REQUIRED)

* per-device and per-peer batch-size caps; oversize batches rejected with backoff
* outbox monitoring with disk-fill alerts and circuit-breaker that pauses non-clinical sync first
* anomalous spikes (>10× rolling baseline) trigger admin review

### D04 — SQLite WAL Bloat (REQUIRED)

* read transactions bounded (≤ 30 s); periodic checkpointing in a maintenance worker
* monitoring for WAL size relative to DB size; alert at 50%; auto-checkpoint at 75%

### D05 — Ransomware (BLOCKING)

* offline-immutable backup (write-once medium or cloud bucket with object-lock) for every entity; retention ≥ 30 days
* tested DR runbook with quarterly drills (NFR §5.4)
* read-only "view-mode" fallback on the device that lets staff read recently cached PHI even when the server is encrypted (best-effort)
* endpoint hardening: documented OS baseline (BitLocker / FileVault, EDR where licensed) for self-hosted operators

### D06 — Cloud-Outage Cascade (BLOCKING)

* local server can fully validate offline-cached credentials without contacting the cloud (constitution mandates offline-first); offline-cache lifetime defaults to 7 days
* token-validation logic identical in cloud and local builds; CI runs the local-only auth path against fixture cloud-issued tokens
* runbook: "cloud is down" decision tree on every entity admin's dashboard

### D07 — Webhook Retry Storm (REQUIRED)

* outbound webhook worker pool isolated from clinical/POS critical paths; exponential backoff with jitter; dead-letter queue with admin alert
* per-integration circuit breaker after N consecutive failures

### D08 — Patient-App Public-Endpoint Abuse (REQUIRED)

* CAPTCHA / Turnstile on registration and appointment booking; SMS quota per phone (≤ 5 / 24 h)
* phone-verification cost-cap per entity per day; alert when approaching the cap

### E01 — Permission-Override Misuse (BLOCKING)

* permission resolution order is fixed: Explicit Deny > Explicit Grant > Group > Default Deny (constitution §44)
* dangerous permissions (`controlled-substance.*`, `clinical.prescription.write`, `clinical.write`, `finance.refund`, `data.export`) cannot be granted via UI without a dual-control workflow (entity admin + workspace owner) and an audit row
* permission-grant change diffs presented for review (red/green) before save

### E02 — Group Escalation (REQUIRED)

* group membership changes that elevate effective permissions trigger a 24-h notice to all workspace owners and the affected user
* admin UI requires explicit confirmation when adding a user to a group that grants any "dangerous" permission (see E01)

### E03 — Invite Privilege Carry-Over (BLOCKING)

* invite codes encode the role / permission set at creation; redemption cannot upgrade
* role/permission escalation post-redemption follows the standard permission-grant flow with audit

### E04 — Stale Access After Offboarding (BLOCKING)

* device revocation invalidates all tokens server-side immediately on cloud; local server picks up the revocation list within 5 min when online
* offline grace window for local-only deployments capped at 24 h; staff offboarding playbook requires explicit "revoke all sessions" before account deactivation
* periodic "ghost session" report — sessions inactive > 30 days auto-revoked

### E05 — OAuth Scope Escalation (BLOCKING for Phase 21)

* PKCE required for all public-client flows; `state` validated; `scope` narrowed at the AS, not the RS
* requested scopes shown verbatim on the consent screen with a plain-language explanation
* token introspection rejects upgraded scopes; refresh tokens cannot widen scope

### E06 — Marketplace Sandbox Escape (BLOCKING for Phase 20)

* add-ons run out-of-process via a permission-scoped API gateway; no in-process plugin loading
* every gateway call carries the user/entity context derived from the platform — add-on cannot forge it
* security review of every add-on before marketplace approval; signed releases; revocation list propagated within 1 h

### E07 — Federation Trust Escalation (BLOCKING when federation activates)

* federation grants are scoped per data class and per direction; "issue prescription on behalf of partner" is never a federation grant — it is a separate per-clinician workflow with its own audit
* federation peer cert revocation removes all previously-granted trust within 1 h

### E08 — SQL / ORM Bypass (BLOCKING)

* dynamic LINQ / raw SQL forbidden in tenant-scoped contexts unless wrapped by the tenant-scoping repository (I01)
* parameterised queries enforced; static-analysis pass in CI flags string-concatenated SQL
* fuzzed query tests in CI for every search endpoint

### E09 — Service-to-Service mTLS Misconfig (REQUIRED)

* mTLS required for all service-to-service traffic; CI test asserts that disabling peer-cert verification fails the build
* short-lived service certs (≤ 24 h) issued by an internal CA; rotation automated

### E10 — Patient-App Horizontal Escalation (BLOCKING)

* every patient-app endpoint scopes by the authenticated `patientId`; query parameters that name another patient are rejected (no IDOR)
* family-linkage reads/writes enforce the consent record both ways
* automated IDOR test in CI for every patient-app endpoint

### AI01, AI02 — Prompt Injection (BLOCKING)

* all user-supplied text passed to AI must be treated as untrusted data, never as instructions
* system prompts must be structurally separated from user content using the AI provider's native role/message separation (e.g., `system` vs `user` message roles) — string concatenation of user input into system prompts is forbidden
* output from AI used as input to another AI call (chaining) must be re-validated before use
* AI responses must be validated against an expected schema; free-form responses containing instruction-like text (e.g., "ignore previous instructions") must be flagged and discarded

### AI03 — Context Bleed (BLOCKING)

* every AI session scoped to a single authenticated user and entity at session creation; context window flushed completely on session end or user switch
* AI feature tests must include a cross-tenant isolation test: two users from different entities query the AI in parallel; neither must receive the other's data
* shared AI infrastructure (LLM API keys, context caches) must be tenant-isolated at the application layer; shared keys must never be used with commingled context

### AI04 — Adversarial Clinical Input (BLOCKING)

* clinical rule-based safety checks (drug interactions, allergy flags, dosage limits) must run independently of AI and cannot be overridden by AI output
* AI clinical suggestions must be post-processed through the rule engine before display; an AI suggestion that contradicts a rule-based safety flag must be suppressed or demoted, never surfaced as the primary recommendation
* adversarial input test cases (known edge cases for clinical AI errors) must be part of the AI validation suite before deployment

### AI05 — Jailbreak (REQUIRED)

* AI system prompts must be reviewed by a security-aware reviewer before deployment
* multi-turn jailbreak testing must be part of the AI feature's test suite
* AI must be instructed to refuse out-of-scope requests and explain why, not silently comply or evade

### AI06 — Model Inversion (REQUIRED)

* rate limiting applied to all AI inference endpoints per user and per entity
* AI endpoints must not return raw confidence scores for individual-patient queries; scores aggregated or thresholded before display
* AI queries logged; anomalous query patterns (high volume, systematic enumeration) trigger alerts

### AI08 — Training-Data Poisoning (BLOCKING when AI training is in scope)

* training-data pipelines must validate statistical distributions of submitted data before incorporation; outliers flagged for human review before training
* training-data provenance recorded; every training record traceable to an authenticated source

### AI09 — Supply Chain (REQUIRED)

* third-party AI models and add-ons undergo a security review before marketplace approval (AI_GOVERNANCE.md §9)
* BYOK API keys validated against a known-safe provider allowlist before use; unrecognised endpoints require explicit admin confirmation
* model checksums or signing verified on update delivery for any bundled AI model

### AI10 — AI DoS (REQUIRED)

* AI inference endpoints enforce per-user, per-entity, and global burst rate limits
* AI features degrade gracefully when quotas are exhausted; the platform remains fully operational without AI; clinical users see a clear "AI unavailable" state, not an error

### AI11 — Unauthorised Capability Escalation (BLOCKING)

* AI must not have direct database write access; all AI-initiated writes go through the same authorisation and validation pipeline as user-initiated writes
* tool-calling / function-calling AI features define an explicit allowlist of callable actions; actions not on the allowlist are rejected at the framework layer, not handled by prompt instruction
* every AI-initiated action is attributed in the audit log as AI-originated and requires human confirmation before execution

### AI12 — AI Audit Tampering (BLOCKING)

* AI audit-log entries are append-only immutable records; no update or delete path exists
* AI audit entries record: model ID, prompt hash, response hash, user ID, entity ID, action taken, and accept/reject decision
* AI audit chain integrates with the platform-wide hash-chained audit (R01) so a single verifier covers both

### AI13 — Data Leakage via Response (BLOCKING)

* AI system prompts specify what the AI is NOT allowed to include in responses (national IDs, raw query results, internal URLs, schema names)
* AI responses scanned for PII/PHI patterns (national-ID format, phone format) before display; matches redacted and logged

### AI14 — Session Hijack via AI Chat (BLOCKING)

* AI chat sessions bound to the authenticated session token; chat cannot be resumed with a different token
* AI chat websocket connections enforce the same authentication and session expiry as REST API calls
* AI chat session contents encrypted in transit and at rest

### AI15 — Bias-Induced Harm (REQUIRED)

* bias evaluation (AI_GOVERNANCE.md §6) includes demographic subgroup analysis across age, gender, and governorate (proxy for socioeconomic and regional variance in Egypt) and equivalent groupings for GCC markets
* features that produce systematically different quality outputs for any demographic must not ship until the bias is mitigated or explicitly disclosed as a known limitation

### AI16 — AI-Assisted Social Engineering (REQUIRED)

* AI-generated outputs that would be sent externally (SMS, email, patient-facing messages) carry a visible "AI-assisted" indicator and require human review before send
* writing/summarisation features rate-limited and audited; bulk-generation patterns (1:N message variants) trigger admin review

***

## Phase Coverage Matrix

Each phase spec must reference the threats below in its own threat-modelling section and confirm `BLOCKING` mitigations are in scope. Threats not introduced by a phase still apply if the phase touches the affected surface.

| Phase                                  | Threats Newly Introduced or Materially Expanded                |
| -------------------------------------- | -------------------------------------------------------------- |
| 1 — Server Foundation                  | I07, T01, D02, D04, I08, S04, R01, I01, E08                    |
| 2 — Cloud-First Auth + Local Fallback  | S01, S02, S03, R03, D01, D06, E04                              |
| 3 — Egypt L10n                         | I02, I03 (national-ID handling tightens here)                  |
| 4 — Inventory                          | T06                                                            |
| 5 — Pharmacy POS                       | T07, R03                                                       |
| 6 — Customer Profiles & Analytics      | I03, I04                                                       |
| 7 — Offline Sync Queue                 | T02, T03, R02, R04, D03                                        |
| 8 — Patient App                        | S05, D08, E10                                                  |
| 9 — Doctor Scheduling                  | E10 (scope expansion)                                          |
| 10 — Clinical Encounters               | T04, R05 (gap to AI), I02 (clinical-note logging)              |
| 11 — Digital Prescriptions & QR        | S06, T05, T06 (controlled rx)                                  |
| 12 — Full Permissions & Entity Expand  | E01, E02, E03                                                  |
| 13 — Payments & Billing                | T07, T10, I12 (payment gateway region)                         |
| 14 — Balsm Network Launch              | S08, T11, I09, I12, R06, E07, D06 (becomes real)               |
| 15 — Labs & Diagnostics                | T09, I02                                                       |
| 16 — Radiology & Imaging               | T09, I10                                                       |
| 17 — Inpatient & Telemedicine          | S07, R03, I12, AI14 (if telemedicine chat is AI-assisted)     |
| 18 — AI Clinical Suite (BYOK)          | AI01–AI16, plus I12, R05                                      |
| 19 — Community & Partners              | I04, I11, AI16 (if AI drafts community messaging)             |
| 20 — Marketplace & Integrations        | I13, E06, T10, AI09 (third-party AI add-ons)                  |
| 21 — Developer API Platform            | E05, D02, D08, AI10 (AI endpoints exposed via public API)     |

***

## Out-of-Scope (Tracked Elsewhere)

* Regulatory/legal obligations (PDPL, EHDR, Pharmacy Law, SFDA, MOH licensing, anti-kickback): see [COMPLIANCE_REVIEW.md](../Balsm-Draft/COMPLIANCE_REVIEW.md).
* Non-functional baselines (rate limits, encryption suites, RTO/RPO numbers): see [NON_FUNCTIONAL_REQUIREMENTS.md](./NON_FUNCTIONAL_REQUIREMENTS.md).
* AI governance process (model approval, evaluation cadence, deprecation policy): see [AI_GOVERNANCE.md](./AI_GOVERNANCE.md). The threats and mitigations themselves are in this document.
* Architectural invariants (offline-first, entity-isolation, append-only clinical records): see [constitution.md](/Volumes/Code/Balsm/.specify/memory/constitution.md).

***

## Review Cadence

* **Per phase:** the phase's `plan.md` lists threat IDs in scope and confirms `BLOCKING` mitigations are tasked.
* **Quarterly:** review the catalog against the prior quarter's incidents and any new attack surfaces shipped.
* **On change:** when a deployment topology, integration, or trust boundary changes, the catalog is updated before the change ships.
