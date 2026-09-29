# Care Team Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store the patient's care team in both the on-device SQLCipher database and the Balsm cloud database, converging the two automatically.

**Architecture:** Local drift stays the write path and the source the UI reads — nothing blocks on the network. Every local write also appends to a durable `sync_outbox` table; a `CareTeamSyncService` drains that outbox to a new `/care-team` API and pulls incrementally by `updated_at` cursor, merging row-level last-writer-wins. Server-side, a new DDD module `CareTeam` holds nine AES-256-GCM-encrypted free-text columns plus plaintext ids and timestamps, with soft-delete tombstones so deletes propagate.

**Tech Stack:** .NET 10.0 / ASP.NET Core / EF Core 10.0.5 / MediatR / FluentValidation / xUnit + FluentAssertions + NSubstitute (API); Dart 3.13 / Flutter 3.47 via fvm / drift / dio / riverpod / melos (app).

**Spec:** `Balsm-Core/specs/003-care-team-cloud-sync/spec.md`

## Global Constraints

- API projects target `net10.0`; SDK pinned by `global.json`. Never add a package without adding its version to `Directory.Packages.props`.
- Flutter runs via **fvm** — `fvm flutter …`, `fvm dart …`. Version pinned in `.fvmrc`.
- Modules depend on `core`, never on each other. Cross-module reads go through `application/ports/`. Enforced by `balsm_boundary_lint` — run `melos run lint-boundaries` before committing app changes.
- Domain/application layers depend on the module's port, never on `Drift*` concretes.
- Record ids are device-generated bare UUIDv7 strings (`UniqueId.uuidv7` → `UuidV7.generate().toString()`; the prefix rides in a field, not in `value`). They parse as `Guid` server-side. No server-side id assignment (FR-505).
- Cloud free-text columns are AES-256-GCM encrypted under `CareTeamEncryption:Key`, which MUST be a different 32-byte key from `DobEncryption:Key` (FR-502).
- Never log, print, or transmit PHI plaintext. Never fabricate sample PHI in code or fixtures — tests use obviously-synthetic strings.
- On-device schema changes go in `packages/core/lib/src/db/app_database.dart` as idempotent `_ensureColumn` calls or `CREATE TABLE IF NOT EXISTS` entries in `_phiSchema`. `schemaVersion` stays `1`; this codebase does not use drift versioned migrations.
- UI strings live in i69n bundles; after editing JSON run `fvm dart run build_runner build` in that package. No inline `ar ? … : …` ternaries.

## Review Focus

These are input classes the spec implies but that no task's happy-path tests exercise. Each has a test assigned to the task that owns the code.

1. **Device clock ahead of real time** — a phone whose clock is set months into the future pushes rows whose `updated_at` beats every later legitimate edit, freezing that row forever. Server MUST assign `updated_at` from server clock and ignore any client-supplied value. *(Task 4)*
2. **Outbox ordering: upsert then delete for the same id** — draining out of order deletes then re-creates the provider, resurrecting a record the patient removed. Drain MUST be FIFO per `entity_id`. *(Task 10)*
3. **Replayed upsert of the same id** — a retried push after an ambiguous timeout must not create a duplicate row or bump `updated_at` when nothing changed. Upsert MUST be idempotent on `id`. *(Task 4)*
4. **Cross-profile and cross-user leakage** — a pull scoped only by `user_id` returns a dependant's providers into the self profile's list. Pull MUST filter on `user_id` AND `health_profile_id`; a request for another user's row MUST answer 404, not 403, so ownership cannot be probed. *(Task 5)*
5. **Tombstone resurrection on a stale device** — a device offline for weeks holds a live local row the server has tombstoned; its next drain re-uploads it. Server MUST reject an upsert whose id is tombstoned, and the client MUST apply the tombstone on pull rather than pushing over it. *(Task 11)*

---

# Part A — API (`../Balsm-API-DotNet`)

## File Structure — API

```
src/Modules/CareTeam/
  Balsm.CareTeam.Domain/
    CareTeamErrors.cs                       expected-failure catalog
    Entities/CareProvider.cs                aggregate root, encrypted fields as byte[]
    AssemblyReference.cs
  Balsm.CareTeam.Application/
    Commands/UpsertCareProviderCommand.cs
    Commands/DeleteCareProviderCommand.cs
    Queries/PullCareProvidersQuery.cs
    DependencyInjection.cs
    AssemblyReference.cs
  Balsm.CareTeam.Infrastructure/
    Data/CareTeamDbContext.cs
    Configuration/CareProviderConfiguration.cs
    Configuration/CareTeamAuditLogConfiguration.cs
    Handlers/UpsertCareProviderHandler.cs
    Handlers/DeleteCareProviderHandler.cs
    Handlers/PullCareProvidersHandler.cs
    DependencyInjection.cs
    Migrations/                             Npgsql migrations
  Balsm.CareTeam.Infrastructure.Migrations.Sqlite/
  Balsm.CareTeam.Api/
    Controllers/CareTeamController.cs
    ModuleRegistration.cs
src/Balsm.Infrastructure/Encryption/
  CareTeamEncryptionService.cs              new, alongside DobEncryptionService
tests/Modules/Balsm.CareTeam.Tests/
  CareProviderEncryptionTests.cs
  CareProviderSyncTests.cs
  CareProviderAuthorizationTests.cs
```

---

## Task 1: Field encryption service

**Files:**
- Create: `src/Balsm.Infrastructure/Encryption/CareTeamEncryptionService.cs`
- Create: `tests/Modules/Balsm.CareTeam.Tests/Balsm.CareTeam.Tests.csproj`
- Create: `tests/Modules/Balsm.CareTeam.Tests/CareProviderEncryptionTests.cs`
- Modify: `Balsm.API.slnx` (add the test project under the tests folder)

**Interfaces:**
- Consumes: nothing.
- Produces: `CareTeamEncryptionService` with `byte[] Encrypt(string plaintext)`, `string Decrypt(byte[] blob)`, `byte[]? EncryptOptional(string? plaintext)`, `string? DecryptOptional(byte[]? blob)`. Config key `CareTeamEncryption:Key`.

- [ ] **Step 1: Create the test project**

```bash
cd ../Balsm-API-DotNet
mkdir -p tests/Modules/Balsm.CareTeam.Tests
cp tests/Modules/Balsm.EmergencyQr.Tests/Balsm.EmergencyQr.Tests.csproj \
   tests/Modules/Balsm.CareTeam.Tests/Balsm.CareTeam.Tests.csproj
```

Then open the copied `.csproj` and replace every `EmergencyQr` with `CareTeam` in `RootNamespace`, `AssemblyName`, and `ProjectReference` paths. Remove project references to modules this test does not use; keep the references to `Balsm.Infrastructure` and `Balsm.SharedKernel`.

- [ ] **Step 2: Write the failing test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareProviderEncryptionTests.cs`:

```csharp
using System.Security.Cryptography;
using Balsm.Infrastructure.Encryption;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareProviderEncryptionTests
{
    private static CareTeamEncryptionService Service(string? keyBase64 = null)
    {
        var key = keyBase64 ?? Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["CareTeamEncryption:Key"] = key })
            .Build();
        return new CareTeamEncryptionService(config, NullLogger<CareTeamEncryptionService>.Instance);
    }

    [Fact]
    public void Encrypt_ThenDecrypt_RoundTrips()
    {
        var svc = Service();
        var blob = svc.Encrypt("Provider Alpha");
        svc.Decrypt(blob).Should().Be("Provider Alpha");
    }

    [Fact]
    public void Encrypt_SamePlaintextTwice_ProducesDifferentCiphertext()
    {
        var svc = Service();
        svc.Encrypt("Provider Alpha").Should().NotEqual(svc.Encrypt("Provider Alpha"));
    }

    [Fact]
    public void Decrypt_WithDifferentKey_Throws()
    {
        var blob = Service().Encrypt("Provider Alpha");
        var other = Service();
        Action act = () => other.Decrypt(blob);
        act.Should().Throw<CryptographicException>();
    }

    [Fact]
    public void EncryptOptional_Null_ReturnsNull()
    {
        Service().EncryptOptional(null).Should().BeNull();
    }

    [Fact]
    public void DecryptOptional_Null_ReturnsNull()
    {
        Service().DecryptOptional(null).Should().BeNull();
    }

    [Fact]
    public void Constructor_WithKeyShorterThan32Bytes_Throws()
    {
        var shortKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
        Action act = () => Service(shortKey);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*32 bytes*");
    }

    [Fact]
    public void Encrypt_LongFreeText_RoundTrips()
    {
        var svc = Service();
        var longNote = new string('n', 100_000);
        svc.Decrypt(svc.Encrypt(longNote)).Should().Be(longNote);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderEncryptionTests`
Expected: FAIL — `CareTeamEncryptionService` does not exist (compile error CS0246).

- [ ] **Step 4: Write the implementation**

Create `src/Balsm.Infrastructure/Encryption/CareTeamEncryptionService.cs`:

```csharp
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Balsm.Infrastructure.Encryption;

/// <summary>
/// AES-256-GCM field-level encryption for care-team free-text columns (FR-502).
/// Key sourced from CareTeamEncryption:Key (32 bytes, base64) — deliberately a
/// DIFFERENT key from DobEncryption:Key so a care-team key rotation cannot
/// invalidate stored DOB ciphertext, and a compromise of one does not yield
/// the other.
/// </summary>
public sealed class CareTeamEncryptionService
{
    private const int NonceSize = 12;
    private const int TagSize = 16;
    private readonly byte[] _key;
    private readonly ILogger<CareTeamEncryptionService> _logger;

    public CareTeamEncryptionService(IConfiguration configuration, ILogger<CareTeamEncryptionService> logger)
    {
        _logger = logger;
        var keyBase64 = configuration["CareTeamEncryption:Key"]
            ?? throw new InvalidOperationException("CareTeamEncryption:Key not configured");
        _key = Convert.FromBase64String(keyBase64);
        if (_key.Length != 32)
            throw new InvalidOperationException("CareTeamEncryption:Key must be 32 bytes (256-bit)");
    }

    // Returns nonce (12B) || tag (16B) || ciphertext
    public byte[] Encrypt(string plaintext)
    {
        var bytes = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[bytes.Length];
        var tag = new byte[TagSize];

        using var aesGcm = new AesGcm(_key, TagSize);
        aesGcm.Encrypt(nonce, bytes, ciphertext, tag);

        var result = new byte[NonceSize + TagSize + ciphertext.Length];
        nonce.CopyTo(result, 0);
        tag.CopyTo(result, NonceSize);
        ciphertext.CopyTo(result, NonceSize + TagSize);
        return result;
    }

    public string Decrypt(byte[] blob)
    {
        if (blob.Length < NonceSize + TagSize)
            throw new CryptographicException("Invalid care-team ciphertext");

        var nonce = blob[..NonceSize];
        var tag = blob[NonceSize..(NonceSize + TagSize)];
        var ciphertext = blob[(NonceSize + TagSize)..];
        var plaintext = new byte[ciphertext.Length];

        using var aesGcm = new AesGcm(_key, TagSize);
        aesGcm.Decrypt(nonce, ciphertext, tag, plaintext);

        return Encoding.UTF8.GetString(plaintext);
    }

    public byte[]? EncryptOptional(string? plaintext) =>
        string.IsNullOrEmpty(plaintext) ? null : Encrypt(plaintext);

    public string? DecryptOptional(byte[]? blob) =>
        blob is null || blob.Length == 0 ? null : Decrypt(blob);
}
```

- [ ] **Step 5: Register the service and the test project**

In `src/Balsm.Infrastructure/DependencyInjection.cs`, find where `DobEncryptionService` is registered and add the same registration style beside it:

```csharp
services.AddSingleton<CareTeamEncryptionService>();
```

In `Balsm.API.slnx`, add under the tests folder that already lists `Balsm.EmergencyQr.Tests`:

```xml
<Project Path="tests/Modules/Balsm.CareTeam.Tests/Balsm.CareTeam.Tests.csproj" />
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderEncryptionTests`
Expected: PASS — 7 tests.

- [ ] **Step 7: Commit**

```bash
git add src/Balsm.Infrastructure/Encryption/CareTeamEncryptionService.cs \
        src/Balsm.Infrastructure/DependencyInjection.cs \
        tests/Modules/Balsm.CareTeam.Tests Balsm.API.slnx
git commit -m "feat(care-team): add AES-256-GCM field encryption service

Separate key from DOB encryption so rotation and compromise are
independent. FR-502."
```

---

## Task 2: Domain entity

**Files:**
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Domain/Balsm.CareTeam.Domain.csproj`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Domain/Entities/CareProvider.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Domain/CareTeamErrors.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Domain/AssemblyReference.cs`
- Test: `tests/Modules/Balsm.CareTeam.Tests/CareProviderEntityTests.cs`

**Interfaces:**
- Consumes: `Balsm.SharedKernel.Domain.AggregateRoot`, `BaseEntity` (`Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`).
- Produces: `CareProvider.Create(Guid id, Guid userId, Guid healthProfileId, string type, CareProviderFields fields, DateTime createdAt)`, `void Overwrite(string type, CareProviderFields fields)`, `void Tombstone()`. Record `CareProviderFields(byte[] Name, byte[]? Specialty, byte[]? Phone, byte[]? Phone2, byte[]? Email, byte[]? Clinic, byte[]? Address, byte[]? MapUrl, byte[]? Notes)`. Errors `CareTeamErrors.NotFound`, `CareTeamErrors.Tombstoned`, `CareTeamErrors.InvalidType`.

- [ ] **Step 1: Create the project files**

```bash
cd ../Balsm-API-DotNet
mkdir -p src/Modules/CareTeam/Balsm.CareTeam.Domain/Entities
cp src/Modules/EmergencyQr/Balsm.EmergencyQr.Domain/Balsm.EmergencyQr.Domain.csproj \
   src/Modules/CareTeam/Balsm.CareTeam.Domain/Balsm.CareTeam.Domain.csproj
```

Open the copied `.csproj` and replace `EmergencyQr` with `CareTeam` throughout.

Create `src/Modules/CareTeam/Balsm.CareTeam.Domain/AssemblyReference.cs`:

```csharp
namespace Balsm.CareTeam.Domain;

public static class AssemblyReference
{
    public static readonly System.Reflection.Assembly Assembly = typeof(AssemblyReference).Assembly;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareProviderEntityTests.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareProviderEntityTests
{
    private static CareProviderFields Fields(string marker = "a") =>
        new([(byte)marker[0]], null, null, null, null, null, null, null, null);

    [Fact]
    public void Create_WithClientId_KeepsThatId()
    {
        var id = Guid.NewGuid();
        var provider = CareProvider.Create(id, Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        provider.Id.Should().Be(id);
    }

    [Fact]
    public void Create_WithEmptyId_Throws()
    {
        Action act = () => CareProvider.Create(
            Guid.Empty, Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        act.Should().Throw<ArgumentException>().WithMessage("*empty GUID*");
    }

    [Fact]
    public void Create_WithUnknownType_Throws()
    {
        Action act = () => CareProvider.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "astrologer", Fields(), DateTime.UtcNow);
        act.Should().Throw<ArgumentException>().WithMessage("*Invalid care provider type*");
    }

    [Fact]
    public void Overwrite_ReplacesFieldsAndType()
    {
        var provider = CareProvider.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields("a"), DateTime.UtcNow);
        provider.Overwrite("pharmacy", Fields("b"));
        provider.Type.Should().Be("pharmacy");
        provider.Name.Should().Equal((byte)'b');
    }

    [Fact]
    public void Overwrite_OnTombstonedRow_Throws()
    {
        var provider = CareProvider.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        provider.Tombstone();
        Action act = () => provider.Overwrite("doctor", Fields("b"));
        act.Should().Throw<InvalidOperationException>().WithMessage("*tombstoned*");
    }

    [Fact]
    public void Tombstone_IsIdempotent()
    {
        var provider = CareProvider.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        provider.Tombstone();
        var first = provider.DeletedAt;
        provider.Tombstone();
        provider.DeletedAt.Should().Be(first);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderEntityTests`
Expected: FAIL — `CareProvider` does not exist (CS0246).

- [ ] **Step 4: Write the implementation**

Create `src/Modules/CareTeam/Balsm.CareTeam.Domain/Entities/CareProvider.cs`:

```csharp
using Balsm.SharedKernel.Domain;

namespace Balsm.CareTeam.Domain.Entities;

/// <summary>
/// The encrypted free-text columns of one care-team row. Every member is
/// already AES-256-GCM ciphertext produced by CareTeamEncryptionService —
/// the domain never sees plaintext PHI (FR-502).
/// </summary>
public sealed record CareProviderFields(
    byte[] Name,
    byte[]? Specialty,
    byte[]? Phone,
    byte[]? Phone2,
    byte[]? Email,
    byte[]? Clinic,
    byte[]? Address,
    byte[]? MapUrl,
    byte[]? Notes);

/// <summary>
/// Cloud mirror of one on-device care_provider row. The id is minted by the
/// device (UUIDv7) and is authoritative on both sides — the server never
/// assigns one (FR-505).
/// </summary>
public sealed class CareProvider : AggregateRoot
{
    /// <summary>Mirrors CareProviderType.id in the Flutter domain.</summary>
    public static readonly string[] AllowedTypes =
        ["doctor", "nurse", "carer", "pharmacy", "lab", "physio", "clinic", "other"];

    public Guid UserId { get; private set; }
    public Guid HealthProfileId { get; private set; }
    public string Type { get; private set; } = string.Empty;

    public byte[] Name { get; private set; } = [];
    public byte[]? Specialty { get; private set; }
    public byte[]? Phone { get; private set; }
    public byte[]? Phone2 { get; private set; }
    public byte[]? Email { get; private set; }
    public byte[]? Clinic { get; private set; }
    public byte[]? Address { get; private set; }
    public byte[]? MapUrl { get; private set; }
    public byte[]? Notes { get; private set; }

    private CareProvider() { }

    public static CareProvider Create(
        Guid id,
        Guid userId,
        Guid healthProfileId,
        string type,
        CareProviderFields fields,
        DateTime createdAt)
    {
        if (id == Guid.Empty)
            throw new ArgumentException("id must not be the empty GUID", nameof(id));
        if (!AllowedTypes.Contains(type))
            throw new ArgumentException($"Invalid care provider type: {type}", nameof(type));

        var provider = new CareProvider
        {
            Id = id,
            UserId = userId,
            HealthProfileId = healthProfileId,
            Type = type,
            CreatedAt = createdAt
        };
        provider.Apply(fields);
        return provider;
    }

    /// <summary>
    /// Whole-row overwrite — the sync contract is last-writer-wins on the row,
    /// not a per-field merge (see spec "Row-level last-writer-wins").
    /// </summary>
    public void Overwrite(string type, CareProviderFields fields)
    {
        if (IsDeleted)
            throw new InvalidOperationException("Cannot overwrite a tombstoned care provider");
        if (!AllowedTypes.Contains(type))
            throw new ArgumentException($"Invalid care provider type: {type}", nameof(type));
        Type = type;
        Apply(fields);
    }

    /// <summary>Soft-delete so the removal can propagate to other devices (FR-507).</summary>
    public void Tombstone()
    {
        if (IsDeleted) return; // idempotent
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    private void Apply(CareProviderFields f)
    {
        Name = f.Name;
        Specialty = f.Specialty;
        Phone = f.Phone;
        Phone2 = f.Phone2;
        Email = f.Email;
        Clinic = f.Clinic;
        Address = f.Address;
        MapUrl = f.MapUrl;
        Notes = f.Notes;
    }
}
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Domain/CareTeamErrors.cs`:

```csharp
using Balsm.SharedKernel.Results;

namespace Balsm.CareTeam.Domain;

/// <summary>Expected-failure catalog for the CareTeam context (Result pattern).</summary>
public static class CareTeamErrors
{
    /// <summary>Unknown id OR an id owned by another user — deliberately one
    /// error so ownership cannot be probed (contract: 404).</summary>
    public static readonly Error NotFound = new("CareTeam.NotFound", "Care provider not found.");

    /// <summary>Upsert targeting an id the server has already tombstoned
    /// (contract: 409). A stale device must pull the tombstone, not push over it.</summary>
    public static readonly Error Tombstoned = new("CareTeam.Tombstoned", "Care provider was deleted.");

    /// <summary>type outside AllowedTypes (contract: 422).</summary>
    public static readonly Error InvalidType = new("CareTeam.InvalidType", "Invalid care provider type.");
}
```

- [ ] **Step 5: Add project references and run tests**

In `tests/Modules/Balsm.CareTeam.Tests/Balsm.CareTeam.Tests.csproj`, add:

```xml
<ProjectReference Include="../../../src/Modules/CareTeam/Balsm.CareTeam.Domain/Balsm.CareTeam.Domain.csproj" />
```

In `Balsm.API.slnx`, add a folder block mirroring the EmergencyQr one:

```xml
<Folder Name="/src/Modules/CareTeam/">
  <Project Path="src/Modules/CareTeam/Balsm.CareTeam.Domain/Balsm.CareTeam.Domain.csproj" />
</Folder>
```

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderEntityTests`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/Modules/CareTeam tests/Modules/Balsm.CareTeam.Tests Balsm.API.slnx
git commit -m "feat(care-team): add CareProvider aggregate with tombstone support

Client-minted id is authoritative (FR-505); whole-row overwrite matches
the LWW sync contract; Tombstone() is idempotent (FR-507)."
```

---

## Task 3: Persistence — DbContext, configuration, migrations

**Files:**
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Balsm.CareTeam.Infrastructure.csproj`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Data/CareTeamDbContext.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Configuration/CareProviderConfiguration.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Configuration/CareTeamDbContextDesignTimeFactory.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/DependencyInjection.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/` (project)
- Test: `tests/Modules/Balsm.CareTeam.Tests/CareProviderPersistenceTests.cs`

**Interfaces:**
- Consumes: `CareProvider`, `CareProviderFields` (Task 2); `BaseDbContext`.
- Produces: `CareTeamDbContext` with `DbSet<CareProvider> CareProviders`. Table `care_provider`. `AddCareTeamInfrastructure(IConfiguration)`.

- [ ] **Step 1: Write the failing test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareProviderPersistenceTests.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.SharedKernel.Events;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareProviderPersistenceTests : IDisposable
{
    private readonly CareTeamDbContext _db;
    private readonly SqliteConnection _connection;

    public CareProviderPersistenceTests()
    {
        var dispatcher = Substitute.For<IDomainEventDispatcher>();
        // A :memory: SQLite database dies with its last connection — hold one open.
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var opts = new DbContextOptionsBuilder<CareTeamDbContext>().UseSqlite(_connection).Options;
        _db = new CareTeamDbContext(opts, dispatcher);
        _db.Database.EnsureCreated();
    }

    private static CareProviderFields Fields() =>
        new([1, 2, 3], null, null, null, null, null, null, null, null);

    [Fact]
    public async Task SaveAndReload_RoundTripsCiphertext()
    {
        var id = Guid.NewGuid();
        _db.CareProviders.Add(CareProvider.Create(
            id, Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow));
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var loaded = await _db.CareProviders.SingleAsync(p => p.Id == id);
        loaded.Name.Should().Equal(1, 2, 3);
        loaded.Type.Should().Be("doctor");
    }

    [Fact]
    public async Task TombstonedRow_IsHiddenByDefaultButVisibleWithIgnoreQueryFilters()
    {
        var id = Guid.NewGuid();
        var provider = CareProvider.Create(
            id, Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        _db.CareProviders.Add(provider);
        await _db.SaveChangesAsync();

        provider.Tombstone();
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        (await _db.CareProviders.AnyAsync(p => p.Id == id)).Should().BeFalse();
        (await _db.CareProviders.IgnoreQueryFilters().AnyAsync(p => p.Id == id)).Should().BeTrue();
    }

    [Fact]
    public async Task SaveChanges_StampsUpdatedAtOnModify()
    {
        var provider = CareProvider.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        _db.CareProviders.Add(provider);
        await _db.SaveChangesAsync();
        provider.UpdatedAt.Should().BeNull();

        provider.Overwrite("pharmacy", Fields());
        await _db.SaveChangesAsync();
        provider.UpdatedAt.Should().NotBeNull();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderPersistenceTests`
Expected: FAIL — `CareTeamDbContext` does not exist (CS0246).

- [ ] **Step 3: Create the infrastructure project**

```bash
cd ../Balsm-API-DotNet
mkdir -p src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/{Data,Configuration,Handlers}
cp src/Modules/EmergencyQr/Balsm.EmergencyQr.Infrastructure/Balsm.EmergencyQr.Infrastructure.csproj \
   src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Balsm.CareTeam.Infrastructure.csproj
```

Replace `EmergencyQr` with `CareTeam` throughout the copied `.csproj`.

- [ ] **Step 4: Write the DbContext and configuration**

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Data/CareTeamDbContext.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using Balsm.Infrastructure.Data;
using Balsm.SharedKernel.Events;
using Microsoft.EntityFrameworkCore;

namespace Balsm.CareTeam.Infrastructure.Data;

public sealed class CareTeamDbContext(
    DbContextOptions<CareTeamDbContext> options,
    IDomainEventDispatcher domainEventDispatcher) : BaseDbContext(options, domainEventDispatcher)
{
    public DbSet<CareProvider> CareProviders { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CareTeamDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Configuration/CareProviderConfiguration.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Balsm.CareTeam.Infrastructure.Configuration;

public sealed class CareProviderConfiguration : IEntityTypeConfiguration<CareProvider>
{
    public void Configure(EntityTypeBuilder<CareProvider> builder)
    {
        builder.HasKey(x => x.Id);
        // Device-minted UUIDv7 (FR-505) — never server-assigned, so no default.
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.HealthProfileId).HasColumnName("health_profile_id").IsRequired();

        // Plaintext: needed for filtering and the sync cursor, carries no free text (FR-503).
        builder.Property(x => x.Type).HasColumnName("type").HasMaxLength(16).IsRequired();

        // Encrypted free text (FR-502).
        builder.Property(x => x.Name).HasColumnName("name_ct").HasColumnType("bytea").IsRequired();
        builder.Property(x => x.Specialty).HasColumnName("specialty_ct").HasColumnType("bytea");
        builder.Property(x => x.Phone).HasColumnName("phone_ct").HasColumnType("bytea");
        builder.Property(x => x.Phone2).HasColumnName("phone2_ct").HasColumnType("bytea");
        builder.Property(x => x.Email).HasColumnName("email_ct").HasColumnType("bytea");
        builder.Property(x => x.Clinic).HasColumnName("clinic_ct").HasColumnType("bytea");
        builder.Property(x => x.Address).HasColumnName("address_ct").HasColumnType("bytea");
        builder.Property(x => x.MapUrl).HasColumnName("map_url_ct").HasColumnType("bytea");
        builder.Property(x => x.Notes).HasColumnName("notes_ct").HasColumnType("bytea");

        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        builder.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(x => x.DeletedAt).HasColumnName("deleted_at");

        builder.Ignore(x => x.CreatedBy);
        builder.Ignore(x => x.UpdatedBy);
        builder.Ignore(x => x.DeletedBy);

        builder.ToTable("care_provider");

        // The incremental pull is (user_id, health_profile_id) filtered and
        // updated_at ordered — FR-508/FR-510.
        builder.HasIndex(x => new { x.UserId, x.HealthProfileId, x.UpdatedAt });
    }
}
```

> **Note on the query filter:** `BaseDbContext` auto-applies `IsDeleted == false` because this entity maps `IsDeleted`. That is what we want for ordinary reads. The pull handler (Task 4) MUST call `.IgnoreQueryFilters()` so tombstones reach the client.

- [ ] **Step 5: Write the DI registration**

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/DependencyInjection.cs`:

```csharp
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Balsm.CareTeam.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddCareTeamInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var dbOptions = configuration
            .GetSection("CloudDatabase")
            .Get<DatabaseOptions>() ?? new DatabaseOptions { Provider = "postgresql", ConnectionString = string.Empty };

        services.AddDbContext<CareTeamDbContext>(options =>
            options.ConfigureDatabase(dbOptions, sqliteMigrationsAssembly: "Balsm.CareTeam.Infrastructure.Migrations.Sqlite"));

        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

        return services;
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Add to `tests/Modules/Balsm.CareTeam.Tests/Balsm.CareTeam.Tests.csproj`:

```xml
<ProjectReference Include="../../../src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Balsm.CareTeam.Infrastructure.csproj" />
```

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderPersistenceTests`
Expected: PASS — 3 tests.

- [ ] **Step 7: Generate migrations**

Create the Sqlite migrations project by copying the EmergencyQr one:

```bash
cp -r src/Modules/EmergencyQr/Balsm.EmergencyQr.Infrastructure.Migrations.Sqlite \
      src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite
rm -rf src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/Migrations/* \
       src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/obj \
       src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/bin
mv src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/Balsm.EmergencyQr.Infrastructure.Migrations.Sqlite.csproj \
   src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite/Balsm.CareTeam.Infrastructure.Migrations.Sqlite.csproj
```

Replace `EmergencyQr` with `CareTeam` in the moved `.csproj`. Copy `EmergencyQrDbContextDesignTimeFactory.cs` into `Balsm.CareTeam.Infrastructure/Configuration/` as `CareTeamDbContextDesignTimeFactory.cs` and rename the types inside.

Then generate both providers' migrations:

```bash
dotnet ef migrations add InitialCareTeamSchema \
  --project src/Modules/CareTeam/Balsm.CareTeam.Infrastructure \
  --startup-project src/Balsm.API \
  --context CareTeamDbContext

dotnet ef migrations add InitialCareTeamSchema \
  --project src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite \
  --startup-project src/Balsm.API \
  --context CareTeamDbContext
```

Inspect both generated migrations and confirm `care_provider` has the nine `*_ct` columns as `bytea` (Postgres) / `BLOB` (SQLite) and the composite index.

- [ ] **Step 8: Commit**

```bash
git add src/Modules/CareTeam tests/Modules/Balsm.CareTeam.Tests Balsm.API.slnx
git commit -m "feat(care-team): add CareTeamDbContext, config and migrations

Nine encrypted bytea columns; ids/type/timestamps plaintext (FR-502/503).
Composite index on (user_id, health_profile_id, updated_at) for the pull."
```

---

## Task 4: Commands, queries and handlers

**Files:**
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Application/` (project, `DependencyInjection.cs`, `AssemblyReference.cs`)
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Application/Commands/UpsertCareProviderCommand.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Application/Commands/DeleteCareProviderCommand.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Application/Queries/PullCareProvidersQuery.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/UpsertCareProviderHandler.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/DeleteCareProviderHandler.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/PullCareProvidersHandler.cs`
- Test: `tests/Modules/Balsm.CareTeam.Tests/CareProviderSyncTests.cs`

**Interfaces:**
- Consumes: `CareTeamDbContext` (Task 3), `CareTeamEncryptionService` (Task 1), `CareProvider` (Task 2).
- Produces:
  - `UpsertCareProviderCommand(Guid Id, Guid UserId, Guid HealthProfileId, string Type, string Name, string? Specialty, string? Phone, string? Phone2, string? Email, string? Clinic, string? Address, string? MapUrl, string? Notes, DateTime CreatedAt) : IRequest<Result>`
  - `DeleteCareProviderCommand(Guid Id, Guid UserId) : IRequest<Result>`
  - `PullCareProvidersQuery(Guid UserId, Guid HealthProfileId, DateTime? Since) : IRequest<Result<IReadOnlyList<CareProviderDto>>>`
  - `CareProviderDto(Guid Id, Guid HealthProfileId, string Type, string Name, string? Specialty, string? Phone, string? Phone2, string? Email, string? Clinic, string? Address, string? MapUrl, string? Notes, DateTime CreatedAt, DateTime UpdatedAt, bool IsDeleted)`

- [ ] **Step 1: Write the failing test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareProviderSyncTests.cs`:

```csharp
using System.Security.Cryptography;
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Application.Queries;
using Balsm.CareTeam.Domain;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.CareTeam.Infrastructure.Handlers;
using Balsm.Infrastructure.Encryption;
using Balsm.SharedKernel.Events;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareProviderSyncTests : IDisposable
{
    private readonly CareTeamDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly CareTeamEncryptionService _crypto;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _profileId = Guid.NewGuid();

    public CareProviderSyncTests()
    {
        var dispatcher = Substitute.For<IDomainEventDispatcher>();
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var opts = new DbContextOptionsBuilder<CareTeamDbContext>().UseSqlite(_connection).Options;
        _db = new CareTeamDbContext(opts, dispatcher);
        _db.Database.EnsureCreated();

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["CareTeamEncryption:Key"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        }).Build();
        _crypto = new CareTeamEncryptionService(config, NullLogger<CareTeamEncryptionService>.Instance);
    }

    private UpsertCareProviderCommand Upsert(Guid id, string name = "Provider Alpha", string type = "doctor") =>
        new(id, _userId, _profileId, type, name,
            null, null, null, null, null, null, null, null, DateTime.UtcNow);

    [Fact]
    public async Task Upsert_NewId_CreatesRow()
    {
        var id = Guid.NewGuid();
        var result = await new UpsertCareProviderHandler(_db, _crypto)
            .Handle(Upsert(id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        (await _db.CareProviders.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Upsert_SameIdTwice_IsIdempotent_NoDuplicateRow()
    {
        var id = Guid.NewGuid();
        var handler = new UpsertCareProviderHandler(_db, _crypto);
        await handler.Handle(Upsert(id), CancellationToken.None);
        await handler.Handle(Upsert(id), CancellationToken.None);

        (await _db.CareProviders.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Upsert_ExistingId_OverwritesFields()
    {
        var id = Guid.NewGuid();
        var handler = new UpsertCareProviderHandler(_db, _crypto);
        await handler.Handle(Upsert(id, "Provider Alpha"), CancellationToken.None);
        await handler.Handle(Upsert(id, "Provider Beta", "pharmacy"), CancellationToken.None);

        var pull = await new PullCareProvidersHandler(_db, _crypto)
            .Handle(new PullCareProvidersQuery(_userId, _profileId, null), CancellationToken.None);

        pull.Value!.Single().Name.Should().Be("Provider Beta");
        pull.Value!.Single().Type.Should().Be("pharmacy");
    }

    /// <summary>Review Focus 1 — a device with a clock months ahead must not
    /// be able to freeze a row by supplying its own updated_at.</summary>
    [Fact]
    public async Task Upsert_UsesServerClockForUpdatedAt_NotClientCreatedAt()
    {
        var id = Guid.NewGuid();
        var handler = new UpsertCareProviderHandler(_db, _crypto);
        var farFuture = DateTime.UtcNow.AddYears(5);
        await handler.Handle(
            new UpsertCareProviderCommand(id, _userId, _profileId, "doctor", "Provider Alpha",
                null, null, null, null, null, null, null, null, farFuture),
            CancellationToken.None);
        // Second write is what stamps UpdatedAt.
        await handler.Handle(Upsert(id, "Provider Beta"), CancellationToken.None);
        _db.ChangeTracker.Clear();

        var row = await _db.CareProviders.SingleAsync(p => p.Id == id);
        row.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    /// <summary>Review Focus 5 — a stale device must not resurrect a tombstone.</summary>
    [Fact]
    public async Task Upsert_OnTombstonedId_ReturnsTombstonedError()
    {
        var id = Guid.NewGuid();
        await new UpsertCareProviderHandler(_db, _crypto).Handle(Upsert(id), CancellationToken.None);
        await new DeleteCareProviderHandler(_db).Handle(
            new DeleteCareProviderCommand(id, _userId), CancellationToken.None);

        var result = await new UpsertCareProviderHandler(_db, _crypto)
            .Handle(Upsert(id), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Be(CareTeamErrors.Tombstoned);
    }

    [Fact]
    public async Task Delete_UnknownId_ReturnsNotFound()
    {
        var result = await new DeleteCareProviderHandler(_db)
            .Handle(new DeleteCareProviderCommand(Guid.NewGuid(), _userId), CancellationToken.None);

        result.Error.Should().Be(CareTeamErrors.NotFound);
    }

    [Fact]
    public async Task Delete_IsIdempotent()
    {
        var id = Guid.NewGuid();
        await new UpsertCareProviderHandler(_db, _crypto).Handle(Upsert(id), CancellationToken.None);
        var handler = new DeleteCareProviderHandler(_db);

        (await handler.Handle(new DeleteCareProviderCommand(id, _userId), CancellationToken.None))
            .IsSuccess.Should().BeTrue();
        (await handler.Handle(new DeleteCareProviderCommand(id, _userId), CancellationToken.None))
            .IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Pull_IncludesTombstones()
    {
        var id = Guid.NewGuid();
        await new UpsertCareProviderHandler(_db, _crypto).Handle(Upsert(id), CancellationToken.None);
        await new DeleteCareProviderHandler(_db).Handle(
            new DeleteCareProviderCommand(id, _userId), CancellationToken.None);

        var pull = await new PullCareProvidersHandler(_db, _crypto)
            .Handle(new PullCareProvidersQuery(_userId, _profileId, null), CancellationToken.None);

        pull.Value!.Single().IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task Pull_WithSinceCursor_ReturnsOnlyNewerRows()
    {
        var handler = new UpsertCareProviderHandler(_db, _crypto);
        await handler.Handle(Upsert(Guid.NewGuid(), "Provider Alpha"), CancellationToken.None);
        await Task.Delay(1100); // second-resolution timestamps
        var cursor = DateTime.UtcNow;
        await Task.Delay(1100);
        await handler.Handle(Upsert(Guid.NewGuid(), "Provider Beta"), CancellationToken.None);

        var pull = await new PullCareProvidersHandler(_db, _crypto)
            .Handle(new PullCareProvidersQuery(_userId, _profileId, cursor), CancellationToken.None);

        pull.Value!.Should().ContainSingle().Which.Name.Should().Be("Provider Beta");
    }

    /// <summary>Review Focus 4 — a dependant's roster must not leak into the
    /// self profile's pull.</summary>
    [Fact]
    public async Task Pull_ScopedToHealthProfile_ExcludesOtherProfiles()
    {
        var otherProfile = Guid.NewGuid();
        var handler = new UpsertCareProviderHandler(_db, _crypto);
        await handler.Handle(Upsert(Guid.NewGuid(), "Provider Alpha"), CancellationToken.None);
        await handler.Handle(
            new UpsertCareProviderCommand(Guid.NewGuid(), _userId, otherProfile, "doctor", "Dependant Provider",
                null, null, null, null, null, null, null, null, DateTime.UtcNow),
            CancellationToken.None);

        var pull = await new PullCareProvidersHandler(_db, _crypto)
            .Handle(new PullCareProvidersQuery(_userId, _profileId, null), CancellationToken.None);

        pull.Value!.Should().ContainSingle().Which.Name.Should().Be("Provider Alpha");
    }

    /// <summary>Review Focus 4 — another user's id must answer NotFound, never
    /// a distinguishable Forbidden, so ownership cannot be probed.</summary>
    [Fact]
    public async Task Delete_AnotherUsersId_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        await new UpsertCareProviderHandler(_db, _crypto).Handle(Upsert(id), CancellationToken.None);

        var result = await new DeleteCareProviderHandler(_db)
            .Handle(new DeleteCareProviderCommand(id, Guid.NewGuid()), CancellationToken.None);

        result.Error.Should().Be(CareTeamErrors.NotFound);
    }

    [Fact]
    public async Task Upsert_InvalidType_ReturnsInvalidTypeError()
    {
        var result = await new UpsertCareProviderHandler(_db, _crypto)
            .Handle(Upsert(Guid.NewGuid(), "Provider Alpha", "astrologer"), CancellationToken.None);

        result.Error.Should().Be(CareTeamErrors.InvalidType);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderSyncTests`
Expected: FAIL — command/query/handler types do not exist (CS0246).

- [ ] **Step 3: Create the Application project and contracts**

```bash
cd ../Balsm-API-DotNet
mkdir -p src/Modules/CareTeam/Balsm.CareTeam.Application/{Commands,Queries}
cp src/Modules/EmergencyQr/Balsm.EmergencyQr.Application/Balsm.EmergencyQr.Application.csproj \
   src/Modules/CareTeam/Balsm.CareTeam.Application/Balsm.CareTeam.Application.csproj
```

Replace `EmergencyQr` with `CareTeam` in the copied `.csproj`.

Create `src/Modules/CareTeam/Balsm.CareTeam.Application/Commands/UpsertCareProviderCommand.cs`:

```csharp
using Balsm.SharedKernel.Results;
using MediatR;

namespace Balsm.CareTeam.Application.Commands;

/// <summary>
/// Creates or overwrites one care-team row. Idempotent on <paramref name="Id"/>:
/// the client drains its outbox with at-least-once delivery, so a replayed push
/// must not duplicate (Review Focus 3).
/// </summary>
/// <param name="CreatedAt">Device clock, trusted only for first-write ordering.
/// UpdatedAt is always the server clock (Review Focus 1).</param>
public sealed record UpsertCareProviderCommand(
    Guid Id,
    Guid UserId,
    Guid HealthProfileId,
    string Type,
    string Name,
    string? Specialty,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Clinic,
    string? Address,
    string? MapUrl,
    string? Notes,
    DateTime CreatedAt) : IRequest<Result>;
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Application/Commands/DeleteCareProviderCommand.cs`:

```csharp
using Balsm.SharedKernel.Results;
using MediatR;

namespace Balsm.CareTeam.Application.Commands;

/// <summary>Tombstones one row. Idempotent — a repeated delete succeeds.</summary>
public sealed record DeleteCareProviderCommand(Guid Id, Guid UserId) : IRequest<Result>;
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Application/Queries/PullCareProvidersQuery.cs`:

```csharp
using Balsm.SharedKernel.Results;
using MediatR;

namespace Balsm.CareTeam.Application.Queries;

/// <summary>One row as the client sees it — decrypted, tombstones included.</summary>
public sealed record CareProviderDto(
    Guid Id,
    Guid HealthProfileId,
    string Type,
    string Name,
    string? Specialty,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Clinic,
    string? Address,
    string? MapUrl,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    bool IsDeleted);

/// <param name="Since">Exclusive cursor on UpdatedAt; null pulls everything.</param>
public sealed record PullCareProvidersQuery(
    Guid UserId,
    Guid HealthProfileId,
    DateTime? Since) : IRequest<Result<IReadOnlyList<CareProviderDto>>>;
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Application/DependencyInjection.cs`:

```csharp
using Microsoft.Extensions.DependencyInjection;

namespace Balsm.CareTeam.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddCareTeamApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
```

- [ ] **Step 4: Write the handlers**

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/UpsertCareProviderHandler.cs`:

```csharp
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Domain;
using Balsm.CareTeam.Domain.Entities;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.Infrastructure.Encryption;
using Balsm.SharedKernel.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Balsm.CareTeam.Infrastructure.Handlers;

public sealed class UpsertCareProviderHandler(CareTeamDbContext db, CareTeamEncryptionService crypto)
    : IRequestHandler<UpsertCareProviderCommand, Result>
{
    public async Task<Result> Handle(UpsertCareProviderCommand cmd, CancellationToken ct)
    {
        if (!CareProvider.AllowedTypes.Contains(cmd.Type))
            return Result.Failure(CareTeamErrors.InvalidType);

        var fields = new CareProviderFields(
            crypto.Encrypt(cmd.Name),
            crypto.EncryptOptional(cmd.Specialty),
            crypto.EncryptOptional(cmd.Phone),
            crypto.EncryptOptional(cmd.Phone2),
            crypto.EncryptOptional(cmd.Email),
            crypto.EncryptOptional(cmd.Clinic),
            crypto.EncryptOptional(cmd.Address),
            crypto.EncryptOptional(cmd.MapUrl),
            crypto.EncryptOptional(cmd.Notes));

        // IgnoreQueryFilters so a tombstoned id is found and refused rather than
        // silently re-created under the same primary key (Review Focus 5).
        var existing = await db.CareProviders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == cmd.Id, ct);

        if (existing is null)
        {
            db.CareProviders.Add(CareProvider.Create(
                cmd.Id, cmd.UserId, cmd.HealthProfileId, cmd.Type, fields, cmd.CreatedAt));
            await db.SaveChangesAsync(ct);
            return Result.Success();
        }

        // Unknown and not-owned collapse into one answer so ownership cannot be probed.
        if (existing.UserId != cmd.UserId)
            return Result.Failure(CareTeamErrors.NotFound);

        if (existing.IsDeleted)
            return Result.Failure(CareTeamErrors.Tombstoned);

        existing.Overwrite(cmd.Type, fields);
        // BaseDbContext.SetAuditFields stamps UpdatedAt from the server clock —
        // the client's CreatedAt is never used for ordering (Review Focus 1).
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/DeleteCareProviderHandler.cs`:

```csharp
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Domain;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.SharedKernel.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Balsm.CareTeam.Infrastructure.Handlers;

public sealed class DeleteCareProviderHandler(CareTeamDbContext db)
    : IRequestHandler<DeleteCareProviderCommand, Result>
{
    public async Task<Result> Handle(DeleteCareProviderCommand cmd, CancellationToken ct)
    {
        var provider = await db.CareProviders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == cmd.Id, ct);

        if (provider is null || provider.UserId != cmd.UserId)
            return Result.Failure(CareTeamErrors.NotFound);

        provider.Tombstone();
        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/PullCareProvidersHandler.cs`:

```csharp
using Balsm.CareTeam.Application.Queries;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.Infrastructure.Encryption;
using Balsm.SharedKernel.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Balsm.CareTeam.Infrastructure.Handlers;

public sealed class PullCareProvidersHandler(CareTeamDbContext db, CareTeamEncryptionService crypto)
    : IRequestHandler<PullCareProvidersQuery, Result<IReadOnlyList<CareProviderDto>>>
{
    public async Task<Result<IReadOnlyList<CareProviderDto>>> Handle(
        PullCareProvidersQuery query, CancellationToken ct)
    {
        // IgnoreQueryFilters so tombstones reach the client — a delete on one
        // device must propagate, not simply vanish from the result set (FR-507).
        var rows = await db.CareProviders
            .IgnoreQueryFilters()
            .Where(p => p.UserId == query.UserId && p.HealthProfileId == query.HealthProfileId)
            .Where(p => query.Since == null || (p.UpdatedAt ?? p.CreatedAt) > query.Since)
            .OrderBy(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync(ct);

        var dtos = rows.Select(p => new CareProviderDto(
            p.Id,
            p.HealthProfileId,
            p.Type,
            crypto.Decrypt(p.Name),
            crypto.DecryptOptional(p.Specialty),
            crypto.DecryptOptional(p.Phone),
            crypto.DecryptOptional(p.Phone2),
            crypto.DecryptOptional(p.Email),
            crypto.DecryptOptional(p.Clinic),
            crypto.DecryptOptional(p.Address),
            crypto.DecryptOptional(p.MapUrl),
            crypto.DecryptOptional(p.Notes),
            p.CreatedAt,
            p.UpdatedAt ?? p.CreatedAt,
            p.IsDeleted)).ToList();

        return Result.Success<IReadOnlyList<CareProviderDto>>(dtos);
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Add the Application project reference to the Infrastructure `.csproj` and to the test `.csproj`.

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareProviderSyncTests`
Expected: PASS — 12 tests.

- [ ] **Step 6: Commit**

```bash
git add src/Modules/CareTeam tests/Modules/Balsm.CareTeam.Tests
git commit -m "feat(care-team): add upsert, delete and incremental pull handlers

Upsert idempotent on client id; tombstoned ids refuse resurrection;
pull scoped to (user, profile) and carries tombstones. FR-505..FR-510."
```

---

## Task 5: Controller, routes and app wiring

**Files:**
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Api/Balsm.CareTeam.Api.csproj`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Api/Controllers/CareTeamController.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Api/ModuleRegistration.cs`
- Modify: `src/Balsm.API/Program.cs:325` (module registration), `:341` (infrastructure), `:366` (application part)
- Modify: `Balsm.API.slnx`
- Test: `tests/Modules/Balsm.CareTeam.Tests/CareTeamControllerTests.cs`

**Interfaces:**
- Consumes: the three MediatR contracts from Task 4.
- Produces: `GET /care-team/providers?health_profile_id=&since=`, `POST /care-team/providers`, `DELETE /care-team/providers/{id}`. `AddCareTeamModule()`.

- [ ] **Step 1: Write the controller**

Create `src/Modules/CareTeam/Balsm.CareTeam.Api/Controllers/CareTeamController.cs`:

```csharp
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Application.Queries;
using Balsm.CareTeam.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Balsm.CareTeam.Api.Controllers;

[ApiController]
[Route("care-team")]
[Authorize]
public sealed class CareTeamController(IMediator mediator) : ControllerBase
{
    private Guid CurrentUserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? Guid.Empty.ToString());

    // GET /care-team/providers?health_profile_id=…&since=…  (FR-508/FR-510)
    [HttpGet("providers")]
    public async Task<IActionResult> Pull(
        [FromQuery(Name = "health_profile_id")] Guid healthProfileId,
        [FromQuery(Name = "since")] DateTime? since,
        CancellationToken ct)
    {
        var result = await mediator.Send(
            new PullCareProvidersQuery(CurrentUserId, healthProfileId, since), ct);

        return Ok(new
        {
            data = result.Value!.Select(p => new
            {
                id = p.Id,
                health_profile_id = p.HealthProfileId,
                type = p.Type,
                name = p.Name,
                specialty = p.Specialty,
                phone = p.Phone,
                phone2 = p.Phone2,
                email = p.Email,
                clinic = p.Clinic,
                address = p.Address,
                map_url = p.MapUrl,
                notes = p.Notes,
                created_at = p.CreatedAt,
                updated_at = p.UpdatedAt,
                is_deleted = p.IsDeleted
            })
        });
    }

    // POST /care-team/providers  (FR-505/FR-506)
    [HttpPost("providers")]
    public async Task<IActionResult> Upsert([FromBody] UpsertCareProviderRequest req, CancellationToken ct)
    {
        var result = await mediator.Send(new UpsertCareProviderCommand(
            req.Id, CurrentUserId, req.HealthProfileId, req.Type, req.Name,
            req.Specialty, req.Phone, req.Phone2, req.Email, req.Clinic,
            req.Address, req.MapUrl, req.Notes, req.CreatedAt), ct);

        if (result.IsSuccess) return Ok(new { data = new { id = req.Id } });
        if (result.Error == CareTeamErrors.NotFound) return NotFound(new { error = result.Error.Code });
        if (result.Error == CareTeamErrors.Tombstoned) return Conflict(new { error = result.Error!.Code });
        return UnprocessableEntity(new { error = result.Error!.Code });
    }

    // DELETE /care-team/providers/{id}  (FR-507)
    [HttpDelete("providers/{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteCareProviderCommand(id, CurrentUserId), ct);
        if (result.IsSuccess) return NoContent();
        return NotFound(new { error = result.Error!.Code });
    }
}

public sealed record UpsertCareProviderRequest(
    Guid Id,
    Guid HealthProfileId,
    string Type,
    string Name,
    string? Specialty,
    string? Phone,
    string? Phone2,
    string? Email,
    string? Clinic,
    string? Address,
    string? MapUrl,
    string? Notes,
    DateTime CreatedAt);
```

Create `src/Modules/CareTeam/Balsm.CareTeam.Api/ModuleRegistration.cs`:

```csharp
using Balsm.CareTeam.Application;
using Microsoft.Extensions.DependencyInjection;

namespace Balsm.CareTeam.Api;

public static class ModuleRegistration
{
    public static IServiceCollection AddCareTeamModule(this IServiceCollection services)
    {
        services.AddCareTeamApplication();
        return services;
    }
}
```

- [ ] **Step 2: Wire into Program.cs**

In `src/Balsm.API/Program.cs`, add after line 325 (`builder.Services.AddPrescriptionModule();`):

```csharp
builder.Services.AddCareTeamModule();
```

Add after line 341 (`builder.Services.AddPrescriptionInfrastructure(builder.Configuration);`):

```csharp
builder.Services.AddCareTeamInfrastructure(builder.Configuration);
```

Add to the `AddApplicationPart` chain after the `Prescription` line:

```csharp
    .AddApplicationPart(typeof(Balsm.CareTeam.Api.ModuleRegistration).Assembly);
```

(Move the `;` off the `Prescription` line onto the new last line.)

Add `Balsm.CareTeam.Api` to `src/Balsm.API/Balsm.API.csproj` as a `ProjectReference`, and add all four CareTeam projects to the `Balsm.API.slnx` folder block created in Task 2.

- [ ] **Step 3: Write the failing integration test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareTeamControllerTests.cs`:

```csharp
using Balsm.CareTeam.Api.Controllers;
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Application.Queries;
using Balsm.CareTeam.Domain;
using Balsm.SharedKernel.Results;
using FluentAssertions;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using System.Security.Claims;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareTeamControllerTests
{
    private static CareTeamController Controller(IMediator mediator, Guid userId)
    {
        var controller = new CareTeamController(mediator);
        var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId.ToString())]);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static UpsertCareProviderRequest Request(Guid id, Guid profileId) =>
        new(id, profileId, "doctor", "Provider Alpha",
            null, null, null, null, null, null, null, null, DateTime.UtcNow);

    [Fact]
    public async Task Upsert_TakesUserIdFromTokenNotBody()
    {
        var tokenUser = Guid.NewGuid();
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<UpsertCareProviderCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        await Controller(mediator, tokenUser)
            .Upsert(Request(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        await mediator.Received(1).Send(
            Arg.Is<UpsertCareProviderCommand>(c => c.UserId == tokenUser),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Upsert_OnTombstoned_Returns409()
    {
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<UpsertCareProviderCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure(CareTeamErrors.Tombstoned));

        var response = await Controller(mediator, Guid.NewGuid())
            .Upsert(Request(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        response.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Upsert_InvalidType_Returns422()
    {
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<UpsertCareProviderCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure(CareTeamErrors.InvalidType));

        var response = await Controller(mediator, Guid.NewGuid())
            .Upsert(Request(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        response.Should().BeOfType<UnprocessableEntityObjectResult>();
    }

    /// <summary>Review Focus 4 — another user's row answers 404, never 403.</summary>
    [Fact]
    public async Task Delete_NotOwned_Returns404()
    {
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<DeleteCareProviderCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Failure(CareTeamErrors.NotFound));

        var response = await Controller(mediator, Guid.NewGuid())
            .Delete(Guid.NewGuid(), CancellationToken.None);

        response.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task Delete_Success_Returns204()
    {
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<DeleteCareProviderCommand>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var response = await Controller(mediator, Guid.NewGuid())
            .Delete(Guid.NewGuid(), CancellationToken.None);

        response.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task Pull_PassesProfileScopeThrough()
    {
        var profileId = Guid.NewGuid();
        var mediator = Substitute.For<IMediator>();
        mediator.Send(Arg.Any<PullCareProvidersQuery>(), Arg.Any<CancellationToken>())
            .Returns(Result.Success<IReadOnlyList<CareProviderDto>>([]));

        await Controller(mediator, Guid.NewGuid()).Pull(profileId, null, CancellationToken.None);

        await mediator.Received(1).Send(
            Arg.Is<PullCareProvidersQuery>(q => q.HealthProfileId == profileId),
            Arg.Any<CancellationToken>());
    }
}
```

- [ ] **Step 4: Run tests and the full build**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests`
Expected: PASS — all tests across the four test classes.

Run: `dotnet build`
Expected: succeeds with no new warnings.

- [ ] **Step 5: Add the routes to the OpenAPI snapshot**

Run: `./scripts/generate-openapi.sh`
Confirm the three `/care-team/*` paths appear in the generated document, then stage it.

- [ ] **Step 6: Commit**

```bash
git add src/Modules/CareTeam src/Balsm.API tests/Modules/Balsm.CareTeam.Tests Balsm.API.slnx
git commit -m "feat(care-team): expose /care-team endpoints and wire the module

User id always comes from the token, never the body. Not-owned answers
404 so ownership cannot be probed."
```

---

## Task 6: Decryption audit log

**Files:**
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Domain/Entities/CareTeamAuditLog.cs`
- Create: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Configuration/CareTeamAuditLogConfiguration.cs`
- Modify: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Data/CareTeamDbContext.cs`
- Modify: `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Handlers/PullCareProvidersHandler.cs`
- Test: `tests/Modules/Balsm.CareTeam.Tests/CareTeamAuditTests.cs`

**Interfaces:**
- Consumes: `CareTeamDbContext`, `PullCareProvidersHandler` (Tasks 3-4).
- Produces: `CareTeamAuditLog` entity; `PullCareProvidersQuery` gains `string? Actor, string? SourceIp, string? CorrelationId`.

- [ ] **Step 1: Write the failing test**

Create `tests/Modules/Balsm.CareTeam.Tests/CareTeamAuditTests.cs`:

```csharp
using System.Security.Cryptography;
using Balsm.CareTeam.Application.Commands;
using Balsm.CareTeam.Application.Queries;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.CareTeam.Infrastructure.Handlers;
using Balsm.Infrastructure.Encryption;
using Balsm.SharedKernel.Events;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace Balsm.CareTeam.Tests;

public sealed class CareTeamAuditTests : IDisposable
{
    private readonly CareTeamDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly CareTeamEncryptionService _crypto;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _profileId = Guid.NewGuid();

    public CareTeamAuditTests()
    {
        var dispatcher = Substitute.For<IDomainEventDispatcher>();
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var opts = new DbContextOptionsBuilder<CareTeamDbContext>().UseSqlite(_connection).Options;
        _db = new CareTeamDbContext(opts, dispatcher);
        _db.Database.EnsureCreated();
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["CareTeamEncryption:Key"] = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        }).Build();
        _crypto = new CareTeamEncryptionService(config, NullLogger<CareTeamEncryptionService>.Instance);
    }

    [Fact]
    public async Task Pull_ThatDecryptsRows_WritesOneAuditRow()
    {
        await new UpsertCareProviderHandler(_db, _crypto).Handle(
            new UpsertCareProviderCommand(Guid.NewGuid(), _userId, _profileId, "doctor", "Provider Alpha",
                null, null, null, null, null, null, null, null, DateTime.UtcNow),
            CancellationToken.None);

        await new PullCareProvidersHandler(_db, _crypto).Handle(
            new PullCareProvidersQuery(_userId, _profileId, null, "user:abc", "203.0.113.7", "corr-1"),
            CancellationToken.None);

        var audit = await _db.CareTeamAuditLogs.SingleAsync();
        audit.Actor.Should().Be("user:abc");
        audit.SourceIp.Should().Be("203.0.113.7");
        audit.CorrelationId.Should().Be("corr-1");
        audit.RowCount.Should().Be(1);
    }

    [Fact]
    public async Task Pull_ThatDecryptsNothing_WritesNoAuditRow()
    {
        await new PullCareProvidersHandler(_db, _crypto).Handle(
            new PullCareProvidersQuery(_userId, _profileId, null, "user:abc", "203.0.113.7", "corr-1"),
            CancellationToken.None);

        (await _db.CareTeamAuditLogs.AnyAsync()).Should().BeFalse();
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests --filter CareTeamAuditTests`
Expected: FAIL — `CareTeamAuditLogs` does not exist, and `PullCareProvidersQuery` takes 3 arguments not 6.

- [ ] **Step 3: Add the entity**

Create `src/Modules/CareTeam/Balsm.CareTeam.Domain/Entities/CareTeamAuditLog.cs`:

```csharp
using Balsm.SharedKernel.Domain;

namespace Balsm.CareTeam.Domain.Entities;

/// <summary>
/// One row per request that decrypted care-team ciphertext (FR-504), mirroring
/// the FR-048 pattern for DOB. Holds no PHI itself — only who read how much.
/// </summary>
public sealed class CareTeamAuditLog : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid HealthProfileId { get; private set; }
    public string? Actor { get; private set; }
    public string? SourceIp { get; private set; }
    public string? CorrelationId { get; private set; }
    public int RowCount { get; private set; }
    public DateTime OccurredAt { get; private set; }

    private CareTeamAuditLog() { }

    public static CareTeamAuditLog Record(
        Guid userId, Guid healthProfileId, string? actor, string? sourceIp,
        string? correlationId, int rowCount) => new()
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        HealthProfileId = healthProfileId,
        Actor = actor,
        SourceIp = sourceIp,
        CorrelationId = correlationId,
        RowCount = rowCount,
        OccurredAt = DateTime.UtcNow
    };
}
```

- [ ] **Step 4: Add the configuration and DbSet**

Create `src/Modules/CareTeam/Balsm.CareTeam.Infrastructure/Configuration/CareTeamAuditLogConfiguration.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Balsm.CareTeam.Infrastructure.Configuration;

public sealed class CareTeamAuditLogConfiguration : IEntityTypeConfiguration<CareTeamAuditLog>
{
    public void Configure(EntityTypeBuilder<CareTeamAuditLog> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).HasColumnName("id");
        builder.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
        builder.Property(x => x.HealthProfileId).HasColumnName("health_profile_id").IsRequired();
        builder.Property(x => x.Actor).HasColumnName("actor").HasMaxLength(128);
        builder.Property(x => x.SourceIp).HasColumnName("source_ip").HasMaxLength(64);
        builder.Property(x => x.CorrelationId).HasColumnName("correlation_id").HasMaxLength(128);
        builder.Property(x => x.RowCount).HasColumnName("row_count").IsRequired();
        builder.Property(x => x.OccurredAt).HasColumnName("occurred_at").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at");

        builder.Ignore(x => x.CreatedBy);
        builder.Ignore(x => x.UpdatedAt);
        builder.Ignore(x => x.UpdatedBy);
        builder.Ignore(x => x.IsDeleted);
        builder.Ignore(x => x.DeletedAt);
        builder.Ignore(x => x.DeletedBy);

        builder.ToTable("care_team_audit_log");
        builder.HasIndex(x => new { x.UserId, x.OccurredAt });
    }
}
```

In `CareTeamDbContext.cs`, add beside the existing DbSet:

```csharp
    public DbSet<CareTeamAuditLog> CareTeamAuditLogs { get; set; } = null!;
```

- [ ] **Step 5: Extend the query and handler**

In `PullCareProvidersQuery.cs`, change the record to:

```csharp
public sealed record PullCareProvidersQuery(
    Guid UserId,
    Guid HealthProfileId,
    DateTime? Since,
    string? Actor = null,
    string? SourceIp = null,
    string? CorrelationId = null) : IRequest<Result<IReadOnlyList<CareProviderDto>>>;
```

In `PullCareProvidersHandler.Handle`, after building `dtos` and before returning:

```csharp
        if (dtos.Count > 0)
        {
            db.CareTeamAuditLogs.Add(CareTeamAuditLog.Record(
                query.UserId, query.HealthProfileId, query.Actor,
                query.SourceIp, query.CorrelationId, dtos.Count));
            await db.SaveChangesAsync(ct);
        }
```

Add `using Balsm.CareTeam.Domain.Entities;` to the handler.

In `CareTeamController.Pull`, pass the request context:

```csharp
        var result = await mediator.Send(
            new PullCareProvidersQuery(
                CurrentUserId, healthProfileId, since,
                Actor: User.FindFirstValue(ClaimTypes.NameIdentifier),
                SourceIp: HttpContext.Connection.RemoteIpAddress?.ToString(),
                CorrelationId: HttpContext.TraceIdentifier), ct);
```

- [ ] **Step 6: Regenerate migrations and run tests**

```bash
dotnet ef migrations add CareTeamAuditLog \
  --project src/Modules/CareTeam/Balsm.CareTeam.Infrastructure \
  --startup-project src/Balsm.API --context CareTeamDbContext

dotnet ef migrations add CareTeamAuditLog \
  --project src/Modules/CareTeam/Balsm.CareTeam.Infrastructure.Migrations.Sqlite \
  --startup-project src/Balsm.API --context CareTeamDbContext
```

Run: `dotnet test tests/Modules/Balsm.CareTeam.Tests`
Expected: PASS — all classes including the 2 new audit tests.

- [ ] **Step 7: Commit**

```bash
git add src/Modules/CareTeam tests/Modules/Balsm.CareTeam.Tests
git commit -m "feat(care-team): audit every decryption of care-team ciphertext

Actor, source IP, correlation id and row count per pull. FR-504,
mirroring the FR-048 pattern for DOB."
```

---

## Task 7: Deletion purge

**Files:**
- Modify: `src/Modules/Deletion/Balsm.Deletion.Infrastructure/Jobs/DeletionPurgeJob.cs:62-98`
- Modify: `src/Modules/Deletion/Balsm.Deletion.Infrastructure/Balsm.Deletion.Infrastructure.csproj`
- Test: `tests/Modules/Balsm.Deletion.Tests/CareTeamPurgeTests.cs`

**Interfaces:**
- Consumes: `CareTeamDbContext` (Task 3).
- Produces: nothing new — extends existing purge behavior.

- [ ] **Step 1: Read the existing purge method**

Run: `sed -n '60,110p' src/Modules/Deletion/Balsm.Deletion.Infrastructure/Jobs/DeletionPurgeJob.cs`

Note how `accountDb` is resolved and how the per-user purge loop is shaped. The new code follows exactly that shape — the job hardcodes each context; there is no participant abstraction.

- [ ] **Step 2: Write the failing test**

Create `tests/Modules/Balsm.Deletion.Tests/CareTeamPurgeTests.cs`:

```csharp
using Balsm.CareTeam.Domain.Entities;
using Balsm.CareTeam.Infrastructure.Data;
using Balsm.SharedKernel.Events;
using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Balsm.Deletion.Tests;

/// <summary>
/// FR-512: account deletion must leave zero care-team rows, tombstones included.
/// </summary>
public sealed class CareTeamPurgeTests : IDisposable
{
    private readonly CareTeamDbContext _db;
    private readonly SqliteConnection _connection;

    public CareTeamPurgeTests()
    {
        var dispatcher = Substitute.For<IDomainEventDispatcher>();
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        var opts = new DbContextOptionsBuilder<CareTeamDbContext>().UseSqlite(_connection).Options;
        _db = new CareTeamDbContext(opts, dispatcher);
        _db.Database.EnsureCreated();
    }

    private static CareProviderFields Fields() => new([1], null, null, null, null, null, null, null, null);

    [Fact]
    public async Task PurgeCareTeam_RemovesLiveAndTombstonedRowsForThatUserOnly()
    {
        var doomed = Guid.NewGuid();
        var survivor = Guid.NewGuid();

        var live = CareProvider.Create(Guid.NewGuid(), doomed, Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        var dead = CareProvider.Create(Guid.NewGuid(), doomed, Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        dead.Tombstone();
        var other = CareProvider.Create(Guid.NewGuid(), survivor, Guid.NewGuid(), "doctor", Fields(), DateTime.UtcNow);
        _db.CareProviders.AddRange(live, dead, other);
        await _db.SaveChangesAsync();

        await DeletionPurgeJob.PurgeCareTeamAsync(_db, doomed, CancellationToken.None);

        (await _db.CareProviders.IgnoreQueryFilters().Where(p => p.UserId == doomed).CountAsync())
            .Should().Be(0);
        (await _db.CareProviders.IgnoreQueryFilters().Where(p => p.UserId == survivor).CountAsync())
            .Should().Be(1);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Modules/Balsm.Deletion.Tests --filter CareTeamPurgeTests`
Expected: FAIL — `PurgeCareTeamAsync` does not exist.

- [ ] **Step 4: Implement the purge**

Add `Balsm.CareTeam.Infrastructure` as a `ProjectReference` to `Balsm.Deletion.Infrastructure.csproj` and to `Balsm.Deletion.Tests.csproj`.

In `DeletionPurgeJob.cs`, add the static method (testable without the BackgroundService host):

```csharp
    /// <summary>
    /// FR-512: hard-delete every care-team row for a purged account, tombstones
    /// included — IgnoreQueryFilters, or soft-deleted rows would survive the purge.
    /// </summary>
    internal static async Task PurgeCareTeamAsync(
        CareTeamDbContext careTeamDb, Guid userId, CancellationToken ct)
    {
        await careTeamDb.CareProviders
            .IgnoreQueryFilters()
            .Where(p => p.UserId == userId)
            .ExecuteDeleteAsync(ct);

        await careTeamDb.CareTeamAuditLogs
            .Where(a => a.UserId == userId)
            .ExecuteDeleteAsync(ct);
    }
```

In `PurgeAsync`, resolve the context beside the existing ones:

```csharp
        var careTeamDb = scope.ServiceProvider.GetRequiredService<CareTeamDbContext>();
```

and call `await PurgeCareTeamAsync(careTeamDb, userId, ct);` inside the same per-user loop that already purges account state. Add `using Balsm.CareTeam.Infrastructure.Data;`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `dotnet test tests/Modules/Balsm.Deletion.Tests`
Expected: PASS — existing deletion tests plus the new one.

- [ ] **Step 6: Commit**

```bash
git add src/Modules/Deletion tests/Modules/Balsm.Deletion.Tests
git commit -m "feat(deletion): purge care-team rows on account deletion

IgnoreQueryFilters so tombstones are hard-deleted too; audit rows go
with them. FR-512."
```

---

# Part B — App (`../balsm_app`)

## File Structure — App

```
packages/core/lib/src/db/app_database.dart          + sync_outbox table, 2 _ensureColumn calls
packages/core/lib/src/sync/sync_outbox_dao.dart     new — enqueue/claim/complete/fail
packages/core/lib/src/sync/outbox_entry.dart        new — row model
packages/balsm_api/lib/src/api_routes.dart          + /care-team group
packages/balsm_api/lib/src/care_team/
  care_team_api.dart                                port
  dio_care_team_api.dart                            dio impl
  requests.dart                                     UpsertCareProviderRequest
  responses.dart                                    CareProviderResponse
modules/profile/lib/src/infrastructure/sync/
  care_team_sync_service.dart                       drain + pull + LWW merge
modules/profile/lib/src/infrastructure/drift/
  drift_profile_data_source.dart                    + outbox enqueue on write
app/lib/brands/balsm/main_balsm.dart                + sync service wiring
```

---

## Task 8: Local schema — sync columns and outbox

**Files:**
- Modify: `packages/core/lib/src/db/app_database.dart` (`_phiSchema` list, `beforeOpen` `_ensureColumn` block)
- Create: `packages/core/lib/src/sync/outbox_entry.dart`
- Create: `packages/core/lib/src/sync/sync_outbox_dao.dart`
- Modify: `packages/core/lib/core.dart` (exports)
- Test: `packages/core/test/sync/sync_outbox_dao_test.dart`

**Interfaces:**
- Consumes: `AppDatabase`.
- Produces:
  - `enum OutboxOp { upsert, delete }`
  - `class OutboxEntry { final int id; final String entity; final String entityId; final OutboxOp op; final String payload; final DateTime createdAt; final int attempts; }`
  - `class SyncOutboxDao { SyncOutboxDao(AppDatabase db); Future<void> enqueue({required String entity, required String entityId, required OutboxOp op, required String payload}); Future<List<OutboxEntry>> pending({int limit = 100}); Future<void> complete(int id); Future<void> fail(int id, String error); Future<int> pendingCount(); }`

- [ ] **Step 1: Write the failing test**

Create `packages/core/test/sync/sync_outbox_dao_test.dart`:

```dart
import 'package:core/core.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late AppDatabase db;
  late SyncOutboxDao dao;

  setUp(() async {
    db = AppDatabase(NativeDatabase.memory());
    dao = SyncOutboxDao(db);
    // Force beforeOpen to run so the raw-SQL schema is applied.
    await db.customSelect('SELECT 1').get();
  });

  tearDown(() => db.close());

  test('enqueue then pending returns the entry', () async {
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.upsert, payload: '{"a":1}');

    final pending = await dao.pending();
    expect(pending, hasLength(1));
    expect(pending.single.entityId, 'cp-1');
    expect(pending.single.op, OutboxOp.upsert);
    expect(pending.single.payload, '{"a":1}');
  });

  test('pending returns entries in insertion order (FIFO)', () async {
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.upsert, payload: '{}');
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.delete, payload: '{}');

    final pending = await dao.pending();
    expect(pending.map((e) => e.op).toList(), [OutboxOp.upsert, OutboxOp.delete]);
  });

  test('complete removes the entry', () async {
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.upsert, payload: '{}');
    final entry = (await dao.pending()).single;

    await dao.complete(entry.id);

    expect(await dao.pending(), isEmpty);
  });

  test('fail keeps the entry and increments attempts', () async {
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.upsert, payload: '{}');
    final entry = (await dao.pending()).single;

    await dao.fail(entry.id, 'connection refused');

    final again = (await dao.pending()).single;
    expect(again.attempts, 1);
  });

  test('entries survive reopening the database', () async {
    await dao.enqueue(entity: 'care_provider', entityId: 'cp-1', op: OutboxOp.upsert, payload: '{}');
    expect(await dao.pendingCount(), 1);
  });

  test('care_provider gained updated_at and deleted_at', () async {
    final columns = await db.customSelect('PRAGMA table_info(care_provider)').get();
    final names = columns.map((r) => r.read<String>('name')).toSet();
    expect(names, containsAll(['updated_at', 'deleted_at']));
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && fvm flutter test test/sync/sync_outbox_dao_test.dart`
Expected: FAIL — `SyncOutboxDao` is not defined.

- [ ] **Step 3: Add the schema**

In `packages/core/lib/src/db/app_database.dart`, add to the `_phiSchema` list (after the `care_provider_file` index):

```dart
  // Durable push queue for cloud sync (FR-506). Generic by column shape so
  // later entities reuse it; today only care_provider enqueues here. Holds a
  // JSON payload, so it is PHI — it lives in the SQLCipher database like every
  // other table here and is never logged.
  '''
  CREATE TABLE IF NOT EXISTS sync_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    op TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  )''',
  'CREATE INDEX IF NOT EXISTS idx_sync_outbox_entity ON sync_outbox(entity, id)',
```

In the `beforeOpen` `_ensureColumn` block, add beside the existing `care_provider` patch:

```dart
          // Cloud-sync bookkeeping (FR-507/FR-508). Nullable so pre-existing
          // rows migrate without a backfill; the sync service treats a null
          // updated_at as created_at.
          await _ensureColumn('care_provider', 'updated_at', 'INTEGER');
          await _ensureColumn('care_provider', 'deleted_at', 'INTEGER');
```

- [ ] **Step 4: Write the DAO**

Create `packages/core/lib/src/sync/outbox_entry.dart`:

```dart
/// What a queued change does to the server row.
enum OutboxOp {
  /// Create-or-overwrite. Covers both add and update — the server handler is
  /// idempotent on id, so the client never distinguishes them.
  upsert,

  /// Tombstone.
  delete;

  static OutboxOp fromId(String id) =>
      OutboxOp.values.firstWhere((o) => o.name == id, orElse: () => OutboxOp.upsert);
}

/// One queued local change awaiting push to the cloud.
class OutboxEntry {
  const OutboxEntry({
    required this.id,
    required this.entity,
    required this.entityId,
    required this.op,
    required this.payload,
    required this.createdAt,
    required this.attempts,
  });

  /// Monotonic rowid — also the FIFO ordering key.
  final int id;

  /// Table this change belongs to, e.g. `care_provider`.
  final String entity;

  /// Primary key of the changed row.
  final String entityId;

  final OutboxOp op;

  /// JSON body to send. Empty object for a delete.
  final String payload;

  final DateTime createdAt;

  /// Failed push count, for backoff and for surfacing a stuck queue.
  final int attempts;
}
```

Create `packages/core/lib/src/sync/sync_outbox_dao.dart`:

```dart
import 'package:drift/drift.dart';

import '../db/app_database.dart';
import 'outbox_entry.dart';

/// Durable push queue for cloud sync (FR-506).
///
/// Ordering is strict FIFO by rowid across the whole queue, which is what makes
/// an upsert-then-delete of the same id safe: draining out of order would
/// tombstone the row and then re-create it, resurrecting something the patient
/// deleted.
class SyncOutboxDao {
  const SyncOutboxDao(this._db);

  final AppDatabase _db;

  Future<void> enqueue({
    required String entity,
    required String entityId,
    required OutboxOp op,
    required String payload,
  }) async {
    await _db.customInsert(
      '''
      INSERT INTO sync_outbox (entity, entity_id, op, payload, created_at, attempts)
      VALUES (?, ?, ?, ?, ?, 0)
      ''',
      variables: [
        Variable.withString(entity),
        Variable.withString(entityId),
        Variable.withString(op.name),
        Variable.withString(payload),
        Variable.withInt(DateTime.now().millisecondsSinceEpoch),
      ],
    );
  }

  /// The oldest [limit] queued changes, oldest first.
  Future<List<OutboxEntry>> pending({int limit = 100}) async {
    final rows = await _db.customSelect(
      'SELECT * FROM sync_outbox ORDER BY id ASC LIMIT ?',
      variables: [Variable.withInt(limit)],
    ).get();
    return rows
        .map((r) => OutboxEntry(
              id: r.read<int>('id'),
              entity: r.read<String>('entity'),
              entityId: r.read<String>('entity_id'),
              op: OutboxOp.fromId(r.read<String>('op')),
              payload: r.read<String>('payload'),
              createdAt: DateTime.fromMillisecondsSinceEpoch(r.read<int>('created_at'), isUtc: true),
              attempts: r.read<int>('attempts'),
            ))
        .toList();
  }

  /// Drops a successfully pushed entry.
  Future<void> complete(int id) async {
    await _db.customStatement('DELETE FROM sync_outbox WHERE id = ?', [id]);
  }

  /// Keeps the entry queued and records why the push failed.
  Future<void> fail(int id, String error) async {
    await _db.customStatement(
      'UPDATE sync_outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      [error, id],
    );
  }

  Future<int> pendingCount() async {
    final row = await _db.customSelect('SELECT COUNT(*) AS c FROM sync_outbox').getSingle();
    return row.read<int>('c');
  }
}
```

Add to `packages/core/lib/core.dart`:

```dart
export 'src/sync/outbox_entry.dart';
export 'src/sync/sync_outbox_dao.dart';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/core && fvm flutter test test/sync/sync_outbox_dao_test.dart`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/core/lib/src/sync packages/core/lib/core.dart \
        packages/core/lib/src/db/app_database.dart packages/core/test/sync
git commit -m "feat(core): add durable sync outbox and care_provider sync columns

FIFO by rowid so upsert-then-delete of one id cannot reorder into a
resurrection. FR-506/FR-507."
```

---

## Task 9: API client for `/care-team`

**Files:**
- Modify: `packages/balsm_api/lib/src/api_routes.dart`
- Create: `packages/balsm_api/lib/src/care_team/care_team_api.dart`
- Create: `packages/balsm_api/lib/src/care_team/dio_care_team_api.dart`
- Create: `packages/balsm_api/lib/src/care_team/requests.dart`
- Create: `packages/balsm_api/lib/src/care_team/responses.dart`
- Modify: `packages/balsm_api/lib/balsm_api.dart` (exports)
- Test: `packages/balsm_api/test/care_team/dio_care_team_api_test.dart`

**Interfaces:**
- Consumes: `NetworkManager`, `unwrapEnvelope`, `ApiException` from `../transport/`.
- Produces:
  - `abstract class CareTeamApi { Future<List<CareProviderResponse>> pull({required String healthProfileId, DateTime? since, CancelToken? cancelToken}); Future<void> upsert(UpsertCareProviderRequest request, {CancelToken? cancelToken}); Future<void> delete(String id, {CancelToken? cancelToken}); }`
  - `class UpsertCareProviderRequest` with `toJson()`
  - `class CareProviderResponse` with `fromJson()` and fields `id, healthProfileId, type, name, specialty, phone, phone2, email, clinic, address, mapUrl, notes, createdAt, updatedAt, isDeleted`

- [ ] **Step 1: Add the routes**

In `packages/balsm_api/lib/src/api_routes.dart`, add after the Care directory group:

```dart
  // ── Care team (patient's own providers, cloud-mirrored) ───────────────────
  static const _care_team = '/care-team';
  static const care_team_providers = '$_care_team/providers';

  /// One provider by id — DELETE tombstones it server-side.
  static String careTeamProvider(String id) => '$care_team_providers/$id';
```

- [ ] **Step 2: Write the failing test**

Create `packages/balsm_api/test/care_team/dio_care_team_api_test.dart`. Open `packages/balsm_api/test/account/dio_account_api_test.dart` first and copy its `FakeHttpAdapter` setup verbatim — the harness shape must match.

```dart
import 'package:balsm_api/balsm_api.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/fake_http_adapter.dart';

void main() {
  late FakeHttpAdapter adapter;
  late CareTeamApi api;

  setUp(() {
    adapter = FakeHttpAdapter();
    api = DioCareTeamApi(net: adapter.networkManager);
  });

  test('pull sends health_profile_id and since as query parameters', () async {
    adapter.respondJson({'data': []});

    await api.pull(
      healthProfileId: 'hp-1',
      since: DateTime.utc(2026, 9, 1, 12),
    );

    expect(adapter.lastRequest.path, '/care-team/providers');
    expect(adapter.lastRequest.queryParameters['health_profile_id'], 'hp-1');
    expect(adapter.lastRequest.queryParameters['since'], '2026-09-01T12:00:00.000Z');
  });

  test('pull omits since when null', () async {
    adapter.respondJson({'data': []});

    await api.pull(healthProfileId: 'hp-1');

    expect(adapter.lastRequest.queryParameters.containsKey('since'), isFalse);
  });

  test('pull parses a tombstoned row', () async {
    adapter.respondJson({
      'data': [
        {
          'id': 'cp-1',
          'health_profile_id': 'hp-1',
          'type': 'doctor',
          'name': 'Provider Alpha',
          'specialty': null,
          'phone': null,
          'phone2': null,
          'email': null,
          'clinic': null,
          'address': null,
          'map_url': null,
          'notes': null,
          'created_at': '2026-09-01T12:00:00.000Z',
          'updated_at': '2026-09-02T12:00:00.000Z',
          'is_deleted': true,
        }
      ]
    });

    final rows = await api.pull(healthProfileId: 'hp-1');

    expect(rows, hasLength(1));
    expect(rows.single.id, 'cp-1');
    expect(rows.single.isDeleted, isTrue);
    expect(rows.single.updatedAt, DateTime.utc(2026, 9, 2, 12));
  });

  test('upsert posts snake_case body', () async {
    adapter.respondJson({'data': {'id': 'cp-1'}});

    await api.upsert(UpsertCareProviderRequest(
      id: 'cp-1',
      healthProfileId: 'hp-1',
      type: 'doctor',
      name: 'Provider Alpha',
      mapUrl: 'https://maps.example/x',
      createdAt: DateTime.utc(2026, 9, 1, 12),
    ));

    expect(adapter.lastRequest.path, '/care-team/providers');
    final body = adapter.lastRequest.data as Map<String, dynamic>;
    expect(body['id'], 'cp-1');
    expect(body['health_profile_id'], 'hp-1');
    expect(body['map_url'], 'https://maps.example/x');
    expect(body['created_at'], '2026-09-01T12:00:00.000Z');
  });

  test('delete targets the id path', () async {
    adapter.respondStatus(204);

    await api.delete('cp-1');

    expect(adapter.lastRequest.path, '/care-team/providers/cp-1');
    expect(adapter.lastRequest.method, 'DELETE');
  });

  test('delete treats 404 as success — the row is already gone', () async {
    adapter.respondStatus(404);

    await expectLater(api.delete('cp-1'), completes);
  });
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd packages/balsm_api && fvm flutter test test/care_team/dio_care_team_api_test.dart`
Expected: FAIL — `CareTeamApi` is not defined.

- [ ] **Step 4: Write the contracts**

Create `packages/balsm_api/lib/src/care_team/requests.dart`:

```dart
/// Body of `POST /care-team/providers`. Create and update are one call — the
/// server upserts on [id], so the client never tracks which it is.
class UpsertCareProviderRequest {
  const UpsertCareProviderRequest({
    required this.id,
    required this.healthProfileId,
    required this.type,
    required this.name,
    required this.createdAt,
    this.specialty,
    this.phone,
    this.phone2,
    this.email,
    this.clinic,
    this.address,
    this.mapUrl,
    this.notes,
  });

  final String id;
  final String healthProfileId;
  final String type;
  final String name;
  final DateTime createdAt;
  final String? specialty;
  final String? phone;
  final String? phone2;
  final String? email;
  final String? clinic;
  final String? address;
  final String? mapUrl;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'id': id,
        'health_profile_id': healthProfileId,
        'type': type,
        'name': name,
        'specialty': specialty,
        'phone': phone,
        'phone2': phone2,
        'email': email,
        'clinic': clinic,
        'address': address,
        'map_url': mapUrl,
        'notes': notes,
        'created_at': createdAt.toUtc().toIso8601String(),
      };
}
```

Create `packages/balsm_api/lib/src/care_team/responses.dart`:

```dart
/// One row from `GET /care-team/providers`. [isDeleted] rows are tombstones —
/// the client applies them as local deletes rather than skipping them.
class CareProviderResponse {
  const CareProviderResponse({
    required this.id,
    required this.healthProfileId,
    required this.type,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    required this.isDeleted,
    this.specialty,
    this.phone,
    this.phone2,
    this.email,
    this.clinic,
    this.address,
    this.mapUrl,
    this.notes,
  });

  final String id;
  final String healthProfileId;
  final String type;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isDeleted;
  final String? specialty;
  final String? phone;
  final String? phone2;
  final String? email;
  final String? clinic;
  final String? address;
  final String? mapUrl;
  final String? notes;

  factory CareProviderResponse.fromJson(Map<String, dynamic> json) => CareProviderResponse(
        id: json['id'] as String,
        healthProfileId: json['health_profile_id'] as String,
        type: json['type'] as String,
        name: json['name'] as String,
        specialty: json['specialty'] as String?,
        phone: json['phone'] as String?,
        phone2: json['phone2'] as String?,
        email: json['email'] as String?,
        clinic: json['clinic'] as String?,
        address: json['address'] as String?,
        mapUrl: json['map_url'] as String?,
        notes: json['notes'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String).toUtc(),
        updatedAt: DateTime.parse(json['updated_at'] as String).toUtc(),
        isDeleted: json['is_deleted'] as bool? ?? false,
      );
}
```

Create `packages/balsm_api/lib/src/care_team/care_team_api.dart`:

```dart
import 'package:dio/dio.dart' show CancelToken;

import 'requests.dart';
import 'responses.dart';

/// The patient's own care team, mirrored to the Balsm cloud (FR-500).
///
/// PHI over TLS to the trusted .NET API — unlike [CareDirectoryApi], which
/// serves Balsm-owned non-PHI reference data.
abstract class CareTeamApi {
  /// GET /care-team/providers — rows changed since [since], tombstones included.
  /// Null [since] pulls the whole roster.
  Future<List<CareProviderResponse>> pull({
    required String healthProfileId,
    DateTime? since,
    CancelToken? cancelToken,
  });

  /// POST /care-team/providers — create or overwrite, idempotent on id.
  Future<void> upsert(UpsertCareProviderRequest request, {CancelToken? cancelToken});

  /// DELETE /care-team/providers/{id} — tombstone. A 404 is treated as success:
  /// the row is already gone, which is the outcome the caller wanted.
  Future<void> delete(String id, {CancelToken? cancelToken});
}
```

Create `packages/balsm_api/lib/src/care_team/dio_care_team_api.dart`:

```dart
import 'package:dio/dio.dart' show CancelToken;

import '../api_routes.dart';
import '../transport/api_exception.dart';
import '../transport/envelope.dart';
import '../transport/network_manager.dart';
import 'care_team_api.dart';
import 'requests.dart';
import 'responses.dart';

class DioCareTeamApi implements CareTeamApi {
  const DioCareTeamApi({required NetworkManager net}) : _net = net;

  final NetworkManager _net;

  @override
  Future<List<CareProviderResponse>> pull({
    required String healthProfileId,
    DateTime? since,
    CancelToken? cancelToken,
  }) async {
    final res = await _net.get(
      ApiRoutes.care_team_providers,
      queryParameters: {
        'health_profile_id': healthProfileId,
        if (since != null) 'since': since.toUtc().toIso8601String(),
      },
      cancelToken: cancelToken,
    );
    final data = unwrapEnvelopeList(res);
    return data.map((e) => CareProviderResponse.fromJson(e)).toList();
  }

  @override
  Future<void> upsert(UpsertCareProviderRequest request, {CancelToken? cancelToken}) async {
    final res = await _net.post(
      ApiRoutes.care_team_providers,
      data: request.toJson(),
      cancelToken: cancelToken,
    );
    unwrapEnvelope(res);
  }

  @override
  Future<void> delete(String id, {CancelToken? cancelToken}) async {
    try {
      await _net.delete(ApiRoutes.careTeamProvider(id), cancelToken: cancelToken);
    } on ApiException catch (e) {
      // Already gone server-side is the outcome we wanted — not a failure to retry.
      if (e.statusCode == 404) return;
      rethrow;
    }
  }
}
```

Add to `packages/balsm_api/lib/balsm_api.dart`:

```dart
export 'src/care_team/care_team_api.dart';
export 'src/care_team/dio_care_team_api.dart';
export 'src/care_team/requests.dart';
export 'src/care_team/responses.dart';
```

> **Check before running:** open `packages/balsm_api/lib/src/transport/envelope.dart` and confirm the list-unwrapping helper is named `unwrapEnvelopeList`. If it is named differently (the care-directory API returns lists — see `dio_care_directory_api.dart` for the exact call), use that name instead in `pull`. Likewise confirm `NetworkManager` exposes `delete`; if not, add it mirroring its `post`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/balsm_api && fvm flutter test test/care_team/`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/balsm_api/lib/src/care_team packages/balsm_api/lib/src/api_routes.dart \
        packages/balsm_api/lib/balsm_api.dart packages/balsm_api/test/care_team
git commit -m "feat(api-client): add /care-team pull, upsert and delete

Delete treats 404 as success — already gone is the wanted outcome."
```

---

## Task 10: Enqueue local writes to the outbox

**Files:**
- Modify: `modules/profile/lib/src/infrastructure/drift/drift_profile_data_source.dart:449-520`
- Test: `modules/profile/test/care_team_outbox_test.dart`

**Interfaces:**
- Consumes: `SyncOutboxDao`, `OutboxOp` (Task 8).
- Produces: `DriftProfileDataSource` constructor gains optional `SyncOutboxDao? outbox`. When null, behavior is exactly as today — no enqueue.

- [ ] **Step 1: Write the failing test**

Create `modules/profile/test/care_team_outbox_test.dart`:

```dart
import 'dart:convert';

import 'package:core/core.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:profile/profile.dart';

void main() {
  late AppDatabase db;
  late SyncOutboxDao outbox;
  late DriftProfileDataSource ds;
  const profileId = HealthProfileId.value('hp-1');

  CareProvider provider({String name = 'Provider Alpha'}) => CareProvider(
        id: const CareProviderId.empty(),
        healthProfileId: profileId,
        type: CareProviderType.doctor,
        name: name,
        createdAt: DateTime.now(),
      );

  setUp(() async {
    db = AppDatabase(NativeDatabase.memory());
    outbox = SyncOutboxDao(db);
    ds = DriftProfileDataSource(db, outbox: outbox);
    await db.customSelect('SELECT 1').get();
    await db.customInsert(
      "INSERT INTO health_profile (id, updated_at) VALUES ('hp-1', 0)",
    );
  });

  tearDown(() => db.close());

  test('addProvider enqueues an upsert carrying the row', () async {
    final id = await ds.addProvider(profileId, provider());

    final pending = await outbox.pending();
    expect(pending, hasLength(1));
    expect(pending.single.op, OutboxOp.upsert);
    expect(pending.single.entity, 'care_provider');
    expect(pending.single.entityId, id.value);
    expect(jsonDecode(pending.single.payload)['name'], 'Provider Alpha');
  });

  test('updateProvider enqueues an upsert with the new values', () async {
    final id = await ds.addProvider(profileId, provider());
    await ds.updateProvider(id, provider(name: 'Provider Beta'));

    final pending = await outbox.pending();
    expect(pending, hasLength(2));
    expect(jsonDecode(pending.last.payload)['name'], 'Provider Beta');
  });

  test('removeProvider enqueues a delete', () async {
    final id = await ds.addProvider(profileId, provider());
    await ds.removeProvider(id);

    final pending = await outbox.pending();
    expect(pending.last.op, OutboxOp.delete);
    expect(pending.last.entityId, id.value);
  });

  /// Review Focus 2 — draining out of order would tombstone then re-create.
  test('upsert then delete of one id stay in that order', () async {
    final id = await ds.addProvider(profileId, provider());
    await ds.removeProvider(id);

    final ops = (await outbox.pending()).map((e) => e.op).toList();
    expect(ops, [OutboxOp.upsert, OutboxOp.delete]);
  });

  test('without an outbox the data source still writes locally', () async {
    final plain = DriftProfileDataSource(db);
    final id = await plain.addProvider(profileId, provider());

    expect((await plain.listProviders(profileId)).map((p) => p.id), contains(id));
    expect(await outbox.pendingCount(), 0);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd modules/profile && fvm flutter test test/care_team_outbox_test.dart`
Expected: FAIL — `DriftProfileDataSource` has no `outbox` parameter.

- [ ] **Step 3: Implement the enqueue**

In `drift_profile_data_source.dart`, add the optional dependency to the constructor:

```dart
  /// [outbox] is null in tests and in any build without cloud sync — the data
  /// source then behaves exactly as before, writing only locally.
  DriftProfileDataSource(this._db, {SyncOutboxDao? outbox}) : _outbox = outbox;

  final SyncOutboxDao? _outbox;
```

Add the payload helper beside `_hydrateProvider`:

```dart
  /// The wire shape of one provider, matching UpsertCareProviderRequest.toJson.
  static Map<String, dynamic> _providerPayload(
    CareProviderId id,
    HealthProfileId profileId,
    CareProvider p,
    DateTime createdAt,
  ) =>
      {
        'id': id.value,
        'health_profile_id': profileId.value,
        'type': p.type.id,
        'name': p.name,
        'specialty': p.specialty,
        'phone': p.phone,
        'phone2': p.phone2,
        'email': p.email,
        'clinic': p.clinic,
        'address': p.address,
        'map_url': p.mapUrl,
        'notes': p.notes,
        'created_at': createdAt.toUtc().toIso8601String(),
      };
```

At the end of `addProvider`, before `return id;`:

```dart
    await _outbox?.enqueue(
      entity: 'care_provider',
      entityId: id.value,
      op: OutboxOp.upsert,
      payload: jsonEncode(_providerPayload(id, profileId, provider, createdAt)),
    );
```

Hoist the timestamp so the local row and the payload agree — replace the inline
`Variable.withInt(DateTime.now().millisecondsSinceEpoch)` with a local
`final createdAt = DateTime.now();` declared at the top of `addProvider` and
`Variable.withInt(createdAt.millisecondsSinceEpoch)` in the variables list.

At the end of `updateProvider`:

```dart
    // The local row keeps its original created_at; re-read it so the pushed
    // payload does not silently reset the server's creation time.
    final row = await _db
        .customSelect('SELECT health_profile_id, created_at FROM care_provider WHERE id = ?',
            variables: [Variable.withString(providerId.value)])
        .getSingleOrNull();
    if (row != null) {
      await _outbox?.enqueue(
        entity: 'care_provider',
        entityId: providerId.value,
        op: OutboxOp.upsert,
        payload: jsonEncode(_providerPayload(
          providerId,
          HealthProfileId.value(row.read<String>('health_profile_id')),
          provider,
          DateTime.fromMillisecondsSinceEpoch(row.read<int>('created_at'), isUtc: true),
        )),
      );
    }
```

At the end of `removeProvider`:

```dart
    await _outbox?.enqueue(
      entity: 'care_provider',
      entityId: providerId.value,
      op: OutboxOp.delete,
      payload: '{}',
    );
```

Add `import 'dart:convert';` and the `core` import for `SyncOutboxDao`/`OutboxOp` at the top of the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd modules/profile && fvm flutter test test/care_team_outbox_test.dart`
Expected: PASS — 5 tests.

Run: `cd modules/profile && fvm flutter test`
Expected: PASS — existing `care_provider_test.dart` still green (the outbox is optional).

- [ ] **Step 5: Commit**

```bash
git add modules/profile/lib/src/infrastructure/drift/drift_profile_data_source.dart \
        modules/profile/test/care_team_outbox_test.dart
git commit -m "feat(profile): enqueue care-team writes to the sync outbox

Optional dependency — a null outbox keeps today's local-only behavior.
Enqueue order is the write order, so delete never precedes its upsert."
```

---

## Task 11: Sync service — drain and pull

**Files:**
- Create: `modules/profile/lib/src/infrastructure/sync/care_team_sync_service.dart`
- Modify: `modules/profile/lib/profile.dart` (export)
- Test: `modules/profile/test/care_team_sync_service_test.dart`

**Interfaces:**
- Consumes: `CareTeamApi` (Task 9), `SyncOutboxDao` (Task 8), `AppDatabase`, `SyncStatusNotifier`.
- Produces: `class CareTeamSyncService { CareTeamSyncService({required CareTeamApi api, required SyncOutboxDao outbox, required AppDatabase db, required SyncStatusNotifier status}); Future<void> drain(); Future<void> pull(HealthProfileId profileId); Future<void> sync(HealthProfileId profileId); }`

- [ ] **Step 1: Write the failing test**

Create `modules/profile/test/care_team_sync_service_test.dart`:

```dart
import 'package:balsm_api/balsm_api.dart';
import 'package:core/core.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:profile/profile.dart';

/// Records what was pushed and replays a scripted pull.
class FakeCareTeamApi implements CareTeamApi {
  FakeCareTeamApi({this.pullRows = const []});

  List<CareProviderResponse> pullRows;
  final upserted = <UpsertCareProviderRequest>[];
  final deleted = <String>[];
  Object? throwOnUpsert;

  @override
  Future<List<CareProviderResponse>> pull({
    required String healthProfileId,
    DateTime? since,
    CancelToken? cancelToken,
  }) async =>
      pullRows;

  @override
  Future<void> upsert(UpsertCareProviderRequest request, {CancelToken? cancelToken}) async {
    if (throwOnUpsert != null) throw throwOnUpsert!;
    upserted.add(request);
  }

  @override
  Future<void> delete(String id, {CancelToken? cancelToken}) async => deleted.add(id);
}

void main() {
  late AppDatabase db;
  late SyncOutboxDao outbox;
  late DriftProfileDataSource ds;
  late SyncStatusNotifier status;
  const profileId = HealthProfileId.value('hp-1');

  CareProvider provider({String name = 'Provider Alpha'}) => CareProvider(
        id: const CareProviderId.empty(),
        healthProfileId: profileId,
        type: CareProviderType.doctor,
        name: name,
        createdAt: DateTime.now(),
      );

  CareProviderResponse row({
    required String id,
    String name = 'Cloud Provider',
    bool isDeleted = false,
    DateTime? updatedAt,
  }) =>
      CareProviderResponse(
        id: id,
        healthProfileId: 'hp-1',
        type: 'doctor',
        name: name,
        createdAt: DateTime.utc(2026, 9, 1),
        updatedAt: updatedAt ?? DateTime.utc(2026, 9, 2),
        isDeleted: isDeleted,
      );

  setUp(() async {
    db = AppDatabase(NativeDatabase.memory());
    outbox = SyncOutboxDao(db);
    ds = DriftProfileDataSource(db, outbox: outbox);
    status = SyncStatusNotifier();
    await db.customSelect('SELECT 1').get();
    await db.customInsert("INSERT INTO health_profile (id, updated_at) VALUES ('hp-1', 0)");
  });

  tearDown(() => db.close());

  CareTeamSyncService service(FakeCareTeamApi api) =>
      CareTeamSyncService(api: api, outbox: outbox, db: db, status: status);

  test('drain pushes queued upserts and clears the queue', () async {
    await ds.addProvider(profileId, provider());
    final api = FakeCareTeamApi();

    await service(api).drain();

    expect(api.upserted, hasLength(1));
    expect(api.upserted.single.name, 'Provider Alpha');
    expect(await outbox.pendingCount(), 0);
  });

  test('drain pushes deletes', () async {
    final id = await ds.addProvider(profileId, provider());
    await ds.removeProvider(id);
    final api = FakeCareTeamApi();

    await service(api).drain();

    expect(api.deleted, [id.value]);
    expect(await outbox.pendingCount(), 0);
  });

  test('drain keeps the entry queued when the push fails', () async {
    await ds.addProvider(profileId, provider());
    final api = FakeCareTeamApi()..throwOnUpsert = Exception('connection refused');

    await service(api).drain();

    expect(await outbox.pendingCount(), 1);
    expect(status.state.state, SyncState.offline);
  });

  test('drain stops at the first failure so order is preserved', () async {
    final id = await ds.addProvider(profileId, provider());
    await ds.removeProvider(id);
    final api = FakeCareTeamApi()..throwOnUpsert = Exception('offline');

    await service(api).drain();

    // The delete must NOT be sent ahead of its blocked upsert.
    expect(api.deleted, isEmpty);
    expect(await outbox.pendingCount(), 2);
  });

  test('pull inserts a row that does not exist locally', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote')]);

    await service(api).pull(profileId);

    final local = await ds.listProviders(profileId);
    expect(local.map((p) => p.id.value), contains('cp-remote'));
    expect(local.single.name, 'Cloud Provider');
  });

  test('pull applies a tombstone as a local delete', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote')]);
    await service(api).pull(profileId);

    api.pullRows = [row(id: 'cp-remote', isDeleted: true, updatedAt: DateTime.utc(2026, 9, 3))];
    await service(api).pull(profileId);

    expect(await ds.listProviders(profileId), isEmpty);
  });

  /// Review Focus 5 — a tombstone applied locally must not re-enqueue a push.
  test('applying a pulled tombstone does not enqueue an outbound delete', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote', isDeleted: true)]);

    await service(api).pull(profileId);

    expect(await outbox.pendingCount(), 0);
  });

  test('pull does not enqueue outbound writes for inserted rows', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote')]);

    await service(api).pull(profileId);

    expect(await outbox.pendingCount(), 0);
  });

  test('pull overwrites the local row when the remote updated_at is newer', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote', name: 'Old')]);
    await service(api).pull(profileId);

    api.pullRows = [row(id: 'cp-remote', name: 'New', updatedAt: DateTime.utc(2026, 9, 5))];
    await service(api).pull(profileId);

    expect((await ds.listProviders(profileId)).single.name, 'New');
  });

  test('pull leaves the local row alone when the remote updated_at is older', () async {
    final api = FakeCareTeamApi(pullRows: [row(id: 'cp-remote', name: 'Newer', updatedAt: DateTime.utc(2026, 9, 9))]);
    await service(api).pull(profileId);

    api.pullRows = [row(id: 'cp-remote', name: 'Stale', updatedAt: DateTime.utc(2026, 9, 3))];
    await service(api).pull(profileId);

    expect((await ds.listProviders(profileId)).single.name, 'Newer');
  });

  test('sync drains before pulling so local edits are not clobbered', () async {
    await ds.addProvider(profileId, provider());
    final api = FakeCareTeamApi();

    await service(api).sync(profileId);

    expect(api.upserted, hasLength(1));
    expect(status.state.state, SyncState.synced);
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd modules/profile && fvm flutter test test/care_team_sync_service_test.dart`
Expected: FAIL — `CareTeamSyncService` is not defined.

- [ ] **Step 3: Write the service**

Create `modules/profile/lib/src/infrastructure/sync/care_team_sync_service.dart`:

```dart
import 'dart:convert';

import 'package:balsm_api/balsm_api.dart';
import 'package:core/core.dart';
import 'package:drift/drift.dart';

/// Converges the on-device care team with the Balsm cloud mirror (FR-500).
///
/// Push is a strict FIFO drain of [SyncOutboxDao]; pull is incremental by
/// `updated_at` cursor and merges row-level last-writer-wins. Local drift stays
/// the write path — this service never sits between the UI and the database.
class CareTeamSyncService {
  CareTeamSyncService({
    required CareTeamApi api,
    required SyncOutboxDao outbox,
    required AppDatabase db,
    required SyncStatusNotifier status,
  })  : _api = api,
        _outbox = outbox,
        _db = db,
        _status = status;

  final CareTeamApi _api;
  final SyncOutboxDao _outbox;
  final AppDatabase _db;
  final SyncStatusNotifier _status;

  static const _entity = 'care_provider';
  static const _cursorKey = 'balsm.sync.care_team.cursor';

  bool _inFlight = false;

  /// Drain then pull. Push first so a local edit is never clobbered by a pull
  /// of the row it just changed.
  Future<void> sync(HealthProfileId profileId) async {
    if (_inFlight) return;
    _inFlight = true;
    _status.set(SyncState.syncing);
    try {
      await _drainInner();
      await _pullInner(profileId);
      _status.set(SyncState.synced, lastSyncedAt: DateTime.now());
    } catch (e) {
      _status.set(SyncState.offline, message: e.toString());
    } finally {
      _inFlight = false;
    }
  }

  /// Pushes every queued change, oldest first.
  Future<void> drain() async {
    try {
      await _drainInner();
    } catch (e) {
      _status.set(SyncState.offline, message: e.toString());
    }
  }

  /// Pulls rows changed since the stored cursor and merges them.
  Future<void> pull(HealthProfileId profileId) async {
    try {
      await _pullInner(profileId);
    } catch (e) {
      _status.set(SyncState.offline, message: e.toString());
    }
  }

  Future<void> _drainInner() async {
    for (final entry in await _outbox.pending()) {
      if (entry.entity != _entity) continue;
      try {
        switch (entry.op) {
          case OutboxOp.upsert:
            final json = jsonDecode(entry.payload) as Map<String, dynamic>;
            await _api.upsert(UpsertCareProviderRequest(
              id: json['id'] as String,
              healthProfileId: json['health_profile_id'] as String,
              type: json['type'] as String,
              name: json['name'] as String,
              specialty: json['specialty'] as String?,
              phone: json['phone'] as String?,
              phone2: json['phone2'] as String?,
              email: json['email'] as String?,
              clinic: json['clinic'] as String?,
              address: json['address'] as String?,
              mapUrl: json['map_url'] as String?,
              notes: json['notes'] as String?,
              createdAt: DateTime.parse(json['created_at'] as String),
            ));
          case OutboxOp.delete:
            await _api.delete(entry.entityId);
        }
        await _outbox.complete(entry.id);
      } catch (e) {
        await _outbox.fail(entry.id, e.toString());
        // STOP at the first failure. Skipping ahead would let a delete overtake
        // the upsert that created its row, resurrecting it on the next pull.
        rethrow;
      }
    }
  }

  Future<void> _pullInner(HealthProfileId profileId) async {
    final cursor = await _readCursor();
    final rows = await _api.pull(healthProfileId: profileId.value, since: cursor);
    if (rows.isEmpty) return;

    for (final row in rows) {
      await _merge(row);
    }

    // Advance to the newest updated_at we actually applied.
    final newest = rows.map((r) => r.updatedAt).reduce((a, b) => a.isAfter(b) ? a : b);
    await _writeCursor(newest);
  }

  /// Row-level last-writer-wins on `updated_at`. Writes here go straight to
  /// drift and deliberately bypass the outbox — echoing a pulled row back to
  /// the server would loop forever.
  Future<void> _merge(CareProviderResponse row) async {
    final local = await _db
        .customSelect(
          'SELECT updated_at, created_at FROM care_provider WHERE id = ?',
          variables: [Variable.withString(row.id)],
        )
        .getSingleOrNull();

    if (local != null) {
      final localStampMs = local.readNullable<int>('updated_at') ?? local.read<int>('created_at');
      // Strictly newer wins; equal timestamps leave the local row untouched.
      if (!row.updatedAt.isAfter(DateTime.fromMillisecondsSinceEpoch(localStampMs, isUtc: true))) {
        return;
      }
    }

    if (row.isDeleted) {
      await _db.customStatement('DELETE FROM care_provider WHERE id = ?', [row.id]);
      return;
    }

    Object? opt(String? v) => v == null || v.isEmpty ? null : v;

    await _db.customStatement(
      '''
      INSERT INTO care_provider
        (id, health_profile_id, type, name, specialty, phone, phone2, email,
         clinic, address, map_url, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        type = excluded.type, name = excluded.name, specialty = excluded.specialty,
        phone = excluded.phone, phone2 = excluded.phone2, email = excluded.email,
        clinic = excluded.clinic, address = excluded.address,
        map_url = excluded.map_url, notes = excluded.notes,
        updated_at = excluded.updated_at
      ''',
      [
        row.id,
        row.healthProfileId,
        row.type,
        row.name,
        opt(row.specialty),
        opt(row.phone),
        opt(row.phone2),
        opt(row.email),
        opt(row.clinic),
        opt(row.address),
        opt(row.mapUrl),
        opt(row.notes),
        row.createdAt.millisecondsSinceEpoch,
        row.updatedAt.millisecondsSinceEpoch,
      ],
    );
  }

  Future<DateTime?> _readCursor() async {
    final row = await _db
        .customSelect(
          'SELECT value FROM key_value WHERE key = ?',
          variables: [Variable.withString(_cursorKey)],
        )
        .getSingleOrNull();
    final raw = row?.readNullable<String>('value');
    return raw == null ? null : DateTime.tryParse(raw);
  }

  Future<void> _writeCursor(DateTime value) async {
    await _db.customStatement(
      'INSERT INTO key_value (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [_cursorKey, value.toUtc().toIso8601String()],
    );
  }
}
```

> **Check before running:** confirm the on-device key/value table is named `key_value` with columns `key` / `value` — grep `_phiSchema` and `packages/core/lib/src/data_source/key_value_data_source.dart`. If the name or columns differ, use the real ones in `_readCursor` / `_writeCursor`.

Add to `modules/profile/lib/profile.dart`:

```dart
export 'src/infrastructure/sync/care_team_sync_service.dart';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd modules/profile && fvm flutter test test/care_team_sync_service_test.dart`
Expected: PASS — 12 tests.

- [ ] **Step 5: Check module boundaries**

Run: `melos run lint-boundaries`
Expected: no new violations. `profile` may depend on `core` and on `balsm_api`; confirm `balsm_api` is already a dependency in `modules/profile/pubspec.yaml` and add it if not.

- [ ] **Step 6: Commit**

```bash
git add modules/profile/lib/src/infrastructure/sync modules/profile/lib/profile.dart \
        modules/profile/test/care_team_sync_service_test.dart modules/profile/pubspec.yaml
git commit -m "feat(profile): add CareTeamSyncService with LWW merge

Drain stops at the first failure to preserve order; pulled rows bypass
the outbox so a merge cannot echo back to the server. FR-506..FR-509."
```

---

## Task 12: Wire sync into the app shell

**Files:**
- Modify: `app/lib/brands/balsm/main_balsm.dart:145-176`
- Modify: `modules/profile/lib/src/infrastructure/drift/drift_profile_data_source.dart` (provider override site — find where `profileDataSourceProvider` is constructed)
- Test: `app/test/care_team_sync_wiring_test.dart`

**Interfaces:**
- Consumes: `CareTeamSyncService` (Task 11), `DioCareTeamApi` (Task 9), `SyncOutboxDao` (Task 8).
- Produces: `careTeamSyncServiceProvider`; sync triggered on sign-in, on app foreground, and on pull-to-refresh in `CareTeamScreen`.

- [ ] **Step 1: Add the provider**

In `modules/profile/lib/src/infrastructure/sync/care_team_sync_service.dart`, append:

```dart
/// Set in bootstrap — needs the network stack and the signed-in user.
final careTeamSyncServiceProvider = Provider<CareTeamSyncService>(
  (ref) => throw UnimplementedError('CareTeamSyncService must be initialized in bootstrap()'),
);
```

Add `import 'package:flutter_riverpod/flutter_riverpod.dart';`.

- [ ] **Step 2: Wire it in bootstrap**

In `app/lib/brands/balsm/main_balsm.dart`, add to the overrides list beside the backup wiring (after the `restoreServiceProvider` override at line ~171):

```dart
    // ── Care-team cloud sync (PHI → Balsm cloud, FR-500) ────────────────────
    // Distinct from the Drive blob backup above: this mirrors structured rows
    // to Balsm's own database so the roster survives device loss for users
    // with no Google session.
    careTeamSyncServiceProvider.overrideWith((ref) => CareTeamSyncService(
          api: DioCareTeamApi(net: ref.watch(networkManagerProvider)),
          outbox: SyncOutboxDao(ref.watch(appDatabaseProvider)),
          db: ref.watch(appDatabaseProvider),
          status: ref.watch(syncStatusProvider.notifier),
        )),
```

Find the existing `profileDataSourceProvider` construction (grep `DriftProfileDataSource(` across `app/lib` and `modules/profile/lib`) and pass the outbox so writes enqueue:

```dart
      DriftProfileDataSource(ref.watch(appDatabaseProvider), outbox: SyncOutboxDao(ref.watch(appDatabaseProvider))),
```

> **Check before writing:** confirm the exact provider names `networkManagerProvider` and `appDatabaseProvider` by grepping `packages/core/lib/src/network/api_providers.dart` and `packages/core/lib/src/db/`. Use whatever they are actually called.

- [ ] **Step 3: Trigger sync on sign-in and foreground**

In the app shell (`app/lib/balsm_app/shell.dart`), find the existing `WidgetsBindingObserver` / lifecycle handling. If there is none, add one to the shell's state:

```dart
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final profileId = ref.read(currentProfileIdProvider);
      if (profileId != null) {
        unawaited(ref.read(careTeamSyncServiceProvider).sync(profileId));
      }
    }
  }
```

In `app/lib/balsm_app/screens/care_team_screen.dart`, wrap the roster list in a `RefreshIndicator` whose `onRefresh` calls:

```dart
        onRefresh: () async {
          final profileId = ref.read(currentProfileIdProvider);
          if (profileId != null) {
            await ref.read(careTeamSyncServiceProvider).sync(profileId);
          }
        },
```

- [ ] **Step 4: Write the wiring test**

Create `app/test/care_team_sync_wiring_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:profile/profile.dart';

void main() {
  test('careTeamSyncServiceProvider throws until bootstrap overrides it', () {
    // Guards the bootstrap contract: a missing override must fail loudly at
    // first read rather than silently never syncing.
    expect(
      () => ProviderContainer().read(careTeamSyncServiceProvider),
      throwsA(isA<UnimplementedError>()),
    );
  });
}
```

Add the `flutter_riverpod` import for `ProviderContainer`.

- [ ] **Step 5: Run the app test suite**

Run: `cd app && fvm flutter test`
Expected: PASS — including existing `care_team_test.dart`.

Run: `melos run analyze`
Expected: no new issues.

- [ ] **Step 6: Commit**

```bash
git add app/lib modules/profile/lib app/test/care_team_sync_wiring_test.dart
git commit -m "feat(app): wire care-team sync into bootstrap, foreground and refresh

Runs alongside the Drive blob backup rather than replacing it."
```

---

## Task 13: Deletion pre-confirm copy

**Files:**
- Modify: `app/lib/balsm_app/i18n/strings.json` and `strings_ar.json` (deletion pre-confirm keys)
- Modify: the deletion pre-confirm screen (grep `FR-031` or the deletion screen under `app/lib/balsm_app/screens/`)
- Test: `app/test/deletion_preconfirm_test.dart`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing consumed later. Pure copy + compliance change (FR-513).

- [ ] **Step 1: Locate the screen and its strings**

Run: `grep -rn "FR-031\|pre-confirm\|preConfirm" app/lib modules/deletion/lib --include="*.dart" | head -20`

Identify the widget that renders the three lists ("deleted now (cloud)", "wiped from this phone", "retained 2 years") and the i69n keys behind them.

- [ ] **Step 2: Write the failing test**

Create `app/test/deletion_preconfirm_test.dart`. Model it on the existing widget tests in `app/test/` — copy the pump/harness helper from `care_team_test.dart` so the theme and localization wiring match.

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('pre-confirm lists care team under cloud deletion and device wipe', (tester) async {
    // FR-513: shipping cloud sync without this makes the existing compliance
    // statement false — care team is no longer device-only.
    await pumpDeletionPreConfirm(tester);

    final cloudSection = find.byKey(const Key('deletion.cloudList'));
    final deviceSection = find.byKey(const Key('deletion.deviceList'));

    expect(
      find.descendant(of: cloudSection, matching: find.textContaining('Care team')),
      findsOneWidget,
    );
    expect(
      find.descendant(of: deviceSection, matching: find.textContaining('Care team')),
      findsOneWidget,
    );
  });
}
```

Add `pumpDeletionPreConfirm` as a local helper in the test file, following the harness used by `app/test/care_team_test.dart`.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd app && fvm flutter test test/deletion_preconfirm_test.dart`
Expected: FAIL — care team appears only in the device list.

- [ ] **Step 4: Update the strings and the screen**

Add the care-team line to the cloud list's i69n bundle entry in `strings.json`, and the Arabic equivalent in `strings_ar.json`. Add `Key('deletion.cloudList')` and `Key('deletion.deviceList')` to the two list widgets if they do not already carry keys.

Then regenerate:

```bash
cd app && fvm dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd app && fvm flutter test test/deletion_preconfirm_test.dart`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/lib/balsm_app/i18n app/lib/balsm_app/screens app/test/deletion_preconfirm_test.dart
git commit -m "fix(deletion): list care team under cloud deletion too

Care team is no longer device-only, so the pre-confirm screen's
exhaustive list was inaccurate as written. FR-513."
```

---

# Part C — Governance (this repo)

## Task 14: Amend the constitution

**Files:**
- Modify: `architecture/bounded-contexts/personal-health.md:9`
- Modify: wherever ADR-10 is defined (grep `ADR-10` and find the canonical ADR text; if the ADRs live outside this repo, record the amendment in `architecture/decisions/` and link it)
- Modify: `docs/compliance-risks.md` (add the new risk row)
- Create: `specs/003-care-team-cloud-sync/checklists/requirements.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the written record FR-514/FR-515 require. No code.

- [ ] **Step 1: Amend the PHI posture line**

In `architecture/bounded-contexts/personal-health.md`, replace line 9's PHI posture cell:

```markdown
| **PHI posture** | Full PHI on device (SQLCipher drift) + optional user-owned Drive/iCloud sync. Balsm servers hold two PHI categories only: (1) `date_of_birth`, pgcrypto-encrypted + audit-logged (FR-047/FR-048); (2) the patient's **care team** — `care_provider` rows, AES-256-GCM field-encrypted per column and audit-logged on every decryption (FR-502/FR-504, spec 003). Everything else — records, medications, dose history, check-ins, allergies, conditions, emergency contacts — remains device-only. UAE rows on UAE-resident Supabase per FR-049. |
```

- [ ] **Step 2: Amend ADR-10**

Run: `grep -rn "ADR-10" --include="*.md" . | grep -iv "plane\|checklist" | head`

Locate the canonical ADR-10 statement ("PHI never on Supabase"). Append an amendment section dated 2026-09-23 recording: what changed (care team is now cloud-mirrored), why (roster must survive device loss for users with no Google session — the Drive backup path is unavailable to email-OTP and Apple users), what bounds it (per-column AES-256-GCM under a dedicated key, decryption audit log, residency routing per FR-049, purge on account deletion), and what did NOT change (every other PHI table stays device-only; local remains the write path per ADR-11).

If no canonical ADR file exists in this repo, create `architecture/decisions/ADR-10-amendment-care-team.md` with that content and link it from `personal-health.md`.

- [ ] **Step 3: Record the compliance risk**

In `docs/compliance-risks.md`, add a row in the same shape as the existing `RR-001`:

- **RR-00N** — Balsm now processes health data (care team) as controller in every FR-049 jurisdiction. DPIA refresh required before GA. App-store data-safety declarations for iOS and Android must be updated to declare health-data collection and linkage to identity (FR-515). Marketing copy asserting "Balsm servers hold zero PHI" must be corrected.

- [ ] **Step 4: Write the requirements checklist**

Create `specs/003-care-team-cloud-sync/checklists/requirements.md` mapping every FR-500..FR-515 to the task that implements it and the test that proves it. Use `specs/002-patient-app-security-hardening/checklists/requirements.md` as the format template.

- [ ] **Step 5: Commit**

```bash
git add architecture docs specs/003-care-team-cloud-sync
git commit -m "docs: amend ADR-10 and PHI posture for care-team cloud sync

Care team becomes the second cloud-PHI category after encrypted DOB.
Records the bounding controls and the DPIA/data-safety follow-ups.
FR-514/FR-515."
```

---

## Self-Review

**Spec coverage** — every FR maps to a task:

| FR | Task | FR | Task |
|---|---|---|---|
| FR-500 | 3, 8, 11 | FR-508 | 4, 11 |
| FR-501 | 10, 11 | FR-509 | 12 |
| FR-502 | 1, 3 | FR-510 | 4, 5 |
| FR-503 | 3 | FR-511 | 3 (per-country provisioning via `CloudDatabase` config) |
| FR-504 | 6 | FR-512 | 7 |
| FR-505 | 2, 4 | FR-513 | 13 |
| FR-506 | 8, 10, 11 | FR-514 | 14 |
| FR-507 | 2, 4, 11 | FR-515 | 14 |

**Review Focus coverage:** (1) server clock → Task 4 `Upsert_UsesServerClockForUpdatedAt_NotClientCreatedAt`; (2) outbox ordering → Task 10 `upsert then delete of one id stay in that order` + Task 11 `drain stops at the first failure so order is preserved`; (3) replayed upsert → Task 4 `Upsert_SameIdTwice_IsIdempotent_NoDuplicateRow`; (4) cross-profile/cross-user → Task 4 `Pull_ScopedToHealthProfile_ExcludesOtherProfiles` + `Delete_AnotherUsersId_ReturnsNotFound`, Task 5 `Delete_NotOwned_Returns404`; (5) tombstone resurrection → Task 4 `Upsert_OnTombstonedId_ReturnsTombstonedError` + Task 11 `applying a pulled tombstone does not enqueue an outbound delete`.

**Known verification points flagged inline** (each is a one-line grep the implementer runs before writing that block, not a placeholder): the envelope list-unwrap helper name in Task 9; the `key_value` table shape in Task 11; `networkManagerProvider` / `appDatabaseProvider` names in Task 12; the deletion pre-confirm widget location in Task 13. These are named existing symbols whose exact spelling I did not read; the surrounding code is complete.

**Not covered by this plan, by design:** `care_provider_file` sync (spec: out of scope — attachments stay device-local), attachment blob storage, live push, retiring the Drive backup.
