import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mainScript = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const viteConfig = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");

test("exposes one unified four-view selector", () => {
  assert.doesNotMatch(html, /data-experience|OPTION 1|OPTION 2/);
  for (const [layout, label] of [["spiral", "Spiral"], ["table", "Table"], ["shells", "Shells"], ["relations", "Sphere"]]) {
    assert.match(html, new RegExp('data-layout="' + layout + '">' + label));
  }
});

test("relationship sphere explains its scientific coordinate system", () => {
  assert.match(html, /Periods occupy latitude bands/);
  assert.match(html, /18 group arcs/);
  assert.match(html, /Central atomic core/);
  assert.match(html, /f-series use separate offset belts/);
});

test("scientific copy distinguishes structural metaphors from literal models", () => {
  assert.match(html, /structural metaphor, not a literal Bohr model/);
  assert.match(html, /Atomic weights follow CIAAW 2024 abridged values/);
  assert.match(html, /Bracketed values follow IUPAC/);
  assert.doesNotMatch(html, /E = mc/);
});

test("the chosen group-3 convention is disclosed", () => {
  assert.match(html, /traditional La\/Ac group-3 convention/);
  assert.match(html, /Lu and Lr remain in the f-series/);
});

test("an open detail panel never blocks hovering or selecting other cards", () => {
  assert.doesNotMatch(mainScript, /pointerInside && !selectedSprite/);
  assert.match(mainScript, /setHovered\(target === selectedSprite \? null : target\)/);
});

test("auto-rotation resumes five seconds after intentional interaction ends", () => {
  assert.match(html, /id="auto-status"/);
  assert.match(mainScript, /AUTO_RESUME_DELAY_MS\s*=\s*5000/);
  assert.match(mainScript, /controls\.addEventListener\("start", pauseAutoRotationForInteraction\)/);
  assert.match(mainScript, /controls\.addEventListener\("end", scheduleAutoRotationResume\)/);

  const pointerMoveHandler = mainScript.match(/canvas\.addEventListener\("pointermove",[\s\S]*?\n\}\);/)?.[0];
  assert.ok(pointerMoveHandler, "pointermove handler must remain available for hover");
  assert.doesNotMatch(pointerMoveHandler, /AutoRotation|AutoResume/);
});

test("cosmic environment is procedural, layered, deterministic, and motion-aware", () => {
  assert.match(mainScript, /function seededRandom/);
  assert.match(mainScript, /function createNebula/);
  assert.match(mainScript, /function createCosmicEnvironment/);
  assert.match(mainScript, /const starLayers = \[/);
  assert.match(mainScript, /dust\.name = "atomic-dust"/);
  assert.match(mainScript, /function createOrbitalSilhouettes/);
  assert.match(mainScript, /if \(!reducedMotion\) \{\s*cosmicEnvironment\.nebula\.uniforms\.uTime/);
  assert.doesNotMatch(mainScript, /Math\.random\(\)/);
});

test("production CSS remains same-origin without a fragile CORS request", () => {
  assert.match(viteConfig, /name: "same-origin-stylesheet"/);
  assert.match(viteConfig, /rel="stylesheet"/);
  assert.match(viteConfig, /crossorigin/);
});
