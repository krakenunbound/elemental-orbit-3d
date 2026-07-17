# Scientific Accuracy Review — Elemental Orbit (3D Periodic Table)

**Date:** 2026-07-17
**Scope:** Read-only analysis of (1) the inspiration image and (2) the scientific accuracy of the periodic table and element-to-element relationships as depicted in the app's four 3D presentations (Spiral, Table, Shells, Sphere).
**Method:** Source review of `src/elements.js`, `src/main.js`, `index.html`, plus empirical verification — the app's derived element data was imported directly in Node and checked against reference chemistry (element inventory, block distribution, sphere coordinate collisions, electron configurations, shell sums, masses, electronegativities).
**Changes made:** None. Documentation only.
**Relationship to prior audit:** A previous pass produced `SCIENTIFIC_AUDIT.md`. All of its major claims were independently re-verified here and **confirmed**. This review adds an analysis of the inspiration image and several findings the prior audit missed (see "New findings").

---

## Executive summary

| Question | Verdict |
|---|---|
| Is the element data trustworthy? | Mostly yes — 118 elements, correct Z order, correct electron configurations (including Aufbau exceptions), correct shell populations. Masses are ~2005-vintage IUPAC. |
| Is the Table view accurate? | Yes in layout; **block labels on cards/panel are systematically wrong** (only 1 of 118 elements gets a d-block label, none get f). |
| Does the Spiral view encode periodicity? | **No.** It encodes atomic-number order only. Unlike the classic Benfey-style spiral (and unlike the inspiration image's own core idea), same-family elements do not align radially. |
| Does the Sphere view encode relationships correctly? | Partially. Period latitudes and family arcs are sound in concept, but **28 element pairs occupy literally identical coordinates**, and the 18 "group meridians" actually render as 9 great circles that each connect two unrelated groups. |
| Is the inspiration image scientifically reliable? | No. It is a style reference, not a data reference. Its one strong scientific idea — families aligned radially, periods as rings — is worth keeping; nearly everything else about it is wrong or outdated. |

---

## Part 1 — The inspiration image

The attached image depicts a Benfey-style spiral: period 1 at the center, later periods radiating outward, with a coiling band carrying the f-block. As inspiration for *style*, it is effective. As chemistry, it should not be trusted:

### What the image gets right (worth preserving)

- **Radial family alignment.** Vertical-group families visibly cluster in wedges: W next to Sg (group 6), Ta with Db (group 5), Zr–Hf–Rf (group 4), Mn/Tc/Re/Bh (group 7), Cu–Ag with Cd–Hg (groups 11–12), Fr–Cs–K on a shared side (group 1). This is the essential insight of every good spiral periodic table: *one turn per period makes chemical families line up along rays from the center.*
- **f-block column pairs.** The coiling band pairs lanthanides with their actinide congeners — Ce/Th, Pr/Pa, Nd/U, Am/Eu, Cm/Gd, Bk/Tb, Cf/Dy, Es/Ho are all genuine same-column f-block pairs. Whoever/whatever produced the image encoded a real relationship there.
- **Radial Z-progression.** Lighter elements sit nearer the center; heavier ones sit farther out, broadly.

### What the image gets wrong (do not inherit)

1. **Obsolete element symbols.** `Uun`, `Uuq`, and `Uuo` are pre-naming IUPAC placeholders: Uun became **darmstadtium (Ds)** in 2003, Uuq became **flerovium (Fl)** in 2012, Uuo became **oganesson (Og)** in 2016. The naming vintage is roughly 1997–2003; the modern names for elements 110, 113–118 (Ds, Rg? partially, Nh, Fl, Mc, Lv, Ts, Og) are absent.
2. **The legend's period arithmetic is wrong.**
   - "Center (Periods 1–2): H to He" — H and He are both **period 1**. Period 2 is Li–Ne.
   - "Middle Rings (Periods 5–6): Transition metals" — transition metals begin in **period 4** (Sc, Z = 21).
   - "Outer Rings (Period 7 **and beyond**)" — there are no confirmed elements beyond period 7.
3. **Ring membership contradicts the legend.** Xe (period 5) and Rn (period 6) sit in the outermost band alongside element 118; period-2 elements (B, C, N, O, F, Ne) fill rings the legend assigns to periods 3–4.
4. **Incomplete and duplicated inventory.** Only ~90 symbols are distinguishable; several elements appear to be missing entirely, and the placeholder `Uun` appears to be rendered more than once. Exact inventory is ambiguous — a hallmark of generated art rather than a data-driven diagram.
5. **Local scrambling.** Within rings, many adjacencies follow neither atomic number nor group (e.g., K adjacent to Ni/Pd territory; noble gases scattered across non-adjacent bands).

**Takeaway:** treat the image as a *composition and palette brief*. The app already does this correctly — it draws element data from a real dataset. But note the irony recorded in Part 3: the image's one real scientific idea (families on rays, periods on rings) is the thing the app's Spiral view currently does *not* implement.

---

## Part 2 — Data foundation (verified)

Source: `periodic-table@0.0.8` npm package, transformed in `src/elements.js`.

### Verified correct

| Check | Result |
|---|---|
| Element inventory | 118 unique symbols, atomic numbers 1–118 in order, H → Og |
| Electron configurations | Spot-checked 17 elements including every classic Aufbau exception — Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au, La, Ce, Gd, Th, Pa, U, Lr — **all match accepted ground states** |
| Shell populations | Derived shell sums equal Z for **all 118** elements (0 mismatches) |
| Electronegativities | Match Pauling reference values (F 3.98, O 3.44, Cl 3.16, N 3.04, Cs 0.79, Fr 0.7) |
| Standard states | Br and Hg correctly the only liquids; Cn/Fl/Og correctly blank (panel shows "Unknown") |
| Table landmarks | H 1/1, He 1/18, C 2/14, Fe 4/8, Og 7/18 all correct |
| Curated element facts | All 25 hand-written facts in `elements.js` check out (H cosmic abundance, Br/Hg liquid pair, Ag conductivity, Au relativistic color, U-235 fissility, Xe fluorides, etc.) |

### Data-quality caveats

- **Masses are ~2005-vintage.** The package carries older CIAAW standard atomic weights with uncertainty digits: H `1.00794(4)`, C `12.0107(8)`, Li `6.941(2)`. Current IUPAC abridged values are 1.008, 12.011, **6.94** (lithium was revised notably). Not *wrong* for a teaching app, but not current.
- **Radioactive masses display as bare integers.** `cleanMass()` strips parentheses, so Tc shows "98", Ra "226", Og "294". Convention is brackets — [98], [226], [294] — to signal "mass number of the most stable isotope," not a measured atomic weight. As displayed, they imply false precision.
- **Contested categories presented as settled.** Po as "metalloid" (most modern sources: post-transition metal); At as a solid halogen (bulk properties unknown); group 12 (Zn/Cd/Hg/Cn) as transition metals (IUPAC treats this as a boundary case); superheavies Mt→Og given firm chemical categories although their bulk chemistry is unmeasured. The legend's "Predicted chemistry" category exists for exactly this purpose and is used by **zero** elements.
- **The Ts override.** `normalizeCategory()` promotes tennessine from the package's "post-transition metal" to "halogen." Group-17 placement is standard, but predicted relativistic chemistry suggests Ts is *less* halogen-like, and the halogen prose ("reactive salt-forming nonmetal") overstates what is known. "Predicted chemistry" would be the more honest bucket.

---

## Part 3 — The four 3D presentations

### 3.1 Spiral view — accurate as a sequence, silent on periodicity

`spiralPosition()` advances a fixed **0.53 rad per element** (≈ 11.9 elements per turn) with steadily growing radius. This is verified against the code.

- **What it encodes correctly:** atomic-number order, H at the center → Og at the rim. As a "continuous journey through Z" it is truthful, and the About dialog frames it that way.
- **What it does not encode:** periodicity. Real periods contain 2, 8, 8, 18, 18, 32, 32 elements, so a constant-angle spiral can never bring same-group elements into radial alignment. Na does not sit above Li; F does not sit above Cl. Any apparent family alignment is coincidence.
- **Why this matters for this project:** radial family alignment is precisely the scientific idea the inspiration image gestures at (Part 1), and it is the classic solution (Benfey 1964, and the many "periodic spiral" designs since): *vary the winding so each period completes one turn*. The current spiral is beautiful but scientifically inert — it shows a number line, coiled.

### 3.2 Table view — correct layout, wrong block labels

- The 18-column layout, group/period assignments, and the La-under-group-3 with separated f-rows convention are all standard and implemented correctly.
- **Block labels are systematically wrong** (critical, confirmed empirically). `orbitalBlock()` reads the *last* orbital token of the configuration string, but configurations conventionally end with the outermost *n*s/np shell, not the differentiating subshell. Measured result across the derived data:

  | Block | App shows | Reality |
  |---|---:|---:|
  | s | **80** | 14 |
  | p | 37 | 36 |
  | d | **1** (Pd only) | 40 |
  | f | **0** | 28 |

  **67 of 118 elements** display a block that contradicts their own table position. Every lanthanide card reads "S BLOCK" while the category prose calls the same element "a rare-earth **f-block** metal" — a self-contradiction visible on a single card. Fe, W, Au: "S BLOCK." Lr: "P BLOCK." The intro panel's stat "4 orbital blocks" is likewise contradicted by the app's own derived data, which effectively contains three.
- The depth offsets in `tablePosition()` (cards displaced in Z by block) inherit the same wrong data, so the 3D "block layering" of the table view is also mostly wrong.

### 3.3 Shells view — a period metaphor labeled as shell physics

Elements are ringed by **period**, not by occupied electron shells. For most elements those coincide, but not for all: Pd ([Kr] 4d¹⁰) has **4** occupied shells yet sits on ring 5. The UI language ("Shells emphasizes electron-shell growth"; sphere panel: "Electron shells orbit as latitudes") equates period with shell count without caveat. Acceptable as a metaphor; mislabeled as physics.

### 3.4 Sphere ("Relations") view — the right ambition, three geometric defects

Concept: period → latitude band, table column → longitude, family arcs and f-series ribbons as connectors. The concept is a legitimate relationship encoding. Three defects undermine it:

1. **28 element pairs occupy literally identical coordinates** (critical, confirmed by computation). `relationshipPosition()` uses only `(period, tableColumn)`, and the f-block rows reuse the same period and column range as the d/p elements of their own period. Every pair below shares one point in space:
   - Period 6: Ce+Hf, Pr+Ta, Nd+W, Pm+Re, Sm+Os, Eu+Ir, Gd+Pt, Tb+Au, Dy+Hg, Ho+Tl, Er+Pb, Tm+Bi, Yb+Po, Lu+At
   - Period 7: Th+Rf, Pa+Db, U+Sg, Np+Bh, Pu+Hs, Am+Mt, Cm+Ds, Bk+Rg, Cf+Cn, Es+Nh, Fm+Fl, Md+Mc, No+Lv, Lr+Ts
   56 elements — nearly half the table — are pairwise unreadable in this view, and the pairings themselves (e.g., U stacked on Sg) depict no real chemical relationship.
2. **The "18 group meridians" are actually 9 circles, each fusing two unrelated groups** *(new finding)*. Each meridian is a full great circle through the poles. A great circle at longitude θ is the same circle as the one at θ + 180°, so the torus drawn for column *c* coincides exactly with the torus for column *c + 9*: 18 meridians collapse to 9 rendered circles, each drawn twice in overlapping alternating colors. Visually, the alkali-metal meridian *is* the nickel-group meridian; group 2 fuses with group 11, and so on. The panel's claim "18 group meridians — chemical families connect pole to pole" is doubly off: the visible circles number 9, and each one links two families that share no chemistry.
3. **Family connectors are incomplete where the table is hardest.** The tube filter (`group === n && tableRow < 7`) yields group 3 = **Sc, Y only** — La/Ac carry `group 3` but live on f-rows and are excluded, and Lu/Lr have no group at all. Meanwhile the group 1 tube includes **H**, welding hydrogen to the alkali metals; shared ns¹ configuration, yes — shared chemistry, no. The f-series ribbons exclude **Lr** (categorized "transition metal" by the source data), so the actinide ribbon silently ends at No.

The instructional copy compounds this: "Follow a ring for atomic-number progression" is true for periods 1–5 (column order is Z order there) but false for periods 6–7, where the ring interleaves stacked f/d pairs out of Z order.

### Lawrencium, in summary *(cross-view inconsistency)*

Lr is simultaneously: placed on the actinide row, colored as a transition metal, labeled p-block, given no group (panel shows "f"), and excluded from the actinide ribbon. Any single convention (IUPAC 2021 provisional group-3 = Lu/Lr, or the traditional La/Ac layout the app uses) would be defensible; the app currently holds all positions at once.

---

## Part 4 — New findings vs. the prior audit

`SCIENTIFIC_AUDIT.md` (earlier pass) — all major claims **independently confirmed**: block distribution (80/37/1/0), the exact 28 sphere collisions, Lr inconsistency, group-3 tube = Sc–Y, zero shell-sum errors, unused "unknown" category, data vintage.

Added by this review:

1. **Meridian collapse:** 18 group meridians render as 9 great circles, each fusing group *n* with group *n + 9* (Part 3.4.2).
2. **Spiral encodes no periodicity:** constant 0.53 rad/element ≈ 11.9 elements/turn cannot align families; the inspiration image's core scientific idea is absent from the flagship view (Part 3.1).
3. **"Follow a ring for atomic-number progression"** is accurate for periods 1–5 and false only for 6–7 — a refinement of the prior audit's blanket "false."
4. **Pd shells-view placement:** period ≠ occupied-shell-count; Pd is the concrete counterexample to the Shells view's labeling (Part 3.3).
5. **"4 orbital blocks" intro stat** contradicted by the app's own derived data (Part 3.2).
6. **Bracket convention for radioactive masses:** "98"/"226"/"294" shown as if they were standard atomic weights (Part 2).
7. **Inspiration-image analysis** (Part 1) — obsolete Uun/Uuq/Uuo naming, wrong legend arithmetic, and identification of its two genuinely correct motifs (radial families, lanthanide/actinide column pairs) worth carrying forward.

---

## Part 5 — Priorities if/when fixes are authorized (not implemented)

Ordered by scientific payoff per unit of visual disruption, honoring both project goals (accuracy *and* beauty):

1. **Fix `orbitalBlock()`** — derive block from table position or a lookup (s: groups 1–2 + He; p: 13–18; d: 3–12; f: f-rows; He special-cased). One function; corrects 67 elements' cards, the detail panel, the table-view depth layering, and the "4 blocks" stat all at once.
2. **De-collide the Sphere** — give f-rows their own latitude sub-band or radial shell so 56 elements become visible; visually this *adds* structure (a distinct f-belt could be gorgeous).
3. **Re-space the meridians or use half-arcs** — either 9 honest great circles labeled as column pairs is abandoned for pole-to-pole *half* arcs per group (18 truly distinct), or meridians are dropped in favor of the (already correct) family tubes.
4. **Make the Spiral periodic** — one turn per period (variable winding rate). This single change would make the flagship view scientifically meaningful and realize the inspiration image's central idea: families along rays, periods as rings.
5. **Resolve Lr/La/Lu/Ac group-3 policy** once, and apply it to category, ribbon membership, family tubes, and the group readout.
6. **Route unmeasured superheavies (Mt–Og, and arguably Ts) to "Predicted chemistry"** — the category and its honest prose already exist, unused.
7. **Copy edits** — soften "shells = latitudes/rings," scope the Z-progression claim to periods 1–5, and clarify H's membership in the group-1 tube as configuration-only.
8. **Data refresh (optional)** — current CIAAW masses and bracket notation for radioactives if educational precision becomes a stated goal.

---

## Appendix — Verification notes

- Derived data was imported directly from `src/elements.js` in Node v25 (read-only; no project files executed with side effects).
- Element count/uniqueness/Z-order: 118/118/true.
- Block distribution: `{s: 80, p: 37, d: 1}`; f: none; position-based comparison flags 67 mismatches.
- Sphere `(period, tableColumn)` collisions: exactly 28 pairs, listed in Part 3.4.
- Shell sums: 0 mismatches across 118 elements.
- Family tube membership (as filtered in `createRelationshipSphere()`): G1 = H,Li,Na,K,Rb,Cs,Fr · G2 = Be…Ra · G3 = **Sc,Y** · G17 = F…At,Ts · G18 = He…Rn,Og.
- Meridian coincidence: `TorusGeometry` rings lie in a plane containing the y-axis; `rotation.y = θ` and `θ + π` produce the identical circle — columns *c* and *c + 9* coincide for all 9 pairs.
- Existing tests (`test/elements.test.js`, `test/interface.test.js`) assert element inventory, shell conservation, layout landmarks, and UI copy — they do **not** currently assert block correctness, sphere coordinate uniqueness, or meridian distinctness, which is why all confirmed defects pass CI.
