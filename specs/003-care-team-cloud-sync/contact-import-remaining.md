# Care-team contact import — remaining work

**Design**: DesignSync project `50dccb01-9a43-45e3-b077-cb8d0be4a1f3` (“Balsm App”), file
`care-import.jsx`. Read it with the DesignSync tool — it is the live source of truth; the
local reference prototype is stale.

**Done** (commit `7b912a2`, 15/15 tests): `modules/profile/.../domain/entities/imported_contact.dart`
— `ImportedContact`, `guessCareProviderType`, `contactPhoneKey`, `toCareProvider`,
`isAlreadyOnTeam`. Exported from `profile.dart`.

## Decision already taken

**Native OS picker, no contacts permission.** The design ships two paths: an in-app
address-book list (needs `READ_CONTACTS` / `NSContactsUsageDescription`, and a
“Contacts” collection declaration in both app stores) and the `initial` “Review
contacts” path fed by the OS picker. We build the second.

Rationale: this is the PHI-heaviest repo and care team now syncs to Balsm servers
(RR-005). The OS picker needs no permission at all, so nothing new appears in a
data-safety filing. Cost: bulk “Select all” over the whole address book is not
reachable; native pick is one contact at a time (Android `ACTION_PICK` is
single-select), so the user repeats to add more and adjusts types in one review sheet.

If the product decision later reverses to the in-app list, that is a new
data-safety declaration and belongs with the compliance owner, not in a code change.

## 1. Picker port + adapter

- Port: `modules/profile/lib/src/application/ports/contact_picker.dart`
  ```dart
  abstract class ContactPicker {
    /// Opens the OS picker. Null when the platform has none; empty when cancelled.
    Future<List<ImportedContact>?> pickOne();
    bool get isAvailable;
  }
  ```
- Adapter: `modules/profile/lib/src/infrastructure/contacts/native_contact_picker.dart`
  using `flutter_contacts` `FlutterContacts.openExternalPick()` — **verify it needs no
  runtime permission on both platforms before shipping**; that is the whole basis of
  the decision above.
- Add `flutter_contacts` to `modules/profile/pubspec.yaml`, then `melos bootstrap`.
- Riverpod provider in the module; override in `main_balsm.dart` like the other adapters.
- Test with a fake implementing the port. Do **not** test the plugin itself.

## 2. Review sheet

`app/lib/balsm_app/screens/care_team_import_sheet.dart`, modelled on the design's
`initial` branch:

- Title “Review contacts” / «مراجعة جهات الاتصال».
- Copy: “Check each contact's type, then add them.” — the design's on-device line
  (“Every record stays on your device”) is now **false**: care team syncs to Balsm.
  Write new copy that says where the data goes, or the pre-confirm screen and this
  sheet contradict each other.
- Per row: checkbox, initials avatar (`ciInitials` → strip `Dr.`/`د.`, two letters),
  name, formatted first number + `+N` when more, type chip opening the
  `PROVIDER_TYPES` picker inline.
- Rows already on the team: 55% opacity, “On your team” badge, not selectable.
- Search, “Select all / Clear”, empty state.
- Footer: primary “Add N to care team”, disabled at zero; ghost “Choose more
  contacts” (re-invokes the picker); ghost “Not in your contacts? Add manually”
  → existing `AddCareProviderSheet`.
- Use `SubScreen`/`showAppSheet` and the existing kit, not the design's inline styles.

## 3. Entry point

`care_team_screen.dart` — the FAB currently goes straight to `AddCareProviderSheet`.
Offer both routes (the design's empty state leads with contacts import).

## 4. Save path

Selected drafts → `toCareProvider(profileId, createdAt: DateTime.now())` →
`CareProvidersDataSource.putBulk`. That already enqueues one outbox entry per row, so
imports sync like any other write. Do **not** bypass the data source.

## 5. Strings

`app/lib/balsm_app/i18n/strings.i69n.jsonc` + `strings_ar...` — every string above.
Then `fvm dart run build_runner build --delete-conflicting-outputs` in `app/`.
No inline `ar ? … : …` ternaries (CLAUDE.md).

## 6. Watch out for

- **Widget tests need `material_ui`'s `MaterialApp`**, not Flutter's — this repo's
  Material layer is `material_ui` and its `RefreshIndicator`/`debugCheckHasMaterialLocalizations`
  will fail otherwise. See `app/test/care_team_test.dart`.
- Two Bash calls per commit: stage, then commit. The docs-with-code guard reads the
  index *before* the command runs.
- A real `dart format` pre-commit hook rejects unformatted staged Dart.
- Never `git add -A`: the working tree carries 55 pre-staged marketing files plus
  `.env.staging.example` that are not ours.
