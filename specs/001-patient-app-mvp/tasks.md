---
description: "P001 task list — Patient App MVP (.NET backend)"
---

# Tasks: Patient App MVP (P001)

**Input**: Design documents from `/specs/001-patient-app-mvp/`
**Prerequisites**: [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/)

> **Backend pivot 2026-06-17**: Cloud backend is **.NET 10.0 ASP.NET Core** (NOT Supabase Edge Functions + Supabase Auth). PostgreSQL accessed via **EF Core 10 + Npgsql**. Auth is custom JWT + OTP + Google/Apple OIDC validation. Authorization is ASP.NET Core policies (no PostgreSQL RLS). DOB encrypted at the .NET application layer (AES-256-GCM, not pgcrypto). Flutter client calls the .NET API via `dio` (the `supabase_flutter` SDK is removed). See `research.md §26–§33` + `contracts/dotnet-api-endpoints.md`.

## Module & Context Scope

*From [plan.md §Module & Bounded Context Mapping](./plan.md) — retrofitted
2026-07-11 per Constitution 1.8.0 Principle IV and the
`architecture/bounded-contexts/` canvases. Tasks MUST stay inside these
modules; a task touching an undeclared module/context requires a plan.md
mapping update first.*

| Bounded Context | Repo | Module | Sub-module / Layer |
|-----------------|------|--------|--------------------|
| Personal Health (Consumer plane, **Core**) | balsm_app | modules/profile, medications, emergency_card | domain / application / presentation |
| Personal Health (Consumer plane, **Core**) | Balsm-Core (backend) | src/Modules/EmergencyQr | Commands / Queries / Infrastructure (PHI-free token surface) |
| Identity & Access (Cross-plane, Generic) | Balsm-Core (backend) | src/Modules/{Auth, Account, Sessions, Deletion, Disclosure, Geofence} | Commands / Queries / Domain / Infrastructure |
| Identity & Access (Cross-plane, Generic) | balsm_app | modules/{auth, sessions, account, deletion, disclosure, geofence_block} | application/use_cases + presentation |
| — shared kernel / orchestration / tooling | both | Balsm.SharedKernel, Balsm.Infrastructure; packages/core, app, home, balsm_boundary_lint | value objects, http/db/backup infra, event bus |
| — published language (client ACL) | balsm_app | packages/balsm_api | typed API contracts + DTOs (pure Dart) |

**Primary (owning) context**: Personal Health

## Per-project split (for cheap-model dispatch)

This file is the canonical, phase-ordered master list. For agents focused on one repo, use the filtered per-project files — same task IDs, same `[P]` markers, fewer distractions:

- **Design** (27 tasks, Phase 2.5, BLOCKING GATE) — [`tasks/design.md`](./tasks/design.md) → `design/` (UI-SPEC, mocks, prototype, sign-off)
- **Flutter** (client) — [`tasks/flutter.md`](./tasks/flutter.md) → `balsm_app/` (mobile + web targets; 3 flavors; public routes via Flutter Web; deeplinks; BalsmKit widgets). Calls the .NET API via `dio`.
- **DotNet** (backend) — [`tasks/dotnet.md`](./tasks/dotnet.md) → `Balsm-Core/src/` + `Balsm-Core/tests/` (ASP.NET Core API, EF Core, modules). **Replaces the former `tasks/supabase.md`.**
- **Cross-cutting** — [`tasks/cross-cutting.md`](./tasks/cross-cutting.md) (walkthrough + AGENTS.md + runbook + compliance-risks register)

> Phase 2.5 design tasks (D001-D027) are ALSO labeled `[Flutter]` and re-emitted into `tasks/flutter.md`.

> Decision 2026-06-16: Flutter Web hosts public routes (`/emergency/{token}`, `/account/delete`, `/status`). Universal Links (iOS) + App Links (Android) deep-link to the installed app when present, fallback to Flutter Web when not.

Phase boundaries + `[P]` parallelism rules apply. A task's ID is globally unique — pull dependencies across files by ID.

**Repo layout** (two repos — `..` resolves to the `/Volumes/Dev/Balsm/` dev root):

```
Balsm-Core/                 # .NET backend (this repo)
  global.json               # pins .NET SDK 10.0.300
  Balsm.sln
  src/
    Balsm.API/              # ASP.NET Core host: controllers, middleware, Program.cs
    Balsm.Infrastructure/   # EF Core + Npgsql, JWT, OTP, OIDC, DOB encryption, rate limiting
    Balsm.SharedKernel/     # Result<T>, domain exceptions, value objects, BaseDbContext
    Modules/
      Auth/                 # AuthSession, OTP, lockout, OIDC token exchange
      Account/              # user_account, handle, country/language, DOB
      EmergencyQr/          # mint, resolve, revoke
      Sessions/             # active sessions, revoke
      Deletion/             # deletion FSM + purge job
      Disclosure/           # cloud mirror of disclosure_acceptance
      Geofence/             # denied_country_blocklist read-side
  tests/
    Balsm.API.IntegrationTests/   # WebApplicationFactory + Testcontainers PostgreSQL
    Modules/                       # per-module xUnit tests
  supabase/supabase/migrations/    # SQL migration files (EF migrations are authoritative; SQL kept as reference)

balsm_app/          # Flutter melos monorepo — mobile + web targets
  melos.yaml
  packages/
    core/                   # core layer (domain, event_bus, db, network[dio], localization, crash, secure_storage, notifications, kit, deeplink, backup, test_kit)
    balsm_boundary_lint/
    auth/ disclosure/ home/ profile/ emergency_card/ medications/ sessions/ account/ deletion/ geofence_block/
  app/                      # runnable shell — iOS, Android, Web
    ios/ android/ web/.well-known/
```

**Optimization target**: tasks are sized for execution by cheap / fast models (Haiku-class). Each task names a single file and a single change. The task ID order is the recommended execution order; `[P]` marks tasks safe to run in parallel.

## Format

`[ID] [P?] [Story?] [Flutter|DotNet] Description with file path`

## Project labels

- `[Flutter]` — `balsm_app/` (client; mobile + web)
- `[DotNet]` — `Balsm-Core/src/` + `Balsm-Core/tests/` (backend)
- No label — applies to multiple repos

## Path conventions

- Flutter: `../balsm_app/`
- DotNet: `../Balsm-Core/`

---

## Phase 1: Setup — Project Initialization

**Purpose**: Scaffold both repos with directory structure, dependency declarations, build tool config, Flutter Web target, and deeplink manifests. No business logic.

### 1.1 .NET solution init

- [ ] T001 [P] [DotNet] Create `../Balsm-Core/global.json` pinning `"sdk": { "version": "10.0.300", "rollForward": "latestPatch" }` (latest installed .NET SDK), and `../Balsm-Core/Balsm.sln` (empty solution). Add a `Directory.Build.props` at `../Balsm-Core/` setting `<TargetFramework>net10.0</TargetFramework>`, `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>`, `<LangVersion>latest</LangVersion>`.
- [ ] T002 [P] [DotNet] Create EF Core schema. Create `../Balsm-Core/src/Balsm.Infrastructure/Data/BalsmDbContext.cs` — a `DbContext` with `DbSet<>` for every cloud table from `data-model.md §1` (`UserAccount`, `UserIdentity`, `UserRefreshToken`, `ActiveSession`, `AccountLockout`, `UsernameReservation`, `EmergencyQrToken`, `DeletionLog`, `ReservedHandleBlocklist`, `DisclosureAcceptance`, `DeniedCountryBlocklist`, `UserAccountAuditLog`, `OtpAttempt`). One `IEntityTypeConfiguration<T>` per entity under `../Balsm-Core/src/Balsm.Infrastructure/Data/Configurations/` mapping the exact columns + constraints + indexes from `data-model.md`. Then run `dotnet ef migrations add InitialSchema` to generate `../Balsm-Core/src/Balsm.Infrastructure/Data/Migrations/`.
- [ ] T003 [P] [DotNet] Create `../Balsm-Core/src/Balsm.Infrastructure/Data/SeedData.cs` — `HasData` seed for `DeniedCountryBlocklist` rows (CU, IR, KP, SY with `source='ofac'`) and `ReservedHandleBlocklist` rows (admin, balsm, support, api, help, null, health with `added_by='system'`). Wire it into the entity configurations so it lands in the InitialSchema migration.
- [ ] T004 [P] [DotNet] Create authorization policies at `../Balsm-Core/src/Balsm.API/Authorization/` — `SelfOnlyPolicy.cs` (`userId == resource.UserId`), `ActiveAccountPolicy.cs` (`deletion_state == 'ACTIVE'` for mutating writes), `NotLockedOutPolicy.cs` (checked at OTP request/verify, returns 423), `AgeGatePolicy.cs` (placeholder; filled in T035bc). Register all four in `Program.cs` via `AddAuthorization(options => options.AddPolicy(...))`. Replaces Supabase RLS per research §28.

### 1.2 .NET host + module project scaffolding

- [ ] T005 [P] [DotNet] Create the project files and add them to `Balsm.sln`:
  - `../Balsm-Core/src/Balsm.API/Balsm.API.csproj` (`Microsoft.NET.Sdk.Web`)
  - `../Balsm-Core/src/Balsm.Infrastructure/Balsm.Infrastructure.csproj`
  - `../Balsm-Core/src/Balsm.SharedKernel/Balsm.SharedKernel.csproj`
  - `../Balsm-Core/src/Modules/{Auth,Account,EmergencyQr,Sessions,Deletion,Disclosure,Geofence}/Balsm.Modules.<Name>.csproj`
  Each module csproj references `Balsm.SharedKernel` + `Balsm.Infrastructure`. `Balsm.API` references all module projects. Add NuGet packages to the relevant csproj: `Microsoft.EntityFrameworkCore 10.0.8`, `Npgsql.EntityFrameworkCore.PostgreSQL 10.0.*`, `MediatR 14.1`, `FluentValidation 12.1`, `FluentValidation.AspNetCore`, `Serilog.AspNetCore 10.*`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `Google.Apis.Auth 1.68.*`, `Microsoft.IdentityModel.Tokens`. (EF Core tools 10.0.8 installed — match `dotnet ef`.)
- [ ] T006 [P] [DotNet] Create `../Balsm-Core/src/Balsm.API/Program.cs` — minimal host: `AddDbContext<BalsmDbContext>(UseNpgsql(connStr))`, `AddControllers()`, MediatR registration scanning all module assemblies, FluentValidation auto-validation, Serilog (`UseSerilog`, structured, no PHI), JWT bearer auth (`AddAuthentication().AddJwtBearer`), CORS policy `balsm-public` (allow `*` for `/emergency/*` + `/status`, restricted origins for the rest), `AddRateLimiter()` (policies filled in T035az), `app.UseAuthentication()`, `app.UseAuthorization()`, `app.MapControllers()`.
- [ ] T007 [P] [DotNet] Create `../Balsm-Core/src/Balsm.API/Middleware/CorrelationIdMiddleware.cs` — reads/creates `X-Correlation-Id`, pushes to Serilog `LogContext`, echoes on the response. Register first in the pipeline in `Program.cs`.
- [ ] T008 [P] [DotNet] Create the API response envelope at `../Balsm-Core/src/Balsm.SharedKernel/Api/ApiResponse.cs` — `ApiResponse<T> { T? Data; ApiError? Error; }` + `ApiError { string Code; string Message; string CorrelationId; }` + static helpers `Ok(data)` and `Fail(code, message, correlationId)`. Create `../Balsm-Core/src/Balsm.SharedKernel/Result/Result.cs` — `Result<T>` with `IsSuccess`, `Value`, `Failure` (maps to `AppFailure`) for expected-failure handling per Constitution §Error Handling.

### 1.3 Flutter repo init

- [ ] T009 [P] [Flutter] Create `../balsm_app/melos.yaml` — workspace config with packages `['packages/*', 'app']`, scripts for `gen` (parallel build_runner), `analyze` (parallel dart analyze), `test` (parallel flutter test), `e2e` (integration_test)
- [ ] T010 [P] [Flutter] Create `../balsm_app/pubspec.yaml` — workspace root pubspec with `name: balsm_app`, `publish_to: none`, dev_dependencies `melos: ^7.0.0`
- [ ] T011 [P] [Flutter] Create `../balsm_app/.fvmrc` — pinning Flutter `3.41.9` (latest installed stable; Dart 3.11.5)
- [ ] T012 [P] [Flutter] Create `../balsm_app/packages/core/pubspec.yaml` — `name: core`, dependencies: `flutter`, `drift: ^2.29`, `sqlite3_flutter_libs`, `sqlcipher_flutter_libs`, `dio: ^5.8`, `sentry_flutter: ^9.0`, `flutter_riverpod: ^2.6`, `flutter_local_notifications: ^18.0`, `flutter_secure_storage: ^9.2`, `google_sign_in: ^6.2`, `sign_in_with_apple: ^6.1`, `freezed_annotation`, `json_annotation`, `intl: ^0.20`. **No `supabase_flutter`** (removed — client talks to the .NET API via `dio` per research §32).
- [ ] T013 [P] [Flutter] Create `../balsm_app/packages/core/lib/core.dart` — empty public barrel file with comment `// Re-export all public APIs from src/subdirs`
- [ ] T014 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/domain/` — scaffold directory with empty `.gitkeep` files for `aggregates/`, `value_objects/`, `events/`
- [ ] T015 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/event_bus/` — scaffold directory with `.gitkeep`
- [ ] T016 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/db/` — scaffold directory with `.gitkeep`
- [ ] T017 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/network/` — scaffold directory with `.gitkeep`
- [ ] T018 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/localization/` — scaffold directory with `.gitkeep`
- [ ] T019 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/crash/` — scaffold directory with `.gitkeep`
- [ ] T020 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/secure_storage/` — scaffold directory with `.gitkeep`
- [ ] T021 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/notifications/` — scaffold directory with `.gitkeep`
- [ ] T022 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/kit/` — scaffold directory with `.gitkeep`
- [ ] T022a [P] [Flutter] Create `../balsm_app/packages/core/lib/src/deeplink/` — scaffold directory with `.gitkeep` (will hold `DeeplinkRouter` in T133)
- [ ] T023 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/test_kit/` — scaffold directory with `.gitkeep`
- [ ] T024 [P] [Flutter] Create `../balsm_app/packages/balsm_boundary_lint/pubspec.yaml` — `name: balsm_boundary_lint`, dependencies: `custom_lint_builder`, `analyzer`, `source_span`
- [ ] T025 [P] [Flutter] For each of the 10 module packages, create `../balsm_app/packages/{auth,disclosure,home,profile,emergency_card,medications,sessions,account,deletion,geofence_block}/pubspec.yaml` — `name: <name>`, dependencies: `core`, `flutter_riverpod`, `go_router`, `intl`, dev_dependencies: `balsm_boundary_lint`, `mocktail`, `golden_toolkit`
- [ ] T026 [P] [Flutter] For each of the 10 module packages, create the DDD layer directory structure:
  - `lib/<name>.dart` (empty barrel)
  - `lib/src/domain/aggregates/`, `lib/src/domain/entities/`, `lib/src/domain/value_objects/`, `lib/src/domain/events/`, `lib/src/domain/repositories/`
  - `lib/src/application/use_cases/`, `lib/src/application/dtos/`
  - `lib/src/infrastructure/drift/`, `lib/src/infrastructure/api/` (was `supabase/` — now holds .NET API adapters), `lib/src/infrastructure/adapters/`
  - `lib/src/presentation/screens/`, `lib/src/presentation/widgets/`, `lib/src/presentation/providers/`, `lib/src/presentation/routes.dart`
- [ ] T027 [P] [Flutter] Create `../balsm_app/app/pubspec.yaml` — `name: app`, dependencies: `core`, `auth`, `disclosure`, `home`, `profile`, `emergency_card`, `medications`, `sessions`, `account`, `deletion`, `geofence_block`, `flutter_riverpod`, `go_router`
- [ ] T028 [P] [Flutter] Create `../balsm_app/app/lib/main.dart` — calls `bootstrap()` then `runApp(BalsmApp())`
- [ ] T029 [P] [Flutter] Create `../balsm_app/app/lib/app.dart` — `BalsmApp` StatelessWidget wrapping `ProviderScope` + `MaterialApp.router` with `go_router`
- [ ] T030 [P] [Flutter] Create `../balsm_app/app/lib/bootstrap.dart` — registers all repository implementations, drift database, and providers

### 1.4 Flutter Web + deeplinking setup

- [ ] T031 [P] [Flutter] Create `../balsm_app/app/web/index.html` — minimal HTML shell, `<base href="/">`, meta viewport, Flutter bootstrap script tag, preload + favicon for PWA install
- [ ] T032 [P] [Flutter] Create `../balsm_app/app/web/manifest.json` — PWA manifest with `name: Balsm`, `display: standalone`, theme color, icons (192/512), localized `lang` switch via `<html lang>`
- [ ] T033 [P] [Flutter] Update `../balsm_app/app/pubspec.yaml` to enable web target — add `app_links: ^6.3` (universal/app links) and `url_strategy: ^0.3` (path URL strategy, no `#`); confirm `flutter: web: true` in the runner config
- [ ] T034 [P] [Flutter] Create `../balsm_app/app/web/.well-known/apple-app-site-association` — JSON binding bundle ID `health.balsm.app` to paths `/emergency/*` and `/account/delete`, served as `application/json` with no extension (iOS Universal Links per AASA spec)
- [ ] T035 [P] [Flutter] Create `../balsm_app/app/web/.well-known/assetlinks.json` — Android Digital Asset Links JSON: `relation: ["delegate_permission/common.handle_all_urls"]`, `target.namespace: android_app`, `package_name: health.balsm.app`, `sha256_cert_fingerprints: [...]` (filled by CI from signing config)
- [ ] T035a [P] [Flutter] Create `../balsm_app/app/ios/Runner/Runner.entitlements` — add `com.apple.developer.associated-domains` with `applinks:{BASE_URL}` (build-time substituted per FR-216)
- [ ] T035b [P] [Flutter] Update `../balsm_app/app/android/app/src/main/AndroidManifest.xml` — add `<intent-filter android:autoVerify="true">` for `https://{BASE_URL}/emergency/*` and `https://{BASE_URL}/account/delete`, `DEFAULT` + `BROWSABLE` categories, `VIEW` action

### 1.5 Build flavors (dev / staging / prod) + multi-server selector

**Purpose**: 3 build flavors with isolated bundle IDs, icons, **.NET API base URLs**, Sentry DSNs. Dev flavor exposes a runtime server selector to switch between local / staging / prod API backends during development without rebuilding. Staging + prod flavors lock to their respective backends.

- [ ] T035c [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/flavor.dart` — `enum Flavor { dev, staging, prod }`; `class FlavorConfig { final Flavor flavor; final String apiBaseUrl; final String? sentryDsn; final String appNameSuffix; final bool serverSelectorEnabled; }`; `FlavorConfig.current` getter reading `--dart-define` keys `FLAVOR`, `API_BASE_URL`, `SENTRY_DSN`. (Renamed from `supabaseUrl`/`supabaseAnonKey` → single `apiBaseUrl` — the .NET API needs no anon key.)
- [ ] T035d [P] [Flutter] Create `../balsm_app/app/lib/main_dev.dart` — entry point: `FlavorConfig.init(Flavor.dev)`, calls `bootstrap()` then `runApp(BalsmApp())`; dev flavor sets `serverSelectorEnabled = true`
- [ ] T035e [P] [Flutter] Create `../balsm_app/app/lib/main_staging.dart` — entry point: `FlavorConfig.init(Flavor.staging)`, locks `serverSelectorEnabled = false`
- [ ] T035f [P] [Flutter] Create `../balsm_app/app/lib/main_prod.dart` — entry point: `FlavorConfig.init(Flavor.prod)`, locks `serverSelectorEnabled = false`
- [ ] T035g [P] [Flutter] Update `../balsm_app/app/lib/main.dart` to delegate to `main_dev.dart` (default for `flutter run` without `-t`); add comment: "Use `flutter run -t lib/main_<flavor>.dart --flavor <flavor>`"
- [ ] T035h [P] [Flutter] Update `../balsm_app/app/android/app/build.gradle` — add `productFlavors { dev { applicationIdSuffix ".dev"; manifestPlaceholders = [appNameSuffix: " Dev"] }; staging { applicationIdSuffix ".staging"; manifestPlaceholders = [appNameSuffix: " Staging"] }; prod { applicationIdSuffix ""; manifestPlaceholders = [appNameSuffix: ""] } }`; `flavorDimensions "default"`
- [ ] T035i [P] [Flutter] Create `../balsm_app/app/android/app/src/dev/`, `src/staging/`, `src/prod/` resource dirs each with `res/mipmap-*/ic_launcher.png` + `res/values/strings.xml` (`app_name="Balsm Dev/Staging/Balsm"`); dev icon has red corner badge, staging amber, prod clean
- [ ] T035j [P] [Flutter] Create iOS xcconfig per flavor at `../balsm_app/app/ios/Flutter/`: `Dev.xcconfig`, `Staging.xcconfig`, `Prod.xcconfig` — each sets `BUNDLE_ID_SUFFIX=.dev/.staging/(empty)`, `APP_NAME_SUFFIX= Dev/ Staging/(empty)`, `ASSETS_PATH=...`
- [ ] T035k [P] [Flutter] Update `../balsm_app/app/ios/Runner.xcodeproj/project.pbxproj` to add 3 schemes (`Runner-Dev`, `Runner-Staging`, `Runner-Prod`) each pointing to its xcconfig + entry-point Dart file via `FLUTTER_TARGET`
- [ ] T035l [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/server_preset.dart` — `class ServerPreset { final String label; final String apiBaseUrl; const ServerPreset({...}); }`; const list `kServerPresets = [ServerPreset(label: "Local", apiBaseUrl: "http://localhost:5000"), ServerPreset(label: "Staging", apiBaseUrl: "https://staging-api.balsm.health"), ServerPreset(label: "Prod", apiBaseUrl: "https://api.balsm.health")]`
- [ ] T035m [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/active_server.dart` — `class ActiveServerStore` wraps `SecureStorage`; methods `read() async → ServerPreset?`, `write(ServerPreset preset) async`, `clear() async`; key `balsm.active_server_preset`; default = `FlavorConfig.current.apiBaseUrl` if no override
- [ ] T035n [P] [Flutter] Update `../balsm_app/packages/core/lib/src/network/balsm_api_client.dart` (T050) to read base URL from `ActiveServerStore.read()` at init; expose `Future<void> reconfigure(ServerPreset preset)` that calls `ActiveServerStore.write()` then re-initializes the `Dio` base URL; broadcast `ServerReconfigured(preset)` AppEvent on the bus
- [ ] T035o [P] [Flutter] Create dev-only screen at `../balsm_app/packages/core/lib/src/dev/server_selector_screen.dart` — `if (!FlavorConfig.current.serverSelectorEnabled) Navigator.pop()` guard; lists `kServerPresets` + custom URL form; on select calls `BalsmApiClient.reconfigure()`; shows current preset + warning banner "Changing server signs you out"; persisted via `ActiveServerStore`
- [ ] T035p [P] [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to conditionally export `dev/server_selector_screen.dart` only when `FlavorConfig.current.flavor == Flavor.dev`
- [ ] T035q [P] [Flutter] Update Sentry init at `../balsm_app/packages/core/lib/src/crash/sentry_init.dart` (T057) to read DSN from `FlavorConfig.current.sentryDsn`; if null (dev) → no `SentryFlutter.init`, log to stdout; release name = `balsm@<version>+<build>-<flavor>`; environment = `flavor.name`
- [ ] T035r [P] [Flutter] Create `../balsm_app/.vscode/launch.json` — 3 configs (Dev, Staging, Prod) each with `args: ["--flavor", "<flavor>", "-t", "lib/main_<flavor>.dart", "--dart-define-from-file=env/<flavor>.json"]`
- [ ] T035s [P] [Flutter] Create env files at `../balsm_app/app/env/dev.json`, `env/staging.json`, `env/prod.json` — `{ "FLAVOR": "dev", "API_BASE_URL": "http://localhost:5000", "SENTRY_DSN": "" }`; `env/*.json` gitignored except `env/example.json`
- [ ] T035t [P] [Flutter] Update `../balsm_app/melos.yaml` — add scripts `run:dev/staging/prod` and `build:android/ios/web:<flavor>` using `-t lib/main_<flavor>.dart --flavor <flavor> --dart-define-from-file=env/<flavor>.json`

### 1.6 Patient App prototype port — BalsmKit Flutter widgets

**Purpose**: Port proven design patterns from `Balsm-Core/brand/design-system/balsm_app/` (React prototype) into Flutter widgets in `core/lib/src/kit/`. Design-system implementation, NOT visual design work (gated by Phase 2.5 sign-off).

**Spec-divergence notes**:
- Prototype phone-OTP → adapt to email OTP per FR-001
- Prototype bottom-nav `[Home, Trends, FAB+, Meds, Profile]` → P001 `[Home, Card, Meds, Sessions, Settings]`
- Prototype daily check-in (BP/glucose/mood/pain) → OUT OF P001 SCOPE
- Prototype DOB DD/MM/YYYY → matches Q1 age-gate (FR-301a/b)

- [ ] T035u [P] [Flutter] Create `BalsmAppBar` at `core/lib/src/kit/widgets/balsm_app_bar.dart` — ports prototype `.appbar` (56pt, avatar slot, grow title, action slot). Variants: with-avatar, title-only, with-back-button
- [ ] T035v [P] [Flutter] Create `BalsmRoundButton` at `core/lib/src/kit/widgets/balsm_round_button.dart` — ports `.round-btn` (40pt circular, hover ink-50, press scale 0.97)
- [ ] T035w [P] [Flutter] Create `BalsmCard` at `core/lib/src/kit/widgets/balsm_card.dart` — ports `.card`. Variants: standard, accent, danger, cream
- [ ] T035x [P] [Flutter] Create `BalsmHeroCard` at `core/lib/src/kit/widgets/balsm_hero_card.dart` — ports `.hero-card`. Variants: prompt (CTA), done (checkmark + chevron)
- [ ] T035y [P] [Flutter] Create `BalsmPill` at `core/lib/src/kit/widgets/balsm_pill.dart` — variants success/warn/danger/neutral/info, optional leading dot
- [ ] T035z [P] [Flutter] Create `BalsmListRow` at `core/lib/src/kit/widgets/balsm_list_row.dart` — icon + grow text + chevron; RTL flips chevron
- [ ] T035aa [P] [Flutter] Create `BalsmListCard` at `core/lib/src/kit/widgets/balsm_list_card.dart` — stacked list-rows with dividers
- [ ] T035ab [P] [Flutter] Create `BalsmSegmented` at `core/lib/src/kit/widgets/balsm_segmented.dart` — generic over T; used for language/gender/range toggles
- [ ] T035ac [P] [Flutter] Create `BalsmStepDots` at `core/lib/src/kit/widgets/balsm_step_dots.dart` — 3-dot step indicator for auth flow
- [ ] T035ad [P] [Flutter] Create `BalsmOtpRow` at `core/lib/src/kit/widgets/balsm_otp_row.dart` — 6 boxes, mono, auto-advance, paste-fill, auto-submit on 6th digit
- [ ] T035ae [P] [Flutter] Create `BalsmField` at `core/lib/src/kit/widgets/balsm_field.dart` — label + input + error state. Variants: text/email/numeric/date(DD/MM/YYYY)/dropdown
- [ ] T035af [P] [Flutter] Create `BalsmMetricGrid` at `core/lib/src/kit/widgets/balsm_metric_grid.dart` — 2×2 metric tiles. P001 use: home today-summary (next dose, taken, missed)
- [ ] T035ag [P] [Flutter] Create `BalsmMedRow` at `core/lib/src/kit/widgets/balsm_med_row.dart` — icon + name + dose + status pill/action. Tone enum: info/controlled(violet FR-020)/success
- [ ] T035ah [P] [Flutter] Create `BalsmAvatar` at `core/lib/src/kit/widgets/balsm_avatar.dart` — circle with initials (no photo avatars per 2026-06-14)
- [ ] T035ai [P] [Flutter] Create `BalsmTrustStrip` at `core/lib/src/kit/widgets/balsm_trust_strip.dart` — 3 trust icons: shield-check (on-device), user-check (private), wifi-off (offline-ready)
- [ ] T035aj [P] [Flutter] Create `BalsmWelcomeBackground` at `core/lib/src/kit/widgets/balsm_welcome_background.dart` — watercolor petal; copy `Balsm-Core/brand/balsm-background.png` → `core/assets/brand/`
- [ ] T035ak [P] [Flutter] Create `BalsmBottomNav` at `core/lib/src/kit/widgets/balsm_bottom_nav.dart` — P001 5-slot `[Home, Card, Meds, Sessions, Settings]`; active state icon + primary color + 3pt indicator
- [ ] T035al [P] [Flutter] Create `BalsmIcon` at `core/lib/src/kit/widgets/balsm_icon.dart` — wraps `lucide_icons` (outline 1.75pt default). Add `lucide_icons ^0.x` to core/pubspec
- [ ] T035am [P] [Flutter] Create `BalsmMoodFace` at `core/lib/src/kit/widgets/balsm_mood_face.dart` — SVG arcs. Not used in P001 (comment "Not wired in P001")
- [ ] T035an [P] [Flutter] Create `BalsmLogoMark` at `core/lib/src/kit/widgets/balsm_logo_mark.dart` — Balsm mark via `flutter_svg ^2.0`. Variants small/medium/large/spinner. Add `flutter_svg ^2.0`
- [ ] T035ao [Flutter] Update `core/lib/core.dart` to re-export all BalsmKit widgets (T035u..T035an) under barrel `balsm_kit.dart`
- [ ] T035ap [P] [Flutter] Create golden test per BalsmKit widget at `core/test/kit/<widget>_golden_test.dart` — RTL+LTR × light+dark × en+ar-EG = 8 goldens each (uses `golden_toolkit` from T067)

**Checkpoint**: BalsmKit ready. Phase 3+ tasks compose these widgets.

### 1.7 Clarification absorption — Q1-Q5 (Session 2026-06-17)

**Purpose**: Implementation hooks for the 5 clarifications. Each task cites the affected FR/SC + parent task.

- [ ] T035aq [P] [Flutter] Create `core/lib/src/config/recaptcha_adapter.dart` — wraps `flutter_recaptcha_enterprise`. `Future<String?> getToken(String action)`. Lazy-loaded. Per Q2 FR-045c.
- [ ] T035ar [P] [Flutter] Add `permission_handler ^11.x` to `core/pubspec.yaml`. Per Q3 FR-017a.
- [ ] T035as [P] [Flutter] Create `core/lib/src/notifications/permission_state.dart` — `enum NotificationPermissionState { granted, denied, provisional, notRequested }`; Riverpod `notificationPermissionStateProvider` reads `Permission.notification.status` on foreground. Per Q3 FR-017a.
- [ ] T035at [P] [Flutter] Create `core/lib/src/notifications/permission_change_event.dart` — `class NotificationPermissionChanged extends AppEvent` with `previousState` + `newState`. Per Q3 FR-017a.
- [ ] T035au [P] [Flutter] Create `core/lib/src/backup/backup_adapter.dart` — abstract `BackupAdapter { Future<void> upload(Uint8List blob, String key); Future<Uint8List?> download(String key); Future<bool> hasBackup(String key); Future<void> delete(String key); }`. `delete` is called on account-deletion confirm / post-grace sign-in denial so the user-owned cloud blob does not outlive the account (RR-004). Per Q1 FR-009a / Q4 FR-009c.
- [ ] T035av [P] [Flutter] Create `core/lib/src/backup/icloud_backup_adapter.dart` (iOS, `cloud_kit`) + `core/lib/src/backup/drive_backup_adapter.dart` (Android, `googleapis ^13` + `googleapis_auth ^1.6`). iOS path `iCloud.health.balsm.app/Documents/balsm/backup.blob.aes`; Android AppDataFolder `balsm-backup.blob.aes`. Per Q1 FR-009a.
- [ ] T035aw [P] [Flutter] Create `core/lib/src/backup/backup_key_derivation.dart` — the blob is sealed with a **random 256-bit DEK** (per-backup, `Random.secure`); the DEK is wrapped by `Argon2id(userBackupRecoveryCode)` (memoryCost 65536, iterations 3, parallelism 1) and the wrapped DEK is stored alongside the ciphertext in the user's cloud. Restore = recovery code → unwrap DEK → decrypt. The backup recovery code is a ≥80-bit value shown to the user once (T035bd/recovery-code surface). **Never derive key material from the OTP** (a 6-digit OTP is ~20 bits — Argon2id cannot rescue that keyspace). Per Q1 FR-009a.
- [ ] T035ax [P] [Flutter] Create `core/lib/src/backup/backup_debouncer.dart` — Riverpod keepAlive listening to mutation events; 1-hour debounce; force-upload on app background, sign-out, `DoseTaken`/`MedicationAdded`/`DeletionRequested`. Per Q4 FR-009c.
- [ ] T035ay [P] [Flutter] Create `core/lib/src/backup/concurrent_conflict_resolver.dart` — `mergeAggregate({existing, incoming})` LWW on `updated_at`; DoseEvent union with dup-detect on `(medication_id, scheduled_at, outcome)` within ±5min. Per Q4 FR-009d/e.
- [ ] T035az [P] [DotNet] Configure OTP rate limiting. Create `../Balsm-Core/src/Balsm.Infrastructure/RateLimit/OtpRateLimitPolicies.cs` — three `Microsoft.AspNetCore.RateLimiting` policies: `OtpPerEmail` (sliding window 3/10min, keyed on SHA-256(email)), `OtpPerIp` (sliding 10/60min, keyed on `X-Forwarded-For`), `OtpGlobal` (fixed window 10000/60min; on breach pause + fire alert webhook). Register in `Program.cs`. Per Q2 FR-045a/b. Replaces `_shared/throttle.ts`.
- [ ] T035ba [P] [DotNet] In `../Balsm-Core/src/Modules/Auth/Commands/RequestOtpCommand.cs` handler, apply the three rate-limit policies before minting an OTP; read optional `CaptchaToken` from the request — if per-email or per-IP rate was exceeded within the previous 24h (tracked in `OtpAttempt`), require a valid token verified against the Google reCAPTCHA Enterprise REST API (call via `IHttpClientFactory`). Per Q2 FR-045a/b/c.
- [ ] T035bb [P] [DotNet] In `../Balsm-Core/src/Modules/Auth/Commands/VerifyOtpCommand.cs` handler, on first successful verify of a new account read the `dob` field from the signup payload, compute age, and if <18 return `403 ageGateRejected` with empty body (capture no PHI). Otherwise call `DobEncryptionService.Encrypt` (T035bw/§30), store `date_of_birth_ciphertext`, and persist the derived non-PHI `dob_year` column. Per Q1 FR-301a. NOTE: the OIDC signup paths (T073b) enforce the same DOB collection + age gate — the age gate is not OTP-only.
- [ ] T035bc [P] [DotNet] Fill `../Balsm-Core/src/Balsm.API/Authorization/AgeGatePolicy.cs` — an `IAuthorizationHandler` that calls `DobEncryptionService.Decrypt`, computes age, succeeds only when ≥18, and **fails CLOSED** (denies) when the DOB is missing or fails to decrypt. Apply `[Authorize(Policy="AgeGate")]` to `EmergencyQrController.Mint` and the medication-add endpoint. **Do NOT apply it to `DeletionController.Intake`** — account erasure is a data-subject right (PDPL) and must not be blocked by the age gate or a missing DOB (deletion intake keeps re-auth only, T146). Per Q1 FR-301b.
- [ ] T035bd [P] [DotNet] Create `../Balsm-Core/src/Balsm.API/Controllers/AuthController.cs` action `RecoveryClaim` (`POST /auth/recovery/claim`, no auth) backed by `../Balsm-Core/src/Modules/Auth/Commands/RecoveryClaimCommand.cs`. This is an unauthenticated account-takeover surface, so it MUST: validate a support-issued recovery token that is ≥128-bit random, signed with a signing key/`typ` DISTINCT from the access-token key, with TTL ≤72h; enforce **single-use** by persisting the token `jti` and burning it on first success (replay → `401 TokenReplayed`); apply per-IP + global rate limits (extend `OtpRateLimitPolicies`); write an audit row for every attempt (success + failure) and send a security notification to the quarantined identity. On success (i) sets the original identity's `quarantine_until = now()+30d`, (ii) re-keys `date_of_birth_ciphertext` to the new email's key derivation via `DobEncryptionService.RotateKey`, (iii) issues a new JWT pair. Per Q5 FR-046c/d/e. Replaces `account-recover-claim` Edge Function.
- [ ] T035be [P] [Flutter] [US1] Create `auth/lib/src/presentation/screens/auth_under_eighteen_screen.dart` — under-18 soft-block screen, localized title + body + "Notify me" CTA + back-to-welcome. Per Q1 FR-301a.
- [ ] T035bf [P] [Flutter] [US1] Create `auth/lib/src/application/use_cases/age_gate_use_case.dart` — accepts `DateOfBirth` VO; validates ≥18 at signup; on age-gated actions surfaces the .NET `403 ageGateRejected`. Throws `UnderageException`. Per Q1 FR-301a/b.
- [ ] T035bg [P] [Flutter] [US5] Create `auth/lib/src/presentation/screens/auth_recovery_explainer_screen.dart` — entered from lockout (T166) / 404; explains manual recovery (mailto:support@balsm.health, 2-of-4 facts). Per Q5 FR-046c.
- [ ] T035bh [P] [Flutter] [US5] Create `auth/lib/src/presentation/screens/auth_recovery_claim_screen.dart` — entered via deep link from support email; reads `?token=`; validates via `POST /auth/recovery/claim`; on success → home, on failure → localized error + mailto. Per Q5 FR-046d.
- [ ] T035bi [P] [Flutter] [US5] Create `auth/lib/src/application/use_cases/recovery_claim_use_case.dart` — orchestrates recovery claim, surfaces compliance copy ("will not restore on-device data per FR-046e"). Per Q5 FR-046d/e.
- [ ] T035bj [P] [Flutter] [US3] Update T138 (`medication_scheduler.dart`) — read `notificationPermissionStateProvider` before scheduling; when denied, skip and rely on `meds.today`; on `denied → granted`, reschedule next 30 days. Per Q3 FR-017c.
- [ ] T035bk [P] [Flutter] [US3] Update T139 (`missed_dose_detector.dart`) — detect more aggressively when permission denied (every foreground). Per Q3 FR-017a.
- [ ] T035bl [P] [Flutter] [US3] Create `medications/lib/src/presentation/widgets/permission_request_sheet.dart` — non-blocking sheet at most once / 14-day window when permission denied AND ≥1 medication; track `notification_permission_resheet_last_shown_at` in secure storage. Per Q3 FR-017b.
- [ ] T035bm [P] [Flutter] [US3] Update T145 (notification-tap handler in `app.dart`) — deep-link payload routes to `meds.today?highlightDoseId=<id>`. Per Q2 FR-018a.
- [ ] T035bn [P] [Flutter] [US3] Create `medications/lib/src/presentation/widgets/dedup_banner.dart` — non-blocking banner on `meds.today` when restore-time dedup detected. Per Q4 FR-009e.
- [ ] T035bo [P] [DotNet] [US1] Create 4 versioned localized OTP email templates at `../Balsm-Core/src/Balsm.Infrastructure/Auth/Templates/auth-otp/{en,ar-EG,ar-SA,ar-AE}.html` — subject + body + sender in user's preferred language; variables `{{ otp_code }}`, `{{ expires_in_minutes }}`, `{{ user_handle_or_email_local }}`, `{{ support_email }}`. Loaded + sent by `OtpService` via Resend. Per Q5 FR-001a.
- [ ] T035bp [Flutter] Update `../balsm_app/packages/auth/lib/auth.dart` public barrel to re-export new use cases + screens (T035be..T035bi)
- [ ] T035bq [Flutter] Update `../balsm_app/packages/medications/lib/medications.dart` public barrel to re-export `permission_request_sheet.dart` + `dedup_banner.dart`
- [ ] T035br [DotNet] Create runbook at `../Balsm-Core/docs/runbooks/account-recovery.md` — support-staff guide: verification floor (2-of-4), token-issuance, 30-day cooling-off template, audit-log + PDPL data-minimization. Per Q5 (research §24).
- [ ] T035bs [P] Create `../Balsm-Core/docs/compliance-risks.md` with RR-001 (Q3 UAE DOB residency gap) + RR-002 (Q5 manual recovery) + RR-003 (FR-049 residency routing descoped in P001 — single EU region, UAE Federal Law 2/2019 exposure) + RR-004 (residual user-cloud backup blobs may outlive deleted accounts until client-side `BackupAdapter.delete` runs). Per plan.md.
- [ ] T035bs2 [P] Add a secrets-management task: all backend secrets — JWT signing key, DOB master key, `RESEND_API_KEY`, reCAPTCHA secret, Apple ES256 `.p8` — load from a managed secret store / platform secret facility, NEVER a committed env/compose file; document rotation. (Closes the "plaintext env-var secrets" gap across T035bt/T035bu/T035bw/T147.)
- [ ] T035bs3 [P] [Flutter] Add a deletion-residual client task: on deletion confirm (and on post-grace sign-in denial), wipe `AppDatabase` + secure storage and call `BackupAdapter.delete(key)` (T035au) so no on-device PHI or user-cloud blob outlives the account. (RR-004.)

---

## Phase 2: Foundational — Core Shared Kernel (Blocking Prerequisites)

**Purpose**: Cross-cutting infrastructure every user story depends on. **No US task may start until this phase completes.** (Flutter `core` kernel + .NET infrastructure services.)

### 2.0 .NET infrastructure services (blocking for all backend stories)

- [ ] T035bt [P] [DotNet] Create `../Balsm-Core/src/Balsm.Infrastructure/Auth/JwtService.cs` — `IssueAccessToken(userId, sessionId, claims)` (15-min; carries a `session_id` claim AND a `kid` header; the validator keeps a dual-key current+previous window for rotation and rejects a token whose `ActiveSession` is revoked, so revoke takes effect ≤2s — SC-013), `IssueRefreshToken(userId, deviceId)` (stores SHA-256 hash of a ≥256-bit random value in `UserRefreshToken`, 30-day), `ValidateAccessToken`, `RotateRefreshToken` (single-use: revoke the presented token atomically; reuse of an already-rotated token → revoke the entire token family for that device), `Revoke(refreshTokenId)`. Signing keys load from a managed secret store (not a raw `JWT_SIGNING_KEY` env var). Per research §26.
- [ ] T035bu [P] [DotNet] Create `../Balsm-Core/src/Balsm.Infrastructure/Auth/OtpService.cs` — `GenerateAndSend(email, preferredLanguage)` (6-digit code, HMAC-SHA256 hash + 10-min expiry stored in `OtpAttempt`, sends via Resend using the T035bo template), `Verify(email, code)` (constant-time compare, single-use, expiry check). The HMAC key is a **pepper loaded from the secret store, distinct from the JWT signing key** (an unkeyed hash of a 6-digit code is trivially invertible). Resend API key + pepper load from the secret store, not committed env files. Per research §26 + Q5.
- [ ] T035bv [P] [DotNet] Create `../Balsm-Core/src/Balsm.Infrastructure/Auth/GoogleOidcValidator.cs` (`Google.Apis.Auth.GoogleJsonWebSignature.ValidateAsync`, with `Audience` pinned to our Google client IDs) + `../Balsm-Core/src/Balsm.Infrastructure/Auth/AppleOidcValidator.cs` (fetch + cache Apple JWKS from `appleid.apple.com/auth/keys`, validate `iss`/`aud`/`exp`/`nonce`, `aud` pinned to our Apple client ID, accept `hide-my-email` relay). Both return `(providerSubject, emailNormalized, emailVerified)`; callers (T073b) MUST treat `emailVerified=false` as a hard 403 and never link by email. Per research §26.
- [ ] T035bw [P] [DotNet] Create `../Balsm-Core/src/Balsm.Infrastructure/Encryption/DobEncryptionService.cs` — AES-256-GCM via `System.Security.Cryptography.AesGcm`; `Encrypt(date, userId)`, `Decrypt(ciphertext, userId)`, `RotateKey(userId)`. **Nonce**: a fresh random 96-bit nonce per encryption, stored alongside the ciphertext — NOT derived from a counter (a repeated nonce under one key lets an attacker recover the GCM auth key). **Key hierarchy**: master key from a managed secret store (not a raw `DOB_ENCRYPTION_KEY` env var), per-user subkey = `HKDF(master, userId)`; write a per-row `dob_key_version` so annual rotation is incremental (rotate-on-read re-seals with the current version). Every `Decrypt` inserts a `UserAccountAuditLog` row (actor, IP, correlationId, ts) in the same transaction. Per research §30 + FR-047/FR-048.
- [ ] T035bx [P] [DotNet] Create `../Balsm-Core/src/Balsm.API/Middleware/PhiLeakGuardMiddleware.cs` — buffers outbound JSON, blocks any field name not on `contracts/crash-allowlist.json` from Serilog request/response logging (scrubs to `[REDACTED]`). Register in `Program.cs`. Mirrors the Flutter Dio interceptor (T051). Per SC-006/SC-016.
- [ ] T035by [DotNet] Create `../Balsm-Core/tests/Balsm.API.IntegrationTests/Balsm.API.IntegrationTests.csproj` — xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`) + `Testcontainers.PostgreSql`. Add a `TestWebAppFactory` fixture spinning up a throwaway PostgreSQL container and applying EF migrations. Add to `Balsm.sln`. Per Constitution §VI.

### 2.1 Core: domain value objects

- [ ] T036 [P] [Flutter] Create `UuidV7` at `core/lib/src/domain/value_objects/uuid_v7.dart` — 16-byte RFC 9562 UUID v7 with `.timestamp`, `UuidV7.generate()`, JSON serialization
- [ ] T037 [P] [Flutter] Create `CountryCode` at `core/lib/src/domain/value_objects/country_code.dart` — ISO 3166-1 alpha-2 with `.isDenied`, `.defaultTimezone`, locale mapping
- [ ] T038 [P] [Flutter] Create `Bcp47Tag` at `core/lib/src/domain/value_objects/bcp47_tag.dart` — `.isFirstClass`, `.fallback` to `en`, `.isRtl`
- [ ] T039 [P] [Flutter] Create `Iso8601Timestamp` at `core/lib/src/domain/value_objects/iso8601_timestamp.dart` — UTC ms wrapper
- [ ] T040 [P] [Flutter] Create `AppResult<T>` at `core/lib/src/domain/app_result.dart` — `.isSuccess`, `.value`, `.error`, factories
- [ ] T041 [P] [Flutter] Create `AppFailure` sealed class at `core/lib/src/domain/app_failure.dart` — Validation/NotFound/Conflict/Unauthorized/Network/Storage
- [ ] T042 [P] [Flutter] Create `AppEvent` base at `core/lib/src/domain/events/app_event.dart` — abstract `eventName`, `toJson()`
- [ ] T043 [P] [Flutter] Create `Money` at `core/lib/src/domain/value_objects/money.dart` — EGP / SAR / AED / default-class
- [ ] T044 [Flutter] Update `core/lib/core.dart` to re-export the 8 value objects + AppResult + AppFailure + AppEvent

### 2.2 Core: event bus

- [ ] T045 [P] [Flutter] Create `EventBus` at `core/lib/src/event_bus/event_bus.dart` — broadcast `Stream<AppEvent>`, `publish`, provider `eventBusProvider`
- [ ] T046 [Flutter] Update `core/lib/core.dart` to re-export `EventBus`

### 2.3 Core: drift database root

- [ ] T047 [P] [Flutter] Create `core/lib/src/db/app_database.dart` — drift `AppDatabase` with SQLCipher key from secure storage, WAL PRAGMAs, migration runner. The SQLCipher key is a 256-bit CSPRNG value generated on first launch and stored in the iOS Keychain with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` (non-synchronizable) / the Android Keystore (StrongBox where available) — never a derived or hardcoded key.
- [ ] T048 [P] [Flutter] Create `core/lib/src/db/uuid_v7_converter.dart` — `TypeConverter<UuidV7, Uint8List>`
- [ ] T049 [Flutter] Update `core/lib/core.dart` to re-export `AppDatabase`

### 2.4 Core: network + .NET API client

- [ ] T050 [P] [Flutter] Create `core/lib/src/network/balsm_api_client.dart` — anti-corruption layer over `Dio`. Base URL from `ActiveServerStore`/`FlavorConfig`. Auth interceptor attaches `Authorization: Bearer <accessToken>`, auto-refreshes via `POST /auth/refresh` on 401 (retry once), persists tokens via secure storage. Typed methods added per module. **Replaces the former `supabase_client_wrapper.dart`.** Per research §32.
- [ ] T051 [P] [Flutter] Create `core/lib/src/network/phi_leak_interceptor.dart` — Dio interceptor scrubbing request/response fields not on `contracts/crash-allowlist.json` before any logging
- [ ] T052 [P] [Flutter] Create `core/lib/src/network/dio_client_provider.dart` — provider `dioClientProvider` returning a `Dio` with `PhiLeakInterceptor` + auth interceptor, base URL from `BalsmApiClient`
- [ ] T053 [Flutter] Update `core/lib/core.dart` to re-export the network layer

### 2.5 Core: localization + country + translation catalog

- [ ] T054 [P] [Flutter] Create `core/lib/src/localization/translation_catalog.dart` — loads `assets/i18n/{locale}.json`, `translate`, `hasTranslation`, provider
- [ ] T055 [P] [Flutter] Create `core/lib/src/localization/country_registry.dart` — country metadata: ISO code, IANA tz, first-class tags, phone hint, national-ID validator (FR-211), supervisory authority (FR-219)
- [ ] T056 [Flutter] Update `core/lib/core.dart` to re-export localization layer

### 2.6 Core: crash reporting (Sentry)

- [ ] T057 [P] [Flutter] Create `core/lib/src/crash/sentry_init.dart` — `initSentry()` with `beforeSend` + `beforeBreadcrumb` scrub per allowlist, environment from flavor. The scrub MUST strip URL fragments (`#...`) and tokenized path segments from every captured URL (`transaction`, `request.url`, navigation breadcrumb `data.url`) — the emergency-QR AES key lives in the URL fragment, so an un-stripped href would leak the decryption key to Sentry (see `contracts/crash-allowlist.json`).
- [ ] T058 [Flutter] Update `core/lib/core.dart` to re-export `initSentry`

### 2.7 Core: secure storage wrapper

- [ ] T059 [P] [Flutter] Create `core/lib/src/secure_storage/secure_storage_wrapper.dart` — typed read/write/delete/clear, provider `secureStorageProvider`
- [ ] T060 [Flutter] Update `core/lib/core.dart` to re-export secure storage wrapper

### 2.8 Core: notifications wrapper

- [ ] T061 [P] [Flutter] Create `core/lib/src/notifications/notification_service.dart` — wraps `FlutterLocalNotificationsPlugin`, `initialize`, `zonedSchedule`, `cancel`, `cancelAll`, provider
- [ ] T062 [Flutter] Update `core/lib/core.dart` to re-export notification service

### 2.9 Core: shared widgets + theme + RTL

- [ ] T063 [P] [Flutter] Create `core/lib/src/kit/theme.dart` — `BalsmTheme` light+dark, typography, palette, `RtlWrapper`
- [ ] T064 [P] [Flutter] Create `core/lib/src/kit/shared_widgets.dart` — `BalsmButton`, `BalsmTextField` (Arabic numeral normalization FR-213), `BalsmCountryPicker`, `BalsmLoadingIndicator`, `BalsmErrorBanner`
- [ ] T065 [Flutter] Update `core/lib/core.dart` to re-export kit layer

### 2.10 Core: test kit

- [ ] T066 [P] [Flutter] Create `core/lib/src/test_kit/fakes.dart` — `FakeEventBus`, `FakeBalsmApiClient`, `FakeSecureStorage`, `FakeNotificationService`, `FakeTranslationCatalog`, `FakeCountryRegistry` (gated by `bool.fromEnvironment('DEV')`)
- [ ] T067 [P] [Flutter] Create `core/lib/src/test_kit/golden_helpers.dart` — `goldenTest` helper wrapping `golden_toolkit` with RTL+LTR variants
- [ ] T068 [Flutter] Update `core/lib/core.dart` to re-export test_kit gated on `bool.fromEnvironment('DEV')`
- [ ] T069 [Flutter] Update `../balsm_app/app/lib/main.dart` to call `initSentry()` before `bootstrap()`

### 2.11 Boundary lint rules

- [ ] T070 [P] [Flutter] Create 6 custom_lint rule files at `../balsm_app/packages/balsm_boundary_lint/lib/src/rules/`:
  - `no_module_to_module_imports.dart`
  - `core_must_not_depend_on_module.dart`
  - `module_barrel_exposes_only_public_api.dart`
  - `no_aggregate_leak.dart`
  - `domain_no_flutter_import.dart`
  - `core_internal_no_cross_subdir_test_kit_in_release.dart`

**Checkpoint**: foundation ready (Flutter core kernel + .NET infra services). All user stories below may now proceed.

---

## Phase 2.5: UI/UX Design & Prototype Review (Blocking Gate)

**Purpose**: Reviewable UI/UX design spec + interactive prototype for every P001 screen BEFORE Flutter implementation. RTL+LTR variants. PHI-safe placeholder data only. No Flutter code may start until sign-off recorded.

**Independent test**: Open `design/prototype/index.html` → click through all 6 US flows → toggle RTL↔LTR + theme → export report.

### 2.5.1 Design spec + screen inventory

- [ ] D001 [Flutter] Create `design/UI-SPEC.md` — design contract: token source `Balsm-Core/brand/design-system/colors_and_type.css`, every screen → FR/SC, typography/spacing/radii/motion/elevation scales, RTL mirroring, dark-mode WCAG AA, focus-ring
- [ ] D002 [Flutter] Create `design/SCREEN-INVENTORY.md` — table of every screen → user story, FR, SC, RTL-mirror notes, a11y notes
- [ ] D003 [Flutter] Create `design/COMPONENT-CONTRACT.md` — for every shared widget — states (default/hover/focus/active/disabled/loading/error), token bindings, RTL, a11y labels

### 2.5.2 High-fidelity mock generation

- [ ] D004 [P] [Flutter] Create `design/mocks/auth/` — US1 4 screens × LTR/RTL × light/dark = 16 HTML files
- [ ] D005 [P] [Flutter] Create `design/mocks/disclosure/` — disclosure long-scroll × 2 × 2 = 4 files; per-country authority strings (PDPC, SDAIA, UAE Data Office) FR-219
- [ ] D006 [P] [Flutter] Create `design/mocks/home/` — empty / nudges / filled = 3 × 2 × 2 = 12 files
- [ ] D007 [P] [Flutter] Create `design/mocks/profile/` — 6 screens × 2 × 2 = 24 files; Arabic numeral preview FR-213
- [ ] D008 [P] [Flutter] Create `design/mocks/emergency_card/` — 7 screens × 2 × 2 = 28 files (incl. lock-screen widget previews)
- [ ] D009 [P] [Flutter] Create `design/mocks/medications/` — 7 screens × 2 × 2 = 28 files (incl. tz-shift modal FR-023, notification preview)
- [ ] D010 [P] [Flutter] Create `design/mocks/deletion/` — 6 screens × 2 × 2 = 24 files (FR-031 data lists)
- [ ] D011 [P] [Flutter] Create `design/mocks/sessions/` — 3 screens × 2 × 2 = 12 files
- [ ] D012 [P] [Flutter] Create `design/mocks/country_lang/` — 4 screens × 2 × 2 = 16 files
- [ ] D013 [P] [Flutter] Create `design/mocks/auth_states/` — lockout / geofence-blocked / network-error / OTP-expired = 4 × 2 × 2 = 16 files
- [ ] D014 [P] [Flutter] Create `design/mocks/system/` — NotFound (FR-404) / error-boundary / splash / loading = 4 × 2 × 2 = 16 files

### 2.5.3 Interactive prototype

- [ ] D015 [Flutter] Create `design/prototype/index.html` — shell wrapping all mocks: left nav, iOS frame, RTL/LTR toggle, theme toggle, locale + country dropdowns
- [ ] D016 [Flutter] Create `design/prototype/flows.json` — declarative flow graph per US
- [ ] D017 [Flutter] Create `design/prototype/assets/data.json` — synthetic non-PHI placeholder data matching `phi_leak_fuzz_test/corpus.dart` shape
- [ ] D018 [P] [Flutter] Create `design/prototype/styles/prototype.css` — chrome using brand tokens (no component overrides)
- [ ] D019 [P] [Flutter] Create `design/prototype/scripts/prototype.js` — vanilla JS: hash routing, dir/theme/locale toggles

### 2.5.4 Review gate + sign-off

- [ ] D020 [Flutter] Create `design/REVIEW-CHECKLIST.md` — 6-pillar checklist per screen
- [ ] D021 [Flutter] Create `design/REVIEW-SIGNOFF.md` — stakeholder rows (PM, design, eng, compliance), per-flow approval columns
- [ ] D022 [Flutter] Run `design/prototype/index.html` review session — file findings under `design/findings/<date>.md`, resolve/defer
- [ ] D023 [Flutter] Update `design/REVIEW-SIGNOFF.md` with signatures + date — **gate unlocks Phase 3+**. T071+ may NOT start until signed
- [ ] D024 [P] [Flutter] Export `design/tokens-snapshot.json` — locked token dump for a CI compare check

### 2.5.5 Optional design enhancements

- [ ] D025 [P] [Flutter] Create `design/MOTION-SPEC.md` — per-screen motion (transitions, modals, list stagger, QR reveal, OTP shake)
- [ ] D026 [P] [Flutter] Create `design/A11Y-SPEC.md` — VoiceOver/TalkBack labels, focus order, ≥44pt targets, contrast, reduced-motion, font scaling 200%
- [ ] D027 [P] [Flutter] Create `design/COPY-SPEC.md` — UX writing per screen, localized en/ar-EG/ar-SA/ar-AE; feeds i18n at T100

**Checkpoint**: design signed off, `tokens-snapshot.json` locked. Phases 3-9 may proceed.

---

## Phase 3: US1 — Signup & Auth (Priority: P1)

**Goal**: Patient signs up with email OTP / Google / Apple, country picker pre-selects, denied countries blocked, disclosure accepted, lands on home. Signup-to-home ≤90s P50 (SC-001a).

**Bounded Context / Module**: Identity & Access → Balsm-Core/src/Modules/{Auth, Geofence, Disclosure} + balsm_app/modules/{auth, geofence_block, disclosure}

**Independent Test**: Fresh install → country picker → enter email → receive OTP → enter OTP → disclosure → Continue → home renders with name.

### 3.1 .NET: Auth module + endpoints

- [ ] T071 [P] [DotNet] [US1] Create `../Balsm-Core/src/Modules/Auth/Commands/RequestOtpCommand.cs` + handler + `../Balsm-Core/src/Balsm.API/Controllers/AuthController.cs` action `RequestOtp` (`POST /auth/otp/request`) — reads `country_code`, runs `GeofenceService.IsDenied` (403 if denied), runs `NotLockedOutPolicy` (423 + `Retry-After` if locked), applies the T035az rate-limit policies, calls `OtpService.GenerateAndSend`. Returns `{ expires_in_seconds: 600 }`. Per FR-001/FR-005/FR-007/FR-045.
- [ ] T072 [P] [DotNet] [US1] Create `../Balsm-Core/src/Modules/Geofence/GeofenceService.cs` — `Task<GeofenceResult> Check(string countryCode)` querying `DeniedCountryBlocklist` via EF Core (`AsNoTracking`); returns `{ allowed, source? }`. Inject into the auth signup path. Replaces `geofence-check` Edge Function. Per FR-005/FR-218.
- [ ] T073 [P] [DotNet] [US1] Create `../Balsm-Core/src/Modules/Auth/Services/AccountLockoutService.cs` — `RecordFailedAttempt(identifier, type)` upserts `AccountLockout` (increment `failed_attempts`, reset `rolling_window_started_at` if outside 10-min window, set `locked_until` when ≥5), `IsLockedOut(identifier)`, `Reset(identifier)` on success. Called from `VerifyOtpCommand`. Replaces `auth-attempt-record`. Per FR-007/SC-011.
- [ ] T073a [P] [DotNet] [US1] Create `VerifyOtpCommand` + `AuthController.VerifyOtp` (`POST /auth/otp/verify`) — `OtpService.Verify`; apply the per-IP rate-limit policy (`OtpPerIp`) to verify as well as request; on success create-or-load `UserAccount` + `UserIdentity`, issue JWT pair (`JwtService`) with the new `ActiveSession` id as the `session_id` claim, reset lockout; on failure call `AccountLockoutService.RecordFailedAttempt`. Returns `{ access_token, refresh_token, user_id, is_new_user }`. Per FR-001/FR-004.
- [ ] T073b [P] [DotNet] [US1] Create `ExchangeGoogleTokenCommand` + `ExchangeAppleTokenCommand` + `AuthController.Google`/`Apple` (`POST /auth/google`, `/auth/apple`) — validate via `GoogleOidcValidator`/`AppleOidcValidator` (which MUST pin `aud` to our client IDs); geofence check; then **link identities by `(provider, providerSubject)` only** — reject with `403` when the provider reports `emailVerified=false`, and NEVER merge into an existing account by email match unless the provider asserts a verified email (prevents pre-account-takeover). On first OIDC sign-in with no stored DOB, require DOB submission before a full session is issued (route <18 to soft-block, same 403 semantics as T035bb). Issue JWT pair + session. Accept Apple `hide-my-email`. Per FR-001/FR-004.
- [ ] T073c [P] [DotNet] [US1] Create `RefreshTokenCommand` + `SignOutCommand` + `AuthController.Refresh`/`SignOut` (`POST /auth/refresh`, `/auth/sign-out`) — rotate refresh token; revoke on sign-out (sets `UserRefreshToken.revoked_at`). Per research §26.
- [ ] T073d [DotNet] [US1] Create `../Balsm-Core/tests/Modules/Auth.Tests/AuthFlowTests.cs` — xUnit integration test via `TestWebAppFactory`: OTP request→verify issues JWT; 6th wrong OTP in 10min → 423; denied country → 403; Google/Apple token exchange creates one account. Per Constitution §VI (auth 100% coverage).

### 3.2 Flutter: auth module

- [ ] T074 [P] [Flutter] [US1] Create `AuthSession` aggregate at `auth/lib/src/domain/aggregates/auth_session.dart` — sealed: `Unauthenticated`, `Authenticated(userId, email, provider, accessToken)`, `LockedOut(until, identifier)`
- [ ] T075 [P] [Flutter] [US1] Create `auth` domain events at `auth/lib/src/domain/events/` — `UserSignedUp`, `UserSignedIn`, `UserSignedOut`, `LockoutTriggered`
- [ ] T076 [P] [Flutter] [US1] Create `ReadAuthRepository` at `auth/lib/src/domain/repositories/read_auth_repository.dart` — `Stream<AuthSession> watchSession()`
- [ ] T077 [P] [Flutter] [US1] Create `auth` API adapter at `auth/lib/src/infrastructure/api/balsm_auth_adapter.dart` — implements auth operations via `core`'s `BalsmApiClient`, calling `.NET` endpoints `POST /auth/otp/request`, `/auth/otp/verify`, `/auth/google`, `/auth/apple`, `/auth/refresh`, `/auth/sign-out`. Persists tokens via secure storage. **Replaces the former `supabase_auth_adapter.dart`.**
- [ ] T078 [P] [Flutter] [US1] Create `SignUpUseCase` at `auth/lib/src/application/use_cases/sign_up_use_case.dart` — accepts `email | google | apple` + `countryCode`; the .NET API performs the geofence check (handle 403); calls auth adapter; dispatches `UserSignedUp`
- [ ] T079 [P] [Flutter] [US1] Create `SignInUseCase` at `auth/lib/src/application/use_cases/sign_in_use_case.dart` — handles `LockedOut` (423) state; dispatches `UserSignedIn`
- [ ] T080 [P] [Flutter] [US1] Create `SignOutUseCase` at `auth/lib/src/application/use_cases/sign_out_use_case.dart` — calls `POST /auth/sign-out`; dispatches `UserSignedOut`
- [ ] T081 [P] [Flutter] [US1] Create `auth` providers at `auth/lib/src/presentation/providers/auth_providers.dart` — `authSessionProvider`, `signUpProvider`, `signInProvider`, `signOutProvider`
- [ ] T082 [P] [Flutter] [US1] Create `auth` screens at `auth/lib/src/presentation/screens/` — `CountryPickerScreen`, `EmailSignUpScreen`, `OtpVerificationScreen`, `SocialSignInScreen` (compose BalsmKit widgets)
- [ ] T083 [P] [Flutter] [US1] Create `auth` routes at `auth/lib/src/presentation/routes.dart` — named routes `auth.countryPicker`, `auth.emailSignUp`, `auth.otpVerification`, `auth.socialSignIn`
- [ ] T084 [Flutter] [US1] Update `auth/lib/auth.dart` public barrel

### 3.3 Flutter: disclosure module

- [ ] T085 [P] [Flutter] [US1] Create `DisclosureAcceptance` aggregate at `disclosure/lib/src/domain/aggregates/disclosure_acceptance.dart` — `disclosureId`, `version`, `countryCodeAtAccept`, `supervisoryAuthorityNameAtAccept`, `preferredLanguageAtAccept`, `acceptedAt`
- [ ] T086 [P] [Flutter] [US1] Create `DisclosureAccepted` event at `disclosure/lib/src/domain/events/disclosure_accepted.dart`
- [ ] T087 [P] [Flutter] [US1] Create `AcceptDisclosureUseCase` at `disclosure/lib/src/application/use_cases/accept_disclosure_use_case.dart` — persists on-device row + syncs cloud mirror via `POST /disclosure/accept`
- [ ] T088 [P] [Flutter] [US1] Create `disclosure` drift DAO at `disclosure/lib/src/infrastructure/drift/disclosure_dao.dart` — `insert`, `watchAcceptance(disclosureId, version)`
- [ ] T089 [P] [Flutter] [US1] Create `ConsolidatedDisclosureScreen` at `disclosure/lib/src/presentation/screens/` — localized FR-040, scroll-to-bottom-enables-Accept FR-041, RTL
- [ ] T090 [P] [Flutter] [US1] Create `disclosure` routes at `disclosure/lib/src/presentation/routes.dart` — `disclosure.onboarding`
- [ ] T091 [Flutter] [US1] Update `disclosure/lib/disclosure.dart` public barrel

### 3.4 .NET: disclosure cloud mirror endpoint

- [ ] T091a [P] [DotNet] [US1] Create `../Balsm-Core/src/Modules/Disclosure/Commands/AcceptDisclosureCommand.cs` + `../Balsm-Core/src/Balsm.API/Controllers/DisclosureController.cs` action `Accept` (`POST /disclosure/accept`, `[Authorize]`) — inserts a `DisclosureAcceptance` row (unique on `user_id, disclosure_id, version`). Per FR-040.

### 3.5 Flutter: geofence_block module

- [ ] T092 [P] [Flutter] [US1] Create `ReadDeniedCountriesRepository` at `geofence_block/lib/src/domain/repositories/read_denied_countries_repository.dart` — `Future<bool> isDenied(String countryCode)` (the .NET API is authoritative; this reads a cached list for the picker), `Stream<List<String>> watchDeniedCountryCodes()`
- [ ] T093 [P] [Flutter] [US1] Create `BlockedSignupAttempted(countryCode, source)` event at `geofence_block/lib/src/domain/events/blocked_signup_attempted.dart`
- [ ] T094 [Flutter] [US1] Update `geofence_block/lib/geofence_block.dart` public barrel

### 3.6 Flutter: home module skeleton

- [ ] T095 [P] [Flutter] [US1] Create `HomeScreen` at `home/lib/src/presentation/screens/` — display_name greeting, nudge cards, country/language info
- [ ] T096 [P] [Flutter] [US1] Create `home` routes at `home/lib/src/presentation/routes.dart` — `home` initial route after auth
- [ ] T097 [Flutter] [US1] Update `home/lib/home.dart` public barrel

### 3.7 Flutter: app shell composition

- [ ] T098 [Flutter] [US1] Compose `go_router` in `../balsm_app/app/lib/router.dart` — import route fragments, auth guard (redirect unauthenticated to `auth.countryPicker`), shell route with bottom nav
- [ ] T099 [Flutter] [US1] Wire `bootstrap()` in `../balsm_app/app/lib/bootstrap.dart` — register repository implementations for auth, disclosure, geofence_block, home; init `AppDatabase` + `BalsmApiClient`
- [ ] T100 [Flutter] [US1] Create i18n bundles at `core/assets/i18n/` — `en.json`, `ar-EG.json`, `ar-SA.json`, `ar-AE.json` for signup/disclosure/country-picker/home/errors (≥98% per SC-203)

### 3.8 Flutter: account module (signup creates row)

- [ ] T101 [P] [Flutter] [US1] Create `account` value objects at `account/lib/src/domain/value_objects/` — `AccountSummary(id, handle, displayName, countryCode, preferredLanguage, deletionState)`
- [ ] T102 [P] [Flutter] [US1] Create `account` events at `account/lib/src/domain/events/` — `CountryChanged`, `LanguageChanged`
- [ ] T103 [P] [Flutter] [US1] Create `ReadAccountRepository` at `account/lib/src/domain/repositories/read_account_repository.dart` — `Future<AccountSummary?> getAccount(userId)`, `Stream<AccountSummary> watchAccount(userId)`
- [ ] T104 [P] [Flutter] [US1] Create `account` API adapter at `account/lib/src/infrastructure/api/balsm_account_adapter.dart` — calls `GET /account/self` via `BalsmApiClient`, maps to `AccountSummary`. **Replaces `supabase_account_adapter.dart`.**
- [ ] T104a [P] [DotNet] [US1] Create `../Balsm-Core/src/Balsm.API/Controllers/AccountController.cs` action `GetSelf` (`GET /account/self`, `[Authorize(Policy="SelfOnly")]`) backed by `../Balsm-Core/src/Modules/Account/Queries/GetSelfQuery.cs` — returns account fields; decrypts DOB via `DobEncryptionService` (writes audit log) and returns `dob_year`. Per FR-006/FR-048.
- [ ] T105 [Flutter] [US1] Update `account/lib/account.dart` public barrel

**Checkpoint**: signup-to-home round-trip complete (SC-001a).

---

## Phase 4: US1a — Handle Claim & Health Profile (Priority: P2)

**Goal**: Patient claims a unique handle, completes health profile (blood type, allergies, conditions, contacts). On-device PHI storage only.

**Bounded Context / Module**: Identity & Access (handle → Balsm-Core/src/Modules/Account + balsm_app/modules/account) + Personal Health (profile → balsm_app/modules/profile, on-device PHI only)

**Independent Test**: Complete US1 → claim handle → "Available" → claim → complete profile → restart → data persists.

### 4.1 .NET: handle endpoints

- [ ] T106 [P] [DotNet] [US1a] Create `../Balsm-Core/src/Modules/Account/Queries/CheckHandleQuery.cs` + `AccountController.CheckHandle` (`POST /account/handle/check`, `[Authorize]`) — validates format `^[a-z0-9_.]{3,30}$`, checks `ReservedHandleBlocklist` + `UsernameReservation`, returns `{ available }`. MUST require auth (handle claim is post-signup) + a per-user/per-IP rate-limit policy + uniform response timing so it is not an unauthenticated oracle for enumerating the handle namespace. Replaces `reserved-handle-check`. Per FR-002/FR-003.
- [ ] T107 [P] [DotNet] [US1a] Create `../Balsm-Core/src/Modules/Account/Commands/ClaimHandleCommand.cs` + `AccountController.ClaimHandle` (`POST /account/handle/claim`, `[Authorize(Policy="ActiveAccount")]`) — re-validates, inserts `UsernameReservation` + updates `UserAccount.handle` in one transaction (unique constraint enforces global uniqueness FR-304); on conflict returns 409 + 3 suggestions. Replaces `handle-claim`. Per FR-002/FR-008/FR-304.
- [ ] T108 [P] [DotNet] [US1a] Create `../Balsm-Core/src/Modules/Account/Services/HandleSuggestionService.cs` — given a base handle/display name, returns 3 available suggestions (append digits, check availability). Replaces `handle-suggest`. Per FR-008.

### 4.2 Flutter: profile module (on-device PHI)

- [ ] T109 [P] [Flutter] [US1a] Create `profile` aggregates at `profile/lib/src/domain/aggregates/` — `HealthProfile` root with embedded `Allergy`, `ChronicCondition`, `EmergencyContact` per data-model.md §2.1–§2.4
- [ ] T110 [P] [Flutter] [US1a] Create `HealthProfileUpdated` event at `profile/lib/src/domain/events/health_profile_updated.dart`
- [ ] T111 [P] [Flutter] [US1a] Create `profile` drift DAOs at `profile/lib/src/infrastructure/drift/` — `ProfileDao` CRUD for `health_profile`, `allergy`, `chronic_condition`, `emergency_contact` (UUID v7 PKs), `watchProfile`
- [ ] T112 [P] [Flutter] [US1a] Create `profile` use cases at `profile/lib/src/application/use_cases/` — `UpdateHealthProfileUseCase`, `AddAllergyUseCase`, `RemoveAllergyUseCase`, `AddChronicConditionUseCase`, `AddEmergencyContactUseCase`
- [ ] T113 [P] [Flutter] [US1a] Create `HealthProfileEditorScreen` at `profile/lib/src/presentation/screens/` — blood type, allergies (≤50), conditions, contacts; Arabic numeral normalization FR-213; national-ID validator FR-211
- [ ] T114 [P] [Flutter] [US1a] Create `profile` routes at `profile/lib/src/presentation/routes.dart` — `profile.editor`
- [ ] T115 [Flutter] [US1a] Update `profile/lib/profile.dart` public barrel

### 4.3 Flutter: account handle-claim surface

- [ ] T116 [P] [Flutter] [US1a] Create `HandleClaimScreen` at `account/lib/src/presentation/screens/handle_claim_screen.dart` — live validation, calls `POST /account/handle/check` then `/claim`, shows 409 + suggestions
- [ ] T117 [P] [Flutter] [US1a] Create `ClaimHandleUseCase` at `account/lib/src/application/use_cases/claim_handle_use_case.dart`
- [ ] T118 [Flutter] [US1a] Update `HomeScreen` to show "Claim your handle" nudge when handle is null

**Checkpoint**: handle claim + health profile CRUD complete. All PHI on-device only.

---

## Phase 5: US2 — Emergency Card & QR (Priority: P2)

**Goal**: Patient fills emergency card, mints QR (configurable TTL), public web page resolves QR. Lock-screen widget (iOS) + quick-settings tile (Android). SC-014 revocation ≤2s.

**Bounded Context / Module**: Personal Health → balsm_app/modules/emergency_card + Balsm-Core/src/Modules/EmergencyQr (PHI-free token surface)

**Independent Test**: Fill card → mint QR TTL 24h → scan with second device → public page opens → revoke → scan again → "Expired" ≤2s.

### 5.1 .NET: EmergencyQr endpoints

- [ ] T119 [P] [DotNet] [US2] Create `../Balsm-Core/src/Modules/EmergencyQr/Commands/MintEmergencyQrCommand.cs` + `../Balsm-Core/src/Balsm.API/Controllers/EmergencyQrController.cs` action `Mint` (`POST /emergency-qr/mint`, `[Authorize(Policy="AgeGate")]`) — accepts `ciphertext` (bytea, **≤16 KB — reject larger with 422**), `profile_etag`, `ttl_seconds` (CHECK 3600/21600/86400/604800); the `jti` is a 128-bit CSPRNG value (UUIDv4 — NOT a timestamp-prefixed UUIDv7, since the resolve surface is public); sets `revoked_at` on the prior active token in the same transaction; inserts new `EmergencyQrToken` with `expires_at = now + ttl`. Returns `{ jti, token_url, expires_at }`. Replaces `emergency-token-mint`. Per FR-013/FR-014.
- [ ] T120 [P] [DotNet] [US2] Create `RevokeEmergencyQrCommand` + `EmergencyQrController.Revoke` (`POST /emergency-qr/{jti}/revoke`, `[Authorize(Policy="SelfOnly")]`) — sets `revoked_at = now()` where `jti=$1 AND user_id=current`. Replaces `emergency-token-revoke`. Per FR-015/FR-034.
- [ ] T121 [P] [DotNet] [US2] Create `ResolveEmergencyQrQuery` + `EmergencyQrController.Resolve` (`GET /emergency-qr/resolve/{jti}`, **no auth**, CORS `balsm-public`) — returns `{ ciphertext, preferred_language }` only where `jti=$1 AND revoked_at IS NULL AND expires_at > now()`, else 404/410. Apply a per-IP rate-limit policy (unauthenticated scraping/DoS guard) and set `Cache-Control: no-store` on the response. Never returns the key (key lives in the URL fragment). Replaces `emergency-token-resolve`. Per FR-015/FR-216.
- [ ] T121a [P] [DotNet] [US2] Create `EmergencyQrController.GetActive` (`GET /emergency-qr/active`, `[Authorize(Policy="SelfOnly")]`) — returns the current active token summary or null. Per FR-014 (at most one active token).
- [ ] T121b [DotNet] [US2] Create `../Balsm-Core/tests/Modules/EmergencyQr.Tests/QrLifecycleTests.cs` — mint→resolve returns ciphertext; revoke→resolve returns 410 within the same request; second mint revokes the first. Per SC-014.

### 5.2 Flutter: emergency_card module

- [ ] T122 [P] [Flutter] [US2] Create `emergency_card` aggregates at `emergency_card/lib/src/domain/aggregates/` — `EmergencyCardSnapshot` (PHI for QR payload), `EmergencyQrToken` (jti, expiresAt, revokedAt, ttl)
- [ ] T123 [P] [Flutter] [US2] Create events at `emergency_card/lib/src/domain/events/` — `EmergencyQrTokenMinted`, `EmergencyQrTokenRevoked`
- [ ] T124 [P] [Flutter] [US2] Create use cases at `emergency_card/lib/src/application/use_cases/` — `MintEmergencyQrTokenUseCase` (reads HealthProfile snapshot via read repo, AES-256-GCM-encrypts with a client-generated key, calls `POST /emergency-qr/mint`), `RevokeEmergencyQrTokenUseCase`, `ResolveEmergencyQrTokenUseCase`
- [ ] T125 [P] [Flutter] [US2] Create screens at `emergency_card/lib/src/presentation/screens/` — `EmergencyCardScreen` (view + mint with TTL picker), `QrCodeDisplayScreen` (renders `https://<host>/emergency/<token>#k=<key>`)
- [ ] T126 [P] [Flutter] [US2] Create `emergency_card/lib/src/presentation/widgets/emergency_lock_screen_widget.dart` — shared widget for iOS WidgetKit + Android tile
- [ ] T127 [P] [Flutter] [US2] Create iOS WidgetKit extension at `emergency_card/ios/` — SwiftUI: blood type + top 3 allergies + top 2 conditions + primary contact, via app group user defaults
- [ ] T128 [P] [Flutter] [US2] Create Android quick-settings tile at `emergency_card/android/` — `TileService` with RemoteViews, same data
- [ ] T129 [P] [Flutter] [US2] Create routes at `emergency_card/lib/src/presentation/routes.dart` — `emergency.card`, `emergency.qrDisplay`
- [ ] T130 [Flutter] [US2] Update `emergency_card/lib/emergency_card.dart` public barrel

### 5.3 Flutter Web + deeplink: emergency QR public route

- [ ] T131 [P] [Flutter] [US2] Create `PublicEmergencyResolveScreen` at `emergency_card/lib/src/presentation/screens/public_emergency_resolve_screen.dart` — no-auth: reads `token` route param, reads fragment key (`dart:html` web / `app_links` mobile), then on web immediately `history.replaceState` to drop `#k=` from the address bar + history, calls `GET /emergency-qr/resolve/{jti}`, AES-256-GCM-decrypts with the fragment key, renders RTL-aware card with tap-to-call (`tel:`)
- [ ] T132 [P] [Flutter] [US2] Add public route to `emergency_card/lib/src/presentation/routes.dart` — `emergency.publicResolve` path `/emergency/:token`, `noAuthRequired: true`; consumes `#k=...` (fragment never sent to API)
- [ ] T133 [P] [Flutter] [US2] Create `DeeplinkRouter` at `core/lib/src/deeplink/deeplink_router.dart` — listens to `app_links`, parses `/emergency/{token}#k=...`, navigates via `go_router`; covers mobile (Universal/App Links) + web (path URL strategy)
- [ ] T133a [P] [Flutter] [US2] Add `../balsm_app/app/web/.well-known/emergency-keys.json` — Ed25519 public key for token signature verification, generated by CI

**Checkpoint**: emergency card + QR full round-trip.

---

## Phase 6: US3 — Medication Reminders (Priority: P3)

**Goal**: Patient adds medications (daily/weekly/custom), notifications fire offline ≥7 days (SC-004). Dose events append-only. Missed-dose detection on foreground. **No backend — all PHI on-device.**

**Bounded Context / Module**: Personal Health → balsm_app/modules/medications (Medication aggregate + DoseEvent append-only; no backend)

**Independent Test**: Add 3 meds → airplane mode → advance clock → notification ±60s → tap Taken → dose event appears.

### 6.1 Flutter: medications module

- [ ] T134 [P] [Flutter] [US3] Create `Medication` aggregate at `medications/lib/src/domain/aggregates/medication.dart` — per data-model.md §2.5; `recordDose(DoseEvent)` enforces correction `parent_event_id`; `isExpired()`
- [ ] T135 [P] [Flutter] [US3] Create `DoseEvent` entity at `medications/lib/src/domain/entities/dose_event.dart` — outcomes taken/skipped/snoozed/missed/correction; append-only
- [ ] T136 [P] [Flutter] [US3] Create events at `medications/lib/src/domain/events/` — `MedicationAdded`, `DoseTaken`, `DoseSkipped`, `DoseSnoozed`, `DoseMissed`, `DoseCorrected`
- [ ] T137 [P] [Flutter] [US3] Create `medication_dao.dart` at `medications/lib/src/infrastructure/drift/` — CRUD for `medication`, insert-only `medication_dose_event` with SQLite triggers preventing UPDATE/DELETE per `contracts/medication-scheduler.md`
- [ ] T138 [P] [Flutter] [US3] Create `medication_scheduler.dart` — daily 03:00 heartbeat rebuilding next 30 days of OS triggers, `zonedSchedule` `exactAllowWhileIdle`, tz-shift modal FR-023; generic notification body only (FR-018)
- [ ] T139 [P] [Flutter] [US3] Create `missed_dose_detector.dart` — on foreground, queries scheduled doses `scheduled_at < now-30min` with no event, inserts `outcome='missed'`
- [ ] T140 [P] [Flutter] [US3] Create use cases at `medications/lib/src/application/use_cases/` — `AddMedicationUseCase` (rebuild schedule), `RecordDoseOutcomeUseCase`, `EditMedicationUseCase`, `DeleteMedicationUseCase`, `NotifyMissedDosesUseCase`
- [ ] T141 [P] [Flutter] [US3] Create screens at `medications/lib/src/presentation/screens/` — `MedicationListScreen`, `AddMedicationScreen` (schedule shape picker), `DoseHistoryScreen`, `TodayScreen` (`meds.today` — upcoming + missed)
- [ ] T142 [P] [Flutter] [US3] Create routes at `medications/lib/src/presentation/routes.dart` — `medications.list`, `medications.add`, `medications.detail`, `meds.today`
- [ ] T143 [Flutter] [US3] Update `medications/lib/medications.dart` public barrel
- [ ] T144 [Flutter] [US3] Update `HomeScreen` — medication nudge + "Today" summary card linking to `meds.today` in ≤1 tap (FR-017c)

### 6.2 Flutter: core notifications wiring

- [ ] T145 [Flutter] [US3] Wire notification tap in `../balsm_app/app/lib/app.dart` — deep-link to `meds.today` with highlighted due dose

**Checkpoint**: reminders fire offline ≥7d, dose events append-only, missed doses detected.

---

## Phase 7: US4 — Self-Service Deletion (Priority: P3)

**Goal**: Patient deletes account in-app or web. FSM: request → 7-day grace → purge. Cancel from grace restores. SC-012 ≤2 taps.

**Bounded Context / Module**: Identity & Access → Balsm-Core/src/Modules/Deletion + balsm_app/modules/deletion

**Independent Test**: Settings → Delete → re-auth → confirm → sign out → sign in within grace → cancel-only flow → cancel → restored. Web path: open `/account/delete`.

### 7.1 .NET: deletion endpoints + purge job

- [ ] T146 [P] [DotNet] [US4] Create `../Balsm-Core/src/Modules/Deletion/Commands/IntakeDeletionCommand.cs` + `../Balsm-Core/src/Balsm.API/Controllers/DeletionController.cs` action `Intake` (`POST /deletion/intake`) — **require a fresh server-validated `reauth_token`** (from a recent OTP/OIDC verify, mirroring T168's country-change pattern) so a stolen access token alone cannot schedule deletion; **do NOT apply the AgeGate policy** (erasure is a data-subject right — never age-gated). Sets `deletion_state='DELETION_REQUESTED'`, `deletion_confirmed_at=now()`, `deletion_grace_until=now()+7d`; inserts `DeletionLog` (`reason_code='user_request'`); revokes all active `EmergencyQrToken` (FR-034). Replaces `account-delete-intake`. Per FR-031/FR-032/FR-034.
- [ ] T147 [P] [DotNet] [US4] Create `../Balsm-Core/src/Modules/Deletion/Services/AppleRevokeService.cs` — calls Apple `/auth/revoke` with the user's Apple refresh token; updates `DeletionLog.apple_revoke_status`. Invoked from `IntakeDeletionCommand` when the identity provider is Apple. Replaces `account-delete-confirm` + `apple-revoke`. Per FR-031.
- [ ] T148 [P] [DotNet] [US4] Create `CancelDeletionCommand` + `DeletionController.Cancel` (`POST /deletion/cancel`, `[Authorize]`) — sets `deletion_state='ACTIVE'`, inserts `DeletionLog` (`reason_code='cancelled'`); 409 if grace expired. Replaces `account-delete-cancel`. Per FR-032.
- [ ] T149 [P] [DotNet] [US4] Create `../Balsm-Core/src/Modules/Deletion/Jobs/DeletionPurgeJob.cs` — an `IHostedService` running nightly: selects `UserAccount` where `deletion_state='DELETION_REQUESTED' AND deletion_grace_until < now()`, deletes each (EF cascade removes related rows), sets `UsernameReservation.released_at`, retains `DeletionLog` 2 years. Replaces `account-delete-purge` cron. Per FR-032.
- [ ] T150 [DotNet] [US4] Create `../Balsm-Core/tests/Modules/Deletion.Tests/DeletionFsmTests.cs` — intake sets grace + revokes QR; cancel restores ACTIVE; purge job deletes past-grace accounts and keeps the deletion log. Per FR-031/FR-032.

### 7.2 Flutter: deletion module

- [ ] T151 [P] [Flutter] [US4] Create `DeletionRequest` aggregate at `deletion/lib/src/domain/aggregates/deletion_request.dart` — FSM ACTIVE→DELETION_REQUESTED→(cancel→ACTIVE | purge); `cancel()` only from DELETION_REQUESTED
- [ ] T152 [P] [Flutter] [US4] Create events at `deletion/lib/src/domain/events/` — `DeletionRequested`, `DeletionCancelled`, `DeletionPurged`
- [ ] T153 [P] [Flutter] [US4] Create use cases at `deletion/lib/src/application/use_cases/` — `RequestDeletionUseCase` (`POST /deletion/intake`), `CancelDeletionUseCase` (`POST /deletion/cancel`)
- [ ] T154 [P] [Flutter] [US4] Create screens at `deletion/lib/src/presentation/screens/` — `DeleteAccountScreen` (FR-031 retained/deleted/wiped lists, ≤2 taps SC-012), `DeletionConfirmScreen` (re-auth + typed DELETE), `DeletionCancelledScreen`, `PostDeletionLoginScreen`
- [ ] T155 [P] [Flutter] [US4] Create routes at `deletion/lib/src/presentation/routes.dart` — `deletion.request`, `deletion.confirm`, `deletion.cancelled`
- [ ] T156 [Flutter] [US4] Update `deletion/lib/deletion.dart` public barrel

### 7.3 Flutter Web + deeplink: account deletion public route

- [ ] T157 [P] [Flutter] [US4] Create `PublicDeleteScreen` at `deletion/lib/src/presentation/screens/public_delete_screen.dart` — public `/account/delete`: 3-channel re-auth via `auth` use cases, pre-confirm matching in-app copy, confirm calls `POST /deletion/intake`
- [ ] T158 [P] [Flutter] [US4] Create `PublicDeleteCancelledScreen` at `deletion/lib/src/presentation/screens/public_delete_cancelled_screen.dart` — `/account/delete-cancelled`: re-auth then `POST /deletion/cancel`
- [ ] T158a [P] [Flutter] [US4] Extend `core` `DeeplinkRouter` (T133) to register `/account/delete` + `/account/delete-cancelled`

### 7.4 Flutter + .NET: sessions module

- [ ] T159 [P] [Flutter] [US4] Create `ActiveSession` aggregate at `sessions/lib/src/domain/aggregates/active_session.dart` — id, deviceId, deviceLabel, deviceType, firstSeenAt, lastActivityAt, revokedAt (one-way)
- [ ] T160 [P] [Flutter] [US4] Create `SessionRevoked` event at `sessions/lib/src/domain/events/session_revoked.dart`
- [ ] T161 [P] [Flutter] [US4] Create use cases at `sessions/lib/src/application/use_cases/` — `ListActiveSessionsUseCase` (`GET /sessions`), `RevokeSessionUseCase` (`DELETE /sessions/{id}`), `SignOutEverywhereUseCase` (`DELETE /sessions`)
- [ ] T162 [P] [Flutter] [US4] Create `SessionsScreen` at `sessions/lib/src/presentation/screens/` — list devices, tap-to-revoke, "Sign out everywhere"
- [ ] T163 [P] [Flutter] [US4] Create routes at `sessions/lib/src/presentation/routes.dart` — `sessions.list`
- [ ] T164 [Flutter] [US4] Update `sessions/lib/sessions.dart` public barrel
- [ ] T164a [P] [DotNet] [US4] Create `../Balsm-Core/src/Balsm.API/Controllers/SessionsController.cs` (`GET /sessions`, `DELETE /sessions/{id}`, `DELETE /sessions` all `[Authorize(Policy="SelfOnly")]`) backed by `../Balsm-Core/src/Modules/Sessions/` query + commands — list active sessions, revoke one (400 if current; **404 for an unknown or not-owned `session_id`** — never 403, to avoid existence probing), revoke all except current. Revoking a session revokes its `UserRefreshToken` rows AND marks the `ActiveSession` revoked, so the `session_id`-claim check invalidates that device's in-flight access tokens within one request (≤2s, SC-013). Per FR-035/FR-036/SC-013.

**Checkpoint**: full deletion FSM observable + sessions screen.

---

## Phase 8: US5 — Account Lockout & Sessions (Priority: P4)

**Goal**: 5 failed attempts / 10-min rolling → 15-min lockout. Lockout screen exposes a support channel reachable without auth (FR-046a).

**Bounded Context / Module**: Identity & Access → Balsm-Core/src/Modules/{Auth (AccountLockout), Sessions} + balsm_app/modules/sessions

**Independent Test**: 5 wrong OTPs → "Locked" screen with countdown + mailto + status link → wait 15 min → sign in.

### 8.1 Flutter: auth lockout UI

- [ ] T165 [P] [Flutter] [US5] Extend `SignInUseCase` (T079) to handle the `LockedOut` (423 + `Retry-After`) response, surface the countdown
- [ ] T166 [P] [Flutter] [US5] Create `LockoutScreen` at `auth/lib/src/presentation/screens/lockout_screen.dart` — countdown + `mailto:support@balsm.health` + `/status` link (FR-046a) + recovery-explainer link (T035bg)
- [ ] T167 [Flutter] [US5] Update `auth` routes to include the lockout screen

### 8.2 .NET: lockout test

- [ ] T167a [DotNet] [US5] No new endpoint — `AccountLockoutService` (T073) + `NotLockedOutPolicy` (T004) already implement the lockout state machine. Add `../Balsm-Core/tests/Modules/Auth.Tests/LockoutWindowTests.cs` verifying the 10-min rolling window + 15-min lock + reset-on-success. Per FR-007/SC-011.

### 8.3 .NET + Flutter: public status page (FR-046b)

- [ ] T167b [P] [DotNet] [US5] Create `../Balsm-Core/src/Modules/Sessions/Jobs/StatusHealthJob.cs` (`IHostedService`) + `../Balsm-Core/src/Balsm.API/Controllers/StatusController.cs` (`GET /status`, no auth, CORS `balsm-public`) — returns service health + recent incident feed JSON. Per Q4 FR-046b.
- [ ] T167c [P] [Flutter] [US5] Create `StatusScreen` at `core/lib/src/kit/status_screen.dart` + register public route `/status` (no auth) — renders the `GET /status` payload, RTL-aware. Per FR-046b.

**Checkpoint**: lockout boundary tested + support channels reachable.

---

## Phase 9: US6 — Country & Language Change (Priority: P4)

**Goal**: Patient changes country post-signup (re-auth + re-disclosure), changes language with RTL toggle. Single global account (FR-300…FR-305).

**Bounded Context / Module**: Identity & Access → Balsm-Core/src/Modules/Account + balsm_app/modules/account

**Independent Test**: Sign up EG → change to KSA → re-auth → re-accept SDAIA disclosure → country=SA, data preserved. Change language → RTL renders ≤200ms.

### 9.1 .NET: country/language endpoints

- [ ] T168 [P] [DotNet] [US6] Create `ChangeCountryCommand` + `AccountController.ChangeCountry` (`PATCH /account/country`, `[Authorize]`) — requires a `reauth_token` (from a prior OTP/OIDC verify) + a `disclosure_acceptance_id`; validates the new country is not denied; updates `UserAccount.country_code` ONLY (does NOT migrate the encrypted DOB — research §6a / FR-049 / RR-001, add an explicit code comment). Replaces `country-change`. Per FR-302/FR-044.
- [ ] T169 [P] [DotNet] [US6] Create `ChangeLanguageCommand` + `AccountController.ChangeLanguage` (`PATCH /account/language`, `[Authorize]`, no re-auth) — updates `UserAccount.preferred_language`. Replaces `language-change`. Per FR-301.

### 9.2 Flutter: account country/language screens

- [ ] T170 [P] [Flutter] [US6] Create use cases at `account/lib/src/application/use_cases/` — `ChangeCountryUseCase` (`PATCH /account/country`), `ChangeLanguageUseCase` (`PATCH /account/language`)
- [ ] T171 [P] [Flutter] [US6] Create screens at `account/lib/src/presentation/screens/` — `CountrySettingsScreen` (re-auth + re-disclosure flow), `LanguageSettingsScreen` (`ar-EG`/`ar-SA`/`ar-AE`/`en`, live RTL preview)
- [ ] T172 [P] [Flutter] [US6] Create routes at `account/lib/src/presentation/routes.dart` — `account.settings`, `account.country`, `account.language`, `account.developer` (only when `serverSelectorEnabled`)
- [ ] T172a [P] [Flutter] [US6] Update `SettingsScreen` at `account/lib/src/presentation/screens/settings_screen.dart` to conditionally render a "Developer" section ("Switch server" + active preset) visible only when `flavor == Flavor.dev`; opens `core` `ServerSelectorScreen` (T035o)

### 9.3 Flutter: home country-change integration

- [ ] T173 [Flutter] [US6] Update `HomeScreen` to react to `CountryChanged` — reload locale, update RTL, re-fetch country data
- [ ] T174 [Flutter] [US6] Update `ConsolidatedDisclosureScreen` to support re-disclosure on country change (different authority name + version)

**Checkpoint**: country change round-trip + single account preserved.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: PHI-leak guardrails, CI/CD, E2E tests, localization completeness.

- [ ] T175 [P] [Flutter] Create PHI-leak fuzz test at `../balsm_app/test/phi_leak_fuzz_test/sentry_allowlist_test.dart` — ≥50 synthetic PHI payloads through Sentry `beforeSend` + Dio `PhiLeakInterceptor`, assert zero non-allowlisted fields AND that no denylist regex survives inside the exception `value` free text (assert on value content, not only field names) AND that URL-fragment vectors (`/emergency/:token#k=...`) are stripped from every captured URL. Include Arabic PHI + Eastern-Arabic-Indic-digit vectors (SC-006/SC-016)
- [ ] T175a [P] [DotNet] Create `../Balsm-Core/tests/Balsm.API.IntegrationTests/PhiLeakGuardTests.cs` — feed ≥50 synthetic PHI payloads through `PhiLeakGuardMiddleware`, assert no non-allowlisted field is logged (SC-006/SC-016 backend side)
- [ ] T176 [P] [Flutter] Create `../balsm_app/test/phi_leak_fuzz_test/corpus.dart` — synthetic EG/SA/AE names, phones, national IDs, DOBs, allergy/condition/medication names in ar+en per `contracts/crash-allowlist.json`
- [ ] T177 [P] [Flutter] Create golden test suite at `../balsm_app/test/golden/` — RTL+LTR goldens for every screen
- [ ] T178 [P] [Flutter] Create localized 404 at `core/lib/src/kit/not_found_screen.dart` — `go_router` `errorBuilder`, RTL-aware (FR-404)
- [ ] T179 [P] [Flutter] Wire web error boundary at `../balsm_app/app/lib/web_error_boundary.dart` — `FlutterError.onError` + `PlatformDispatcher.onError` → localized error page + Sentry capture. The web capture path MUST route through the same fragment/URL scrub as T057 so a captured `window.location.href` never carries the emergency `#k=` key.
- [ ] T180 [P] [Flutter] Add web smoke test at `../balsm_app/test/web_smoke/public_routes_test.dart` — `/emergency/{token}` + `/account/delete` + `/status` resolve without auth redirect; deeplink fragment-key parser
- [ ] T181 [P] [Flutter] Create CI at `../balsm_app/.github/workflows/ci.yml` — flutter analyze, test, golden diffs, phi_leak_fuzz, drift schema check, i18n ≥98% completeness, iOS + Android release builds
- [ ] T182 [P] [DotNet] Create CI at `../Balsm-Core/.github/workflows/dotnet-ci.yml` — `dotnet restore`, `dotnet build -warnaserror`, `dotnet test` (xUnit + Testcontainers PostgreSQL), `dotnet ef migrations script` dry-run, `dotnet format --verify-no-changes`. Replaces the former Supabase CI.
- [ ] T183 [P] [Flutter] Extend Flutter CI with a `build-web` job — `flutter build web --release --wasm`, validate AASA content-type + JSON, validate `assetlinks.json` SHA-256 vs release cert, publish artifact
- [ ] T184 [P] [Flutter] Add E2E at `../balsm_app/test/e2e_test/signup_to_home_test.dart` — full signup via Patrol (against a local .NET API)
- [ ] T185 [P] [Flutter] Add E2E at `../balsm_app/test/e2e_test/emergency_qr_roundtrip_test.dart` — mint → public page resolves
- [ ] T186 [P] [Flutter] Add E2E at `../balsm_app/test/e2e_test/medication_reminder_test.dart` — add medication → advance clock → notification fires
- [ ] T187 [P] [Flutter] Add E2E at `../balsm_app/test/e2e_test/deletion_flow_test.dart` — request → cancel → sign in → no data loss
- [ ] T188 [P] [Flutter] Add E2E at `../balsm_app/test/e2e_test/country_change_test.dart` — sign up EG → change KSA → re-disclosure appears
- [ ] T189 [Flutter] Verify i18n completeness across `en`, `ar-EG`, `ar-SA`, `ar-AE` — ≥98% per SC-203
- [ ] T190 Run `quickstart.md` end-to-end on iOS Simulator + Android Emulator against a local .NET API; record pass/fail per SC-001a, US2, SC-004, US4, SC-006, SC-016, SC-011, Q1-Q5, FR-300..FR-305
- [ ] T191 Update `../balsm_app/AGENTS.md` + `../Balsm-Core/AGENTS.md` — note the structure (12 Flutter packages + 7 .NET modules, boundary lint, core kernel, 3 flavors, 4 sub-processors: Resend, iCloud, Drive, reCAPTCHA)

---

## Dependencies & Execution Order

### Phase order

```
Phase 1 (Setup — .NET solution + Flutter scaffold)
  │
  ▼
Phase 2 (Foundational — .NET infra services + Flutter core kernel + boundary lint)
  │
  ▼
Phase 2.5 (UI/UX Design + Prototype Review) ── BLOCKING GATE: stakeholder sign-off
  │
  ├──► Phase 3 (US1 — Signup & Auth) ────────── P1, blocks everything
  │         │
  │         ├──► Phase 4 (US1a — Handle + Profile) ── P2
  │         ├──► Phase 5 (US2 — Emergency Card) ──── P2
  │         ├──► Phase 6 (US3 — Medications) ─────── P3
  │         ├──► Phase 7 (US4 — Deletion) ────────── P3
  │         └──► Phase 8 (US5 — Lockout) ─────────── P4
  │
  └──► Phase 9 (US6 — Country Change) ────────── P4
          │
          ▼
      Phase 10 (Polish & Cross-Cutting)
```

### Within each user story

- **US1**: .NET auth endpoints (T071-T073d) parallel with Flutter modules (T074-T105). The Flutter auth adapter (T077) depends on the endpoint contracts in `contracts/dotnet-api-endpoints.md`, not on the implementations being deployed.
- **US1a**: .NET handle endpoints (T106-T108) parallel with Flutter profile (T109-T118).
- **US2**: .NET emergency endpoints (T119-T121b) parallel with Flutter emergency_card (T122-T133a).
- **US3**: Flutter-only (T134-T145) — no backend (PHI on-device).
- **US4**: .NET deletion (T146-T150) + .NET sessions (T164a) parallel with Flutter deletion (T151-T158a) + Flutter sessions (T159-T164).
- **US5**: Flutter lockout UI (T165-T167) + .NET status (T167b) + Flutter status (T167c).
- **US6**: .NET country/language (T168-T169) parallel with Flutter screens (T170-T174).

### Parallel opportunities

- Phase 1 strongly parallel across both repos (.NET solution init + Flutter scaffold).
- Phase 2 strongly parallel — .NET infra services (T035bt-by) independent of Flutter core subdirectories.
- Phases 3-6 may run on separate agents after Phase 2.
- Phase 9 depends on auth (re-auth flow) — cannot start before US1.

---

## Implementation strategy

### MVP first (US1 only)

1. Phase 1 + Phase 2 → foundation ready (both repos)
2. Phase 3 US1 → signup-to-home round-trip
3. **Stop and validate**: run SC-001a (T073d backend test + T184 E2E)
4. Demo / ship MVP.

### Incremental delivery

- US1 → signup + disclosure + home
- US1a → handle + health profile
- US2 → emergency card + QR + public page
- US3 → medication reminders offline
- US4 → deletion FSM both paths + sessions
- US5 → lockout + status page
- US6 → country change + RTL
- Polish → CI, E2E, PHI-leak fuzz, completeness

### Parallel team strategy

- Backend team: .NET tasks (T001-T008, T035az-bd, T035bt-by, all `[DotNet]` story tasks)
- Foundation team: Flutter Phase 1 + Phase 2 core kernel
- Dev A: US1 (auth-heavy, both repos)
- Dev B: US1a + US2 (profile + emergency)
- Dev C: US3 (medication scheduler, Flutter-only)
- Dev D: US4 + US5 (deletion + sessions + lockout)
- Dev E: US6 (country/language)

---

## Notes for cheap-model execution

- Each task names the exact file path. Open the file (or create it), apply the named change, do not refactor adjacent code.
- When a task says "extend `<existing file>`", load it first, locate the cited symbol, add the behavior without rewriting unrelated regions.
- Every Flutter module follows the same DDD template (domain/ → application/ → infrastructure/ → presentation/). Copy the pattern from a completed module.
- Every .NET module follows the same template: `Commands/` + `Queries/` (MediatR handlers) → `Domain/` (aggregate) → `Infrastructure/` (EF config). Controllers live in `Balsm.API/Controllers/`. Copy the pattern from the `Auth` module.
- The API contract is authoritative: `contracts/dotnet-api-endpoints.md`. Match request/response shapes exactly so the Flutter adapter (`infrastructure/api/`) and the .NET controller agree.
- All drift PHI table PKs use `UuidV7`; all PHI tables go through SQLCipher (`core.db.AppDatabase`).
- All .NET reads use `AsNoTracking()`; all I/O is async with `CancellationToken`; never `SELECT *` (project to DTOs) — Constitution §VII.
- DOB is encrypted/decrypted ONLY via `DobEncryptionService` (T035bw); every decrypt writes a `UserAccountAuditLog` row.
- `[P]` tasks in the same phase touch different files — safe to run in parallel.
- Test tasks (T073d, T121b, T150, T167a, T175-T188) reference patterns in `core/test_kit/` (Flutter) and `TestWebAppFactory` (.NET) — can be written last per story.
