# Quickstart: Local Server Foundation

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-05-30

**Routing conventions**: All HTTP endpoints referenced below follow [`architecture/routing-best-practices.md`](../../architecture/routing-best-practices.md): standard response envelope, `X-Request-ID` tracing, and status codes from the reference table (200/201/400/404/409/412/422/429/503).

**API subdomains**: The local server maps to `local.balsm.health` (`https://local.balsm.health/v1/...`) when reachable on the LAN or via Public mode. In Standalone development mode all endpoints are at `https://localhost:5051/api/v1/...`. The cloud API subdomain `api.balsm.health` is reserved for future SaaS phases. See [`architecture/subdomain-route-mapping.md`](../../architecture/subdomain-route-mapping.md).

End-to-end "fresh OS → working admin panel" walkthrough used as the Phase 0 manual smoke-test and as the script the Playwright e2e test automates. Ports / paths reflect the actual `Balsm-API-DotNet` runtime: single `Balsm.API` Standalone process on HTTP `:5050` + HTTPS `:5051`, with `Balsm.Supervisor` loaded in-process.

---

## Prerequisites

- Target machine meets minimum spec (4 GB RAM, dual-core, 20 GB free disk).
- Installer artifact built by `scripts/publish-all.sh` and packaged from the matching `packaging/{linux,macos,windows}/` directory:
  - Windows: `balsm-<version>.msi`
  - macOS: `balsm-<version>.pkg` (shipped inside a `balsm-<version>.dmg` distribution image; the `.pkg` is what actually runs)
  - Linux: `balsm-<version>.deb`
- Logged in as a user with local administrator / root privileges.

---

## Step 1 — Install

Windows:
```powershell
msiexec /i balsm-<version>.msi /qb
```
Runs `packaging/windows/install.ps1`; registers one Windows Service: `BalsmApi`.

macOS:
```bash
hdiutil attach balsm-<version>.dmg
sudo installer -pkg /Volumes/Balsm/balsm-<version>.pkg -target /   # machine-path-ok: the mounted DMG
```
Runs `packaging/macos/build-pkg.sh` postinstall scripts; loads `com.balsm.api.plist` LaunchDaemon into the system domain via `launchctl bootstrap system /Library/LaunchDaemons/com.balsm.api.plist`.

Linux:
```bash
sudo apt install ./balsm-<version>.deb
```
Built from `packaging/linux/build-deb.sh`; installs and enables `balsm-api.service` (systemd).

**Expected**:
- Service running:
  - Windows: `Get-Service BalsmApi` → `Running`
  - macOS: `sudo launchctl print system/com.balsm.api` → state = running
  - Linux: `systemctl status balsm-api` → `active (running)`
- Installer completion dialog shows the admin panel URL `https://localhost:5051/admin`.
- Tray / menu-bar icon present and reports "Running".
- `balsm status` from a new shell prints `up`, version, mode `Standalone`, uptime.
- On loopback the self-signed cert is expected; verify its fingerprint against the value the installer/tray/`balsm status` printed to the server console (a trusted local source) — do NOT trust a fingerprint fetched over the same unverified TLS connection. Then `curl --cacert <server-cert.pem> https://localhost:5051/api/v1/health` returns `{"status":"up","ready":true,"version":"…","uptime_seconds":…}`.
- `curl --cacert <server-cert.pem> https://localhost:5051/api/v1/server-info` returns version, mode `Standalone`, empty workspace_name (wizard pending), and the cert SHA-256. (`-k`/`--insecure` skips verification and is acceptable only for a throwaway smoke check, never for pinning trust.)

---

## Step 2 — First-run wizard

1. Open `https://localhost:5051/admin` in a browser. Accept the self-signed cert only after confirming its fingerprint matches the one the installer / tray / `balsm status` printed on the server console (trusted local source) — not one re-fetched over the same unverified connection.
2. The wizard is the only accessible UI (FR-004 via existing `AdminSetupRedirectMiddleware`). `FirstRunService` opens the browser automatically on first launch.
3. Pick a locale (English or العربية) — RTL applies immediately on selection.
4. Create the admin account: email, display name, password (≥12 chars).
5. Set workspace name + slug (slug auto-suggested; `^[a-z0-9-]{3,40}$`).
6. POST to `/api/v1/admin/auth/setup` commits, returns a **one-time recovery code** (FR-018a). The page blocks further navigation until the admin checks "I have stored this offline."
7. Browser receives the `balsm_admin_session` cookie and redirects to the dashboard.

**Expected**:
- Dashboard shows: server status (Running), uptime, version, workspace name, navigation to Entities / Backups / Audit / Mode / Recovery.
- `GET /api/v1/server-info` now returns `workspace_name` populated.
- `GET /api/v1/admin/status` (cookie-auth) returns `is_running: true` plus the extended `certificate_sha256` + `workspace_name` fields.
- mDNS instance name switches from `balsm-setup-…` to `balsm-<slug>`.

---

## Step 3 — Add an entity + two branches

1. Navigate to *Entities → New*.
2. Create entity `My Pharmacy`, type `pharmacy`.
3. Add branch `Downtown` with address + phone.
4. Add branch `Heliopolis` with address + phone.
5. Deactivate `Heliopolis`. Confirm it disappears from active lists but remains visible under "Include inactive".
6. Edit `Downtown` address; confirm change is reflected on reload.

**Expected**:
- All three operations produce audit log rows under `module = Entity` / `Branch`. The `AuditSaveChangesInterceptor` populates them automatically.
- No hard delete is possible from the UI; `DELETE /api/v1/admin/branches/{id}` returns `405`.

---

## Step 4 — Backup + restore round trip

1. *Backups → Backup Now* (`POST /api/v1/admin/backups`).
2. Wait until the new file appears with status `OK` (≤30 s for typical sub-1 GB DB).
3. Note the file path + SHA-256.
4. *Backups → Schedule*: set to daily 02:00 (default), retention 30 (`PUT /api/v1/admin/backups/schedule`).
5. Create a junk entity to dirty the DB.
6. Select the backup row → *Restore* → echo `RESTORE` in confirmation (`POST /api/v1/admin/backups/{id}/restore`).
7. During restore: `GET /api/v1/admin/entities` returns 503; `GET /api/v1/health` returns 200 with `ready=false`, `not_ready_reason="restore"`.
8. Restore completes, application restarts in-process via the existing `IHostApplicationLifetime` path (no OS-level `systemctl restart` / `launchctl kickstart` / `Restart-Service` required), the junk entity is gone.

**Expected**:
- Audit log shows `BackupTaken`, `RestoreStarted`, `RestoreCompleted` with the SHA-256 of the source backup.

---

## Step 5 — Recovery code path

1. Log out (`POST /api/v1/admin/auth/logout`).
2. Attempt login with the wrong password 5 times → HTTP 423 `Locked` after the 5th attempt (`AdminAuthService` + `RateLimitMiddleware`).
3. Visit the *Recovery* page → enter admin email + the one-time recovery code + a new password (`POST /api/v1/admin/auth/recovery/use`).
4. Recovery succeeds; lockout cleared; cookie issued; the consumed recovery code is retired; a fresh code is generated on next login via `POST /api/v1/admin/auth/recovery/regenerate`.

**Alternative CLI path** (works even if the UI is unreachable):

```bash
sudo balsm admin reset-password
```
Enter a new password at the prompt → all sessions invalidated → lockout cleared.

---

## Step 6 — mDNS discovery from a second device

1. Connect a second device to the same LAN.
2. From a terminal: `dns-sd -B _balsm._tcp` (macOS) or `avahi-browse -r _balsm._tcp` (Linux).
3. Confirm `balsm-<slug>` appears within 5 seconds (powered by `Balsm.Supervisor.Services.MdnsService` + `Makaretu.Dns.Multicast`).
4. Switch server to Standalone mode in *Mode* — the service-manager-driven in-process restart completes within ~10 seconds; the instance disappears from discovery.
5. Switch back to Network — re-appears with the same TXT records.

---

## Step 7 — Audit log + JSONL export

1. Open *Audit Log* in the admin panel. Verify entries from all preceding steps are present with correct `actor`, `module`, `action`, `target_*`.
2. Confirm retention is 2 years in *Audit → Retention*.
3. Adjust retention to a short window to expose at least one row, trigger `AuditRetentionJob` on-demand from the admin panel, confirm a JSONL archive file appears in the backup directory and a row appears in *Audit → Archives*.
4. Optional: `sudo balsm audit export --to /tmp/audit.jsonl` produces the same JSONL shape on demand.

---

## Success criteria checklist (mirrors `spec.md` Success Criteria)

- [ ] SC-001: install completed in ≤10 minutes on all three OSes with zero manual dependency install.
- [ ] SC-002: server ready ≤10 s after OS boot.
- [ ] SC-003: first-time admin completes wizard + first entity + one branch in ≤5 minutes.
- [ ] SC-004: second-device mDNS discovery ≤5 s.
- [ ] SC-005: backup ≤30 s for ≤1 GB DB; restore round-trip succeeds.
- [ ] SC-006: 50 concurrent read connections sustained ≥60 s, p95 read latency <100 ms.
- [ ] SC-007: server refuses non-health requests during migration / restore.
- [ ] SC-008: zero hard-deletions on domain tables; audit log present for every write / auth-state-change.
