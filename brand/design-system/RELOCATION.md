# Design system — canonical location

**This directory is the single source of truth for the Balsm design system inside
the Balsm org.** It was consolidated here on 2026-08-13. Nothing else in any
Balsm repo should hold a second copy.

Upstream is the Claude Design project `51cdbf29-13b7-4206-9328-125fade14cc3`
("Balsm Design System"). This directory mirrors it, with the deliberate deltas
recorded below.

## Who reads this

| Consumer | How it reaches these files |
|---|---|
| `balsm-design` skill (Balsm-AI plugin) | Points here by path. It carries the brand rules inline but **no copy** of the assets — see `Balsm-AI/plugin/skills/balsm-design/SKILL.md`. |
| `Balsm-Core/design.md` | The design contract. Links here for the full system. |
| P001 spec (`specs/001-patient-app-mvp/design/`) | `_ds/` used to hold a mirror; it is now a pointer note. |
| Flutter / website / admin-ui | They do **not** read these files. Each ships its own token file, kept in step by hand. See "Known duplication" below. |

## Deltas from upstream

Two kinds. Both are intentional; invert them before pushing anything back.

**1. Dropped directories.** Upstream has `brand/` and `uploads/`. Both are
duplicates of files that already live in this repo, so they were not copied:

| Upstream path | Lives here instead |
|---|---|
| `brand/*` (35 files: logos, icons, og-images, wordmark, background) | `../` — i.e. `Balsm-Core/brand/`, byte-identical |
| `uploads/balsm-brand-canvas.md` | `../balsm-brand-canvas.md` |
| `uploads/design.md` | `../../design.md` (Core's is a superset) |
| `uploads/balsm-background.png`, `icon.svg`, `logo-vertical.svg` | `../` (same files) |
| `uploads/BUSINESS_FEATURES.md` | not mirrored — upstream only |

**2. Rewritten relative paths.** Because this directory now sits *inside*
`Balsm-Core/brand/`, references to brand assets moved up one level:

| File | Was | Now |
|---|---|---|
| `preview/brand-logo.html`, `preview/brand-pattern.html` | `../brand/X` | `../../X` |
| `ui_kits/balsm_pharmacy/{index.html,shell.jsx}` | `../../brand/X` | `../../../X` |
| `colors_and_type.css`, `balsm_app/colors_and_type.css` | `brand/…`, `uploads/…` | `../…` |
| `README.md`, `SKILL.md` | `brand/…`, `uploads/…` | `../…` |

**3. `care_app/` is named `balsm_app/` here.** Upstream calls it `care_app/`
(itself a rename from `patient_app/`). It was renamed again locally on
2026-08-13 to match the Flutter app directory `balsm_app/app/lib/balsm_app/`.

This is the one delta that costs something on every pull:

- A fresh pull re-creates `care_app/` — rename it to `balsm_app/` again.
- `_ds_bundle.js`'s `sourceHashes` key on `care_app/…`, so the byte-exact hash
  check no longer resolves for those 11 files. To verify them after a pull,
  compare *before* renaming, or map the prefix when checking.
- The card path in `_ds_manifest.json` was updated to `balsm_app/Care App.html`.
  Upstream's own manifest still says `care_app/…`.

The entry file is still `Care App.html` and the card is still named "Balsm Care
App": those describe the product surface (Balsm Care, the care app) in the brand's
own vocabulary, which the directory name does not change.

**4. `../colors_and_type.css` is now a re-export.** `Balsm-Core/brand/colors_and_type.css`
is cited as the Tier 1–2 token source by `design.md`, the P001 spec, and the task
files, so that path had to keep working. It used to hold a hand-copied subset
that had drifted — missing all 18 responsive tokens (`--bp-*`, `--container-*`,
`--gutter*`, `--cols-*`) and the media-query type escalation, even though
`design.md` §6.5 asserted those tokens lived there. It is now a one-line
`@import "./design-system/colors_and_type.css"`. Anything that needs the tokens
as *text* (regenerating `specs/001-patient-app-mvp/design/tokens.css`) must read
this directory's copy directly.

Two upstream bugs were fixed in passing and should be pushed back:

- `preview/brand-logo.html` referenced `logo-vertical-white.png`, a filename
  retired when the reverse lockups were renamed to `-mono-white.png`
  (see `github.md`, 2026-08-12 entry). It now points at
  `logo-vertical-mono-white.png`.
- `SKILL.md`'s frontmatter description still said "warm olive-gray neutrals"
  and "a Patient App prototype" — both untrue since the palette retune and the
  `care_app` rename. Corrected here.

## Not mirrored (upstream only)

`_ds_bundle.js` (exceeds the 256 KiB `get_file` cap — it comes back truncated,
and a truncated bundle is worse than none), `thumbnail.html`,
`brand/logo-animation.html`, and `uploads/BUSINESS_FEATURES.md`.

**Consequence:** eleven preview harnesses `<script src="../../_ds_bundle.js">` and
so will not run from a local file open —
`components/{AnimatedLogo,Avatar,Card,Checkbox,DatePicker,Modal,ProSidebar,Switch,Table,TimePicker}/index.html`
and `preview/responsive/stage.html`. Every other local link in this directory
resolves. To run those, export `_ds_bundle.js` from the design project into this
directory; it is gitignored-by-absence, not tracked. The components themselves
(`*.jsx`, `*.d.ts`) are complete and unaffected.

As of the 2026-09-23 pull the 256 KiB cap is no longer the blocker — the bundle
comes down whole (109 559 B) when the project files are zipped in-browser and
downloaded in one file. It is still not mirrored, for a different reason: the
upstream bundle is built from pre-rename sources and carries 42 `--petal-*`
references, so dropping it in would render the harnesses against tokens this
directory no longer defines. Re-export it only after upstream is caught up.

## Refresh — 2026-09-23

Pulled all 175 upstream paths' hashes and the 92 non-`brand/`, non-`uploads/`
files that differed or were missing. **The direction of drift has reversed: for
every file that differs, this directory is ahead of upstream, not behind.**
Upstream's newest edit to these files is 2026-09-15; the repo took the
2026-08-29 mark change and the 2026-09-18 `petal` → `ribbon`/`hue` rename after
that (see `github.md`). So the 49 differing files were **not** overwritten —
copying them down would have reinstated `--petal-*`, "five-petal flower" and
the warm-olive vocabulary.

**Taken from upstream (36 files, all additions this directory did not have):**

| What | Files |
|---|---|
| Tier-5 window-class layer | `responsive.css`, `RESPONSIVE.md`, `preview/responsive-{shell,content,panes,overlay,input,density,rtl}.html`, `preview/responsive/stage.html` |
| Component contracts + harnesses | `components/{Avatar,Card,Checkbox,Modal,Switch,Table}/{<Name>.d.ts,index.html}` — the `.jsx` sources were already here and byte-identical |
| Webfonts | `fonts/IBMPlexMono-*.ttf` (15 faces) + `fonts/README.md` |

Two edits applied on the way in, same spirit as the path rewrites above:
`preview/responsive/stage.html`'s four `--petal-blue*` refs → `--hue-blue*`, and
`RESPONSIVE.md`'s "five-petal mark" → "ring mark". One line was merged into
`styles.css` by hand — `@import url('./responsive.css')` — rather than taking
upstream's copy of that file.

**Deliberately skipped:** `preview/colors-petals.html` (superseded here by
`preview/colors-hues.html`), `balsm-brand-canvas.md` (the repo copy at `../` is
canonical and differs), `_ds_bundle.js` (see above), `thumbnail.html`,
`.thumbnail`, `_thumbnail.state.json`.

**Owed upstream.** The project still has to receive the mark change and the
rename. Until it does, every pull will look like this one. The largest
divergences, by upstream-only lines that are *not* petal vocabulary:
`_adherence.oxlintrc.json` (126), `components/AnimatedLogo/AnimatedLogo.jsx`
(93 — upstream still draws the retired flower), `github.md` (38),
`preview/type-display.html` (34), `preview/brand-logo.html` (13),
`preview/loading-and-progress.html` (13). `care_app/` and `ui_kits/` no longer
exist upstream, so delta 3 below is moot.

## Verification

The upstream bundle publishes `sourceHashes` (sha256, first 12 chars) for every
source file. On the 2026-08-13 pull, all 32 hashed files matched byte-for-byte
before the path rewrites above were applied. To re-verify after a future pull,
compare against `_ds_bundle.js`'s header JSON.

## Known duplication — not yet solved

The three product surfaces each re-declare the tokens by hand rather than
importing `colors_and_type.css`:

- `website/src/app/globals.css` — its own `--color-*` block
- `balsm_app/packages/core/lib/src/kit/_tokens.dart` — Dart `Color()` literals
- `Balsm-API-DotNet/admin-ui/src/styles.css`

That hand-duplication is what let the site sit on a retired `--color-wordmark-tld`
and the whole olive ink ramp until 2026-08-13. Closing it means generating the
per-stack token files from this directory rather than editing them by hand.
