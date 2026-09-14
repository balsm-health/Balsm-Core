# Balsm Healthcare Platform — Agent Instructions

> Universal instructions for all AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, Cline, etc.)

---

## Project Overview

Balsm is a healthcare platform consisting of multiple repositories:

| Repo | Stack | Description |
|------|-------|-------------|
| `Balsm-Core` | Markdown | Product roadmap, phased delivery plans, business features, and AI governance docs |
| `Balsm-API-DotNet` | .NET (C#) | Backend API — modular monolith with clean architecture and DDD |
| `balsm_app` | Flutter (Dart) | Cross-platform mobile/desktop client application |
| `website` | Web | Marketing and public-facing website |

### P001 Patient App MVP — architecture notes

- **Backend is .NET 10 (ASP.NET Core + EF Core 10 + Npgsql/PostgreSQL).** There is **no Supabase** — the 2026-06-17 pivot removed it. Auth is custom JWT (HS256, 15-min access / 30-day refresh) + password + Google/Apple OIDC; email OTP is used only for registration and password reset (email-OTP login was removed to conserve email quota — 2026-08-02). Cloud DB holds non-PHI only; PHI lives on-device (SQLite/SQLCipher via drift). `date_of_birth` is the one cloud PHI field — AES-256-GCM at the .NET application layer, audited on every write (FR-048).
- **Backend layout**: `Balsm.API` + 14 modules (`Account`, `Auth`, `CareDirectory`, `Customer`, `Deletion`, `Disclosure`, `EmergencyQr`, `Entity`, `Geofence`, `Identity`, `Inventory`, `POS`, `Prescription`, `Sessions`; `Customer`, `Inventory`, `POS` and `Prescription` are P002+ stubs with health endpoints only) over `Balsm.Infrastructure`/`Balsm.SharedKernel`, plus the Standalone-only `Balsm.Supervisor`. Handlers that touch a DbContext live in `*.Infrastructure` (not `*.Application`) to avoid circular project deps.
- **Flutter** is a **melos monorepo: 16 packages** — `core` shared kernel + `balsm_api` API-contract package + 12 DDD module packages (`account`, `auth`, `deletion`, `disclosure`, `emergency_card`, `geofence_block`, `medications`, `prescriptions`, `profile`, `records`, `self_report`, `sessions`) + `balsm_boundary_lint` + runnable `app` shell. Modules depend only on `core` and `balsm_api` (boundary lint's module list stays module-only, so both are importable). The client talks to the .NET API exclusively through `packages/balsm_api` — abstract per-area interfaces (`AuthApi`, `SessionsApi`, …) + dio implementations + hand-written DTOs, wired via core `Provider<XxxApi>`s; raw `dio` never appears in feature modules. Never Supabase.
- **Build flavors**: `dev` / `staging` / `prod` (`main_<flavor>.dart` + `--dart-define-from-file=env/<flavor>.json`, key `API_BASE_URL`). Dev flavor enables the in-app server selector.
- **Sub-processors** (data-safety filings must disclose): **Resend** (email OTP), **iCloud Drive** + **Google Drive** (user-owned encrypted PHI backup blobs), **reCAPTCHA Enterprise** (signup abuse), self-hosted **Sentry** (crash, PHI-scrubbed).

---

## 1. General Behavior

- read and understand the existing code in the file and surrounding modules before making changes
- do not guess — if context is missing, read the relevant files first
- make only the changes requested — do not refactor, add features, or "improve" surrounding code unless asked or after granting explicit permission
- do not add comments, docstrings, or type annotations to code you did not change
- do not add error handling, validation, or fallbacks for scenarios that cannot happen
- do not create helper functions, utilities, or abstractions for one-time operations
- do not design for hypothetical future requirements
- follow the existing code style, naming conventions, and patterns in each project — do not introduce new conventions
- write clean, maintainable code — keep functions small and focused (single responsibility)
- do not introduce new dependencies or packages without justification
- do not create files unless they are necessary to complete the task — prefer editing existing files
- do not leave dead code, commented-out code, or TODO comments without a linked issue
- do not mix formatting changes with functional changes in the same commit
- always check for typos in code, variable names, strings, comments, and documentation before submitting — typos in identifiers cause bugs, typos in user-facing text damage credibility
- when a user request adds, modifies, or removes a business requirement, feature, or behavioral rule — update all affected documentation before or alongside the code implementation; this includes [`BUSINESS_FEATURES.md`](../../BUSINESS_FEATURES.md) for feature specs, [`PHASED_DELIVERY_STEPS.md`](../../PHASED_DELIVERY_STEPS.md) for delivery tasks, [`GLOSSARY.md`](../../GLOSSARY.md) for new or changed domain terms, [`NON_FUNCTIONAL_REQUIREMENTS.md`](../../NON_FUNCTIONAL_REQUIREMENTS.md) for validation and performance rules, [`CERTIFICATIONS.md`](../../CERTIFICATIONS.md) for standards and certification compliance, agent rules ([`AGENTS.md`](./AGENTS.md), [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)) for AI behavior or coding convention changes, Claude skills (`.claude/commands/`) for new or modified slash commands, and any other relevant spec document; code changes without corresponding documentation updates are incomplete

---

## 2. Architecture & Domain Rules

### 2.1 Modular Monolith

- the system follows a modular monolith architecture with clean module boundaries
- every bounded context must be a separate package/project — no two contexts in the same package
- modules communicate through well-defined internal interfaces — never access another module's database tables or internal classes directly
- each module follows clean architecture: API layer → business logic → data access — respect the layer boundaries
- never add cross-module project references — modules depend on shared contracts/interfaces only

### 2.2 Domain-Driven Design

- [`architecture/`](../../architecture/) is the **single source of truth for domain decomposition**: subdomains (problem space) in [`architecture/domain-map.md`](../../architecture/domain-map.md), bounded contexts (solution space) in [`architecture/bounded-contexts/`](../../architecture/bounded-contexts/README.md). All bounded contexts, modules, and submodules MUST be defined there before they exist in code
- before creating, renaming, splitting, merging, or deleting any module/submodule in any repo, consult `architecture/domain-map.md` and `architecture/bounded-contexts/`; if the proposed module maps to no documented subdomain/context, STOP and propose an architecture/ update first — docs lead, code follows
- a module that exists in code but not in `architecture/` (or vice versa where the phase is active) is an architecture defect — surface it, do not silently extend it
- the codebase uses DDD with 20 canonical bounded contexts (+2 provisional), organized by data-ownership plane (ADR-10) — respect their boundaries; full canvases in [`architecture/bounded-contexts/`](../../architecture/bounded-contexts/README.md):
  - *Consumer plane (patient-owned PHI):*
  - **Personal Health** (Core) — HealthProfile, TimelineEntry, VaccinationRecord, MedicationSchedule, DoseEvent, EmergencyCardSnapshot, EmergencyToken, RecordDocument
  - **Provider Directory** — ProviderListing, CatalogProjection
  - *Provider plane (entity-owned data):*
  - **Entity Management** — Workspace, Entity, Branch, Department, Room, Bed
  - **Inventory** — CatalogItem, Barcode, StockLevel, PurchaseEntry, PurchaseReturn, ControlledSubstanceClassification
  - **Point of Sale** — Sale, Basket, SaleReturn, CashDrawerSession, Receipt
  - **Customer Relations** — Customer, PaperPrescriptionNote, PurchaseHistory (projection)
  - **Appointment** — Appointment, Slot, Schedule, WaitingList, HouseVisit, Questionnaire, CostEstimate
  - **Clinical Records** (Core) — Encounter, PatientRecord, ClinicalNote, Addendum, Referral, Consent, AuditTrailEntry
  - **Prescriptions** (Core) — Prescription, Medication, DrugInteraction, Validity, RecurringPrescription
  - **Pharmacy** — Dispensation, QRVerification, DeliveryOrder
  - **Billing & Finance** — Invoice, Claim, Payment, InsurancePolicy, VATReport
  - **Labs** — Analyte, LabTest, Bundle, ReferenceRange, LabOrder, Specimen, AnalyteResult, QCRun, ReflexRule, ResultShareLink
  - **Radiology** — ImagingOrder, Study, RadiologyReport
  - **Care Delivery** — Admission, BedOccupancy, DischargeSummary, TeleconsultSession, VirtualWaitingRoom
  - **Charitable Donations** — Charity, DonationCase, Donation, CaseUpdate
  - *Platform plane (Balsm-owned, non-PHI):*
  - **Balsm Network** — FederationPairing, SharingPolicy, Subscription, Entitlement, TunnelRegistration, InstanceRegistration
  - **Platform Access** — OAuthClient, ConsentGrant, ApiKey, RateLimitPolicy, WebhookSubscription
  - **Marketplace** — AddOn, AddOnDeveloper, AddOnReview, AddOnListing
  - *Cross-plane:*
  - **Identity & Access** — User, Account, Session, Device, DeletionRequest, WorkspaceMembership, Permission, PermissionGroup, Team, InviteCode, Caregiver, Guardianship, GeofencePolicy, DisclosureAcceptance
  - **Messaging & Notifications** — Conversation, Message, Notification, Announcement
  - *Provisional (P021 gate — modules must not map to these yet):* **Community**, **Population Insights**
  - note: `PharmacyInventory` moved from Pharmacy to Inventory (`StockLevel`) — one context owns stock
- every module/package MUST carry a `README.md` with YAML frontmatter declaring `context:` (exact canonical name, or `shared-kernel` / `infrastructure` / `app-shell` / `tooling`), `plane:`, and `features:` (one line per roadmap deliverable, phase-prefixed) — convention spec in [`architecture/bounded-contexts/README.md`](../../architecture/bounded-contexts/README.md#module-readme-convention-binding); a module without a valid mapping is an architecture defect

### 2.3 Ubiquitous Language

- use domain-specific terminology exactly as defined — do not invent synonyms or abbreviations
- examples: "appointment" not "reservation" or "booking", "admission" not "internal reservation", "dispensation" not "pharmacy fulfillment", "specimen" not "sample"
- naming must be consistent across code, API endpoints, database schemas, and documentation

### 2.4 Cross-Context Communication

- use domain events for communication between bounded contexts — never create direct dependencies between contexts
- sole sanctioned exception (constitution v1.8.0, Principle IV): Point of Sale → Inventory `DeductStock`/`RestoreStock` is a synchronous published-interface command inside one local transaction, because P007 requires atomic stock deduction; the never-below-zero invariant stays inside Inventory's `StockLevel` aggregate
- implement anti-corruption layers when integrating with external systems (HL7/FHIR, DICOM, insurance APIs)
- each bounded context owns its database schema — no shared tables between contexts

### 2.5 Tactical Patterns

- apply tactical DDD patterns (aggregates, domain events, value objects, repositories, domain services) in complex contexts: Personal Health, Clinical Records, Prescriptions, Billing & Finance, Labs, Radiology
- keep simple CRUD contexts (User Profile, Announcements) lightweight — do not over-engineer them with unnecessary patterns

---

## 3. Security & Data Rules

- **Security-first**: every operation must be verified with its corresponding permission before execution
- never log, print, or expose patient health information (PHI) — log only record IDs, never content
- never hardcode secrets, API keys, passwords, or connection strings — use environment variables
- always enforce permission checks — every API endpoint must verify the user has the required permission
- validate all user inputs on both client and server side
- use parameterized queries — never concatenate user input into queries
- soft-delete records — never hard-delete clinical or patient data
- all modifications to patient records must be immutably logged with previous value, new value, user, and timestamp
- all sensitive operations must have an audit log entry created for tracking purposes
- encrypt sensitive fields (diagnoses, medications, test results) at the field level
- never bypass authentication or authorization checks, even in tests or dev utilities
- never include real patient data, PHI, or production secrets in code, comments, prompts, commit messages, or test fixtures — use synthetic or anonymized data only
- never paste or reference production data in AI assistant prompts or chat — treat all AI conversations as potentially logged by third parties
- never generate code that sends PHI to external services without encryption and consent verification
- never weaken existing security controls to fix a bug or simplify code
- sanitize all AI-facing inputs — guard against prompt injection

---

## 4. Data Integrity

- all clinical data operations must be ACID-compliant
- use optimistic concurrency control for concurrent record edits — do not silently overwrite
- validate medical data against relevant coding standards (ICD-10, CPT, HCPCS, SNOMED CT, LOINC, RxNorm) where applicable
- all generated code must comply with the standards defined in [`CERTIFICATIONS.md`](../../CERTIFICATIONS.md) — read that file before generating code that touches clinical data, lab results, medications, diagnoses, FHIR resources, or patient records
- maintain referential integrity — never leave orphaned records or broken foreign key relationships
- file uploads must validate file type, size limits, and content integrity

---

## 5. Testing

- do not submit code without tests for new business logic
- unit tests are required for domain and business logic — target 80% coverage
- integration tests are required for API endpoints and critical workflows
- do not mock what you can test with an in-memory or test database
- tests must be deterministic — no reliance on external services, current time, or random values without seeding
- do not skip or disable existing tests to make new code pass

---

## 6. API Conventions

- follow RESTful conventions with consistent resource naming and HTTP status codes
- API versioning is URI-based: `/api/v1/`
- all list endpoints must support pagination, filtering, and sorting
- API responses must use consistent error response structure
- when adding or modifying an API endpoint, update the corresponding API client collection in `/docs/api/`

---

## 7. Healthcare-Specific Rules

- **before implementing any clinical, lab, pharmacy, FHIR, or medication feature — read [`CERTIFICATIONS.md` Section 3](../../CERTIFICATIONS.md) and ensure the implementation satisfies all code-level compliance rules defined there**
- prescription validation rules (drug interactions, allergy checks, dosage limits) are safety-critical — do not bypass, weaken, or shortcut them
- clinical workflows must always maintain audit trails — never skip audit logging for convenience
- consent checks must be enforced before any data sharing operation
- medical terminology and coding standards (ICD-10, CPT, HCPCS, SNOMED CT, LOINC, RxNorm, HL7 FHIR, DICOM) must be used correctly — do not approximate or simplify medical codes; full usage rules are in [`CERTIFICATIONS.md`](../../CERTIFICATIONS.md)
- all FHIR resources must include `resourceType`, `id`, `meta.profile`, and mandatory R4 elements — use the standard R4 resource types; never invent custom structures where standard ones exist
- all lab/observation codes must use LOINC with `system: "http://loinc.org"` — never use free-text or internal codes where LOINC equivalents exist
- all clinical findings and diagnoses must be coded with SNOMED CT (`system: "http://snomed.info/sct"`) — ICD-10 is acceptable as a secondary billing code alongside SNOMED, not a replacement
- all medication references must include RxNorm `RxCUI` with `system: "http://www.nlm.nih.gov/research/umls/rxnorm"`
- all patient data must be exportable as a FHIR Bundle on request — no data lock-in
- patient-facing content must support internationalization — no hardcoded strings

---

## 8. Performance & Scalability (Critical)

> Performance is a first-class requirement — not an afterthought. Every code change must be evaluated for its performance impact.

- every code change must consider its performance implications — unoptimized code is a bug
- measure before and after — do not claim a change improves performance without benchmarks or profiling data
- read the detailed performance standards in [`CODING_STANDARDS.md`](./CODING_STANDARDS.md)

---

## 9. Git & Workflow

- every feature, bug fix, and hotfix must be developed on a separate branch — never commit directly to `main`
- commit after completing every task — do not batch multiple tasks into a single commit
- write clear, descriptive commit messages following the project's commit convention
- do not use `--force`, `--no-verify`, or destructive git operations without explicit approval
- do not amend published commits
- keep commits focused — one logical change per commit
- do not commit generated files, build artifacts, or environment-specific configuration
- every UI screen or component must have a Figma design created before implementation — include the Figma URL in the issue and PR description — see [`UI_DESIGN.md`](./UI_DESIGN.md) for the design system, responsive breakpoints, and Figma MCP workflow

---

## 10. AI Governance

Read [`AI_GOVERNANCE.md`](../../AI_GOVERNANCE.md) before implementing any AI-related feature. Core principle: **AI is assistive only — it never replaces human clinical judgment.**

---

## 11. Coding Standards

Read [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) for detailed technical patterns including: error handling, naming conventions, SOLID principles, structured logging, database patterns, async patterns, validation strategy, DTO/mapping, idempotency, and code organization.

---

## Key Documentation

### Architecture & Design
- [`architecture/domain-map.md`](../../architecture/domain-map.md) — **authoritative problem-space decomposition**: domain vision, 17 subdomains (Core/Supporting/Generic), subdomain → bounded-context mapping — consult before any module/context change (§2.2)
- [`architecture/subdomain-classification.md`](../../architecture/subdomain-classification.md) — DDD subdomain analysis: Core, Supporting, and Generic domains with investment strategies
- [`architecture/subdomain-map.md`](../../architecture/subdomain-map.md) — visual subdomain organization, context maps, and team ownership
- [`architecture/communication-architecture.md`](../../architecture/communication-architecture.md) — three-tier architecture (App, Local Server, Cloud)
- [`architecture/api-routing-strategy.md`](../../architecture/api-routing-strategy.md) — complete API endpoint routing by bounded context with versioning and patterns
- [`architecture/website-routing-strategy.md`](../../architecture/website-routing-strategy.md) — public website URL structure, SEO, and i18n strategy
- [`architecture/subdomain-route-mapping.md`](../../architecture/subdomain-route-mapping.md) — quick reference: subdomains → API routes → website pages
- [`architecture/documentation-routing-strategy.md`](../../architecture/documentation-routing-strategy.md) — documentation subdomain routing (docs, developers, help center, API reference)
- [`architecture/download-routing-strategy.md`](../../architecture/download-routing-strategy.md) — app download & distribution routing (iOS, Android, Windows, macOS, Linux, local server)
- [`architecture/share-routing-strategy.md`](../../architecture/share-routing-strategy.md) — universal sharing & QR code routing (health passport, prescriptions, appointments, secure links)
- [`architecture/authentication-routing-strategy.md`](../../architecture/authentication-routing-strategy.md) — authentication & SSO routing (login, MFA, OAuth, SAML, social login)
- [`architecture/payment-routing-strategy.md`](../../architecture/payment-routing-strategy.md) — payment & checkout routing (Stripe, invoices, subscriptions, refunds, PCI compliance)
- [`architecture/legal-consent-routing-strategy.md`](../../architecture/legal-consent-routing-strategy.md) — legal documents & consent management (legal.balsm.health, templates, HIPAA, GDPR)
- [`architecture/community-routing-strategy.md`](../../architecture/community-routing-strategy.md) — community & feedback platform (community.balsm.health, feature requests, bug reports, discussions, roadmap, voting, knowledge base)

### Development Standards
- [`CODING_STANDARDS.md`](./CODING_STANDARDS.md) — detailed technical patterns (error handling, naming, SOLID, logging, database, async, validation, DTOs, idempotency, code organization)
- [`UI_DESIGN.md`](./UI_DESIGN.md) — UI design system, Figma MCP workflow, responsive breakpoints, component library, and design tokens

### Business & Compliance
- [`AI_GOVERNANCE.md`](../../AI_GOVERNANCE.md) — AI governance, data privacy, and clinical AI policies
- [`SYSTEM_THREAT_MODEL.md`](../../SYSTEM_THREAT_MODEL.md) — platform-wide STRIDE + AI/ML threat catalog and mitigations; phase specs reference threat IDs from this document
- [`CERTIFICATIONS.md`](../../CERTIFICATIONS.md) — target certifications (DPG, FHIR, SNOMED, LOINC, ICD-10, RxNorm, PDPL) and **mandatory code-level compliance rules** for all generated code
- [`BUSINESS_FEATURES.md`](../../BUSINESS_FEATURES.md) — full feature specifications
- [`PHASED_DELIVERY_STEPS.md`](../../PHASED_DELIVERY_STEPS.md) — delivery phases and milestones
- [`GLOSSARY.md`](../../GLOSSARY.md) — domain terminology definitions
- [`NON_FUNCTIONAL_REQUIREMENTS.md`](../../NON_FUNCTIONAL_REQUIREMENTS.md) — performance, scalability, compliance requirements
- [`MIGRATION_INTEGRATION_GUIDE.md`](../../MIGRATION_INTEGRATION_GUIDE.md) — integration with external systems (HL7/FHIR, DICOM, etc.)

### Project-scoped skills
Claude Code auto-loads skills from [`.claude/skills/`](../../.claude/skills/). Notable:
- **`healthcare-threat-modeling`** — produces a STRIDE + AI/ML threat model for a system or phase. Use when adding or auditing a phase, when a new external integration is introduced, or when reviewing security for a new feature. The skill reads `SYSTEM_THREAT_MODEL.md`, `NON_FUNCTIONAL_REQUIREMENTS.md`, `COMPLIANCE_REVIEW.md`, and the constitution as canonical context.
