# Balsm Healthcare Platform — Non-Functional Requirements

## 1. Performance

### 1.1 Response Time
- API response time must not exceed 200ms for standard CRUD operations under normal load
- Search queries (full-text, patient records) must return results within 500ms for datasets up to 10 million records
- Real-time features (notifications, messaging, session sync) must have end-to-end latency under 300ms
- Document generation (PDF export, print preview) must complete within 2 seconds for single documents
- Batch operations (bulk export, batch printing) must process at least 50 documents per minute
- QR code generation and validation must complete within 100ms

### 1.2 Throughput
- the system must handle at least 1,000 concurrent users per deployed instance without degradation
- the system must support at least 500 concurrent API requests per second per instance under peak load
- the messaging subsystem must handle at least 10,000 messages per minute across all active conversations
- notification delivery must process at least 5,000 push notifications per minute
- the system must handle at least 100 concurrent video/audio telemedicine sessions per instance

### 1.3 Scalability
- the system must scale horizontally by adding instances behind a load balancer without architectural changes
- database must support horizontal read scaling through read replicas
- individual modules (inventory, labs, pharmacy) must be independently scalable when extracted as microservices
- file storage (medical images, documents, attachments) must scale independently from application servers
- the system must support multi-tenant deployments where a single instance serves multiple entities without cross-tenant data leakage

---

## 2. Security

### 2.1 Authentication & Session Security
- all passwords must be hashed using an industry-standard adaptive hashing algorithm with a sufficiently high cost factor
- multi-factor authentication (MFA) must be supported for all user accounts and enforceable by entity admins
- session tokens must be signed JWTs with configurable expiration (default: 1 hour access token, 30 days refresh token)
- refresh tokens must be rotated on every use and previous tokens invalidated
- sessions must be revocable in real-time (logout one session or all sessions)
- brute-force protection must lock accounts after 5 failed login attempts within 15 minutes with progressive backoff
- OAuth 2.0 / OpenID Connect must be used for social login (Google, Apple)
- each Balsm server instance must act as its own identity provider — the server must issue and validate its own JWTs using a server-specific signing key, without depending on any external authentication authority
- JWT signing keys must be generated per server instance on first startup and stored securely — keys must never be shared between server instances
- the server must maintain a device registry tracking all authenticated devices — device revocation must immediately invalidate all tokens issued to that device by adding revoked device IDs to a deny list checked on every request
- access tokens must be short-lived (default: 15 minutes) and refresh tokens long-lived (default: 30 days) — both durations must be configurable by the entity admin
- the server must validate the `X-Device-Id` header on every authenticated request and reject requests from revoked or unregistered devices with a 403 response
- invite codes for device registration must be cryptographically random, at least 6 characters, single-use, and expire within a configurable window (default: 24 hours)
- the `GET /api/v1/server-info` endpoint must be unauthenticated and must not expose sensitive information — it must only return: platform identifier, server version, server display name, and module capabilities

### 2.2 Data Protection
- all data in transit must be encrypted using TLS 1.2 or higher (TLS 1.3 preferred)
- all data at rest must be encrypted using AES-256 encryption
- patient health information (PHI) must be encrypted at the field level for highly sensitive data (diagnoses, medications, test results)
- encryption keys must be managed through a dedicated key management service with regular rotation
- database backups must be encrypted with the same standard as production data
- file uploads (medical images, documents) must be scanned for malware before storage

### 2.3 Authorization & Access Control
- permission-based access control must enforce granular permissions at every API endpoint — authorization checks use permissions directly, not team names or group names
- a user's effective permissions must be resolved by merging permissions from all teams they belong to in the current entity, plus any individual overrides
- permission resolution must be cached per session and invalidated when team membership or team permissions change
- patient data access must follow the principle of least privilege — only authorized personnel with an active care relationship can access records
- every access to patient records must be logged in an immutable audit trail with user ID, timestamp, action, and accessed data
- API endpoints must enforce rate limiting per user and per IP to prevent abuse
- cross-tenant data isolation must be enforced at the database query level — no tenant can access another tenant's data under any circumstance
- add-on/plugin permissions must be sandboxed and scoped — no add-on can exceed its declared permissions

### 2.4 Compliance
- the system must be designed for HIPAA compliance (US) with support for Business Associate Agreements (BAAs)
- the system must support GDPR compliance (EU) including right to erasure, data portability, and consent management
- the system must comply with Egypt's Personal Data Protection Law (PDPL) — collect only data necessary for the stated health purpose, record patient consent, prohibit cross-border PHI transfer without consent and legal basis, and fulfill data deletion requests within 30 days (anonymization where hard-delete is prohibited)
- the system must maintain audit trails for a minimum of 7 years as required by healthcare regulations
- the system must support configurable data retention policies per entity to comply with local regulations
- all third-party integrations must go through security review and must not receive PHI unless covered by a BAA or equivalent agreement
- penetration testing must be conducted at least annually, with critical findings remediated within 72 hours
- all code and requirements must comply with the certification standards defined in [`CERTIFICATIONS.md`](./CERTIFICATIONS.md) — this is the authoritative reference for FHIR R4, LOINC, SNOMED CT, ICD-10, RxNorm, DPG Standard, and PDPL code-level rules

---

## 3. Reliability & Availability

### 3.1 Uptime
- the system must target 99.9% uptime for production SaaS deployments (less than 8.76 hours downtime per year)
- critical subsystems (authentication, patient records, emergency features) must target 99.95% uptime
- planned maintenance windows must be communicated at least 72 hours in advance and scheduled during off-peak hours
- zero-downtime deployments must be supported through rolling updates or blue-green deployment strategies

### 3.2 Fault Tolerance
- the system must continue operating in degraded mode if non-critical services (analytics, notifications, community features) are unavailable
- database must use primary-replica architecture with automatic failover (failover time under 30 seconds)
- critical data writes (patient records, prescriptions, orders) must not be lost even during service failures — write-ahead logging or equivalent mechanism required
- circuit breakers must protect against cascading failures when external integrations (labs, insurance, pharmacy networks) are unresponsive
- message queues must persist undelivered messages and retry with exponential backoff

### 3.3 Backup & Disaster Recovery
- automated database backups must run at least every 6 hours with point-in-time recovery capability
- backups must be stored in a geographically separate location from the primary data center
- full disaster recovery must be achievable within 4 hours (RTO) with data loss not exceeding 1 hour (RPO)
- backup restoration must be tested at least quarterly with documented results
- self-hosted instances must have built-in backup tools and clear documentation for disaster recovery procedures

---

## 4. Data Integrity & Consistency

### 4.1 Transactional Integrity
- all clinical data operations (patient records, prescriptions, lab orders) must be ACID-compliant
- concurrent edits to the same record must be handled with optimistic concurrency control to prevent silent overwrites
- every modification to patient records must be immutably logged with the previous value, new value, user, and timestamp
- deleted records must be soft-deleted and retained per applicable retention policies — hard deletion only through audited data retention workflows

### 4.2 Data Validation
- all user inputs must be validated on both client and server side
- medical data must be validated against relevant coding standards (ICD-10, CPT, SNOMED CT, LOINC, RxNorm) where applicable — see [`CERTIFICATIONS.md` Section 3](./CERTIFICATIONS.md) for the full code-level rules for each standard
- LOINC codes must use `system: "http://loinc.org"`; SNOMED CT codes must use `system: "http://snomed.info/sct"`; RxNorm codes must use `system: "http://www.nlm.nih.gov/research/umls/rxnorm"` — never use free-text or internal identifiers in coded fields
- when a standard code is unavailable, use `DataAbsentReason` — never omit or fabricate a code
- file uploads must validate file type, size limits, and content integrity (checksum verification)
- QR code data must include integrity checksums to detect tampering

### 4.3 Data Migration Integrity
- data migration from legacy systems must include automated validation with field-by-field comparison
- migration must produce a detailed discrepancy report before any data is committed to production
- migration must be reversible with a documented rollback procedure
- referential integrity must be verified after migration (all foreign key relationships intact)

### 4.4 Sync Data Integrity
- the sync outbox must be written in the same database transaction as the entity change — no change must be observable by the sync system without its corresponding outbox record, and no outbox record must exist without a committed entity change
- outbox sequence numbers must be monotonically increasing per server instance — gaps in sequence numbers must be detected by the receiving server and trigger a re-delivery request for the missing range
- inbound sync records must be idempotent — re-delivering the same `SyncRecord` (same entity ID + same sequence number) must not create duplicates or corrupt data; the receiver must detect and skip already-applied records
- all entity IDs must use UUID v7 (`Guid.CreateVersion7()`) for time-sorted generation — IDs must be generated once at the point of origin and preserved unchanged through all sync operations; receiving servers and devices must never regenerate entity IDs
- soft-deleted records must be included in sync responses — the receiving side must apply the `IsDeleted` flag locally rather than physically deleting the record, ensuring sync consistency and audit trail preservation
- the sync pull endpoint must use a timestamp watermark (`?since={lastServerTimestamp}`) — the server must return all records with `UpdatedAt` greater than the watermark and include a `serverTimestamp` in the response for the client to use as the next watermark
- server-to-server sync batches must be acknowledged by the receiver before the sender marks outbox records as processed — if acknowledgment is not received within a configurable timeout, the sender must retry delivery with exponential backoff
- conflict resolution for mobile-to-server sync must use last-write-wins by `UpdatedAt` for operational data (POS transactions, inventory movements) and server-authoritative for clinical data (prescriptions, patient records, lab results) where the server version always takes precedence
- the sync system must not transfer data between servers that exceeds the entity's configured data sharing scope — sync filters must respect entity-level data sharing controls and never include private data categories in outbound sync batches
- all sync operations (outbound push, inbound receive, conflict resolution decisions) must be logged in the audit trail with: source server ID, destination server ID, entity type, entity ID, operation type, timestamp, and outcome (applied, skipped, conflict-resolved)
- the mobile app's local outbox queue must persist across app restarts — queued changes must not be lost on app crash, force-close, or device restart; the queue must use an on-device database (not in-memory storage)
- sync must not block the user interface — all sync operations (push, pull, conflict resolution UI) must run on background threads/isolates and must not prevent the user from continuing their work

---

## 5. Usability

### 5.1 Adaptive & Responsive UI
- the UI must be adaptive — layouts, navigation patterns, and component density must change based on device type and screen size, not just scale down (e.g., bottom nav on mobile, side rail on tablet, full sidebar on desktop)
- the UI must be responsive — all screens must fluidly adjust to any screen width from 320px (small phones) to ultra-wide desktop monitors without horizontal scrolling or content clipping
- breakpoint tiers must be defined and consistently applied across the app:
  - **Compact** (< 600px): phones — single-column layout, bottom navigation, full-screen dialogs
  - **Medium** (600–1024px): tablets — two-column layouts, navigation rail, side sheets
  - **Expanded** (> 1024px): desktops — multi-pane layouts, persistent sidebar, inline dialogs, data-dense tables
- complex screens (patient records, dashboards, scheduling) must use master-detail patterns on medium/expanded screens and drill-down navigation on compact screens
- touch targets must be at least 48x48dp on mobile and tablet; pointer-optimized density is allowed on desktop
- input methods must adapt to the device — touch gestures on mobile/tablet, keyboard shortcuts and hover states on desktop
- forms must adapt their layout to screen size — single column on compact, multi-column on expanded, with field grouping optimized per breakpoint
- data tables must be scrollable with sticky headers on all sizes, with column visibility adjustable based on available width (hide non-essential columns on smaller screens)
- the app must handle orientation changes (portrait/landscape) gracefully on mobile and tablet without data loss or layout breakage
- split-screen and multi-window modes must be supported on tablets (iPad Split View, Android multi-window) and desktops
- mobile apps (iOS, Android) must follow platform-specific design guidelines (Human Interface Guidelines, Material Design)
- desktop apps must be supported on Windows, macOS, and Linux — built from the same codebase as mobile apps
- desktop apps must support native windowing features (resizing, multi-window, system tray, keyboard shortcuts, native file dialogs)
- desktop apps must support system-level notifications on all three platforms
- desktop apps must be distributed through platform-appropriate channels (Microsoft Store / .msix, macOS DMG / App Store, Linux .deb / .rpm / Snap / Flatpak)
- desktop apps must support auto-update with user-controlled update preferences
- the system must support the latest 2 major versions of Chrome, Firefox, Safari, and Edge
- mobile apps must support the latest 3 major versions of iOS and Android
- desktop apps must support Windows 10+, macOS 12 (Monterey)+, and Ubuntu 22.04+ (or equivalent modern Linux distributions)

### 5.2 Accessibility
- the system must comply with WCAG 2.1 Level AA accessibility standards
- all interactive elements must be keyboard-navigable
- all images and media must have alternative text descriptions
- color must not be the sole means of conveying information
- screen reader compatibility must be tested with platform-native screen readers on iOS, macOS, and Android
- minimum touch target size must be 44x44 points on mobile devices

### 5.3 Internationalization & Localization
- the system must support right-to-left (RTL) layouts for Arabic, Hebrew, and other RTL languages
- all user-facing text must be externalized for translation (no hardcoded strings)
- date, time, number, and currency formats must adapt to the user's locale
- medical terminology translations must be reviewed by certified medical translators before deployment

### 5.4 Offline Support
- the app must detect network connectivity status in real-time and clearly indicate online/offline mode to the user
- core read operations must work offline — users can view their previously loaded data (appointments, patient records, medication history, prescriptions, medical documents, profile info) without an internet connection
- offline data must be cached locally in an encrypted local database to protect PHI at rest even on the device
- drafts and form entries must be fully functional offline — users can fill out forms, write clinical notes, and create prescriptions in draft mode without connectivity
- offline changes must be queued locally and automatically synced to the server when connectivity is restored, with conflict resolution handling
- if the same record was modified both offline and on the server, the system must present a conflict resolution UI showing both versions and letting the user choose or merge
- QR codes for prescriptions that were previously generated must remain accessible offline for presentation at pharmacies
- the app must define clear boundaries for what is available offline vs. what requires connectivity:
  - **Available offline**: viewing cached data, drafts, QR codes, educational content, profile, search within cached data
  - **Requires connectivity**: submitting orders/prescriptions, real-time messaging, video consultations, payment processing, syncing new data, push notifications
- the amount of data cached offline must be configurable (e.g., last 30 days of records, last 50 appointments) to manage device storage
- offline cache must be automatically cleared when a user logs out or when a session is revoked remotely, to prevent unauthorized access to stale data on shared or lost devices
- sync status must be visible to the user — pending uploads, last successful sync time, and any failed sync items must be clearly displayed

**Patient app — implementation status (2026-09-13).** The patient app satisfies
the read half of this section and explicitly does not yet satisfy the write
half:

- *Met.* PHI (profile, medications, records, prescriptions, check-ins) has
  always been on-device in an encrypted database. Server-owned read models —
  the account summary, the geofence deny list and the care directory — are now
  retained too, in a `cache_entry` table inside the same encrypted database.
  Connectivity is surfaced to the user by an app-wide offline banner. The cache
  is cleared on sign-in, sign-out and session expiry.
- *Deliberately not met.* Offline changes are **not** queued and there is **no**
  conflict-resolution UI. Writes fail fast with an explicit "you're offline"
  message. Queuing was scoped out: it needs server-side idempotency keys and
  per-endpoint merge rules that do not exist yet, and a partial queue is worse
  than none because users cannot tell which writes survived.
- *Not yet applicable.* Configurable cache size, sync-status display and
  offline prescription QR presentation await the features that produce them.

Design: `balsm_app/docs/superpowers/specs/2026-09-13-offline-resilient-reads-design.md`.

---

## 6. Maintainability & Code Quality

### 6.1 Architecture
- the system must follow a modular monolith architecture for MVP with clear module boundaries enabling future microservice extraction
- modules must communicate through well-defined internal interfaces (not direct database access across modules)
- the codebase must follow clean architecture principles with separation of concerns (API layer, business logic, data access)
- shared libraries and utilities must be versioned and documented

### 6.2 Domain-Driven Design (DDD)
- **strategic DDD must be applied from day 1** — bounded contexts, context mapping, and ubiquitous language must guide module boundaries and naming
- each module must align with a bounded context that owns its data, business rules, and domain model independently
- the following bounded contexts are identified:
  - **Identity & Access** — User, Account, Permission, PermissionGroup, Team, Session, Authentication, Caregiver, EmergencyProfile, HealthPassport
  - **Entity Management** — Entity, Branch, Department, Room, Bed
  - **Appointment** — Appointment, Slot, Schedule, WaitingList, HouseVisit, Questionnaire, CostEstimate
  - **Clinical Records** — PatientRecord, Entry, CareTeam, Referral, Consent, SelfReport, DischargeFollowUp, Timeline
  - **Prescriptions** — Prescription, Medication, DrugInteraction, Validity, RecurringPrescription
  - **Pharmacy** — Pharmacy, PharmacyInventory, Dispensation, QRCode, Delivery
  - **Labs** — LabOrder, Specimen, TestResult, QualityControl
  - **Radiology** — ImagingOrder, Study, RadiologyReport, PACS
  - **Billing & Finance** — Bill, Claim, Payment, InsurancePolicy, Revenue
  - **Inventory** — Item, PurchaseOrder, Vendor, StockLevel
  - **Messaging & Notifications** — Conversation, Message, Notification, Announcement
  - **Charitable Donations** — Charity, DonationCase, Donation, CaseUpdate
  - **Marketplace** — AddOn, AddOnDeveloper, AddOnReview, AddOnListing
- ubiquitous language must be enforced — code must use the domain's precise terminology (e.g., "admission" not "internal reservation", "dispensation" not "pharmacy fulfillment") and this terminology must be consistent between code, API endpoints, database schemas, and documentation
- **tactical DDD patterns** (aggregates, domain events, value objects, repositories, domain services) must be applied in complex bounded contexts where business rules justify it (Clinical Records, Prescriptions, Billing, Labs, Radiology)
- simple CRUD-oriented bounded contexts (User Profile, Announcements) should remain lightweight without over-engineering tactical patterns
- domain events must be used for cross-context communication — when a prescription is issued in the Prescriptions context, a domain event notifies the Pharmacy context rather than direct coupling
- anti-corruption layers must be implemented at integration boundaries with external systems (HL7/FHIR, DICOM, insurance APIs, pharmacy networks) to translate between external data models and internal domain models
- each bounded context must own its database schema — no shared tables between contexts, even within the modular monolith (schema-per-module isolation)
- context mapping must be documented and maintained showing the relationships between bounded contexts (upstream/downstream, conformist, anti-corruption layer, shared kernel)

### 6.3 Testing
- unit test coverage must be at least 80% for business logic and domain layer
- integration tests must cover all API endpoints and critical workflows
- end-to-end tests must cover core user journeys (registration, appointment booking, prescription flow, payment)
- all tests must run in CI/CD pipeline — no code merged without passing tests
- performance/load tests must be run before each major release

### 6.4 Documentation
- all public API endpoints must have OpenAPI documentation auto-generated from code
- architecture decision records (ADRs) must be maintained for significant technical decisions
- deployment procedures, environment setup, and configuration must be documented in the repository
- add-on/plugin API must have comprehensive developer documentation with examples and SDK references

### 6.5 API Client Collections
- all API endpoints must be maintained as an Insomnia HTTP client collection in the repository
- the Insomnia collection must be organized by module/domain matching the system architecture (Auth, User, Entity, Appointments, Records, Pharmacy, Labs, etc.)
- each request in the collection must include example request body, headers, query parameters, and documented expected responses
- environment variables must be configured in the Insomnia workspace for base URL, auth tokens, and tenant context to allow easy switching between development, staging, and production
- the collection must be kept in sync with the codebase — any new or modified API endpoint must have its corresponding Insomnia request updated before the PR is merged
- the Insomnia collection file must be exported in Insomnia v4 JSON format and stored under a `/docs/api/` directory in the repository for version control
- authentication flows (login, token refresh, social login) must be preconfigured in the collection so developers can authenticate and test protected endpoints immediately
- the collection must include folder-level documentation describing the purpose and usage of each module's endpoints

### 6.6 CI/CD
- every commit to main must trigger automated build, lint, test, and security scan pipeline
- deployments to staging must be automated on merge to main
- production deployments must require manual approval after staging validation
- rollback to previous version must be achievable within 5 minutes
- container images must be scanned for known vulnerabilities before deployment

---

## 7. Observability & Monitoring

### 7.1 Logging
- all API requests must be logged with request ID, user ID, endpoint, method, status code, and response time
- all errors must be logged with full stack traces, request context, and correlation IDs
- patient data must never appear in logs — PHI must be masked or excluded (log only record IDs, never content)
- logs must be structured (JSON format) and shipped to a centralized log aggregation system
- log retention must be at least 90 days for operational logs and 7 years for audit logs

### 7.2 Metrics & Alerting
- system health metrics must be collected: CPU, memory, disk, network, and request rates
- application metrics must be collected: response times (p50, p95, p99), error rates, active users, queue depths
- business metrics must be tracked: appointment volumes, prescription fills, active entities
- alerts must be configured for: error rate spikes, response time degradation, disk space thresholds, failed background jobs, security events
- alert escalation must follow defined on-call procedures with acknowledgment tracking

### 7.3 Tracing
- distributed tracing must be implemented across all service calls with correlation IDs
- trace data must capture the full request lifecycle from API gateway through database queries
- slow queries (exceeding 500ms) must be automatically flagged and logged for investigation

---

## 8. Deployment & Infrastructure

### 8.1 Containerization
- all services must be containerized using Docker with multi-stage builds for minimal image size
- container images must be published to a private container registry
- a container orchestration platform must be used for production deployments
- deployment templates must be provided for repeatable, configurable deployments

### 8.2 Environment Management
- the system must support at least 3 environments: development, staging, and production
- every hospital migration must have a dedicated staging environment (as defined in MIGRATION_INTEGRATION_GUIDE.md)
- environment-specific configuration must be managed through environment variables — no secrets in code or config files
- secrets must be stored in a dedicated secrets manager (e.g., HashiCorp Vault, cloud provider KMS)

### 8.3 Self-Hosted Deployment
- self-hosted instances must be deployable via a single-host container setup for small deployments and an orchestrated cluster for production scale
- a CLI tool or installation wizard must guide self-hosted setup including database provisioning, initial admin creation, and TLS certificate configuration
- self-hosted instances must be upgradable with minimal downtime through provided migration scripts
- self-hosted instances must be able to operate fully air-gapped (no internet dependency) for organizations with strict network policies, with optional connectivity for federation and marketplace

---

## 9. Interoperability Standards

### 9.1 Healthcare Standards
- the system must support HL7 FHIR R4 for healthcare data exchange — the API must expose a `/metadata` endpoint returning a valid `CapabilityStatement` documenting supported resources, operations, and search parameters
- all FHIR resources exchanged externally must include `resourceType`, `id`, `meta.profile`, and all mandatory R4 elements — anti-corruption layers must translate between FHIR types and internal domain models
- the system must support DICOM for medical imaging interoperability (radiology, pathology)
- the system must support ICD-10 for diagnosis coding — ICD-10 codes must be validated against the active code set before persistence
- the system must support CPT and HCPCS codes for procedure coding
- the system must support SNOMED CT for clinical terminology — all clinical findings, diagnoses, and procedures must use SNOMED CT concept IDs stored alongside display terms
- the system must support LOINC for laboratory and clinical observation coding — all lab observations, vital signs, and clinical document types must use LOINC codes; LOINC registration at loinc.org is required before shipping any lab-related feature
- the system must support RxNorm for medication nomenclature and interoperability — all medication references must include RxNorm `RxCUI`
- the system must support WHO ATC classification for drug classification and pharmacovigilance
- full code-level compliance rules for all of the above standards are defined in [`CERTIFICATIONS.md` Section 3](./CERTIFICATIONS.md) — that document is authoritative

### 9.2 API Standards
- all external APIs must follow RESTful conventions with consistent resource naming and HTTP status codes
- API versioning must be supported (URI-based: /api/v1/) to allow backward-compatible evolution
- all APIs must support pagination, filtering, and sorting for list endpoints
- API rate limiting must be applied per consumer with configurable limits
- webhook delivery must include retry logic (at least 3 attempts with exponential backoff) and signature verification for payload integrity

---

## 10. Privacy & Data Governance

### 10.1 Consent Management
- patients must explicitly consent to data sharing before any record is shared with a doctor, entity, or external system
- consent records must include what data, with whom, for what purpose, and for how long — and must be revocable at any time
- pharmaceutical analytics data must be anonymized and aggregated — no individual patient identification possible
- add-ons must not access patient data beyond their declared and approved permission scope

### 10.2 Data Residency
- the system must support configurable data residency — entity data must remain in the geographic region specified by the entity admin
- federated instances must keep clinical data local and only share explicitly federated data (doctor profiles, pharmacy availability) across the network
- cross-border data transfers must comply with applicable regulations (GDPR, local health data laws)

### 10.3 Right to Erasure
- users must be able to request deletion of their account and all associated personal data
- erasure requests must be fulfilled within 30 days as required by GDPR
- data that must be retained for legal/regulatory purposes must be anonymized rather than deleted, with a documented legal basis for retention
