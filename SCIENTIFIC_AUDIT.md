# Scientific Accuracy Audit — Elemental Orbit (3D Periodic Table)

**Date:** 2026-07-17  
**Scope:** Read-only review of scientific accuracy and element relationships  
**Sources reviewed:** `src/elements.js`, `src/main.js`, `index.html`, live import of derived `elements`, `periodic-table@0.0.8` data  
**Changes made during audit:** None (documentation only)

---

## Executive summary

| Area | Assessment |
|------|------------|
| Element set (118, Z order) | Correct |
| Main-table groups and periods | Largely correct |
| Electron shell population sums | Correct (all match Z) |
| Orbital **block** labels | **Systematically wrong** |
| Relationship **Sphere** layout | **Broken for f-block vs main table** (position collisions) |
| Sphere UI copy vs geometry | Overclaims what the model shows |

**Bottom line:** Layout and identities of the 118 elements are largely correct for a standard teaching table. Shell electron counts are correct. Orbital block labels are not scientifically reliable, and the Sphere “relationship” view fails where f-block and main-table elements share the same `(period, tableColumn)`.

---

## What is solid

| Area | Assessment |
|------|------------|
| Element set | All **118** elements, Z = 1…118, H → Og |
| Main-table groups/periods | Landmarks correct (H 1/1, He 1/18, C 2/14, Fe 4/8, Og 7/18) |
| Electron shell **counts** | Every shell sum equals atomic number |
| Electron configs (source) | Standard Aufbau forms for common elements; exceptions (Cr, Cu, Nb, etc.) present |
| Table layout shape | Standard 18-column IUPAC-style grid with La/Ac under group 3 and f-series as separate rows |
| About dialog | Correctly notes visual scale is interpretive |

---

## Critical issues

### 1. Orbital block is systematically wrong

**Location:** `src/elements.js` — `orbitalBlock()` (approx. lines 98–102)

**Cause:** Block is taken from the **last** orbital token in the electronic configuration. Almost all configs end in `ns²` / `ns¹` / `np`, so **d** and **f** almost never win.

**Live counts from derived data:**

| Block | Count | Expected (rough) |
|-------|------:|------------------|
| s | **80** | ~14–16 |
| p | 37 | ~36 |
| d | **1** (only Pd) | ~38 |
| f | **0** | ~28 |

**Impact:**

- All lanthanides and nearly all actinides labeled **s-block** (card footer and detail panel).
- Nearly all transition metals labeled **s-block** (e.g. Fe, Cu, W → `s`).
- Lr → **p-block** (config ends `7p1`) while sitting in the actinide row and categorized as transition metal.

**Surfaces:** Element cards (`main.js` texture text) and detail panel (`#detail-block`).

---

### 2. Relationship sphere: f-block and main-table elements stack

**Location:** `src/main.js` — `relationshipPosition()` (approx. lines 119–128); f-block columns in `src/elements.js` (approx. lines 60–65, 128)

**Cause:** Sphere position uses only `(period, tableColumn)`, **not** `tableRow`. F-block assigns `tableColumn = index + 2` on the **same period** as the main d/p row.

**Result:** **28 collision pairs** share identical sphere coordinates:

**Period 6 (lanthanoids vs main-row d/p):**  
Ce–Hf, Pr–Ta, Nd–W, Pm–Re, Sm–Os, Eu–Ir, Gd–Pt, Tb–Au, Dy–Hg, Ho–Tl, Er–Pb, Tm–Bi, Yb–Po, Lu–At

**Period 7 (actinoids vs superheavies):**  
Th–Rf, Pa–Db, U–Sg, Np–Bh, Pu–Hs, Am–Mt, Cm–Ds, Bk–Rg, Cf–Cn, Es–Nh, Fm–Fl, Md–Mc, No–Lv, **Lr–Ts**

**Impact:** In Sphere view those pairs occupy the same point; family/period geometry cannot show distinct relationships for them.

---

### 3. UI claims about the sphere overstate the geometry

**Location:** `index.html` (relationship panel, about dialog); layout copy in `src/main.js` `setLayout()`

| Claim | Reality |
|-------|---------|
| “Follow a ring for atomic-number progression” | False for Sphere: longitude is **group/column**, not Z-order; collisions scramble rings |
| “Shared valence behavior” along meridians | Only for main-table groups; f-block has `group: null` (except La/Ac) and is excluded from family tubes |
| “Chemical families connect pole to pole” | Meridians are full torus circles, not pole-to-pole arcs; family tubes skip f-rows (`tableRow < 7`) |

---

## High-severity issues

### 4. Lawrencium is inconsistent with the actinide series

| Field | Lr (derived) |
|-------|----------------|
| Placement | Actinide row (`tableRow` 8) |
| Category | **transition metal** (from package `groupBlock`) |
| Block | **p** |
| Group | `null` (UI shows `"f"`) |
| F-series tube | **Not included** (`category !== "actinoid"`) |

Lr is placed with actinides, colored as a transition metal, labeled p-block, and omitted from the actinide relationship ribbon — internally inconsistent regardless of IUPAC group-3 convention.

**Related derived samples:**

| Element | Category | Block | Group | tableRow | tableColumn |
|---------|----------|-------|------:|---------:|------------:|
| La | lanthanoid | s | 3 | 7 | 2 |
| Lu | lanthanoid | s | null | 7 | 16 |
| Ac | actinoid | s | 3 | 8 | 2 |
| Lr | transition metal | p | null | 8 | 16 |

---

### 5. Group 3 family connector is only Sc–Y

**Location:** `src/main.js` — family filter `group === n && tableRow < 7` (approx. lines 193–208)

- Eligible for group 3: **Sc, Y** only  
- La/Ac have `group = 3` but `tableRow` 7/8 → **excluded**  
- Lu/Lr never get group 3 (`group = null`)  

Pedagogically incomplete for “group 3 family.”

---

### 6. Zero true f-block labels vs f-series ribbons

F-series tubes use **category** (`lanthanoid` / `actinoid`), not block, so pink/purple ribbons still draw — but every card in those series says **S BLOCK**, which contradicts the ribbons and standard teaching.

**Note:** All 29 category lanthanoid/actinoid entries (La–Lu, Ac–No; Lr excluded by category) have `block === "s"`.

---

## Medium-severity issues

### 7. Contested or soft categories from the npm package

Examples shown as hard categories:

- **Po** → metalloid (often metal/metalloid debate)
- **At** → solid halogen (phase poorly known)
- **Zn / Cd / Hg / Cn** → transition metal (IUPAC often treats group 12 as a boundary case)
- Superheavies **Cn–Lv, Og** get firm categories while bulk chemistry is largely unknown  
- Legend includes “Predicted chemistry” (`unknown`) but **0 elements** use that category

### 8. Selective prediction overrides

**Location:** `src/elements.js` — `normalizeCategory()` predicted overrides

| Symbol | Derived category | Raw `groupBlock` |
|--------|------------------|------------------|
| Mt, Ds, Rg | transition metal | transition metal |
| Ts | **halogen** (override) | post-transition metal |
| Cn | transition metal | transition metal |
| Nh–Lv | post-transition metal | post-transition metal |
| Og | noble gas | noble gas |

Ts override is chemically reasonable; treating Mt–Rg (and Cn) as settled without using `unknown` is uneven.

### 9. Hydrogen in group 1 family tube

H is correctly **nonmetal** and group 1, but the Sphere family connector groups H with alkali metals as “shared valence behavior.” ns¹ is shared; chemistry is not. Easy to over-read.

### 10. Helium: s-block, group 18

He is special-cased to **s-block** (good) and group 18 (IUPAC-standard). Family still ties it to p-block noble gases — acceptable, but mixed message with block.

### 11. Stale / approximate source data (`periodic-table@0.0.8`)

- Masses such as Li `6.941` (older form); many radioactives as simple integers  
- Uncertainty stripped for display (OK); dataset is not current IUPAC CIAAW standard atomic weights  
- Some package fields are wrong if ever shown (e.g. Si `bondingType: "metallic"`); app mostly does not surface those

### 12. Shells view is a metaphor, not shell physics

**Location:** `src/main.js` — `shellsPosition()`

Places elements by **period** on concentric rings, not by true principal shells of multi-electron atoms. Fine as a period metaphor; UI does not strongly warn that this is not Bohr shells for heavy atoms.

### 13. “Periodic signals” panel mix

**Location:** `index.html` trend panel

- Atomic-radius trend “grows ↓ and ←” is the usual teaching rule (with known exceptions).  
- `E = hν` and `E = mc²` are not periodic relationships and can dilute the scientific focus of that panel.

---

## Lower-severity / convention notes

| Item | Note |
|------|------|
| La under group 3, Lu under f-row | Older common layout; modern Lu/Lr-in-group-3 is not used |
| “Lanthanide” label vs `lanthanoid` key | IUPAC prefers lanthanoid; label is fine for general audiences |
| Group display `"f"` for null group | UI shorthand, not an IUPAC group number (`main.js` detail panel) |
| Spiral / decorative nucleus | Artistic; About dialog already says scale is interpretive |

---

## Relationship model by view

| View | Scientific relationship encoding | Accuracy |
|------|----------------------------------|----------|
| **Table** | Standard groups/periods + f-rows | Good layout; **block labels wrong** |
| **Spiral** | Atomic number sequence | Good as Z-ordered path; not periodic families |
| **Shells** | Period as ring | Period metaphor only |
| **Sphere** | Period → latitude, column → longitude, group tubes, f-series tubes | **Broken for f/main collisions**; group 3 incomplete; H–alkali over-linked; copy overclaims Z-order on rings |

---

## Severity checklist

1. **Critical** — Block assignment broken for most of the table (80 s / 1 d / 0 f).  
2. **Critical** — Sphere `(period, tableColumn)` collisions: 28 pairs stacked (Ce–Hf … Lr–Ts).  
3. **High** — Sphere instructional copy does not match geometry.  
4. **High** — Lr placement vs category vs block vs f-series exclusion inconsistent.  
5. **High** — Group 3 family connector only Sc–Y.  
6. **Medium** — Superheavy / edge classifications treated as settled; `unknown` unused.  
7. **Medium** — H–alkali family and He–noble-gas messaging oversimplify.  
8. **Medium** — Upstream data age and contested categories (Po, group 12, etc.).  
9. **Low** — Shells/spiral are metaphors; physics formulas panel not period-specific.

---

## Suggested fix directions (not implemented)

These are recommendations only; this audit did not change application code.

1. **Block:** Prefer IUPAC/block tables or “highest-ℓ occupied subshell” / period-row rules, not the last token in the config string. Special-case He, and handle La/Ac/Lu/Lr deliberately.  
2. **Sphere positions:** Include `tableRow` (or a dedicated radial offset / secondary latitude band) so f-block does not share coordinates with main d/p elements of the same period.  
3. **Copy:** Align relationship-panel text with actual geometry (column order on rings; family tubes exclude f-rows).  
4. **Lr:** Align category (actinoid vs group-3 d-block) with placement and f-series membership; document the convention.  
5. **Group 3:** Decide La vs Lu convention and wire family connectors + empty main-table cell consistently.  
6. **Unknown chemistry:** Route short-lived superheavies (and optional group-12 edge cases) to the existing “Predicted chemistry” category where appropriate.  
7. **Data:** Consider a maintained dataset for masses and categories if educational precision is a goal.

---

## Verification notes

- Shell sum vs atomic number: **0 mismatches** (all 118).  
- Element count and uniqueness: **118** unique symbols, Z-ordered.  
- Category key `unknown`: **0** elements.  
- Block-s with Z ≥ 57 and category lanthanoid/actinoid: **29** (La–Lu, Ac–No).  
- Full automated unit suite was not re-run as part of this documentation pass; existing tests in `test/elements.test.js` assert shell conservation and layout landmarks but **do not** assert correct block distribution or unique sphere coordinates.

---

## Related project files

| Path | Role |
|------|------|
| `src/elements.js` | Categories, layout, block, shells, descriptions |
| `src/main.js` | 3D layouts, relationship sphere, UI binding |
| `index.html` | Relationship panel, about dialog, property grid |
| `test/elements.test.js` | Element metadata and shell conservation tests |
| `test/interface.test.js` | View switcher and relationship copy smoke tests |
| `node_modules/periodic-table/data.json` | Upstream element property source |
