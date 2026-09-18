---
description: "P001 tasks — Flutter track"
---

# P001 Tasks — Flutter Track

> **Module & Context Scope**: Personal Health (**Core**) → `modules/{profile, medications, emergency_card}`; Identity & Access → `modules/{auth, sessions, account, deletion, disclosure, geofence_block}`; shared kernel → `packages/core`, `app`, `home`, `balsm_boundary_lint`; published language → `packages/balsm_api`. Full mapping: [../tasks.md §Module & Context Scope](../tasks.md) / [../plan.md](../plan.md). Tasks outside these modules require a plan.md mapping update first.


Filtered from `../tasks.md`. Phase + section headers preserved. Only `[Flutter]` rows kept.

Format: `[ID] [P?] [Story?] [Project] Description with absolute file path`


## Phase 1: Setup — Project Initialization

### 1.3 Flutter repo init

- [X] T009 [P] [Flutter] Create `../balsm_app/melos.yaml` — workspace config with packages `['packages/*', 'app']`, scripts for `gen` (parallel build_runner), `analyze` (parallel dart analyze), `test` (parallel flutter test), `e2e` (integration_test)
- [X] T010 [P] [Flutter] Create `../balsm_app/pubspec.yaml` — workspace root pubspec with `name: balsm_app`, `publish_to: none`, dev_dependencies `melos: ^7.0.0`
- [X] T011 [P] [Flutter] Create `../balsm_app/.fvmrc` — pinning Flutter `3.41.9` (latest installed stable; Dart 3.11.5). ⚠ Re-do: bump pin from `3.41.0-stable` → `3.41.9`.
- [X] T012 [P] [Flutter] Create `../balsm_app/packages/core/pubspec.yaml` — `name: core`, dependencies: `flutter`, `drift: ^2.29`, `sqlite3_flutter_libs`, `sqlcipher_flutter_libs`, `dio: ^5.8`, `sentry_flutter: ^9.0`, `flutter_riverpod: ^2.6`, `flutter_local_notifications: ^18.0`, `flutter_secure_storage: ^9.2`, `google_sign_in: ^6.2`, `sign_in_with_apple: ^6.1`, `freezed_annotation`, `json_annotation`, `intl: ^0.20`. **No `supabase_flutter`** (client talks to the .NET API via `dio`, research §32). ⚠ Re-do: drop `supabase_flutter` if already added.
- [X] T013 [P] [Flutter] Create `../balsm_app/packages/core/lib/core.dart` — empty public barrel file with comment `// Re-export all public APIs from src/subdirs`
- [X] T014 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/domain/` — scaffold directory with empty `.gitkeep` files for `aggregates/`, `value_objects/`, `events/`
- [X] T015 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/event_bus/` — scaffold directory with `.gitkeep`
- [X] T016 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/db/` — scaffold directory with `.gitkeep`
- [X] T017 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/network/` — scaffold directory with `.gitkeep`
- [X] T018 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/localization/` — scaffold directory with `.gitkeep`
- [X] T019 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/crash/` — scaffold directory with `.gitkeep`
- [X] T020 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/secure_storage/` — scaffold directory with `.gitkeep`
- [X] T021 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/notifications/` — scaffold directory with `.gitkeep`
- [X] T022 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/kit/` — scaffold directory with `.gitkeep`
- [X] T022a [P] [Flutter] Create `../balsm_app/packages/core/lib/src/deeplink/` — scaffold directory with `.gitkeep` (will hold `DeeplinkRouter` in T133)
- [X] T023 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/test_kit/` — scaffold directory with `.gitkeep`
- [X] T024 [P] [Flutter] Create `../balsm_app/packages/balsm_boundary_lint/pubspec.yaml` — `name: balsm_boundary_lint`, dependencies: `custom_lint_builder`, `analyzer`, `source_span`
- [X] T025 [P] [Flutter] For each of the 10 module packages, create `../balsm_app/packages/{auth,disclosure,home,profile,emergency_card,medications,sessions,account,deletion,geofence_block}/pubspec.yaml` — `name: <name>`, dependencies: `core`, `flutter_riverpod`, `go_router`, `intl`, dev_dependencies: `balsm_boundary_lint`, `mocktail`, `golden_toolkit`
- [X] T026 [P] [Flutter] For each of the 10 module packages, create the DDD layer directory structure: (⚠ rename `lib/src/infrastructure/supabase/` → `lib/src/infrastructure/api/` — now holds .NET API adapters, not Supabase clients)
- [X] T027 [P] [Flutter] Create `../balsm_app/app/pubspec.yaml` — `name: app`, dependencies: `core`, `auth`, `disclosure`, `home`, `profile`, `emergency_card`, `medications`, `sessions`, `account`, `deletion`, `geofence_block`, `flutter_riverpod`, `go_router`
- [X] T028 [P] [Flutter] Create `../balsm_app/app/lib/main.dart` — calls `bootstrap()` then `runApp(BalsmApp())`
- [X] T029 [P] [Flutter] Create `../balsm_app/app/lib/app.dart` — `BalsmApp` StatelessWidget wrapping `ProviderScope` + `MaterialApp.router` with `go_router`
- [X] T030 [P] [Flutter] Create `../balsm_app/app/lib/bootstrap.dart` — registers all repository implementations, drift database, and providers
### 1.4 Flutter Web + deeplinking setup

- [X] T031 [P] [Flutter] Create `../balsm_app/app/web/index.html` — minimal HTML shell, `<base href="/">`, meta viewport, Flutter bootstrap script tag, preload + favicon for PWA install
- [X] T032 [P] [Flutter] Create `../balsm_app/app/web/manifest.json` — PWA manifest with `name: Balsm`, `display: standalone`, theme color, icons (192/512), localized `lang` switch via `<html lang>`
- [X] T033 [P] [Flutter] Update `../balsm_app/app/pubspec.yaml` to enable web target — add `app_links: ^6.3` (universal/app links) and `url_strategy: ^0.3` (path URL strategy, no `#`); confirm `flutter: web: true` in the runner config
- [X] T034 [P] [Flutter] Create `../balsm_app/app/web/.well-known/apple-app-site-association` — JSON binding bundle ID `health.balsm.app` to paths `/emergency/*` and `/account/delete`, served as `application/json` with no extension (iOS Universal Links per AASA spec)
- [X] T035 [P] [Flutter] Create `../balsm_app/app/web/.well-known/assetlinks.json` — Android Digital Asset Links JSON: `relation: ["delegate_permission/common.handle_all_urls"]`, `target.namespace: android_app`, `package_name: health.balsm.app`, `sha256_cert_fingerprints: [...]` (filled by CI from signing config)
- [X] T035a [P] [Flutter] Create `../balsm_app/app/ios/Runner/Runner.entitlements` — add `com.apple.developer.associated-domains` with `applinks:{BASE_URL}` (build-time substituted per FR-216)
- [X] T035b [P] [Flutter] Update `../balsm_app/app/android/app/src/main/AndroidManifest.xml` — add `<intent-filter android:autoVerify="true">` for `https://{BASE_URL}/emergency/*` and `https://{BASE_URL}/account/delete`, `DEFAULT` + `BROWSABLE` categories, `VIEW` action
### 1.5 Build flavors (dev / staging / prod) + multi-server selector

- [X] T035c [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/flavor.dart` — `enum Flavor { dev, staging, prod }`; `class FlavorConfig { final Flavor flavor; final String apiBaseUrl; final String? sentryDsn; final String appNameSuffix; final bool serverSelectorEnabled; }`; `FlavorConfig.current` reads `--dart-define` keys `FLAVOR`, `API_BASE_URL`, `SENTRY_DSN`. ⚠ Re-do: replace `supabaseUrl`/`supabaseAnonKey` with single `apiBaseUrl` (the .NET API needs no anon key).
- [X] T035d [P] [Flutter] Create `../balsm_app/app/lib/main_dev.dart` — entry point: `FlavorConfig.init(Flavor.dev)`, calls `bootstrap()` then `runApp(BalsmApp())`; dev flavor sets `serverSelectorEnabled = true`
- [X] T035e [P] [Flutter] Create `../balsm_app/app/lib/main_staging.dart` — entry point: `FlavorConfig.init(Flavor.staging)`, locks `serverSelectorEnabled = false`
- [X] T035f [P] [Flutter] Create `../balsm_app/app/lib/main_prod.dart` — entry point: `FlavorConfig.init(Flavor.prod)`, locks `serverSelectorEnabled = false`
- [X] T035g [P] [Flutter] Update `../balsm_app/app/lib/main.dart` to delegate to `main_dev.dart` (default for `flutter run` without `-t`); add comment: "Use `flutter run -t lib/main_<flavor>.dart --flavor <flavor>`"
- [X] T035h [P] [Flutter] Update `../balsm_app/app/android/app/build.gradle` — add `productFlavors { dev { applicationIdSuffix ".dev"; manifestPlaceholders = [appNameSuffix: " Dev"] }; staging { applicationIdSuffix ".staging"; manifestPlaceholders = [appNameSuffix: " Staging"] }; prod { applicationIdSuffix ""; manifestPlaceholders = [appNameSuffix: ""] } }`; `flavorDimensions "default"`
- [X] T035i [P] [Flutter] Create `../balsm_app/app/android/app/src/dev/`, `src/staging/`, `src/prod/` resource dirs each with `res/mipmap-*/ic_launcher.png` + `res/values/strings.xml` (`app_name="Balsm Dev/Staging/Balsm"`); dev icon has red corner badge, staging amber, prod clean
- [X] T035j [P] [Flutter] Create iOS xcconfig per flavor at `../balsm_app/app/ios/Flutter/`: `Dev.xcconfig`, `Staging.xcconfig`, `Prod.xcconfig` — each sets `BUNDLE_ID_SUFFIX=.dev/.staging/(empty)`, `APP_NAME_SUFFIX= Dev/ Staging/(empty)`, `ASSETS_PATH=ios/Runner/Assets.xcassets/AppIconDev` etc.
- [X] T035k [P] [Flutter] Update `../balsm_app/app/ios/Runner.xcodeproj/project.pbxproj` to add 3 schemes (`Runner-Dev`, `Runner-Staging`, `Runner-Prod`) each pointing to its xcconfig + entry-point Dart file via `FLUTTER_TARGET`; 3 configurations Debug/Profile/Release × 3 flavors = 9 build configs total
- [X] T035l [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/server_preset.dart` — `class ServerPreset { final String label; final String apiBaseUrl; const ServerPreset({...}); }`; const list `kServerPresets = [ServerPreset(label: "Local", apiBaseUrl: "http://localhost:5000"), ServerPreset(label: "Staging", apiBaseUrl: "https://staging-api.balsm.health"), ServerPreset(label: "Prod", apiBaseUrl: "https://api.balsm.health")]`. ⚠ Re-do: drop `url`/`anonKey` → single `apiBaseUrl`.
- [X] T035m [P] [Flutter] Create `../balsm_app/packages/core/lib/src/config/active_server.dart` — `class ActiveServerStore` wraps `SecureStorage`; methods `read() async → ServerPreset?`, `write(ServerPreset preset) async`, `clear() async`; key `balsm.active_server_preset`; default = `FlavorConfig.current.apiBaseUrl` if no override
- [X] T035n [P] [Flutter] Update `../balsm_app/packages/core/lib/src/network/balsm_api_client.dart` (T050) to read base URL from `ActiveServerStore.read()` at init; expose `Future<void> reconfigure(ServerPreset preset)` that calls `ActiveServerStore.write()` then re-inits the `Dio` base URL; broadcast `ServerReconfigured(preset)` AppEvent on the bus. ⚠ Re-do: target the renamed `balsm_api_client.dart` (was `supabase_client_wrapper.dart`).
- [X] T035o [P] [Flutter] Create dev-only screen at `../balsm_app/packages/core/lib/src/dev/server_selector_screen.dart` — `if (!FlavorConfig.current.serverSelectorEnabled) Navigator.pop()` guard; lists `kServerPresets` + custom URL form; on select calls `BalsmApiClient.reconfigure()`; shows current preset + warning banner "Changing server signs you out"; persisted via `ActiveServerStore`
- [X] T035p [P] [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to conditionally export `dev/server_selector_screen.dart` only when `FlavorConfig.current.flavor == Flavor.dev`; in staging/prod the symbol does not exist (compile-time guarantee via `--dart-define-from-file`)
- [X] T035q [P] [Flutter] Update Sentry init at `../balsm_app/packages/core/lib/src/crash/sentry_init.dart` (T057) to read DSN from `FlavorConfig.current.sentryDsn`; if null (dev flavor) → no `SentryFlutter.init` call, log to stdout instead; release name = `balsm@<version>+<build>-<flavor>`; environment = `flavor.name`
- [X] T035r [P] [Flutter] Create `../balsm_app/.vscode/launch.json` — 3 configurations (Dev, Staging, Prod) each with `args: ["--flavor", "<flavor>", "-t", "lib/main_<flavor>.dart", "--dart-define-from-file=env/<flavor>.json"]`
- [X] T035s [P] [Flutter] Create env files at `../balsm_app/app/env/dev.json`, `env/staging.json`, `env/prod.json` — `{ "FLAVOR": "dev", "API_BASE_URL": "http://localhost:5000", "SENTRY_DSN": "" }`; `env/*.json` gitignored except `env/example.json` checked in. ⚠ Re-do: replace `SUPABASE_URL`/`SUPABASE_ANON_KEY` with `API_BASE_URL`.
- [X] T035t [P] [Flutter] Update `../balsm_app/melos.yaml` — add scripts: `run:dev` = `flutter run -t lib/main_dev.dart --flavor dev --dart-define-from-file=env/dev.json`; same for `run:staging`, `run:prod`; `build:android:<flavor>` = `flutter build apk --flavor <flavor> -t lib/main_<flavor>.dart --dart-define-from-file=env/<flavor>.json`; same for iOS, web
### 1.6 Patient App prototype port — BalsmKit Flutter widgets

- [X] T035u [P] [Flutter] Create `BalsmAppBar` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_app_bar.dart` — ports prototype `.appbar` (56pt, avatar slot, title with `.grow`, action slot for round-btn). Variants: with-avatar (Home), title-only (Trends/Meds), with-back-button (Auth screens)
- [X] T035v [P] [Flutter] Create `BalsmRoundButton` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_round_button.dart` — ports prototype `.round-btn` (40pt circular, transparent background, hover → ink-50 fill, press scale 0.97). Used for back, settings, bell, action icons
- [X] T035w [P] [Flutter] Create `BalsmCard` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_card.dart` — ports prototype `.card` (white bg, border 1px ink-200, radius 14px, padding 16-20px, shadow-sm). Variants: `BalsmCard.standard`, `BalsmCard.accent` (with `--balsm-primary-bg` gradient), `BalsmCard.danger` (`--balsm-danger-bg`), `BalsmCard.cream` (`--balsm-cream-100` bg)
- [X] T035x [P] [Flutter] Create `BalsmHeroCard` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_hero_card.dart` — ports prototype `.hero-card` (accent gradient bg, eyebrow label + h-display title + CTA + clock meta). Variants: `BalsmHeroCard.prompt` (with CTA), `BalsmHeroCard.done` (with checkmark + chevron). Used for Home nudges per P001 home design
- [X] T035y [P] [Flutter] Create `BalsmPill` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_pill.dart` — ports prototype `.pill` with variants `.success` (mint), `.warn` (sun), `.danger` (danger), `.neutral` (ink-100), `.info` (blue). Optional leading dot (6×6 colored circle). Used for medication status, allergy severity, controlled-substance flag
- [X] T035z [P] [Flutter] Create `BalsmListRow` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_list_row.dart` — ports prototype `.list-row` (icon + grow text + chevron-right). RTL flips chevron via `Transform.scale(-1, 1)`. Used in Profile + Settings screens
- [X] T035aa [P] [Flutter] Create `BalsmListCard` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_list_card.dart` — ports prototype `.list-card` (vertically-stacked `BalsmListRow` items with 1px dividers between, no internal padding). Container card wraps list-rows with shared padding
- [X] T035ab [P] [Flutter] Create `BalsmSegmented` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_segmented.dart` — ports prototype `.segmented` (rounded container with N button slots, active slot has `--balsm-primary-bg` background + primary color text). Generic over T option type. Used for language toggle, gender toggle, range tabs
- [X] T035ac [P] [Flutter] Create `BalsmStepDots` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_step_dots.dart` — ports prototype 3-dot step indicator from `AuthHeader` (current dot stretches to 22pt pill, others 7pt circles). Used in auth flow per FR-001
- [X] T035ad [P] [Flutter] Create `BalsmOtpRow` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_otp_row.dart` — ports prototype `.otp-row` with 6 `.otp-box` (48×56pt boxes, mono font, auto-advance on input, paste-fill all, hidden TextField backing). Auto-submits via callback on 6th digit fill. Used for FR-001 + FR-302 OTP confirm
- [X] T035ae [P] [Flutter] Create `BalsmField` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_field.dart` — ports prototype `.field` (label above input, input 56pt height, label 13pt + 600 weight, error state with `--balsm-danger` border + helper text below). Variants: text, email, numeric, date (DD/MM/YYYY mask), dropdown
- [X] T035af [P] [Flutter] Create `BalsmMetricGrid` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_metric_grid.dart` — ports prototype `.metric-grid` (2×2 grid of `.metric` tiles with icon-label + value + unit + optional trend arrow). **P001 use**: home today-summary card (next dose, taken count, missed count) — NOT the prototype's BP/glucose/mood/pain (those are P002 trends)
- [X] T035ag [P] [Flutter] Create `BalsmMedRow` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_med_row.dart` — ports prototype `.med-row` (40pt icon with tone-coded background + name + dose + status pill OR action button). Tone enum: `info` (petal-blue), `controlled` (petal-violet per FR-020), `success` (mint). Used on `meds-list` and `home` today summary
- [X] T035ah [P] [Flutter] Create `BalsmAvatar` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_avatar.dart` — ports prototype `.avatar` (circle with patient initials in white, background = passed color). Used in home greeting + profile head. Per P001 directive 2026-06-14 (no photo avatars, initials of first + last name)
- [X] T035ai [P] [Flutter] Create `BalsmTrustStrip` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_trust_strip.dart` — ports prototype `.trust` (3 evenly-spaced trust icons + labels along bottom of welcome screen). P001 use: 3 icons = `shield-check` (on-device) + `user-check` (private) + `wifi-off` (offline-ready)
- [X] T035aj [P] [Flutter] Create `BalsmWelcomeBackground` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_welcome_background.dart` — ports prototype welcome `.wbg` (watercolor petal pattern at top-right with gradient fade to surface). Asset `Balsm-Core/brand/balsm-background.png` — must be copied into `core/assets/brand/` and referenced via `package:core/assets/brand/balsm-background.png`
- [X] T035ak [P] [Flutter] Create `BalsmBottomNav` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_bottom_nav.dart` — ports prototype `.tabbar` STRUCTURE but with P001 5-slot order: `[Home, Card, Meds, Sessions, Settings]` (no Trends, no center FAB per P001 scope). Each slot 60pt min-height with icon 22pt + label 11pt. Active state: icon weight 2.1 stroke + primary color + 3pt top indicator pill
- [X] T035al [P] [Flutter] Create `BalsmIcon` SVG wrapper at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_icon.dart` — wraps `lucide_icons` Flutter package per design.md §8 (Lucide outline 1.75pt default, 2pt emphasis, sizes 16/20/24). Standardize icon usage across the app. Add `lucide_icons ^0.x` to `core/pubspec.yaml`
- [X] T035am [P] [Flutter] Create `BalsmMoodFace` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_mood_face.dart` — ports prototype `MoodFace` (SVG drawn from arcs, no emoji per design.md §3). **Not used in P001** (no daily check-in) but lift for P002 forward-compat — gated behind a comment "Not wired in P001"
- [X] T035an [P] [Flutter] Create `BalsmLogoMark` widget at `../balsm_app/packages/core/lib/src/kit/widgets/balsm_logo_mark.dart` — renders the Balsm mark from `Balsm-Core/brand/logo-vertical.svg` via `flutter_svg ^2.0`. Variants: `BalsmLogoMark.small` (24pt), `BalsmLogoMark.medium` (56pt), `BalsmLogoMark.large` (96pt), `BalsmLogoMark.spinner` (animated 4s linear rotate for loading per design.md §6 motion). Add `flutter_svg ^2.0` dep
- [X] T035ao [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export all BalsmKit widgets (T035u..T035an) under a single barrel `balsm_kit.dart` import
- [X] T035ap [P] [Flutter] Create golden test for each BalsmKit widget at `../balsm_app/packages/core/test/kit/<widget>_golden_test.dart` — RTL + LTR + light + dark variants × en + ar-EG locales = 8 golden images per widget. Uses `golden_toolkit` from T067

**Checkpoint**: BalsmKit ready. Phase 3+ implementation tasks compose these widgets rather than reinvent. Each US screen task in `tasks.md` § Phase 3-9 should be updated to cite the BalsmKit widget it consumes.

### 1.7 Patient App-aligned absorption — Q1-Q5 (Session 2026-06-17)

- [X] T035aq [P] [Flutter] Create `core/lib/src/config/recaptcha_adapter.dart` — wraps `flutter_recaptcha_enterprise` SDK (or platform-channel implementation). Exposes `Future<String?> getToken(String action)` returning reCAPTCHA token for assessment. Lazy-loaded on first invocation to keep cold start budget. Per Q2 FR-045c.
- [X] T035ar [P] [Flutter] Add `permission_handler ^11.x` to `../balsm_app/packages/core/pubspec.yaml`. Per Q3 FR-017a.
- [X] T035as [P] [Flutter] Create `core/lib/src/notifications/permission_state.dart` — `enum NotificationPermissionState { granted, denied, provisional, notRequested }`. Riverpod provider `notificationPermissionStateProvider` reads `Permission.notification.status` on app foreground. Per Q3 FR-017a.
- [X] T035at [P] [Flutter] Create `core/lib/src/notifications/permission_change_event.dart` — `class NotificationPermissionChanged extends AppEvent` with fields `previousState` + `newState`. Emitted by permission state provider when transition detected. Per Q3 FR-017a.
- [X] T035au [P] [Flutter] Create `core/lib/src/backup/backup_adapter.dart` — abstract interface `BackupAdapter { Future<void> upload(Uint8List blob, String key); Future<Uint8List?> download(String key); Future<bool> hasBackup(String key); }`. Per Q1 FR-009a (yesterday) — re-affirmed by Q4 FR-009c today.
- [X] T035av [P] [Flutter] Create `core/lib/src/backup/icloud_backup_adapter.dart` (iOS) and `core/lib/src/backup/drive_backup_adapter.dart` (Android) implementations of `BackupAdapter`. Use `cloud_kit` (iOS) and `googleapis ^13` + `googleapis_auth ^1.6` (Android) packages. iOS path: `iCloud.health.balsm.app/Documents/balsm/backup.blob.aes`. Android: AppDataFolder scope `appDataFolder/balsm-backup.blob.aes`. Per Q1 FR-009a (yesterday).
- [X] T035aw [P] [Flutter] Create `core/lib/src/backup/backup_key_derivation.dart` — `Future<Uint8List> deriveKey(String otpToken, String deviceSecret)` returns a 32-byte key via Argon2id. Uses `cryptography ^2.7` package (memoryCost: 65536, iterations: 3, parallelism: 1, lanes: 1, outputLength: 32). Per Q1 FR-009a (yesterday).
- [X] T035ax [P] [Flutter] Create `core/lib/src/backup/backup_debouncer.dart` — Riverpod `KeepAlive` `backupDebouncerProvider` that listens to mutation events on the event bus and triggers `BackupAdapter.upload()` after a 1-hour debounce window. Force-uploads on: app background (`AppLifecycleState.paused`), sign-out, and on critical events (`DoseTaken`, `MedicationAdded`, `DeletionRequested`). Per Q4 FR-009c.
- [X] T035ay [P] [Flutter] Create `core/lib/src/backup/concurrent_conflict_resolver.dart` — `mergeAggregate({existing, incoming})` returns the aggregate with `max(updated_at)` (last-writer-wins for HealthProfile + Medication). For `DoseEvent` stream: returns the UNION of both streams with duplicate-detection on `(medication_id, scheduled_at, outcome)` within ±5 min — duplicates flagged but both kept. Per Q4 FR-009d, FR-009e.
- [X] T035be [P] [Flutter] [US1] Create `auth/lib/src/presentation/screens/auth_under_eighteen_screen.dart` — soft-block screen for under-18 signups. Localized title + body + "Notify me when available" CTA + back-to-welcome. Per Q1 FR-301a. Composes BalsmKit widgets from §1.6.
- [X] T035bf [P] [Flutter] [US1] Create `auth/lib/src/application/use_cases/age_gate_use_case.dart` — accepts `DateOfBirth` value object, validates ≥18 years on signup; age-gated actions are enforced server-side by the .NET `AgeGatePolicy` inside `POST /emergency-qr/mint` and medication-add (.NET endpoint — post-pivot; there is no standalone `age-gate-check` endpoint). Throws `UnderageException` to caller. NOTE: deletion intake is NOT age-gated (erasure is a data-subject right — see SEC-F remediation). Per Q1 FR-301a/b.
- [X] T035bg [P] [Flutter] [US5] Create `auth/lib/src/presentation/screens/auth_recovery_explainer_screen.dart` — entered from lockout (T166) / 404 footer. Explains the manual recovery procedure (mailto:support@balsm.health) and what's required from the user (2 of 4 verification facts). Per Q5 FR-046c.
- [X] T035bh [P] [Flutter] [US5] Create `auth/lib/src/presentation/screens/auth_recovery_claim_screen.dart` — entered via deep link from the support-sent recovery email. Accepts `?token=` query param. Validates with `POST /auth/recovery/claim` (.NET endpoint — post-pivot, replaces `account-recover-claim` Edge Function). On success: navigates to home; on failure: shows localized error with mailto fallback. Per Q5 FR-046d.
- [X] T035bi [P] [Flutter] [US5] Create `auth/lib/src/application/use_cases/recovery_claim_use_case.dart` — orchestrates the recovery-claim flow: validates the recovery token, surfaces compliance copy ("This will not restore your on-device data per FR-046e"), and on user confirm calls `POST /auth/recovery/claim` (.NET endpoint — post-pivot). Per Q5 FR-046d, FR-046e.
- [X] T035bj [P] [Flutter] [US3] Update T138 (`medication_scheduler.dart`) — read `notificationPermissionStateProvider` before scheduling; when state is `denied`, skip scheduling and rely on `meds.today` fallback per Q3 FR-017c. When state transitions `denied → granted`, force-reschedule next 30 days of OS triggers.
- [X] T035bk [P] [Flutter] [US3] Update T139 (`missed_dose_detector.dart`) — apply detection more aggressively when permission denied (every app-foreground check, not just first-of-day). Per Q3 FR-017a + missed-dose fallback.
- [X] T035bl [P] [Flutter] [US3] Create `medications/lib/src/presentation/widgets/permission_request_sheet.dart` — non-blocking bottom sheet shown at most once per 14-day rolling window when permission denied AND user has ≥1 medication added. Tracked via `flutter_secure_storage` key `notification_permission_resheet_last_shown_at`. Per Q3 FR-017b.
- [X] T035bm [P] [Flutter] [US3] Update T145 (notification-tap handler in `app.dart`) — deep-link payload routes to `meds.today` with `?highlightDoseId=<id>` query param so the today screen scrolls to + highlights the due dose. Per Q2 (yesterday) FR-018a.
- [X] T035bn [P] [Flutter] [US3] Create `medications/lib/src/presentation/widgets/dedup_banner.dart` — non-blocking banner shown on `meds.today` when restore-time dedup detected (FR-009e). Copy: "Some dose entries appeared twice and were merged. Review your today list." Dismissible. Per Q4 FR-009e.
- [X] T035bp [Flutter] Update `../balsm_app/packages/auth/lib/auth.dart` public barrel to re-export the new use cases + screens from T035be..T035bi
- [X] T035bq [Flutter] Update `../balsm_app/packages/medications/lib/medications.dart` public barrel to re-export `permission_request_sheet.dart` + `dedup_banner.dart` from T035bl + T035bn
- [X] T035br [Flutter] Create runbook at `../docs/runbooks/account-recovery.md` — operational guide for support staff: verification floor (2 of 4 facts), token-issuance procedure, 30-day cooling-off communication template, audit-log requirements (PDPL data-minimization). Per Q5 (research.md §24). NOT a Flutter file; place under repo `docs/runbooks/`.

## Phase 2: Foundational — Core Shared Kernel (Blocking Prerequisites)

### 2.1 Core: domain value objects

- [X] T036 [P] [Flutter] Create `UuidV7` value object at `../balsm_app/packages/core/lib/src/domain/value_objects/uuid_v7.dart` — 16-byte RFC 9562 UUID v7 with `.timestamp` accessor, `UuidV7.generate()` factory, JSON serialization
- [X] T037 [P] [Flutter] Create `CountryCode` value object at `../balsm_app/packages/core/lib/src/domain/value_objects/country_code.dart` — ISO 3166-1 alpha-2 wrapper with `.isDenied` check against injected denied-list, `.defaultTimezone` IANA zone resolution, `ar-SA` / `ar-EG` / `ar-AE` / `en` locale mapping
- [X] T038 [P] [Flutter] Create `Bcp47Tag` value object at `../balsm_app/packages/core/lib/src/domain/value_objects/bcp47_tag.dart` — language tag with `.isFirstClass` (true for `ar-EG`, `ar-SA`, `ar-AE`, `en`), `.fallback` to `en`, `.isRtl`
- [X] T039 [P] [Flutter] Create `Iso8601Timestamp` value object at `../balsm_app/packages/core/lib/src/domain/value_objects/iso8601_timestamp.dart` — UTC milliseconds wrapper with `.toDateTime`, `.toIso8601String`, `.fromDateTime` factory
- [X] T040 [P] [Flutter] Create `AppResult<T>` at `../balsm_app/packages/core/lib/src/domain/app_result.dart` — `Result<T>` type with `.isSuccess`, `.isFailure`, `.value`, `.error`, static factories `Result.success(T)`, `Result.failure(AppFailure)`
- [X] T041 [P] [Flutter] Create `AppFailure` sealed class at `../balsm_app/packages/core/lib/src/domain/app_failure.dart` — `ValidationFailure(String message)`, `NotFoundFailure`, `ConflictFailure`, `UnauthorizedFailure`, `NetworkFailure`, `StorageFailure`
- [X] T042 [P] [Flutter] Create `AppEvent` base sealed class at `../balsm_app/packages/core/lib/src/domain/events/app_event.dart` — abstract `String get eventName`, `Map<String, dynamic> toJson()`
- [X] T043 [P] [Flutter] Create `Money` value object at `../balsm_app/packages/core/lib/src/domain/value_objects/money.dart` — currency code + minor units, EGP / SAR / AED / default-class factory constructors
- [X] T044 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export all 8 value objects + `AppResult` + `AppFailure` + `AppEvent`
### 2.2 Core: event bus

- [X] T045 [P] [Flutter] Create `EventBus` at `../balsm_app/packages/core/lib/src/event_bus/event_bus.dart` — `Stream<AppEvent>` pub/sub via `StreamController.broadcast()`, `publish(AppEvent event)`, `Stream<AppEvent> get events`, Riverpod provider `eventBusProvider`
- [X] T046 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export `EventBus` and `eventBusProvider`
### 2.3 Core: drift database root

- [X] T047 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/db/app_database.dart` — drift `AppDatabase` class with SQLCipher encryption key from `flutter_secure_storage`, WAL mode PRAGMAs, migration runner, `@Database` annotation including all module table classes as the database grows
- [X] T048 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/db/uuid_v7_converter.dart` — `TypeConverter<UuidV7, Uint8List>` for drift BLOB columns
- [X] T049 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export `AppDatabase` and `uuidV7Converter`
### 2.4 Core: network + .NET API client

- [X] T050 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/network/balsm_api_client.dart` — anti-corruption layer over `Dio`. Base URL from `ActiveServerStore`/`FlavorConfig`. Auth interceptor attaches `Authorization: Bearer <accessToken>`, auto-refreshes via `POST /auth/refresh` on 401 (retry once), persists tokens via secure storage. ⚠ Re-do: renamed from `supabase_client_wrapper.dart`; wraps `Dio` not `SupabaseClient` (research §32).
- [X] T051 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/network/phi_leak_interceptor.dart` — Dio interceptor that scrubs request/response body fields matching the allowlist from `contracts/crash-allowlist.json` before any logging/transport
- [X] T052 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/network/dio_client_provider.dart` — Riverpod provider `dioClientProvider` returning a `Dio` instance with `PhiLeakInterceptor` + auth interceptor, base URL from `BalsmApiClient`. ⚠ Re-do: base URL source is `BalsmApiClient` (was `SupabaseClientWrapper`).
- [X] T053 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export network layer
### 2.5 Core: localization + country + translation catalog

- [X] T054 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/localization/translation_catalog.dart` — `TranslationCatalog` class loading JSON bundles from `assets/i18n/{locale}.json`, `String translate(String key, {String? locale})`, `bool hasTranslation(String key, String locale)`, Riverpod provider `translationCatalogProvider`
- [X] T055 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/localization/country_registry.dart` — `CountryRegistry` with country metadata: ISO code, default IANA timezone, first-class BCP 47 tags, Gregorian-only calendar flag, phone format hint, national-ID validator per FR-211, supervisory authority name per FR-219
- [X] T056 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export localization layer
### 2.6 Core: crash reporting (Sentry)

- [X] T057 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/crash/sentry_init.dart` — `initSentry()` function calling `SentryFlutter.init` with `beforeSend` callback that scrubs all non-allowlisted fields per `contracts/crash-allowlist.json`, `beforeBreadcrumb` similar scrub, `environment` from build flavor
- [X] T058 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export `initSentry`
### 2.7 Core: secure storage wrapper

- [X] T059 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/secure_storage/secure_storage_wrapper.dart` — wraps `flutter_secure_storage`, typed methods `readToken(String key)`, `writeToken(String key, String value)`, `deleteToken(String key)`, `clearAll()`, Riverpod provider `secureStorageProvider`
- [X] T060 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export secure storage wrapper
### 2.8 Core: notifications wrapper

- [X] T061 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/notifications/notification_service.dart` — wraps `FlutterLocalNotificationsPlugin`, `initialize()` with Android + iOS channel config, `zonedSchedule(int id, String title, String body, TZDateTime dateTime, ...)` for medication reminders, `cancel(int id)`, `cancelAll()`, Riverpod provider `notificationServiceProvider`
- [X] T062 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export notification service
### 2.9 Core: shared widgets + theme + RTL

- [X] T063 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/kit/theme.dart` — `BalsmTheme` with light + dark `ThemeData`, typography scale, color palette, `RtlWrapper` widget that flips `Directionality` based on `Bcp47Tag.isRtl`
- [X] T064 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/kit/shared_widgets.dart` — `BalsmButton`, `BalsmTextField` (with Arabic numeral normalization per FR-213), `BalsmCountryPicker`, `BalsmLoadingIndicator`, `BalsmErrorBanner`
- [X] T065 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export kit layer
### 2.10 Core: test kit

- [X] T066 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/test_kit/fakes.dart` — `FakeEventBus`, `FakeBalsmApiClient`, `FakeSecureStorage`, `FakeNotificationService`, `FakeTranslationCatalog`, `FakeCountryRegistry` — all gated by `bool.fromEnvironment('DEV')`. ⚠ Re-do: `FakeBalsmApiClient` replaces `FakeSupabaseClientWrapper`.
- [X] T067 [P] [Flutter] Create `../balsm_app/packages/core/lib/src/test_kit/golden_helpers.dart` — `goldenTest(String name, Widget widget)` helper wrapping `golden_toolkit` with RTL + LTR variants
- [X] T068 [Flutter] Update `../balsm_app/packages/core/lib/core.dart` to re-export test_kit gated on `bool.fromEnvironment('DEV')`
- [X] T069 [Flutter] Update `../balsm_app/app/lib/main.dart` to call `initSentry()` before `bootstrap()`
### 2.11 Boundary lint rules

- [X] T070 [P] [Flutter] Create 6 custom_lint rule files at `../balsm_app/packages/balsm_boundary_lint/lib/src/rules/`:

**Checkpoint**: foundation ready. All user stories below may now proceed with core shared kernel available.


## Phase 2.5: UI/UX Design & Prototype Review (Blocking Gate)

### 2.5.1 Design spec + screen inventory

- [X] D001 [Flutter] Create `design/UI-SPEC.md` — design contract for P001: imports `Balsm-Core/brand/colors_and_type.css` as token source, lists every screen mapped to FRs + SCs, locks typography scale (Display / Body / Caption), spacing scale (4/8/12/16/24/32), radii (sm/md/lg/full), motion (durations + curves), elevation, RTL mirroring rules, dark-mode contrast targets WCAG AA, focus-ring spec
- [X] D002 [Flutter] Create `design/SCREEN-INVENTORY.md` — table mapping every screen (CountryPicker, EmailSignUp, OtpVerification, SocialSignIn, ConsolidatedDisclosure, Home, HandleClaim, HealthProfileEditor, EmergencyCard, QrCodeDisplay, PublicEmergencyResolve, MedicationList, AddMedication, TodayScreen, DoseHistory, DeleteAccount, DeletionConfirm, DeletionCancelled, PublicDelete, Sessions, CountrySettings, LanguageSettings, Lockout, NotFound) to: user story, FR, SC, RTL-mirror notes, accessibility notes
- [X] D003 [Flutter] Create `design/COMPONENT-CONTRACT.md` — for every shared widget from `core/kit/shared_widgets.dart` (BalsmButton, BalsmTextField, BalsmCountryPicker, BalsmLoadingIndicator, BalsmErrorBanner, BalsmCard, BalsmListItem, BalsmDialog, BalsmBottomSheet, BalsmAppBar, BalsmBottomNav, BalsmFab) — states (default/hover/focus/active/disabled/loading/error), token bindings, RTL behavior, a11y label requirements
### 2.5.2 High-fidelity mock generation

- [X] D004 [P] [Flutter] Create `design/mocks/auth/` HTML mocks for US1 — 4 screens (country picker, email signup, OTP verification, social sign-in) × 2 dirs (LTR-en, RTL-ar) × 2 themes (light, dark) = 16 HTML files using `brand/colors_and_type.css` tokens, no JS frameworks
- [X] D005 [P] [Flutter] Create `design/mocks/disclosure/` — consolidated disclosure screen (long-scroll) × LTR/RTL × light/dark = 4 files; per-country supervisory authority strings (Egypt PDPC, KSA SDAIA, UAE Data Office) per FR-219
- [X] D006 [P] [Flutter] Create `design/mocks/home/` — Home empty state, Home with nudges (handle, emergency card, meds), Home filled = 3 screens × LTR/RTL × light/dark = 12 files
- [X] D007 [P] [Flutter] Create `design/mocks/profile/` — HealthProfileEditor sections (blood type, allergies list, allergy add modal, conditions, emergency contacts), HandleClaim with live validation states = 6 screens × LTR/RTL × light/dark = 24 files; Arabic numeral normalization preview per FR-213
- [X] D008 [P] [Flutter] Create `design/mocks/emergency_card/` — EmergencyCard view, TTL picker, QrCodeDisplay, PublicEmergencyResolve (browser variant), revoked-token state, lock-screen widget previews (iOS WidgetKit + Android tile) = 7 screens × LTR/RTL × light/dark = 28 files
- [X] D009 [P] [Flutter] Create `design/mocks/medications/` — MedicationList empty + filled, AddMedication (schedule shape picker: daily/weekly/custom), DoseHistory, TodayScreen with missed-dose banner, timezone-shift modal per FR-023, notification preview = 7 screens × LTR/RTL × light/dark = 28 files
- [X] D010 [P] [Flutter] Create `design/mocks/deletion/` — DeleteAccount pre-confirmation (FR-031 retained/deleted/wiped data list), DeletionConfirm, DeletionCancelled, PublicDelete (browser variant), PublicDeleteCancelled, PostDeletionLogin = 6 screens × LTR/RTL × light/dark = 24 files
- [X] D011 [P] [Flutter] Create `design/mocks/sessions/` — Sessions list (multiple devices), per-device detail, "Sign out everywhere" confirm = 3 screens × LTR/RTL × light/dark = 12 files
- [X] D012 [P] [Flutter] Create `design/mocks/country_lang/` — CountrySettings, LanguageSettings, country-change re-auth, re-disclosure with new authority = 4 screens × LTR/RTL × light/dark = 16 files
- [X] D013 [P] [Flutter] Create `design/mocks/auth_states/` — Lockout countdown screen, geofence-blocked screen, network-error, OTP-expired = 4 screens × LTR/RTL × light/dark = 16 files
- [X] D014 [P] [Flutter] Create `design/mocks/system/` — NotFound (FR-404), error-boundary, splash, onboarding loading = 4 screens × LTR/RTL × light/dark = 16 files
### 2.5.3 Interactive prototype

- [X] D015 [Flutter] Create `design/prototype/index.html` — interactive shell wrapping all mocks: left nav (US flows), iOS device frame (reuse `Balsm-Core/brand/design-system/balsm_app/ios-frame.jsx` skeleton), RTL/LTR toggle, theme toggle, locale dropdown (`en`, `ar-EG`, `ar-SA`, `ar-AE`), country dropdown for re-disclosure variants
- [X] D016 [Flutter] Create `design/prototype/flows.json` — declarative flow graph: each US flow as ordered list of screen IDs + edge labels (tap targets), driving the prototype's "Next/Back" controls
- [X] D017 [Flutter] Create `design/prototype/assets/data.json` — synthetic non-PHI placeholder data (fictional names, no real numbers; matches `phi_leak_fuzz_test/corpus.dart` shape so designers and devs share fixtures)
- [X] D018 [P] [Flutter] Create `design/prototype/styles/prototype.css` — prototype chrome (nav, toolbar, frame) using same `brand/colors_and_type.css` tokens; does NOT override component styles
- [X] D019 [P] [Flutter] Create `design/prototype/scripts/prototype.js` — minimal vanilla JS: route to mock via hash, toggle dir/theme/locale via `<html dir>` + `data-theme` + `lang` attributes (no frameworks)
### 2.5.4 Review gate + sign-off

- [X] D020 [Flutter] Create `design/REVIEW-CHECKLIST.md` — 6-pillar checklist (visual hierarchy, motion + interaction, accessibility WCAG AA, RTL + locale, brand fidelity, edge states + errors) per screen, used by reviewers; reuse `gsd-ui-auditor` rubric shape
- [X] D021 [Flutter] Create `design/REVIEW-SIGNOFF.md` — empty signoff doc with stakeholder rows (PM, design lead, eng lead, compliance lead), per-flow approval columns, comments column, date column
- [X] D022 [Flutter] Run `design/prototype/index.html` review session — collect comments, file findings under `design/findings/<date>.md`, resolve or defer; second-pass mocks updated in place
- [X] D023 [Flutter] Update `design/REVIEW-SIGNOFF.md` with signatures + date — **gate unlocks Phase 3+ implementation**. Tasks T071+ may NOT start until this file shows all stakeholders signed
- [X] D024 [P] [Flutter] Export design tokens snapshot at `design/tokens-snapshot.json` — JSON dump of every token used (locked at sign-off time) so Flutter implementation can compare against expected values in a CI check
### 2.5.5 Optional design enhancements

- [X] D025 [P] [Flutter] Create `design/MOTION-SPEC.md` — per-screen motion specs (page transitions, modal enter/exit, list-item stagger, QR reveal, OTP shake on error) with durations + curves anchored to `brand/colors_and_type.css` motion tokens
- [X] D026 [P] [Flutter] Create `design/A11Y-SPEC.md` — VoiceOver / TalkBack labels per screen, focus order, touch target ≥44pt, contrast pairs verified, reduced-motion alternates, font scaling up to 200%
- [X] D027 [P] [Flutter] Create `design/COPY-SPEC.md` — UX writing per screen anchored on `brand/balsm-brand-canvas.md` voice + tone; localizations for `en`, `ar-EG`, `ar-SA`, `ar-AE`; feeds the i18n bundle creation at T100

**Checkpoint**: design spec + prototype reviewed + signed off by all stakeholders. `tokens-snapshot.json` locked. Implementation phases 3-9 may proceed referencing finalized mocks + spec.


## Phase 3: US1 — Signup & Auth (Priority: P1)

### 3.2 Flutter: auth module

- [X] T074 [P] [Flutter] [US1] Create `auth` aggregate `AuthSession` at `../balsm_app/packages/auth/lib/src/domain/aggregates/auth_session.dart` — sealed state: `Unauthenticated`, `Authenticated(userId, email, provider, sessionToken)`, `LockedOut(until, identifier)`
- [X] T075 [P] [Flutter] [US1] Create `auth` domain events at `../balsm_app/packages/auth/lib/src/domain/events/` — `UserSignedUp(userId, email, provider, countryCode)`, `UserSignedIn(userId, email, provider)`, `UserSignedOut(userId)`, `LockoutTriggered(identifier, lockedUntil)`
- [X] T076 [P] [Flutter] [US1] Create `auth` `ReadAuthRepository` interface at `../balsm_app/packages/auth/lib/src/domain/repositories/read_auth_repository.dart` — `Stream<AuthSession> watchSession()`
- [X] T077 [P] [Flutter] [US1] Create `auth` API adapter at `../balsm_app/packages/auth/lib/src/infrastructure/api/balsm_auth_adapter.dart` — implements auth operations via `core`'s `BalsmApiClient`, calling .NET endpoints `POST /auth/otp/request`, `/auth/otp/verify`, `/auth/google`, `/auth/apple`, `/auth/refresh`, `/auth/sign-out`; persists tokens via secure storage. Replaces `supabase_auth_adapter.dart`.
- [X] T078 [P] [Flutter] [US1] Create `auth` signup use case at `../balsm_app/packages/auth/lib/src/application/use_cases/sign_up_use_case.dart` — accepts `email | google | apple` + `countryCode`; geofence is enforced server-side at the auth endpoints (`POST /auth/otp/request` → 403 GeofenceBlocked, likewise `/auth/google`, `/auth/apple`) and the pair is issued by `POST /auth/{otp/verify,google,apple}` (.NET endpoints — post-pivot, replace `geofence-check` + `auth-gate` Edge Functions); dispatches `UserSignedUp` event
- [X] T079 [P] [Flutter] [US1] Create `auth` sign-in use case at `../balsm_app/packages/auth/lib/src/application/use_cases/sign_in_use_case.dart` — accepts `email | google | apple` + `countryCode`, handles lockout state, dispatches `UserSignedIn` event
- [X] T080 [P] [Flutter] [US1] Create `auth` sign-out use case at `../balsm_app/packages/auth/lib/src/application/use_cases/sign_out_use_case.dart` — calls `signOut`, dispatches `UserSignedOut`
- [X] T081 [P] [Flutter] [US1] Create `auth` providers at `../balsm_app/packages/auth/lib/src/presentation/providers/auth_providers.dart` — `authSessionProvider` (StreamProvider), `signUpProvider`, `signInProvider`, `signOutProvider`
- [X] T082 [P] [Flutter] [US1] Create `auth` screens at `../balsm_app/packages/auth/lib/src/presentation/screens/` — `CountryPickerScreen`, `EmailSignUpScreen`, `OtpVerificationScreen`, `SocialSignInScreen`
- [X] T083 [P] [Flutter] [US1] Create `auth` routes at `../balsm_app/packages/auth/lib/src/presentation/routes.dart` — `StatefulShellRoute` fragment with named routes `auth.countryPicker`, `auth.emailSignUp`, `auth.otpVerification`, `auth.socialSignIn`
- [X] T084 [Flutter] [US1] Update `../balsm_app/packages/auth/lib/auth.dart` public barrel to export use cases, read repository interface, domain events, routes
### 3.3 Flutter: disclosure module

- [X] T085 [P] [Flutter] [US1] Create `disclosure` aggregate `DisclosureAcceptance` at `../balsm_app/packages/disclosure/lib/src/domain/aggregates/disclosure_acceptance.dart` — properties: `disclosureId`, `version`, `countryCodeAtAccept`, `supervisoryAuthorityNameAtAccept`, `preferredLanguageAtAccept`, `acceptedAt`
- [X] T086 [P] [Flutter] [US1] Create `disclosure` domain event `DisclosureAccepted` at `../balsm_app/packages/disclosure/lib/src/domain/events/disclosure_accepted.dart`
- [X] T087 [P] [Flutter] [US1] Create `disclosure` use case at `../balsm_app/packages/disclosure/lib/src/application/use_cases/accept_disclosure_use_case.dart` — persists on-device disclosure_acceptance row + syncs cloud mirror via `POST /disclosure/accept` (BalsmApiClient)
- [X] T088 [P] [Flutter] [US1] Create `disclosure` drift DAO at `../balsm_app/packages/disclosure/lib/src/infrastructure/drift/disclosure_dao.dart` — `insert(DisclosureAcceptance)`, `watchAcceptance(disclosureId, version)`
- [X] T089 [P] [Flutter] [US1] Create `disclosure` screens at `../balsm_app/packages/disclosure/lib/src/presentation/screens/` — `ConsolidatedDisclosureScreen` rendering the consolidated onboarding disclosure (localized per FR-040, RTL per preferred language)
- [X] T090 [P] [Flutter] [US1] Create `disclosure` routes at `../balsm_app/packages/disclosure/lib/src/presentation/routes.dart` — `disclosure.onboarding` route
- [X] T091 [Flutter] [US1] Update `../balsm_app/packages/disclosure/lib/disclosure.dart` public barrel
### 3.4 Flutter: geofence_block module

- [X] T092 [P] [Flutter] [US1] Create `geofence_block` read-side repository at `../balsm_app/packages/geofence_block/lib/src/domain/repositories/read_denied_countries_repository.dart` — `Future<bool> isDenied(String countryCode)` (client-side hint for the picker only; the authoritative geofence decision is server-side at the auth endpoints — .NET, post-pivot, replaces `geofence-check` Edge Function), `Stream<List<String>> watchDeniedCountryCodes()` from cloud or cached list
- [X] T093 [P] [Flutter] [US1] Create `geofence_block` domain event `BlockedSignupAttempted(countryCode, source)` at `../balsm_app/packages/geofence_block/lib/src/domain/events/blocked_signup_attempted.dart`
- [X] T094 [Flutter] [US1] Update `../balsm_app/packages/geofence_block/lib/geofence_block.dart` public barrel
### 3.5 Flutter: home module skeleton

- [X] T095 [P] [Flutter] [US1] Create `home` screens at `../balsm_app/packages/home/lib/src/presentation/screens/` — `HomeScreen` showing user display_name, nudge cards (complete emergency card, medication reminders placeholder), country/language info
- [X] T096 [P] [Flutter] [US1] Create `home` routes at `../balsm_app/packages/home/lib/src/presentation/routes.dart` — `home` as initial route after auth
- [X] T097 [Flutter] [US1] Update `../balsm_app/packages/home/lib/home.dart` public barrel
### 3.6 Flutter: app shell composition

- [X] T098 [Flutter] [US1] Compose `go_router` in `../balsm_app/app/lib/router.dart` — import route fragments from every module, compose auth guard (redirect unauthenticated to `auth.countryPicker`), shell route for authenticated screens with bottom nav
- [X] T099 [Flutter] [US1] Wire `bootstrap()` in `../balsm_app/app/lib/bootstrap.dart` — register all repository implementations for auth, disclosure, geofence_block, home; call `AppDatabase` init
- [X] T100 [Flutter] [US1] Create i18n JSON translation bundles at `../balsm_app/packages/core/assets/i18n/` — `en.json`, `ar-EG.json`, `ar-SA.json`, `ar-AE.json` — with all keys for signup screens, disclosure text, country picker, home, error messages (at least 98% completeness per SC-203)
### 3.7 Flutter: account module (signup creates row)

- [X] T101 [P] [Flutter] [US1] Create `account` value objects at `../balsm_app/packages/account/lib/src/domain/value_objects/` — `AccountSummary(id, handle, displayName, countryCode, preferredLanguage, deletionState)` read-only projection
- [X] T102 [P] [Flutter] [US1] Create `account` domain events at `../balsm_app/packages/account/lib/src/domain/events/` — `CountryChanged(userId, oldCountry, newCountry)`, `LanguageChanged(userId, oldLanguage, newLanguage)`
- [X] T103 [P] [Flutter] [US1] Create `account` read repository interface at `../balsm_app/packages/account/lib/src/domain/repositories/read_account_repository.dart` — `Future<AccountSummary?> getAccount(String userId)`, `Stream<AccountSummary> watchAccount(String userId)`
- [X] T104 [P] [Flutter] [US1] Create `account` API adapter at `../balsm_app/packages/account/lib/src/infrastructure/api/balsm_account_adapter.dart` — calls `GET /account/self` via `BalsmApiClient`, maps to `AccountSummary`. Replaces `supabase_account_adapter.dart`.
- [X] T105 [Flutter] [US1] Update `../balsm_app/packages/account/lib/account.dart` public barrel

**Checkpoint**: signup-to-home round-trip complete. User can pick country, sign up with email OTP / Google / Apple, accept disclosure, land on home. Verified by SC-001a.


## Phase 4: US1a — Handle Claim & Health Profile (Priority: P2)

### 4.2 Flutter: profile module (on-device PHI)

- [X] T109 [P] [Flutter] [US1a] Create `profile` aggregates at `../balsm_app/packages/profile/lib/src/domain/aggregates/` — `HealthProfile` root with embedded `Allergy`, `ChronicCondition`, `EmergencyContact` entities per data-model.md §2.1–§2.4
- [X] T110 [P] [Flutter] [US1a] Create `profile` domain event `HealthProfileUpdated` at `../balsm_app/packages/profile/lib/src/domain/events/health_profile_updated.dart`
- [X] T111 [P] [Flutter] [US1a] Create `profile` drift DAOs at `../balsm_app/packages/profile/lib/src/infrastructure/drift/` — `ProfileDao` with CRUD for `health_profile`, `allergy`, `chronic_condition`, `emergency_contact` tables using UUID v7 PKs, `watchProfile` StreamProvider
- [X] T112 [P] [Flutter] [US1a] Create `profile` use cases at `../balsm_app/packages/profile/lib/src/application/use_cases/` — `UpdateHealthProfileUseCase`, `AddAllergyUseCase`, `RemoveAllergyUseCase`, `AddChronicConditionUseCase`, `AddEmergencyContactUseCase`
- [X] T113 [P] [Flutter] [US1a] Create `profile` screens at `../balsm_app/packages/profile/lib/src/presentation/screens/` — `HealthProfileEditorScreen` with sections for blood type, allergies (up to 50), chronic conditions, emergency contacts; Arabic numeral normalization per FR-213; national-ID field with country-aware validator per FR-211
- [X] T114 [P] [Flutter] [US1a] Create `profile` routes at `../balsm_app/packages/profile/lib/src/presentation/routes.dart` — `profile.editor`
- [X] T115 [Flutter] [US1a] Update `../balsm_app/packages/profile/lib/profile.dart` public barrel
### 4.3 Flutter: account handle-claim surface

- [X] T116 [P] [Flutter] [US1a] Create `account` handle claim screen at `../balsm_app/packages/account/lib/src/presentation/screens/handle_claim_screen.dart` — text input with live validation (3-30 chars, `[a-z0-9_.]`), suggestions button, calls `POST /account/handle/claim` (.NET endpoint — post-pivot, replaces `handle-claim` Edge Function; availability pre-check via authenticated `POST /account/handle/check`), shows 409 on conflict
- [X] T117 [P] [Flutter] [US1a] Create `account` handle claim use case at `../balsm_app/packages/account/lib/src/application/use_cases/claim_handle_use_case.dart`
- [X] T118 [Flutter] [US1a] Update `home` screen at `../balsm_app/packages/home/lib/src/presentation/screens/home_screen.dart` to show nudge "Claim your handle" if `user_account.handle` is null

**Checkpoint**: handle claim + health profile CRUD complete. All PHI stored on-device only.


## Phase 5: US2 — Emergency Card & QR (Priority: P2)

### 5.2 Flutter: emergency_card module

- [X] T122 [P] [Flutter] [US2] Create `emergency_card` aggregates at `../balsm_app/packages/emergency_card/lib/src/domain/aggregates/` — `EmergencyCardSnapshot` (PHI fields from health_profile for QR payload), `EmergencyQrToken` (jti, expiresAt, revokedAt, ttl)
- [X] T123 [P] [Flutter] [US2] Create `emergency_card` domain events at `../balsm_app/packages/emergency_card/lib/src/domain/events/` — `EmergencyQrTokenMinted(jti, expiresAt)`, `EmergencyQrTokenRevoked(jti)`
- [X] T124 [P] [Flutter] [US2] Create `emergency_card` use cases at `../balsm_app/packages/emergency_card/lib/src/application/use_cases/` — `MintEmergencyQrTokenUseCase` (reads HealthProfile snapshot from profile module via read repository, encrypts with client-generated key, calls `POST /emergency-qr/mint` — .NET endpoint, post-pivot), `RevokeEmergencyQrTokenUseCase` (`POST /emergency-qr/{jti}/revoke`), `ResolveEmergencyQrTokenUseCase` (`GET /emergency-qr/resolve/{jti}`)
- [X] T125 [P] [Flutter] [US2] Create `emergency_card` screens at `../balsm_app/packages/emergency_card/lib/src/presentation/screens/` — `EmergencyCardScreen` (view snapshot, mint QR with TTL picker), `QrCodeDisplayScreen` (renders scannable QR with URL `https://<host>/emergency/<token>#k=<key>`)
- [X] T126 [P] [Flutter] [US2] Create `emergency_card` lock-screen widgets: `../balsm_app/packages/emergency_card/lib/src/presentation/widgets/emergency_lock_screen_widget.dart` — shared widget used by both iOS WidgetKit extension and Android quick-settings tile
- [X] T127 [P] [Flutter] [US2] Create `emergency_card` iOS WidgetKit extension at `../balsm_app/packages/emergency_card/ios/` — SwiftUI widget showing blood type + top 3 allergies + top 2 conditions + primary contact name, updated via app group user defaults
- [X] T128 [P] [Flutter] [US2] Create `emergency_card` Android quick-settings tile at `../balsm_app/packages/emergency_card/android/` — `TileService` subclass showing same data via RemoteViews
- [X] T129 [P] [Flutter] [US2] Create `emergency_card` routes at `../balsm_app/packages/emergency_card/lib/src/presentation/routes.dart` — `emergency.card`, `emergency.qrDisplay`
- [X] T130 [Flutter] [US2] Update `../balsm_app/packages/emergency_card/lib/emergency_card.dart` public barrel
### 5.3 Flutter Web + deeplink: emergency QR public route

- [X] T131 [P] [Flutter] [US2] Create `emergency_card` public screen at `../balsm_app/packages/emergency_card/lib/src/presentation/screens/public_emergency_resolve_screen.dart` — no-auth screen: reads `token` from route param, reads fragment key via `dart:html` (Web) / `app_links` (mobile deeplink), calls `GET /emergency-qr/resolve/{jti}` (.NET endpoint — post-pivot, replaces `emergency-token-resolve` Edge Function), AES-256-GCM-decrypts ciphertext using fragment key, renders blood type, allergies, conditions, contact; RTL-aware; tap-to-call (`tel:`); print-friendly CSS via `flutter_html` or custom view. On web, immediately `history.replaceState` to drop `#k=` from the address bar/history after reading it (SEC-F).
- [X] T132 [P] [Flutter] [US2] Add public route to `../balsm_app/packages/emergency_card/lib/src/presentation/routes.dart` — `emergency.publicResolve` mapped to path `/emergency/:token` with `noAuthRequired: true` guard bypass; consumes URL fragment `#k=...` for the decryption key (fragment never sent to the resolve endpoint — .NET, post-pivot)
- [X] T133 [P] [Flutter] [US2] Create deeplink handler at `../balsm_app/packages/core/lib/src/deeplink/deeplink_router.dart` — listens to `app_links` stream, on `https://{BASE_URL}/emergency/{token}#k=...` parses token + key, navigates app via `go_router` to `emergency.publicResolve`; same handler covers mobile (Universal/App Links) and web (path URL strategy)
- [X] T133a [P] [Flutter] [US2] Add `../balsm_app/app/web/.well-known/emergency-keys.json` — Ed25519 public key file for emergency token signature verification, served by Flutter Web static assets, generated by CI from `contracts/emergency-token.md` spec. ⚠️ NOTE (2026-07-17): `contracts/emergency-token.md` now specifies that emergency-token SIGNING is **out of scope for P001** — integrity rests on the AES-256-GCM auth tag + server-side `jti` lookup, not an Ed25519 envelope. This key file is inert in P001 (no signature is produced or verified); it is retained as a P002 placeholder. See SEC-F remediation.

**Checkpoint**: emergency card + QR full round-trip. Mint → scan → public page resolves → revoke → page returns "Expired".


## Phase 6: US3 — Medication Reminders (Priority: P3)

### 6.1 Flutter: medications module

- [X] T134 [P] [Flutter] [US3] Create `medications` aggregate `Medication` at `../balsm_app/packages/medications/lib/src/domain/aggregates/medication.dart` — properties per data-model.md §2.5, `recordDose(DoseEvent)` method enforcing invariants (correction parent_event_id check), `isExpired()` check against `endDate`
- [X] T135 [P] [Flutter] [US3] Create `medications` entity `DoseEvent` at `../balsm_app/packages/medications/lib/src/domain/entities/dose_event.dart` — outcomes: `taken`, `skipped`, `snoozed`, `missed`, `correction`; append-only invariant (no UPDATE/DELETE)
- [X] T136 [P] [Flutter] [US3] Create `medications` domain events at `../balsm_app/packages/medications/lib/src/domain/events/` — `MedicationAdded`, `DoseTaken`, `DoseSkipped`, `DoseSnoozed`, `DoseMissed`, `DoseCorrected`
- [X] T137 [P] [Flutter] [US3] Create `medications` drift DAO at `../balsm_app/packages/medications/lib/src/infrastructure/drift/medication_dao.dart` — CRUD for `medication` table, insert-only for `medication_dose_event` with SQLite triggers preventing UPDATE/DELETE per `contracts/medication-scheduler.md`
- [X] T138 [P] [Flutter] [US3] Create `medications` scheduler at `../balsm_app/packages/medications/lib/src/infrastructure/drift/medication_scheduler.dart` — per `contracts/medication-scheduler.md`: daily heartbeat at 03:00 rebuilding next 30 days of OS-native triggers, `zonedSchedule` with `exactAllowWhileIdle`, timezone-shift confirmation modal (FR-023)
- [X] T139 [P] [Flutter] [US3] Create `medications` missed-dose detector at `../balsm_app/packages/medications/lib/src/infrastructure/drift/missed_dose_detector.dart` — on app foreground: queries scheduled doses `scheduled_at < now() - 30 min` with no matching event, inserts `outcome='missed'` event
- [X] T140 [P] [Flutter] [US3] Create `medications` use cases at `../balsm_app/packages/medications/lib/src/application/use_cases/` — `AddMedicationUseCase` (includes schedule rebuild), `RecordDoseOutcomeUseCase`, `EditMedicationUseCase`, `DeleteMedicationUseCase`, `NotifyMissedDosesUseCase`
- [X] T141 [P] [Flutter] [US3] Create `medications` screens at `../balsm_app/packages/medications/lib/src/presentation/screens/` — `MedicationListScreen`, `AddMedicationScreen` (with schedule shape picker: daily/weekly/custom), `DoseHistoryScreen`, `TodayScreen` (shows upcoming + missed doses)
- [X] T142 [P] [Flutter] [US3] Create `medications` routes at `../balsm_app/packages/medications/lib/src/presentation/routes.dart` — `medications.list`, `medications.add`, `medications.detail`
- [X] T143 [Flutter] [US3] Update `../balsm_app/packages/medications/lib/medications.dart` public barrel
- [X] T144 [Flutter] [US3] Update `home` screen to show medication nudge if no medications added, and a "Today" summary card
### 6.2 Flutter: core notifications wiring

- [X] T145 [Flutter] [US3] Wire notification tap handling in `../balsm_app/app/lib/app.dart` — on notification tap, deep-link to medication detail or today screen

**Checkpoint**: medication reminders fire offline ≥7d, dose events logged append-only, missed doses detected on foreground.


## Phase 7: US4 — Self-Service Deletion (Priority: P3)

### 7.2 Flutter: deletion module

- [X] T151 [P] [Flutter] [US4] Create `deletion` aggregate `DeletionRequest` at `../balsm_app/packages/deletion/lib/src/domain/aggregates/deletion_request.dart` — FSM: `ACTIVE` → `DELETION_REQUESTED` → cancellable back to `ACTIVE` or proceed to purge; `cancel()` allowed only from `DELETION_REQUESTED` state
- [X] T152 [P] [Flutter] [US4] Create `deletion` domain events at `../balsm_app/packages/deletion/lib/src/domain/events/` — `DeletionRequested`, `DeletionCancelled`, `DeletionPurged`
- [X] T153 [P] [Flutter] [US4] Create `deletion` use cases at `../balsm_app/packages/deletion/lib/src/application/use_cases/` — `RequestDeletionUseCase` (calls `POST /deletion/intake` — .NET endpoint, post-pivot, replaces `account-delete-intake`; requires a fresh `reauth_token`), `CancelDeletionUseCase` (calls `POST /deletion/cancel` — replaces `account-delete-cancel`)
- [X] T154 [P] [Flutter] [US4] Create `deletion` screens at `../balsm_app/packages/deletion/lib/src/presentation/screens/` — `DeleteAccountScreen` (pre-confirmation listing retained/deleted/wiped data per FR-031, ≤2 taps from settings root per SC-012), `DeletionConfirmScreen`, `DeletionCancelledScreen`, `PostDeletionLoginScreen` (shows only cancel-deletion flow)
- [X] T155 [P] [Flutter] [US4] Create `deletion` routes at `../balsm_app/packages/deletion/lib/src/presentation/routes.dart` — `deletion.request`, `deletion.confirm`, `deletion.cancelled`
- [X] T156 [Flutter] [US4] Update `../balsm_app/packages/deletion/lib/deletion.dart` public barrel
### 7.3 Flutter Web + deeplink: account deletion public route

- [X] T157 [P] [Flutter] [US4] Create `deletion` public screen at `../balsm_app/packages/deletion/lib/src/presentation/screens/public_delete_screen.dart` — public route `/account/delete`: 3-channel re-auth (email OTP / Google / Apple) via `auth` use cases, pre-confirmation screen matching in-app copy (FR-031), confirm button calls `POST /deletion/intake` (.NET endpoint — post-pivot, replaces `account-delete-intake`; the re-auth supplies the required `reauth_token`), navigates to done screen; same widget for web and mobile (mobile reached via deeplink)
- [X] T158 [P] [Flutter] [US4] Create `deletion` cancellation public screen at `../balsm_app/packages/deletion/lib/src/presentation/screens/public_delete_cancelled_screen.dart` — route `/account/delete-cancelled`: shown when user signs back in during grace period, re-auth then `POST /deletion/cancel` (.NET endpoint — post-pivot, replaces `account-delete-cancel`)
- [X] T158a [P] [Flutter] [US4] Extend `core` `DeeplinkRouter` (T133) to register `/account/delete` and `/account/delete-cancelled` handlers — navigate via `go_router` to public deletion screens regardless of platform (web direct URL, mobile via Universal/App Links)
### 7.4 Flutter: sessions module

- [X] T159 [P] [Flutter] [US4] Create `sessions` aggregate `ActiveSession` at `../balsm_app/packages/sessions/lib/src/domain/aggregates/active_session.dart` — id, deviceId, deviceLabel, deviceType, firstSeenAt, lastActivityAt, revokedAt (one-way transition)
- [X] T160 [P] [Flutter] [US4] Create `sessions` domain event `SessionRevoked` at `../balsm_app/packages/sessions/lib/src/domain/events/session_revoked.dart`
- [X] T161 [P] [Flutter] [US4] Create `sessions` use cases at `../balsm_app/packages/sessions/lib/src/application/use_cases/` — `ListActiveSessionsUseCase`, `RevokeSessionUseCase`, `SignOutEverywhereUseCase`
- [X] T162 [P] [Flutter] [US4] Create `sessions` screens at `../balsm_app/packages/sessions/lib/src/presentation/screens/` — `SessionsScreen` (list active devices, tap to revoke, "Sign out everywhere" button)
- [X] T163 [P] [Flutter] [US4] Create `sessions` routes at `../balsm_app/packages/sessions/lib/src/presentation/routes.dart` — `sessions.list`
- [X] T164 [Flutter] [US4] Update `../balsm_app/packages/sessions/lib/sessions.dart` public barrel

**Checkpoint**: full deletion FSM observable — in-app request, cancel, web path, purge cron. Sessions screen shows active devices.


## Phase 8: US5 — Account Lockout & Sessions (Priority: P4)

### 8.1 Flutter: auth lockout UI

- [X] T165 [P] [Flutter] [US5] Extend `auth` sign-in use case at `../balsm_app/packages/auth/lib/src/application/use_cases/sign_in_use_case.dart` to handle the `423 AccountLocked` + `Retry-After` response from the .NET auth endpoints (post-pivot, replaces `auth-gate` Edge Function), surface lockout countdown
- [X] T166 [P] [Flutter] [US5] Create lockout screen at `../balsm_app/packages/auth/lib/src/presentation/screens/lockout_screen.dart` — shows "Too many attempts. Try again in X minutes." with timer countdown
- [X] T167 [Flutter] [US5] Update `auth` routes to include lockout screen

**Checkpoint**: lockout boundary tested. 5 bad logins → locked → unlock after 15 min.


## Phase 9: US6 — Country & Language Change (Priority: P4)

### 9.2 Flutter: account country/language screens

- [X] T170 [P] [Flutter] [US6] Create `account` use cases at `../balsm_app/packages/account/lib/src/application/use_cases/` — `ChangeCountryUseCase`, `ChangeLanguageUseCase`
- [X] T171 [P] [Flutter] [US6] Create `account` screens at `../balsm_app/packages/account/lib/src/presentation/screens/` — `CountrySettingsScreen` (selectable country list, calls country-change flow = re-auth + re-disclosure), `LanguageSettingsScreen` (selectable `ar-EG`, `ar-SA`, `ar-AE`, `en`)
- [X] T172 [P] [Flutter] [US6] Create `account` routes at `../balsm_app/packages/account/lib/src/presentation/routes.dart` — `account.settings`, `account.country`, `account.language`, `account.developer` (route only registered when `FlavorConfig.current.serverSelectorEnabled` is true)
- [X] T172a [P] [Flutter] [US6] Update `account` settings root screen at `../balsm_app/packages/account/lib/src/presentation/screens/settings_screen.dart` to conditionally render a "Developer" section showing tile "Switch server" + active preset label — visible only when `FlavorConfig.current.flavor == Flavor.dev`; tap opens `core` `ServerSelectorScreen` (T035o); section spatially separated below regular settings with `--space-8` margin and warning icon
### 9.3 Flutter: home country-change integration

- [X] T173 [Flutter] [US6] Update `home` screen at `../balsm_app/packages/home/lib/src/presentation/screens/home_screen.dart` to react to `CountryChanged` event — reload locale, update RTL, re-fetch country-specific data
- [X] T174 [Flutter] [US6] Update `disclosure` screen at `../balsm_app/packages/disclosure/lib/src/presentation/screens/consolidated_disclosure_screen.dart` to support re-disclosure flow on country change (different supervisory authority name, different copy version)

**Checkpoint**: country change round-trip → re-auth → re-disclosure → RTL toggle → single account preserved across countries.


## Phase 10: Polish & Cross-Cutting Concerns

- [X] T175 [P] [Flutter] Create PHI-leak fuzz test at `../balsm_app/test/phi_leak_fuzz_test/sentry_allowlist_test.dart` — exercises ≥50 synthetic PHI payloads through Sentry `beforeSend` and Dio `PhiLeakInterceptor`, asserts zero non-allowlisted field names on wire (SC-006, SC-016)
- [X] T176 [P] [Flutter] Create `../balsm_app/test/phi_leak_fuzz_test/corpus.dart` — generates synthetic Egyptian/Saudi/UAE names, phone numbers, national IDs, DOBs, allergy/condition/medication names in ar + en per `contracts/crash-allowlist.json`
- [X] T177 [P] [Flutter] Create golden test suite at `../balsm_app/test/golden/` — RTL + LTR golden tests for every screen (auth, disclosure, home, profile, emergency_card, medications, deletion, sessions, account)
- [X] T178 [P] [Flutter] Create localized 404 screen at `../balsm_app/packages/core/lib/src/kit/not_found_screen.dart` — `go_router` `errorBuilder` target, uses `TranslationCatalog`, RTL-aware
- [X] T179 [P] [Flutter] Wire web-target error boundary at `../balsm_app/app/lib/web_error_boundary.dart` — `FlutterError.onError` + `PlatformDispatcher.instance.onError` route to localized error page, Sentry capture with same allowlist
- [X] T180 [P] [Flutter] Add Flutter Web `flutter build web --release` smoke test at `../balsm_app/test/web_smoke/public_routes_test.dart` — verify `/emergency/{token}` + `/account/delete` resolve to public screens without auth redirect; verify deeplink fragment-key parser
- [X] T181 [P] [Flutter] Create CI workflow at `../balsm_app/.github/workflows/ci.yml` — steps: flutter analyze, flutter test, golden diffs, phi_leak_fuzz_test, drift schema check, translation catalog ≥98% completeness per language, iOS + Android release build
- [X] T183 [P] [Flutter] Extend Flutter CI workflow `../balsm_app/.github/workflows/ci.yml` with a `build-web` job — `flutter build web --release --wasm`, validate `.well-known/apple-app-site-association` content-type + JSON, validate `assetlinks.json` SHA-256 fingerprint matches release signing cert, publish artifact for Firebase Hosting / Cloudflare Pages
- [X] T184 [P] [Flutter] Add E2E test at `../balsm_app/test/e2e_test/signup_to_home_test.dart` — full signup flow via Patrol
- [X] T185 [P] [Flutter] Add E2E test at `../balsm_app/test/e2e_test/emergency_qr_roundtrip_test.dart` — mint QR → verify public page resolves
- [X] T186 [P] [Flutter] Add E2E test at `../balsm_app/test/e2e_test/medication_reminder_test.dart` — add medication → advance clock → verify notification fires
- [X] T187 [P] [Flutter] Add E2E test at `../balsm_app/test/e2e_test/deletion_flow_test.dart` — request deletion → cancel → sign in → verify no data loss
- [X] T188 [P] [Flutter] Add E2E test at `../balsm_app/test/e2e_test/country_change_test.dart` — sign up EG → change to KSA → verify re-disclosure appears
- [X] T189 [Flutter] Verify translation catalog completeness across all 4 locales (`en`, `ar-EG`, `ar-SA`, `ar-AE`) — every key present, ≥98% completeness per SC-203

## Security Remediation (2026-07-17 review)

New, unchecked follow-ups from the security review. The tasks above are already executed ([X]); these capture required changes without rewriting completed history.

- [ ] SEC-F01 [Flutter] [CRITICAL] Notification PHI: verify the shipped `medication_scheduler.dart` emits ONLY the fixed localized title/body ("Time for your medication" / «موعد دوائك») with the drug name/dose confined to the `meds.today?highlightDoseId=` deep-link payload (never in `title`/`body`/`subtitle`/`summary`/wearable preview), per the rewritten `contracts/medication-scheduler.md`. Extend the T175 PHI fuzz corpus with notification-payload assertions.
- [ ] SEC-F02 [Flutter] [HIGH] OIDC account linking: in `sign_up_use_case.dart` / OIDC handlers, ensure Google/Apple identities link by `(provider, providerSubject)` only and never merge into an existing account by email unless the provider asserts `emailVerified=true`; surface the server's 403 on unverified email. Add a test.
- [ ] SEC-F03 [Flutter] [HIGH] Backup key: rework `core/lib/src/backup/*` so the blob is sealed with a random 256-bit DEK, the DEK wrapped by Argon2id(user backup recovery code ≥80 bits), and the wrapped DEK stored alongside the blob; restore path = recovery code → unwrap DEK → decrypt. Remove any OTP-derived key material. Add a new-device restore-path test (SC-002a).
- [ ] SEC-F04 [Flutter] [MEDIUM] Age gate on OIDC: on first Google/Apple sign-in with no stored DOB, require DOB submission before a full session is used (route under-18 to the soft-block screen). Confirm no age gate blocks the deletion-intake path.
- [ ] SEC-F05 [Flutter] [MEDIUM] Deletion residuals: add `delete(String key)` to `BackupAdapter`; on deletion confirm (and on post-grace sign-in denial) wipe `AppDatabase` + secure storage and call `BackupAdapter.delete`. (RR-004.)
- [ ] SEC-F06 [Flutter] [MEDIUM] Fragment leak: Sentry `beforeSend`/`beforeBreadcrumb` MUST strip URL fragments + tokenized path segments from every captured URL; the public resolve screen MUST `history.replaceState` to drop `#k=` after reading it; extend the T175 corpus with URL-fragment vectors.
- [ ] SEC-F07 [Flutter] [MEDIUM] UUID encoding: align `ProfileDao` (and any BLOB writer) to store ALL UUID columns as canonical TEXT per data-model §2 (closes gaps.md G13); add a write→read→join round-trip integrity test.
- [ ] SEC-F08 [Flutter] [MEDIUM] Lock-screen widget: default the iOS WidgetKit widget / Android tile to disabled; enabling requires explicit in-app opt-in recording a disclosure snapshot; set the iOS app-group container file protection to `.completeUntilFirstUserAuthentication`.
- [ ] SEC-F09 [Flutter] [LOW] SQLCipher key: generate a 256-bit CSPRNG DB key on first launch; store in iOS Keychain `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` (non-synchronizable) / Android Keystore (StrongBox where available).
- [ ] SEC-F10 [Flutter] [LOW] Web build scope: the web release build serves ONLY `/emergency/*`, `/account/delete*`, `/status`; disable authenticated flows on web in P001 (`flutter_secure_storage` degrades to XSS-readable localStorage on web).
