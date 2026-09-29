# Contract: `balsm` CLI (Phase 0 surface)

**Routing conventions**: The HTTP endpoints this CLI calls follow [`architecture/routing-best-practices.md`](../../architecture/routing-best-practices.md) — all responses include `X-Request-ID` for tracing, use the standard response envelope, and return status codes consistent with the routing conventions.

The `balsm` CLI ships in the same self-contained installer as the single Standalone process (`Balsm.API` with `Balsm.Supervisor` loaded as a library). It is the **secondary** management surface (admin panel is primary). All write commands MUST emit an audit log entry (FR-016) with `actor = cli:<command-name>`.

The CLI is implemented as a thin command-router that:

1. For read-only commands (`status`, `version`, `backup list`, `audit tail`): calls the local HTTP surface on loopback HTTPS `:5051` using a short-lived local-OS-identity token (no admin password required; loopback identity is verified by the new `LocalOsTrustMiddleware`). `LocalOsTrustMiddleware` MUST: (a) require `Connection.RemoteIpAddress.IsLoopback` — the header is ignored otherwise; (b) constant-time compare (`CryptographicOperations.FixedTimeEquals`) the `X-Balsm-Local-Token` value against the file under `<install-dir>/var/local-cli.token` (readable only by `root` / `Administrators`); (c) grant ONLY the read-only routes in the table below — never restore, mode switch, or password flows (those go through the in-process OS-privilege path, not header trust); (d) reject the header outright when the request also carries `CF-Connecting-IP` / `X-Forwarded-*` (i.e. arrived via the Public-mode tunnel, where "loopback" is no longer a trust signal). The token is rotated by `LocalCliTokenService` every 24 h, not only at process start.
2. For write commands (`backup`, `db restore`, `admin reset-password`, `mode`, `audit export`): performs the OS effective-UID check (`geteuid() == 0` on Unix / `IsUserAnAdmin()` on Windows) and then either calls the same loopback endpoint OR invokes the relevant service in-process via the SDK (`AdminAuthService.ChangePasswordAsync` is direct in-process to avoid surfacing the new password to a HTTP request log).

All commands return exit code `0` on success, `>0` on failure, with structured JSON to stdout on `--json`.

| Command | FR mapping | Endpoint / direct call | Auth requirement |
|---|---|---|---|
| `balsm status` | FR-014 | `GET /api/v1/admin/status` | Loopback token |
| `balsm version` | FR-009 | `GET /api/v1/server-info` | Public |
| `balsm backup` | FR-011 | `POST /api/v1/admin/backups` | Local OS admin / root + loopback token |
| `balsm backup list` | FR-011a | `GET /api/v1/admin/backups` | Loopback token |
| `balsm db restore <file>` | FR-011b | `POST /api/v1/admin/backups/{id}/restore` | Local OS admin / root |
| `balsm db verify` | FR-010 / FR-010a | `RestoreOrchestrator.VerifyAsync(path)` in-process | Local OS admin / root |
| `balsm admin reset-password` | FR-018a path 1 | `AdminAuthService.ChangePasswordAsync` in-process | Local OS admin / root |
| `balsm mode <Standalone\|Network\|Public>` | FR-013 | `PUT /api/v1/admin/mode` | Local OS admin / root |
| `balsm audit export --to <path>` | FR-016a | `AuditExportSink.ExportAsync(...)` in-process | Local OS admin / root |
| `balsm audit tail` | FR-016 | `GET /api/v1/admin/audit/logs?page_size=50` | Loopback token |

Auth model:

- "Loopback token": file at `<install-dir>/var/local-cli.token` (UNIX mode `0400` owned by service user); created/rotated by `Balsm.Supervisor.Services.LocalCliTokenService` (new) at process start.
- "Local OS admin / root": `geteuid() == 0` (Unix) or `IsUserAnAdmin()` returns `true` (Windows). No JWT / cookie auth involved.

All write commands MUST print a one-line audit confirmation line including the audit log row sequence and timestamp.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic failure |
| 2 | Invalid arguments / usage |
| 3 | Insufficient OS privileges |
| 4 | Server not installed / not running |
| 5 | Server running but unhealthy (migrations pending / restore in progress) |
| 6 | Pre-condition failed (e.g., `db restore` while another restore is already in progress) |

JSON envelope on `--json`:

```json
{
  "command": "backup",
  "status": "ok",
  "result": {
    "file": "~/balsm/backups/balsm-20260530-104511.db",
    "size_bytes": 4321088,
    "sha256": "…"
  },
  "audit_sequence": 4823
}
```

## System-tray / menu-bar icon

Lives under `Balsm.Supervisor/Tray/` (new). Cross-platform abstraction:

- Windows: `NotifyIcon` via Windows Forms in a dedicated STA thread inside the Windows Service process (gated by `--ui` flag; off when running headless).
- macOS: AppKit `NSStatusBar` via a small Cocoa companion executable launched from `com.balsm.api.plist` as a `LSUIElement = true` user-domain helper agent (kept alive by `launchctl`).
- Linux: `libappindicator3` via `Gtk.StatusIcon` fallback.

Tray menu items: `Open Admin Panel`, `Show Status`, `Pause mDNS`, `Quit Tray` (does NOT stop the service).
