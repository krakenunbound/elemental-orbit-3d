import test from "node:test";
import assert from "node:assert/strict";
import { elements, getElement, CATEGORY_META } from "../src/elements.js";
import { ATOMIC_MASS_DISPLAY, ATOMIC_MASS_SOURCE } from "../src/atomic-masses.js";

test("contains every recognized element exactly once in atomic-number order", () => {
  assert.equal(elements.length, 118);
  assert.equal(new Set(elements.map((element) => element.symbol)).size, 118);
  elements.forEach((element, index) => assert.equal(element.atomicNumber, index + 1));
  assert.deepEqual([elements[0].symbol, elements.at(-1).symbol], ["H", "Og"]);
});

test("all elements have renderable scientific and layout metadata", () => {
  for (const element of elements) {
    assert.ok(element.name);
    assert.ok(element.atomicMass);
    assert.ok(element.electronicConfiguration);
    assert.ok(element.electronDisplay);
    assert.ok(element.orbitals.length > 0);
    assert.ok(element.description.length > 25, element.symbol + " needs useful prose");
    assert.ok(CATEGORY_META[element.category], element.symbol + " has an invalid category");
    assert.ok(element.period >= 1 && element.period <= 7);
    assert.ok(element.tableRow >= 0 && element.tableRow <= 8);
    assert.ok(element.tableColumn >= 0 && element.tableColumn <= 17);
    assert.ok(["s", "p", "d", "f"].includes(element.block));
  }
});

test("electron shell populations conserve atomic number", () => {
  for (const element of elements) {
    const electronCount = element.shells.reduce((sum, count) => sum + count, 0);
    assert.equal(electronCount, element.atomicNumber, element.symbol + " electron configuration");
  }
});

test("expanded orbital occupancies conserve atomic number", () => {
  for (const element of elements) {
    const electronCount = element.orbitals.reduce((sum, orbital) => sum + orbital.electrons, 0);
    assert.equal(electronCount, element.atomicNumber, element.symbol + " orbital configuration");
    for (const orbital of element.orbitals) assert.match(orbital.type, /^[spdf]$/);
  }
});

test("standard table landmarks map to the correct groups and periods", () => {
  assert.deepEqual([getElement("H").period, getElement("H").group], [1, 1]);
  assert.deepEqual([getElement("He").period, getElement("He").group], [1, 18]);
  assert.deepEqual([getElement("C").period, getElement("C").group], [2, 14]);
  assert.deepEqual([getElement("Fe").period, getElement("Fe").group], [4, 8]);
  assert.deepEqual([getElement("Og").period, getElement("Og").group], [7, 18]);
  assert.equal(getElement("U").tableRow, 8);
  assert.equal(getElement("Lr").category, "actinoid");
  assert.equal(getElement("Po").category, "post-transition metal");
});

test("orbital blocks follow the standard 14/36/40/28 partition", () => {
  const counts = Object.fromEntries(["s", "p", "d", "f"].map((block) => [
    block,
    elements.filter((element) => element.block === block).length,
  ]));

  assert.deepEqual(counts, { s: 14, p: 36, d: 40, f: 28 });
  assert.equal(getElement("He").block, "s");
  assert.equal(getElement("Fe").block, "d");
  assert.equal(getElement("La").block, "d");
  assert.equal(getElement("Ce").block, "f");
  assert.equal(getElement("Ac").block, "d");
  assert.equal(getElement("Lr").block, "f");
});

test("La and Ac prose matches the selected d-block group-3 convention", () => {
  for (const symbol of ["La", "Ac"]) {
    assert.match(getElement(symbol).description, /d-block metal/);
    assert.doesNotMatch(getElement(symbol).description, /f-block metal/);
  }
});

test("uncertain and radioactive values are presented without false precision", () => {
  for (const symbol of ["Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]) {
    assert.equal(getElement(symbol).category, "unknown", symbol);
  }
  assert.equal(getElement("At").standardState, "unknown");
  assert.equal(getElement("Tc").atomicMass, "[97]");
  assert.equal(getElement("Ra").atomicMass, "[226]");
  assert.equal(getElement("Og").atomicMass, "[294]");
});

test("all displayed masses come from the pinned current reference table", () => {
  assert.equal(Object.keys(ATOMIC_MASS_DISPLAY).length, 118);
  assert.equal(ATOMIC_MASS_SOURCE.standardWeights, "CIAAW Abridged Standard Atomic Weights 2024");
  assert.equal(ATOMIC_MASS_SOURCE.standardWeightsUrl, "https://ciaaw.org/abridged-atomic-weights.htm");
  assert.match(ATOMIC_MASS_SOURCE.radioactiveMassNumbers, /IUPAC Periodic Table/);
  assert.match(ATOMIC_MASS_SOURCE.radioactiveMassNumbersUrl, /^https:\/\/iupac\.org\//);
  for (const element of elements) {
    assert.equal(element.atomicMass, ATOMIC_MASS_DISPLAY[element.symbol], element.symbol);
  }

  assert.equal(getElement("H").atomicMass, "1.0080");
  assert.equal(getElement("Li").atomicMass, "6.94");
  assert.equal(getElement("C").atomicMass, "12.011");
  assert.equal(getElement("Zr").atomicMass, "91.222");
  assert.equal(getElement("Rg").atomicMass, "[282]");
  assert.equal(getElement("Fl").atomicMass, "[290]");
});
