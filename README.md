<p align="center">
  <img src=".github/banner.png" alt="نواة بلسم · Balsm Core" width="880">
</p>

# Balsm-Core

Source of truth for the Balsm healthcare platform: architecture, specs, governance,
brand, and the shared rules every other Balsm repo imports. **No product code lives
here** — code repos (`balsm_app`, `Balsm-API-DotNet`, `website`) reference this repo
for decisions and standards.

## Map

| Path | What it holds |
|---|---|
| `agents/rules/` | **AGENTS.md + CODING_STANDARDS.md** — org-wide agent/contributor rules imported by every repo's CLAUDE.md. Change here, applies everywhere. |
| `architecture/` | C4 model, domain map, bounded contexts, routing/communication strategies, diagrams. |
| `specs/` | Phased platform specs (e.g. `001-server-foundation`). |
| `docs/` | Rendered documentation tree: `api/`, `developer/`, `user-guides/`, `clinical/`, `runbooks/`. Entry: [docs/README.md](docs/README.md). |
| `SYSTEM_THREAT_MODEL.md` | Platform threat model. |
| `NON_FUNCTIONAL_REQUIREMENTS.md` · `PHASED_DELIVERY_STEPS.md` | NFRs and delivery phasing. |
| `AI_GOVERNANCE.md` · `CERTIFICATIONS.md` · `legal/` | Compliance and governance. |
| `GLOSSARY.md` | Shared vocabulary — check before inventing a term. |
| `brand/` · `assets/` · `store assets/` | Identity, artwork, store listings. |
| `personas/` · `validations/` | User research inputs. |

`index.md` + `package.json` power the docs site build; `_bmad*` and `graphify-out/`
are generated working artifacts, not sources.

## Start here

- New to the platform → `architecture/c4-model.md`, then `architecture/domain-map.md`
- Writing code in any Balsm repo → `agents/rules/CODING_STANDARDS.md`
- Security review → `SYSTEM_THREAT_MODEL.md`, `docs/compliance-risks.md`
- Operations → `docs/runbooks/`
