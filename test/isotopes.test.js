import test from "node:test";
import assert from "node:assert/strict";
import { elements, getElement } from "../src/elements.js";
import {
  REPRESENTATIVE_ISOTOPE_MASS,
  REPRESENTATIVE_ISOTOPE_SOURCE,
  representativeIsotope,
} from "../src/isotopes.js";

test("defines one physically valid representative isotope for every element", () => {
  assert.equal(Object.keys(REPRESENTATIVE_ISOTOPE_MASS).length, 118);
  for (const element of elements) {
    const isotope = representativeIsotope(element);
    assert.equal(isotope.protons, element.atomicNumber);
    assert.equal(isotope.electrons, element.atomicNumber);
    assert.ok(Number.isInteger(isotope.neutrons) && isotope.neutrons >= 0, element.symbol);
    assert.equal(isotope.massNumber, isotope.protons + isotope.neutrons, element.symbol);
  }
});

test("uses expected abundant and bracketed nuclides at scientific landmarks", () => {
  const expected = { H: 1, C: 12, Na: 23, Fe: 56, Cu: 63, Mo: 98, U: 238, Tc: 97, Og: 294 };
  for (const [symbol, massNumber] of Object.entries(expected)) {
    assert.equal(representativeIsotope(getElement(symbol)).massNumber, massNumber, symbol);
  }
  assert.match(representativeIsotope(getElement("C")).basis, /most abundant/);
  assert.match(representativeIsotope(getElement("Tc")).basis, /IUPAC bracketed/);
});

test("pins authoritative isotope-selection sources", () => {
  assert.match(REPRESENTATIVE_ISOTOPE_SOURCE.natural, /^NIST/);
  assert.match(REPRESENTATIVE_ISOTOPE_SOURCE.naturalUrl, /^https:\/\/www\.nist\.gov\//);
  assert.match(REPRESENTATIVE_ISOTOPE_SOURCE.radioactive, /^IUPAC/);
  assert.match(REPRESENTATIVE_ISOTOPE_SOURCE.radioactiveUrl, /^https:\/\/iupac\.org\//);
});
