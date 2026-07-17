import test from "node:test";
import assert from "node:assert/strict";
import { elements, getElement } from "../src/elements.js";
import {
  meridianArcCoordinates,
  OCCLUSION_SPHERE_RADIUS,
  periodicSpiralCoordinate,
  relationshipCoordinate,
} from "../src/layouts.js";

const coordinateKey = ({ x, y, z }) => [x, y, z]
  .map((value) => value.toFixed(8))
  .join(":");

test("all 118 relationship-sphere element positions are distinct", () => {
  const keys = elements.map((element) => coordinateKey(relationshipCoordinate(element)));
  assert.equal(new Set(keys).size, 118);
  assert.notEqual(
    coordinateKey(relationshipCoordinate(getElement("Ce"))),
    coordinateKey(relationshipCoordinate(getElement("Hf"))),
  );
  assert.notEqual(
    coordinateKey(relationshipCoordinate(getElement("Th"))),
    coordinateKey(relationshipCoordinate(getElement("Rf"))),
  );
});

test("every relationship position clears the sphere's occlusion mask", () => {
  for (const element of elements) {
    const { x, y, z } = relationshipCoordinate(element);
    const radius = Math.hypot(x, y, z);
    assert.ok(
      radius >= OCCLUSION_SPHERE_RADIUS + 0.4,
      element.symbol + " orbits at " + radius.toFixed(2) + ", inside or grazing the depth mask",
    );
  }
});

test("the sphere has 18 distinct pole-to-pole group arcs", () => {
  const signatures = [];
  for (let column = 0; column < 18; column += 1) {
    const arc = meridianArcCoordinates(column);
    assert.ok(Math.abs(arc[0].y + 8.08) < 1e-9);
    assert.ok(Math.abs(arc.at(-1).y - 8.08) < 1e-9);
    signatures.push(coordinateKey(arc[Math.floor(arc.length / 2)]));
  }
  assert.equal(new Set(signatures).size, 18);
});

test("the spiral aligns recurring main-group families on shared rays", () => {
  for (const family of [["Li", "Na", "K", "Rb", "Cs", "Fr"], ["F", "Cl", "Br", "I", "At", "Ts"]]) {
    const angles = family.map((symbol) => periodicSpiralCoordinate(getElement(symbol)).angle.toFixed(10));
    assert.equal(new Set(angles).size, 1, family.join(", "));
  }
});

test("ungrouped f-series tracks stagger while true group-3 members stay aligned", () => {
  const mainAngles = new Set(
    elements.filter((element) => element.tableRow < 7)
      .map((element) => periodicSpiralCoordinate(element).angle.toFixed(6)),
  );
  for (const element of elements.filter((candidate) => candidate.tableRow >= 7 && candidate.group === null)) {
    const angle = periodicSpiralCoordinate(element).angle.toFixed(6);
    assert.ok(!mainAngles.has(angle), element.symbol + " hides behind the main coil");
  }
  for (const symbol of ["Y", "La", "Ac"]) {
    assert.equal(
      periodicSpiralCoordinate(getElement(symbol)).angle.toFixed(10),
      periodicSpiralCoordinate(getElement("Sc")).angle.toFixed(10),
      "Sc/Y/La/Ac share the group-3 spiral rail",
    );
    assert.equal(
      relationshipCoordinate(getElement(symbol)).longitude.toFixed(10),
      relationshipCoordinate(getElement("Sc")).longitude.toFixed(10),
      "Sc/Y/La/Ac share the group-3 sphere meridian",
    );
  }
  for (const [lanthanoid, actinoid] of [["Ce", "Th"], ["Pr", "Pa"], ["Nd", "U"]]) {
    assert.equal(
      periodicSpiralCoordinate(getElement(lanthanoid)).angle.toFixed(10),
      periodicSpiralCoordinate(getElement(actinoid)).angle.toFixed(10),
      lanthanoid + "/" + actinoid + " congeners share a ray",
    );
  }
  assert.notEqual(
    relationshipCoordinate(getElement("Ce")).longitude.toFixed(6),
    relationshipCoordinate(getElement("Hf")).longitude.toFixed(6),
    "sphere belts stagger off the main meridians too",
  );
});

test("the spiral is a true cylindrical helix, one turn per period", () => {
  const coordinates = elements.map((element) => ({ element, ...periodicSpiralCoordinate(element) }));

  const mainRadii = new Set(coordinates
    .filter(({ element }) => element.tableRow < 7)
    .map(({ radius }) => radius.toFixed(8)));
  assert.equal(mainRadii.size, 1, "main coil keeps a single cylinder radius");
  const fRadii = new Set(coordinates
    .filter(({ element }) => element.tableRow >= 7)
    .map(({ radius }) => radius.toFixed(8)));
  assert.equal(fRadii.size, 1, "f-series track keeps its own constant radius");
  assert.ok(Number([...fRadii][0]) < Number([...mainRadii][0]), "f-series track nests inside the main coil");

  for (let row = 0; row <= 8; row += 1) {
    const rowCoordinates = coordinates
      .filter(({ element }) => element.tableRow === row)
      .sort((a, b) => a.element.tableColumn - b.element.tableColumn);
    for (let index = 1; index < rowCoordinates.length; index += 1) {
      assert.ok(rowCoordinates[index].y < rowCoordinates[index - 1].y, "row " + row + " descends");
    }
  }

  const depths = coordinates.map(({ y }) => y);
  assert.equal(Math.max(...depths), periodicSpiralCoordinate(getElement("H")).y, "hydrogen crowns the apex");
  assert.ok(Math.max(...depths) - Math.min(...depths) > 9, "the helix is deep, not a flat disc");

  const ce = periodicSpiralCoordinate(getElement("Ce"));
  const hf = periodicSpiralCoordinate(getElement("Hf"));
  assert.ok(ce.y < hf.y && ce.radius < hf.radius, "f-series hangs inset below its period turn");
});
