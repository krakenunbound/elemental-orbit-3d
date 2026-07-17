# Changelog — Elemental Orbit (3D Periodic Table)

An interactive three.js visualization of all 118 elements in four views: Spiral (helix), Table, Shells, and Sphere. This changelog records the project's evolution during the 2026-07-17 working sessions, newest phase first.

Project goals: **1. scientific accuracy · 2. style and beauty.** Original inspiration: an AI-generated "3D periodic spiral" image (analyzed in [SCIENTIFIC_REVIEW.md](SCIENTIFIC_REVIEW.md), Part 1 — good style brief, unreliable chemistry).

---

## 1.1.0 — 2026-07-17 — Representative atomic models

- Replaced the decorative central core with a selected-element atom model while retaining the original core as the unselected state.
- Added color-coded proton, neutron, and electron counts for a neutral representative isotope of every element.
- Added animated shell-population and qualitative orbital-family cloud modes with explicit scientific limitations.
- Added independent mouse-drag rotation for the selected atom and selection-focused dimming of the surrounding atlas.
- Added pinned NIST/IUPAC isotope provenance and regression tests covering all 118 representative nuclides and orbital electron totals.
- Positioned the selected atom below the standard Table view so it never obscures element cards.
- Kept the selected atom visible through the Sphere depth mask and foreground card crossings in both Shell and Cloud modes.
- Raised non-selected card opacity to preserve legibility while maintaining clear selection emphasis.
- Removed the nested `npm.cmd` process from the Windows launcher so Ctrl+C no longer produces duplicate batch-termination prompts.
- Expanded the automated suite to 28 scientific, geometric, interaction, launcher, and production assertions.

---

## Phase 10 — Standalone open-source release

### Added
- Procedural Atomic Cosmos environment: three star-depth layers, luminous elemental dust, a restrained animated nebula shader, and orbital silhouettes.
- Deterministic particle placement, compact-display particle budgets, and reduced-motion safeguards.
- Standalone root-path build configuration with optional `BASE_PATH` support for subpath hosting.
- GitHub-ready README, MIT license, contribution and security guidance, issue/PR templates, CI, and GitHub Pages deployment.
- Four real application screenshots covering Spiral, Table, Shells, and Sphere.

### Fixed
- Auto-rotation resumes five seconds after clicks and drags end; passive pointer movement no longer restarts the timer.
- Production stylesheet handling remains same-origin and compatible with static hosting.

### Tests / verification
- The suite now contains 22 scientific, geometric, interaction, environment, and production-build assertions.
- Both root-path and GitHub Pages subpath builds are part of release verification.

---

## Phase 8 — Release data refresh

### Changed
- Replaced the legacy `periodic-table@0.0.8` display masses with a pinned, local 118-element reference map.
- Naturally occurring elements now use CIAAW 2024 abridged standard atomic weights, including the 2024 zirconium revision.
- Elements without standard atomic weights use the bracketed longest-lived-nuclide mass numbers from IUPAC's current Periodic Table release.
- Corrected legacy radioactive entries including Tc `[98]` → `[97]`, Sg `[271]` → `[269]`, Rg `[280]` → `[282]`, Nh `[284]` → `[286]`, Fl `[289]` → `[290]`, and Mc `[288]` → `[290]`.
- The About panel now identifies both scientific sources and their conventions.

### Tests / verification
- The source table must contain exactly 118 entries, every rendered element must resolve to its pinned value, and representative current/revised values are asserted explicitly.

---

## Phase 7 — Group-3 consistency pass

**Source:** Follow-up findings in `SCIENTIFIC_REAUDIT.md`.

### Fixed
- La and Ac now keep the true group-3 angle in both Spiral and Sphere, aligning with Sc and Y. Only ungrouped f-series members receive the half-slot stagger that prevents false d/p-block family alignments.
- La/Ac generated descriptions now identify them as d-block heads of their respective inner-transition series instead of contradicting their d-block card labels.
- The About panel explicitly discloses the traditional La/Ac group-3 convention and the resulting Lu/Lr f-series placement.

### Tests / verification
- Regression coverage now asserts the shared Sc–Y–La–Ac rail and meridian, continued staggering for ungrouped f-series elements, accurate La/Ac prose, and visible convention disclosure.

---

## Phase 6 — Cylindrical helix & pulsing atomic wire

**Request:** "A spiral should be like a helix, so it can all be seen including relationships" + "replace the basic jagged joining lines with a solid wire that pulses."

### Changed
- **Spiral view is now a true cylindrical helix** (`src/layouts.js`): every period winds one full turn on a single constant-radius cylinder (r = 6.6, pitch 1.55), replacing the cone whose lower turns grew wider. Family rails are now perfectly straight, evenly spaced vertical lines — and the form matches de Chancourtois' 1862 *telluric screw* (wound on a cylinder), the first periodic system in history.
- Spiral camera moved to a side-on vantage (y = 4) with width-adaptive distance (25 / 31 / 42 for desktop / narrow / mobile).
- About dialog and intro copy updated: "descending helix," wire/pulse explanation.

### Added
- **Pulsing wire** (`src/main.js`): the old 1-px jagged `THREE.Line` through 118 card positions is replaced by a smooth solid tube — a centripetal Catmull-Rom curve swept through 960 segments — with a custom shader: dim teal base, bright mint pulse head with comet tail traveling the hydrogen → oganesson path in ~20 s, animating atomic-number order.
  - Tube rebuilds per layout (spiral / table / shells); table view runs at reduced intensity.
  - Wire fades out during layout morphs and fades back in when cards settle.
  - `prefers-reduced-motion` freezes the pulse to a static wire.

### Tests / verification
- Geometry test replaced: asserts constant main-coil radius, constant (smaller) f-track radius, strict descent per row, > 9 depth span, H at apex. **17/17 passing.**
- Live pixel verification: alkali rail Li→Fr projects to a single vertical pixel column with uniform period spacing; wire present along all 117 sampled path segments; pulse peak measurably traveled forward (segment 16 → 35 over 2.5 s).

---

## Phase 5 — F-series half-slot stagger (visibility + honesty)

**Request:** "The inner track is covered by the outer track instead of being offset for visibility."

### Fixed
- F-series cards shared the main coil's 18 angular column slots, so every inner-track card hid directly behind a main-track card (Eu behind Ir, Sm behind Os…). The f-track is now **staggered half a column slot** in both the Spiral and Sphere views, threading through the gaps between main rails.

### Why it also improves accuracy
- The f-block's column indices are a layout artifact, not group membership — Ce sharing a ray with Hf falsely implied a group-4 kinship. The stagger removes 28 such false alignments while preserving the belts' one genuine angular relationship: lanthanide/actinide congener pairs (Ce/Th, Pr/Pa, Nd/U…) still share rays exactly, because both rows shift identically.

### Tests / verification
- New regression test: no f-series card shares a ray/longitude with any main-table card; congener pairs stay locked. Live measurement: formerly-eclipsed front-zone pairs now 66–122 px apart (~1.5–3 card widths); remaining edge-of-silhouette shingling matches what all cards do at the limb and resolves with rotation.

---

## Phase 4 — Selection no longer blocks hover

**Request:** "If I select a card it shuts me down from mouse-over on others unless I close the card first."

### Fixed
- The hover raycast in the animation loop was gated with `!selectedSprite`, disabling all hover while the detail panel was open. Gate removed: hover and click-to-reselect now stay live with a panel open, so you can surf card-to-card continuously. Hovering the already-open card is suppressed (no redundant tooltip).

### Tests / verification
- Regression test guards against the gate returning. Verified by driving real pointer events in the browser: select Potassium → hover another card (tooltip appears) → click (panel re-targets without closing) → hover Hydrogen (tooltip again).

---

## Phase 3.5 — Conical helix spiral *(superseded by Phase 6)*

**Request:** "Spiral and Shells are essentially the same thing. Originally spiral was a deep cone shape."

- After the accuracy pass flattened the spiral into period rings, it duplicated the Shells view. Rebuilt as a deep conical helix: one turn per period descending ~1.55/turn and widening per turn, f-series as inset under-slung loops, spiral-specific camera with width-adaptive distance, telluric-screw copy added.
- Established that depth is a free axis: accuracy constrains only the angle (one turn per period), so the "deep" shape and family alignment coexist.
- Verified live: family rails aligned to a single pixel column; edge cards initially cropped at narrow viewports → fixed with adaptive camera distance.
- Phase 6 later replaced the cone with a constant-radius cylinder (straighter rails, uniform turns, closer to the historical telluric screw).

---

## Phase 3 — Sphere occlusion fix (buried f-series cards)

**Request:** screenshot showed lanthanide/actinide cards sliced to slivers inside the Sphere view.

### Fixed
- Root cause: the accuracy pass placed f-belts at radius 7.72, *inside* the sphere's invisible depth-mask occluder (radius 7.82) that hides far-side cards — the mask swallowed the belts, and the pink f-ribbons (7.72 × 1.012 ≈ 7.81) grazed it and rendered as chopped chunks.
- F-belts moved onto the main 8.3 card shell. Distinctness preserved via latitude offset, ribbon color, and a slightly smaller f-card scale (0.78 vs 0.84) as the "inserted series" cue. Partial insets (e.g., 8.06) were ray-checked and rejected — card edges still got shaved near the view axis.
- Mask and shell radii are now shared, named constants (`OCCLUSION_SPHERE_RADIUS`, `RELATIONSHIP_SHELL_RADIUS`) exported from `src/layouts.js` so they cannot silently drift apart.

### Added
- Per-layout camera helper (`applyLayoutCamera`) deduplicating setLayout / reset / resize logic; layout camera now also applied on first load.
- `.claude/launch.json` dev-server launch config.

### Tests / verification
- New regression test: all 118 sphere positions clear the occlusion mask by ≥ 0.4 (would have caught the 7.72 regression). Live pixel verification: 14 front-facing f-cards render with full card signatures matching main-card controls; far-side control card correctly occluded.

---

## Phase 2 — Scientific accuracy overhaul *(companion fix session)*

Implemented the priority list from the audits below. Summarized from that session's self-audit and the resulting code.

### Fixed
- **Orbital blocks** now derive from table position (correct 14 s / 36 p / 40 d / 28 f partition; He special-cased; La/Ac treated as d-block) — previously 80/37/1/0 with every lanthanide labeled "S BLOCK."
- **Sphere coordinate collisions eliminated** (formerly 28 stacked pairs — Ce+Hf … Lr+Ts): f-series moved to offset belts; all 118 positions unique.
- **Meridians**: 18 geometrically distinct pole-to-pole group arcs (formerly full great circles collapsing into 9, each fusing two unrelated groups).
- **Spiral**: rebuilt as one-turn-per-period so recurring families share rays (formerly a constant-winding Z-number line with no periodicity).
- **Lawrencium** aligned as actinoid (was: transition-metal category, p-block label, excluded from the actinide ribbon while sitting on the actinide row).
- **Superheavies Z ≥ 109** routed to the existing "Predicted chemistry" category (was firm categories with unknown bulk chemistry); At/Cn/Fl/Og standard states shown as unknown; Po reclassified post-transition metal.
- **Radioactive masses** display bracket notation ([98], [226], [294]) instead of false-precision integers.
- **Interface copy** scientifically qualified (Shells labeled a structural metaphor, not a Bohr model; trend panel's non-periodic formulas E = hν / E = mc² replaced with ionization energy and electronegativity trends; sphere reading guide matches actual geometry).
- New `src/layouts.js` module isolating layout math; test suite expanded to cover block partition, position uniqueness, arc distinctness, family rays, bracket notation, and copy claims.

### Known residuals (accepted)
- ~~Upstream `periodic-table@0.0.8` masses are ~2005-vintage CIAAW values.~~ Resolved by Phase 8's pinned CIAAW 2024 / IUPAC reference table.
- Group 12 as "transition metal" retained as a defensible boundary convention.
- Vite emits a non-blocking 609 KB bundle-size warning.

---

## Phase 1 — Scientific accuracy audits (read-only, docs only)

- **`SCIENTIFIC_AUDIT.md`** — first audit: identified the broken block derivation (last-token parsing), the 28 sphere collisions, Lr inconsistency, group-3 connector gaps, unused "unknown" category, data-vintage issues.
- **`SCIENTIFIC_REVIEW.md`** — independent verification of every audit claim (all confirmed empirically via Node import of the derived data), plus:
  - Analysis of the inspiration image: obsolete Uun/Uuq/Uuo symbols (renamed 2003–2016), wrong legend period arithmetic, missing elements — but two genuinely correct motifs worth keeping (radial family wedges; lanthanide/actinide congener pairs).
  - New findings: meridian great-circle collapse (18 → 9), spiral's lack of periodicity (constant ~11.9 elements/turn), Pd as the period-≠-shell-count counterexample, "4 orbital blocks" stat contradicted by derived data, missing bracket convention.
  - Fix-priority list ordered by scientific payoff per unit of visual disruption (became Phase 2's worklist).

### Verified-solid baseline (unchanged throughout)
- 118 elements, unique, Z-ordered; electron configurations correct including all Aufbau exceptions (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, Pt, Au, La, Ce, Gd, Th, Pa, U, Lr); shell populations sum to Z for all 118; electronegativities match Pauling values; Br/Hg the only liquids; all 25 curated element facts accurate.

---

## Test suite growth

| Milestone | Tests |
|---|---:|
| Post-accuracy overhaul (Phase 2) | 13 |
| + occlusion-mask guard (Phase 3) | 14 |
| + cone/helix geometry (Phase 3.5→6) | 15 |
| + hover-while-selected guard (Phase 4) | 16 |
| + f-stagger guard (Phase 5) | 17 |

All 22 passing as of the standalone release (`npm test`); production build green (`npm run build`).
