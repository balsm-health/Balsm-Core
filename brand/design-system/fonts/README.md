# fonts/ — self-hosted webfont files

`../fonts.css` declares every face against a file in this folder. Nothing
in the type stack touches the network at runtime.

## Why self-hosted

Balsm is offline-default and community-owned. Fonts loaded from a CDN break
both: a pharmacy with no signal loses its typography, and every page load
reports the reader to a third party. These files make the design system work
the way the product claims to.

## Present

| Family | Files | Notes |
|---|---|---|
| **Montserrat** — display / headings | `Montserrat-VariableFont_wght.ttf`, `Montserrat-Italic-VariableFont_wght.ttf` | Variable, `wght` 100–900 |
| **IBM Plex Sans** — body / data / UI | `IBMPlexSans-VariableFont_wdth_wght.ttf`, `IBMPlexSans-Italic-VariableFont_wdth_wght.ttf` | Variable, `wght` 100–700 + `wdth` 85–100 |
| **IBM Plex Sans Arabic** — Arabic / RTL | `IBMPlexSansArabic-{Thin,ExtraLight,Light,Regular,Medium,SemiBold,Bold}.ttf` | Seven static faces, 100–700 |
| **Cairo** — Arabic display | `Cairo-VariableFont_slnt_wght.ttf` | Variable, `wght` 200–1000 (`slnt` left at 0) |
| **IBM Plex Mono** — numerics, IDs, batch codes | `IBMPlexMono-{Thin,ExtraLight,Light,Regular,Medium,SemiBold,Bold}.ttf` + matching `*Italic.ttf` | Fourteen static faces, 100–700 roman + italic |

All SIL Open Font License 1.1 — redistributable, so they belong in the repo
alongside the rest of the brand assets. **Every family the design system
references is now self-hosted; nothing in the type stack touches the network.**

## Two rules when editing `fonts.css`

**Never declare a single static file across a weight range.** The browser
will happily accept `font-weight: 100 900` on a Regular file and then fake
every bold by smearing the outlines. One rule per static weight, or one rule
for a genuine variable file.

**No `local()` sources.** A locally installed copy matches on family name and
wins over the file, which reintroduces exactly that synthesis problem on
whichever machines happen to have the font installed — a bug that only shows
up on other people's screens.

## Subsetting

These are uncompressed TTFs; converting to `.woff2` typically halves each
one. Subsetting to the glyphs actually used (`pyftsubset`, `glyphhanger`)
cuts another 60–80%. Worth doing before this ships to a rural clinic — but
ship correct first, small second.

Do **not** subset the Arabic faces aggressively: Arabic shaping needs the
full set of initial / medial / final / isolated forms plus the ligature and
mark-positioning tables. Dropping them silently breaks joining.
