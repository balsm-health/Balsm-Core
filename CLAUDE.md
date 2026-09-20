# Claude Code Instructions

Read and follow the agent instructions in [AGENTS.md](./agents/rules/AGENTS.md).

## Brand assets — never rebuild unasked

Do **not** regenerate derived brand assets. That means no `scripts/brand/build-brand-assets.py`,
and no hand-writing of anything it produces, unless I ask for it in that same message. Finishing
a change to a source file is not permission to rebuild.

Only `brand/icon.svg` and `brand/wordmark.svg` are sources. Everything else under `brand/` is
output — mono variants, lockups, social avatars, PNG renders, OG images, the background wash,
the LinkedIn banners.

When a source changes, edit the source, say plainly that the derived assets are now stale, and
stop there. I decide when they get rebuilt.

## Active Technologies
- .NET 10.0 (C#) for backend; TypeScript 5.8 + React 19 for admin UI; Bash / PowerShell for installer hooks + ASP.NET Core 10, Entity Framework Core 10.0.5 (SQLite provider with `Microsoft.Data.Sqlite` online backup API), `Tmds.MDns` or `Zeroconf` for mDNS, `Konscious.Security.Cryptography.Argon2` (or libsodium binding) for password hashing, FluentValidation, Serilog (structured logging), Vite + React + React Router 7 admin SPA (main)
- SQLite (`balsm.db`) embedded; backups + audit JSONL archives under configurable backup directory (default `<install-dir>/backups/`) (main)
- .NET 10.0 (C#) for backend (`Balsm.API`, `Balsm.Supervisor`, `Balsm.Infrastructure`, `Balsm.SharedKernel`, all `Modules/*`); TypeScript 5.8 + React 19 for admin UI (`admin-ui/`); PowerShell for Windows install scripts; Bash for Linux `.deb` build (`packaging/linux/build-deb.sh`) and macOS `.pkg` (`packaging/macos/build-pkg.sh`). (main)
- SQLite (`balsm.db`) for domain data; backups written under a configurable directory (default `<install-dir>/backups/`); audit JSONL archives written to the same directory. Admin credential file remains at the path managed by `Balsm.Supervisor.Auth.FileCredentialStore` (extended with new fields for recovery-code hashes). (main)
- .NET 10.0 (C#) for `Balsm.API`, `Balsm.Supervisor`, `Balsm.Infrastructure`, `Balsm.SharedKernel`, and all `Modules/*` projects. TypeScript 5.8 + React 19 for `admin-ui/`. PowerShell for `packaging/windows/install*.ps1`. Bash for `packaging/macos/build-pkg.sh` and `packaging/linux/build-deb.sh`. (main)
- SQLite (`balsm.db`) for domain data, accessed via per-module EF Core DbContexts that all derive from `Balsm.Infrastructure.Data.BaseDbContext`. Backups written under a configurable directory (default `<install-dir>/backups/`). Audit JSONL archives written to the same directory. Admin credential file remains the canonical secret store at the path managed by `Balsm.Supervisor.Auth.FileCredentialStore`; this file's JSON shape (`AdminCredentials`) gets four new fields (`passwordHashAlgorithm`, `recoveryCodeHash`, `recoveryCodeCreatedAt`, `recoveryCodeUsedAt`, `recoveryCodeRetiredAt`) — backwards-compatible with the existing layout. (main)
- Dart 3.13 / Flutter 3.47 (stable channel; upgraded 2026-09-14, material_ui migration done) organized as a **melos ^7 monorepo** with one shared `core` package + 10 module packages (named after their bounded context — no `feature_` prefix; DDD per 2026-06-15 directives) + a `balsm_boundary_lint` package + a runnable `app` shell = 12 packages total; TypeScript 5.10 + Next.js 16 + React 19.2 + Tailwind 4.0 for the two public web pages; Deno 2.5 for Supabase Edge Functions; Swift 6.1 / Xcode 17 for iOS WidgetKit; Kotlin 2.2 + Android SDK 36 + AGP 9 for Android lock-screen tile; SQL for migrations. Cloud row carries one PHI field — `date_of_birth` — field-level-encrypted via pgcrypto pgp_sym + audit-logged per FR-047/FR-048 (2026-06-15 Path-ii Q-clarification; UAE rows on UAE-resident self-hosted Supabase per FR-049). (001-patient-app-mvp; SDK refresh + DDD-packages + core-consolidation + module-prefix-drop + cloud-DOB-PHI-exception per 2026-06-15 directives)
- Dart 3.13 / Flutter 3.47 (client) · C# / .NET 10.0 SDK 10.0.101 `net10.0` (backend) (001-patient-app-mvp)
- PostgreSQL 16 (cloud non-PHI, EF Core 10 + Npgsql) · SQLite/SQLCipher (on-device PHI, drift 2.29) · iCloud Drive (iOS backup blob) · Google Drive (Android backup blob) (001-patient-app-mvp)

* C# / .NET 10.0 (SDK 10.0.101, `net10.0` TFM) + ASP.NET Core, EF Core 10.0.5, SQLite, MediatR 14.1, FluentValidation 12.1, Serilog 10.0, Sentry SDK, React/Vite (admin UI) (001-server-foundation)
* SQLite (embedded, WAL mode) — file: `balsm.db` (001-server-foundation)

## Recent Changes

* 001-server-foundation: Added C# / .NET 10.0 (SDK 10.0.101, `net10.0` TFM) + ASP.NET Core, EF Core 10.0.5, SQLite, MediatR 14.1, FluentValidation 12.1, Serilog 10.0, Sentry SDK, React/Vite (admin UI)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
