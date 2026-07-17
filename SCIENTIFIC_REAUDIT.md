# Scientific Re-Audit — Elemental Orbit (3D Periodic Table)

**Date:** 2026-07-17  
**Scope:** Re-verify scientific accuracy and element relationships after the Phase 2–6 accuracy and geometry work  
**Compared against:**
- `SCIENTIFIC_AUDIT.md` — original findings
- `SCIENTIFIC_REVIEW.md` — independent (Claude) review
- `CHANGELOG.md` — claimed fixes and residuals

**Method:** Read-only review of `src/elements.js`, `src/layouts.js`, `src/main.js`, `index.html`, and tests; live Node import of derived element and layout data; `npm test`.  
**Changes made during this re-audit:** None (documentation only).

> **Post-audit resolution:** The two medium group-3/La–Ac findings were resolved in Phase 7. The vintage-mass residual was subsequently resolved in Phase 8 with pinned CIAAW 2024 abridged standard weights and current IUPAC bracketed mass numbers. This document remains the point-in-time verification record that prompted those changes; see `CHANGELOG.md` for implementation details.

---

## Executive summary

| Question | Verdict |
|----------|---------|
| Were the original critical defects fixed? | **Yes** — blocks, sphere collisions, meridians, spiral periodicity, Lr, superheavy categories, bracket masses |
| Do automated checks support that? | **Yes** — **17/17** tests pass; live smoke import matches |
| Is the table scientifically reliable for teaching? | **Mostly yes** — identities, blocks, shell math, and most relationship encodings are sound |
| Remaining accuracy debt? | **Medium:** group-3 geometry vs membership; La/Ac prose vs d-block. **Low:** convention, vintage masses, group 12, shells metaphor |

**Bottom line:** The accuracy overhaul resolved the critical and high findings from both prior audits. Residual issues are narrower policy/geometry/copy mismatches, not wholesale data failure.

---

## Verification evidence

| Check | Result |
|-------|--------|
| `npm test` | **17/17 pass** |
| Block partition | **s: 14, p: 36, d: 40, f: 28** |
| Sphere positions unique | **118 / 118** |
| Min sphere orbital radius vs occlusion mask | **≈ 8.30 ≥ 7.82** (clearance OK) |
| Distinct group meridians / arcs | **18** |
| Alkali spiral ray (Li…Fr) | **One shared angle** |
| Halogen spiral ray (F…Ts) | Covered by tests (shared ray) |
| Ce/Th congener spiral angle | **Equal** |
| Ce vs Hf sphere longitude | **Different** (f-stagger working) |
| Lr category | **actinoid**; actinoid series count **15** (includes Lr) |
| Superheavies Z ≥ 109 | All **unknown** (Predicted chemistry) |
| Bracket masses | Tc `[98]`, Ra `[226]`, Og `[294]` |
| Sample blocks | He=s, Fe=d, La=d, Ce=f, Ac=d, Lr=f, Lu=f, Zn=d |

---

## Status of original findings (`SCIENTIFIC_AUDIT.md`)

| ID | Finding | Status |
|----|---------|--------|
| C1 | Orbital blocks systematically wrong (80 s / 37 p / 1 d / 0 f) | **Fixed** — position-based `orbitalBlock()`; correct 14/36/40/28 partition; He special-cased; La/Ac as d; Ce–Lu and Th–Lr as f |
| C2 | 28 sphere coordinate collisions (Ce–Hf … Lr–Ts) | **Fixed** — f-row latitude offset + half-column stagger; all 118 positions unique |
| C3 | Sphere UI overclaims geometry | **Fixed** — copy matches model (period bands, 18 group arcs, separate f-belts; no false “follow ring for Z-order”) |
| H4 | Lawrencium inconsistent (transition metal / p-block / off actinide ribbon) | **Fixed** — actinoid, f-block, included on actinide ribbon |
| H5 | Group 3 family connector only Sc–Y | **Partly fixed** — filter is `group === n && symbol !== "H"`, so **Sc, Y, La, Ac** connect; geometry residual remains (below) |
| H6 | F-series cards labeled S BLOCK | **Fixed** |
| M7–M8 | Superheavies over-classified; `unknown` unused | **Fixed** — Mt–Og → unknown; At phase forced unknown |
| M9 | Hydrogen welded into alkali family tube | **Fixed** — H excluded from family connectors |
| M10 | Helium s-block + group 18 | Unchanged; acceptable IUPAC hybrid |
| M11 | Stale upstream masses | **Accepted residual** (also noted in changelog) |
| M12 | Shells view = period metaphor unlabeled | **Fixed in copy** — explicit structural metaphor / not Bohr model |
| M13 | Trend panel used non-periodic E=hν / E=mc² | **Fixed** — ionization energy and electronegativity trends |

---

## Status of Claude findings (`SCIENTIFIC_REVIEW.md`)

| Finding | Status |
|---------|--------|
| Block labels wrong; intro “4 orbital blocks” contradicted by data | **Fixed** — derived data now has four real blocks |
| Spiral encodes no periodicity (constant ~0.53 rad/element) | **Fixed** — one turn per period cylindrical helix; families on shared rails |
| 28 sphere stack pairs | **Fixed** |
| 18 meridians collapse to 9 great circles (group *n* fused with *n*+9) | **Fixed** — pole-to-pole half-arcs; 18 distinct midpoints |
| Group 3 incomplete; H on G1 tube; Lr off f-ribbon | **Fixed** (group 3 geometry caveat remains) |
| Pd: period ≠ occupied-shell count | Still true (Pd shells length **4**, period **5**); **honestly labeled** as period-ring metaphor |
| Radioactive masses as bare integers | **Fixed** — bracket notation |
| Po as metalloid | **Fixed** → post-transition metal |
| Ts forced halogen with firm chemistry prose | **Fixed** → unknown (Z ≥ 109) |
| Inspiration image scientifically unreliable | Still valid as **style brief only** — app data does not inherit Uun/Uuq/Uuo or legend errors |
| Fix-priority list (Part 5) | Largely implemented across Phases 2–6 |

---

## Changelog claim verification

| Claim | Evidence |
|-------|----------|
| Phase 2 scientific accuracy overhaul | Confirmed by tests + live import |
| Phase 3 f-belts outside occlusion mask | min radius ≈ 8.3 > mask 7.82 |
| Phase 5 f-stagger (no main/f ray overlap; congeners aligned) | Tests pass; Ce ≠ Hf longitude; Ce = Th angle |
| Phase 6 cylindrical helix + pulse wire | Geometry tests pass; implementation in `layouts.js` / `main.js` |
| 17 tests green | Confirmed (`npm test`) |
| Known residuals: vintage masses, group 12 as TM | Still accurate — but **incomplete** (see remaining issues) |

---

## What is solid

| Area | Assessment |
|------|------------|
| Element inventory | 118 unique symbols, Z = 1…118, H → Og |
| Electron configurations | Ground-state forms including classic Aufbau exceptions |
| Shell populations | Sum equals atomic number for all 118 |
| Main-table groups/periods | Standard landmarks correct |
| Orbital blocks | Standard 14/36/40/28 teaching partition |
| Table layout | 18-column grid + f-rows; La/Ac under group 3 convention |
| Sphere uniqueness & occlusion | All cards distinct and outside depth mask |
| Meridians | 18 geometrically distinct pole-to-pole arcs |
| Spiral periodicity | One turn per period; main-group family rails; Ln/An congener rays |
| Superheavy honesty | Z ≥ 109 → Predicted chemistry; uncertain phases labeled unknown |
| Radioactive mass display | Bracketed mass numbers where package supplies integers |
| UI scientific framing | Shells metaphor, sphere guide, About dialog largely careful |

---

## Remaining issues

### Medium — Group 3 geometry vs group membership

**Location:** `src/layouts.js` — `F_SERIES_COLUMN_STAGGER` applied when `tableRow >= 7`

La and Ac are **group 3**, but the f-row half-column stagger applies to every `tableRow ≥ 7` element, including them.

| Element | Column used for spiral angle / sphere longitude |
|---------|--------------------------------------------------|
| Sc, Y | 2 (true group-3 ray/meridian) |
| La, Ac | **2.5** (staggered) |

**Consequences:**

- Alkali and halogen family rails remain scientifically clean.
- **Sc–Y–La–Ac do not share one vertical spiral rail or one sphere meridian**, even though the purple family tube still connects all four (`main.js` family filter includes all `group === 3`).
- Phase 5 correctly avoided false Ce–Hf “group 4” kinship; the same rule pulls **true** group-3 members (La/Ac) off the group-3 ray.

**Impact:** Group 3 relationship encoding is better than the old Sc–Y-only tube, but not fully consistent with “families on shared rails.”

### Medium — Prose vs block for La and Ac

**Location:** `src/elements.js` — `CATEGORY_META` prose + generated descriptions

| Element | `block` | Category prose used in description |
|---------|---------|--------------------------------------|
| La | **d** | “a rare-earth **f-block** metal” |
| Ac | **d** | “a radioactive **f-block** metal” |

Ce–Lu and Th–Lr prose matches f-block. **La and Ac alone** show a visible self-contradiction on the detail panel (d-block label vs f-block sentence).

### Low — Group 3 / Lu–Lr convention (documented choice)

Layout still places **La/Ac in group 3** and Lu/Lr in the f-series with `group: null` (UI shows "—").  
This is a defensible traditional layout, not the IUPAC provisional Lu/Lr-in-group-3 model. Not a data bug if the convention is intentional; still a policy choice for users who expect modern group-3 treatment.

### Low — Upstream and presentation residuals

- Masses from `periodic-table@0.0.8` remain ~2005-vintage CIAAW values (e.g. older Li form). Full refresh not done.
- Group 12 (Zn/Cd/Hg; Cn is unknown by Z) retained as transition metals — boundary case accepted in changelog.
- Some package `standardState` values are empty (e.g. Lr raw `""`); UI falls back to `"Unknown"` via `||`, which is fine but uneven vs explicit `"unknown"` for At / Z ≥ 109.
- Shells view still places elements by **period**, not true multi-electron shell occupancy — copy is correct; geometry remains a metaphor.
- Spiral intro copy (*“same-group elements stack on vertical rails”*) is absolute; it is false for group 3 under the stagger rule (same class as the medium group-3 issue).

---

## Severity summary (current codebase)

| Severity | Count | Items |
|----------|------:|-------|
| Critical | **0** | Prior criticals resolved |
| High | **0** | Prior highs resolved or reduced to medium |
| Medium | **2** | Group-3 stagger vs membership; La/Ac f-block prose vs d-block |
| Low | **several** | Lu/Lr convention; vintage masses; group 12; Shells metaphor; copy absolutes; empty states |

---

## Relationship model by view (re-audit)

| View | Encoding | Accuracy now |
|------|----------|--------------|
| **Table** | Groups, periods, f-rows; block depth from `block` | **Good** — layout + blocks correct under La/Ac group-3 convention |
| **Spiral** | One turn per period; angle from column; f-track inset + staggered | **Good** for main families and Ln/An congeners; **weak for group 3** (La/Ac off Sc/Y ray) |
| **Shells** | Period rings | **Honest metaphor** — not Bohr shells |
| **Sphere** | Period latitude; column longitude; f-belts; 18 arcs; family + f-series tubes | **Good** uniqueness and meridians; family tubes exclude H; **group 3** still kinked by stagger |

---

## Suggested next fixes (not implemented)

1. **Group 3 alignment:** Do not apply column stagger when `group === 3` (La/Ac), or only stagger when `group === null`. Keep latitude/radius cues so Sc–Y–La–Ac share one ray/meridian while Ce–Lu stay off false d/p rays.
2. **La/Ac copy:** Specialize descriptions (or prose by block) so “f-block” is not applied to d-block La/Ac.
3. **About note:** Optionally state the group-3 convention (La/Ac vs Lu/Lr).
4. **Data (optional):** Refresh standard atomic weights from a current CIAAW-oriented source when educational precision is prioritized.
5. **Changelog:** Extend “known residuals” to include group-3 stagger and La/Ac prose mismatch.

---

## Related files

| Path | Role |
|------|------|
| `SCIENTIFIC_AUDIT.md` | Original audit (pre-fix baseline) |
| `SCIENTIFIC_REVIEW.md` | Independent review + inspiration-image analysis |
| `CHANGELOG.md` | Phases 1–6 implementation history |
| `src/elements.js` | Categories, blocks, masses, layout metadata |
| `src/layouts.js` | Spiral, sphere, meridian math |
| `src/main.js` | Rendering, family tubes, UI copy binding |
| `index.html` | Relationship panel, About, trend panel |
| `test/elements.test.js` | Inventory, shells, blocks, categories, masses |
| `test/layouts.test.js` | Sphere uniqueness, occlusion, meridians, spiral rails |
| `test/interface.test.js` | View switcher and scientific copy guards |

---

## Overall verdict

The Phase 2–6 accuracy work **substantially fixed** the original and Claude audits. Critical defects (blocks, sphere collisions, meridian collapse, non-periodic spiral, Lr inconsistency, superheavy overconfidence, false-precision masses) are **verified fixed** with regression coverage.

**Scientific accuracy of identities, blocks, categories, and most relationship encodings is now good for a teaching visualization.**

Remaining accuracy debt is concentrated in **group-3 / f-row policy** (geometry + La/Ac prose), not in wholesale data failure. Changelog “known residuals” understate the group-3 stagger and La/Ac description mismatch.
