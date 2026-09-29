# Balsm Healthcare Platform — Shared Coding Standards

> Cross-project principles that apply to EVERY Balsm repo. Referenced from
> [AGENTS.md](./AGENTS.md).
>
> **Per-project standards** (tech-specific naming, structure, performance)
> live in each repo's root and extend this file:
>
> | Project | Standards file |
> |---|---|
> | Balsm-API-DotNet (.NET API) | `Balsm-API-DotNet/CODING_STANDARDS.md` |
> | balsm_app (patient app) | `balsm_app/CODING_STANDARDS.md` |
> | website (Next.js) | `website/CODING_STANDARDS.md` |
>
> When working in a repo, read the shared file AND that repo's file. On
> conflict, the per-project file wins for that repo.

---

## 1. Error Handling

- use the Result pattern (`Result<T>` / `AppResult`) for expected failures (validation errors, not-found, business rule violations) — do not throw exceptions for expected outcomes
- reserve exceptions for truly unexpected failures (network errors, database unavailability, null references)
- define domain-specific error/exception types organized by bounded context — no generic `Exception`/`ApplicationException`
- never swallow exceptions silently — always log or propagate
- never catch broadly without re-throwing or logging — catch only what you can meaningfully handle
- boundary layers translate domain errors into transport-appropriate responses (HTTP status codes, UI failure states) — never leak internal exception details
- include correlation IDs in all error responses to enable tracing

## 2. SOLID Principles

- **Single Responsibility**: each class and method does one thing — if a class name needs "And" or "Manager", it does too much
- **Open/Closed**: extend behavior through new implementations, not by modifying existing working code — use interfaces and strategy patterns
- **Liskov Substitution**: derived types must be fully substitutable for their base types — do not override methods to throw not-implemented
- **Interface Segregation**: create focused interfaces — never force a class to implement methods it does not use
- **Dependency Inversion**: depend on abstractions (interfaces/ports), not concrete implementations — inject dependencies, never instantiate them inside business logic

## 3. Structured Logging

- structured key-value logging — not string interpolation/concatenation
- every log entry: `CorrelationId`, `UserId`, `Action`, `Module`
- levels: `Debug` (dev diagnostics), `Information` (business events), `Warning` (recoverable), `Error` (needs attention), `Critical` (system-level)
- **never log PHI, passwords, tokens, or full request/response bodies** — entity IDs and operation names only
- log entry/exit for critical workflows (clinical, financial); include duration where performance matters

## 4. Validation Strategy

- validate at two layers — never skip either:
  - **boundary layer** (input): types, required fields, lengths, formats — reject malformed input before business logic
  - **domain layer** (business rules): state transitions, cross-field rules, invariants — enforced regardless of entry point
- domain validation lives inside the domain model (entities, value objects) — not in services or handlers
- return all validation errors at once — never first-error-only
- validation errors carry: field name, machine-readable code, human-readable message
- never trust client-side validation alone

## 5. DTO & Mapping

- never expose or accept domain entities at the API boundary — always map to/from DTOs
- three distinct models per entity: Domain Model (behavior), Persistence Model (storage mapping), DTO (contract)
- DTOs are immutable; mapping is purely structural — no domain logic in DTOs or mappers
- purpose-specific DTOs: `{Entity}DetailDto`, `{Entity}ListItemDto`, `Create{Entity}Request`, `Update{Entity}Request`

## 6. Idempotency

- all write APIs are idempotent — the same request twice produces the same result without side effects
- client-generated `Idempotency-Key` for creates; ID-addressed updates/deletes tolerate already-applied state
- payment/billing and prescription dispensation MUST be idempotent — duplicates are unacceptable in healthcare
- event publishing/consumption is idempotent — dedupe by event ID

## 7. File & Member Organization

- consistent member order: constants/statics → private fields → constructors → public properties → public methods → private methods
- files under 300 lines; one public class per file; file name matches the class

## 8. Caching Principles

- explicit TTL on every cached item; cache-aside pattern; invalidate on write — stale data in healthcare is dangerous
- cache: configurations, permission sets, lookup/formulary/code tables
- **never cache**: patient records, prescriptions, real-time inventory, appointment availability
- cache keys include tenant ID — never serve cached data across tenants

## 9. Performance Posture

Performance is a first-class requirement in every repo. Targets, tooling, and
platform-specific rules (EF Core, Flutter frame budget, web vitals) live in
the per-project standards files.

## 10. Formatting & Commit Hygiene

- **auto-format the whole tree before every commit** — never hand-reflow lines or mix manual whitespace edits into a feature diff. Each repo pins ONE canonical formatter + width in committed config; per-file overrides are never allowed:
  - Dart/Flutter → `dart format .`; width pinned by `formatter: page_width: 120` in `analysis_options.yaml`
  - C#/.NET → `dotnet format`
  - TS/JS → the repo's Prettier config
- **a `pre-commit` hook enforces it** — the hook runs the formatter in check mode (`--set-exit-if-changed` for dart) over staged files and blocks the commit on any drift. Ship it in a versioned hooks dir and enable per clone with `git config core.hooksPath .githooks`; CI runs the same check.
- **keep pure-format commits separate** from semantic changes so review stays legible, and tag them `[skip-docs]` (mechanical → no doc impact).
- **never commit a machine-specific absolute path** — `/Volumes/...`, `/Users/<name>/...`, `/home/<name>/...`, `C:\Users\...`, `~/Dev/...`. A checkout location is one developer's accident, not a fact about the repo: it is wrong in every other clone and on CI, and it publishes the author's directory layout. This binds docs and plans as much as code — a runbook nobody else can paste is not a runbook.
  - `cd /Volumes/Dev/Balsm/<repo>` → `cd "$(git rev-parse --show-toplevel)"`, or write commands as run from the repo root
  - a path inside this repo → repo-relative (`app/lib/...`, `src/...`)
  - another repo in the workspace → `../<repo>`; the workspace itself → "the parent directory of this repo"
  - the same `pre-commit` hook blocks it on added lines, and CI greps the tracked tree for the `--no-verify` case and for clones that never enabled hooks
  - when the path IS the subject — a test asserting a path is redacted, a mounted DMG, an illustrative CLI transcript — put `machine-path-ok` on that line; vendored third-party skills are exempt
