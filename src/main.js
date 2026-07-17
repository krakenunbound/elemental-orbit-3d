import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { elements, CATEGORY_META } from "./elements.js";
import { meridianArcCoordinates, OCCLUSION_SPHERE_RADIUS, periodLatitude, periodicSpiralCoordinate, relationshipCoordinate } from "./layouts.js";
import "./style.css";

const canvas = document.querySelector("#scene");
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05080d, 0.016);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 3.5, 29);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.5, 0.78);
composer.addPass(bloom);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 12;
controls.maxDistance = 58;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.32;
controls.target.set(0, 0, 0);

const atlas = new THREE.Group();
scene.add(atlas);

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function makeCardTexture(element) {
  const card = document.createElement("canvas");
  card.width = 256;
  card.height = 300;
  const context = card.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 256, 300);
  gradient.addColorStop(0, element.color + "42");
  gradient.addColorStop(0.58, "#0b121ddf");
  gradient.addColorStop(1, "#070b12f2");
  roundedRect(context, 5, 5, 246, 290, 22);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = element.color + "ba";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = element.color;
  context.fillRect(18, 18, 34, 3);
  context.font = "500 25px 'DM Mono', monospace";
  context.fillStyle = "#dce6f5";
  context.fillText(String(element.atomicNumber).padStart(3, "0"), 18, 53);
  context.font = "500 103px 'DM Mono', monospace";
  context.fillStyle = "#f6f9ff";
  context.textAlign = "center";
  context.fillText(element.symbol, 128, 169);
  context.font = "600 24px Manrope, sans-serif";
  context.fillStyle = "#c7d1df";
  context.fillText(element.name, 128, 213);
  context.font = "400 18px 'DM Mono', monospace";
  context.fillStyle = "#758397";
  context.fillText(element.atomicMass, 128, 246);
  context.font = "500 13px 'DM Mono', monospace";
  context.fillStyle = element.color;
  context.fillText(element.block.toUpperCase() + " BLOCK", 128, 273);
  const texture = new THREE.CanvasTexture(card);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function spiralPosition(element) {
  const coordinate = periodicSpiralCoordinate(element);
  return new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z);
}

function tablePosition(element) {
  const x = (element.tableColumn - 8.5) * 1.22;
  const y = (3.8 - element.tableRow) * 1.48;
  const blockDepth = { s: 0.25, p: -0.12, d: 0.08, f: -0.32 }[element.block];
  return new THREE.Vector3(x, y, blockDepth);
}

function shellsPosition(element) {
  const shell = element.period;
  const radius = 1.45 + shell * 1.5;
  const indexInShell = elements.filter((candidate) => candidate.period === shell && candidate.atomicNumber <= element.atomicNumber).length - 1;
  const countInShell = elements.filter((candidate) => candidate.period === shell).length;
  const angle = (indexInShell / countInShell) * Math.PI * 2 + shell * 0.46;
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    (shell - 4) * 0.86 + Math.sin(angle * 2) * 0.25,
    Math.sin(angle) * radius
  );
}

function relationshipPosition(element) {
  const coordinate = relationshipCoordinate(element);
  return new THREE.Vector3(coordinate.x, coordinate.y, coordinate.z);
}

const layouts = {
  spiral: elements.map((element) => spiralPosition(element)),
  table: elements.map((element) => tablePosition(element)),
  shells: elements.map((element) => shellsPosition(element)),
  relations: elements.map((element) => relationshipPosition(element))
};

function createRelationshipSphere() {
  const group = new THREE.Group();
  const palette = [0xff5f57, 0xff9f43, 0xffd166, 0x6ee7b7, 0x53b9ff, 0x8b7cff, 0xd783ff];

  const depthMask = new THREE.Mesh(
    new THREE.SphereGeometry(OCCLUSION_SPHERE_RADIUS, 48, 32),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true })
  );
  group.add(depthMask);

  const globe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(8.02, 4),
    new THREE.MeshBasicMaterial({
      color: 0x79e9dc,
      wireframe: true,
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  );
  group.add(globe);

  for (let period = 1; period <= 7; period += 1) {
    const latitude = periodLatitude(period);
    const ringRadius = Math.cos(latitude) * 8.1;
    const material = new THREE.MeshBasicMaterial({
      color: palette[period - 1],
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringRadius, 0.032, 6, 180), material);
    ring.position.y = Math.sin(latitude) * 8.1;
    ring.rotation.x = Math.PI * 0.5;
    ring.userData = { relationType: "period", period };
    group.add(ring);
  }

  for (let column = 0; column < 18; column += 1) {
    const points = meridianArcCoordinates(column).map((point) => new THREE.Vector3(point.x, point.y, point.z));
    const meridianCurve = new THREE.CatmullRomCurve3(points);
    const material = new THREE.MeshBasicMaterial({
      color: column % 2 === 0 ? 0x795baf : 0x4d8c9e,
      transparent: true,
      opacity: 0.105,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const meridian = new THREE.Mesh(new THREE.TubeGeometry(meridianCurve, 72, 0.014, 5, false), material);
    meridian.userData = { relationType: "meridian", group: column + 1 };
    group.add(meridian);
  }

  for (let groupNumber = 1; groupNumber <= 18; groupNumber += 1) {
    const family = elements.filter((element) => element.group === groupNumber && element.symbol !== "H");
    if (family.length < 2) continue;
    const points = family.map((element) => layouts.relations[element.atomicNumber - 1].clone().multiplyScalar(1.006));
    const curve = new THREE.CatmullRomCurve3(points);
    const material = new THREE.MeshBasicMaterial({
      color: 0x9e7cff,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const connector = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.026, 5, false), material);
    connector.userData = { relationType: "family", group: groupNumber };
    group.add(connector);
  }

  for (const category of ["lanthanoid", "actinoid"]) {
    const series = elements.filter((element) => element.category === category);
    const points = series.map((element) => layouts.relations[element.atomicNumber - 1].clone().multiplyScalar(1.012));
    const curve = new THREE.CatmullRomCurve3(points);
    const connector = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 70, 0.045, 6, false),
      new THREE.MeshBasicMaterial({
        color: category === "lanthanoid" ? 0xff7eb6 : 0xef6ef0,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    connector.userData = { relationType: "f-series", category };
    group.add(connector);
  }

  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -9.2, 0), new THREE.Vector3(0, 9.2, 0)]),
    new THREE.LineBasicMaterial({ color: 0x6ef6d8, transparent: true, opacity: 0.2 })
  );
  group.add(axis);
  group.visible = false;
  return group;
}

const relationshipSphere = createRelationshipSphere();
atlas.add(relationshipSphere);

const sprites = elements.map((element, index) => {
  const material = new THREE.SpriteMaterial({
    map: makeCardTexture(element),
    transparent: true,
    depthWrite: false,
    opacity: 0.94
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(layouts.spiral[index]);
  sprite.scale.set(1.0, 1.17, 1);
  sprite.userData = { element, index, baseScale: 1 };
  atlas.add(sprite);
  return sprite;
});

const pathUniforms = {
  uTime: { value: 0 },
  uFade: { value: 1 },
  uIntensity: { value: 1 },
  uColor: { value: new THREE.Color(0x4de1c1) },
  uPulseColor: { value: new THREE.Color(0xd8fff4) }
};
const pathMaterial = new THREE.ShaderMaterial({
  uniforms: pathUniforms,
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n"),
  fragmentShader: [
    "uniform float uTime;",
    "uniform float uFade;",
    "uniform float uIntensity;",
    "uniform vec3 uColor;",
    "uniform vec3 uPulseColor;",
    "varying vec2 vUv;",
    "void main() {",
    "  float travel = fract(vUv.x - uTime * 0.05);",
    "  float head = smoothstep(0.045, 0.0, travel);",
    "  float tail = smoothstep(0.28, 0.0, travel) * 0.4;",
    "  float energy = head + tail;",
    "  vec3 color = uColor * (0.5 + 0.25 * energy) + uPulseColor * energy;",
    "  float alpha = uFade * uIntensity * (0.3 + 0.7 * energy);",
    "  gl_FragColor = vec4(color * alpha, alpha);",
    "}"
  ].join("\n"),
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const elementPath = new THREE.Mesh(new THREE.BufferGeometry(), pathMaterial);
atlas.add(elementPath);

function rebuildElementPath(layout) {
  const curve = new THREE.CatmullRomCurve3(layouts[layout], false, "centripetal");
  const geometry = new THREE.TubeGeometry(curve, 960, 0.035, 5, false);
  elementPath.geometry.dispose();
  elementPath.geometry = geometry;
}
rebuildElementPath("spiral");

const haloGeometry = new THREE.BufferGeometry();
haloGeometry.setAttribute("position", new THREE.Float32BufferAttribute(layouts.spiral.flatMap((position) => position.toArray()), 3));
const halo = new THREE.Points(haloGeometry, new THREE.PointsMaterial({
  color: 0x8bfff0,
  size: 0.14,
  transparent: true,
  opacity: 0.5,
  blending: THREE.AdditiveBlending,
  depthWrite: false
}));
atlas.add(halo);

function createNucleus() {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.12, 2),
    new THREE.MeshBasicMaterial({ color: 0x78ffe2, wireframe: true, transparent: true, opacity: 0.28 })
  );
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xb8fff1, transparent: true, opacity: 0.75 })
  );
  group.add(core, glow);
  for (let index = 0; index < 3; index += 1) {
    const curve = new THREE.EllipseCurve(0, 0, 1.75, 0.66, 0, Math.PI * 2);
    const points = curve.getPoints(80).map((point) => new THREE.Vector3(point.x, point.y, 0));
    const orbit = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: index === 0 ? 0x6ef6d8 : 0x65728c, transparent: true, opacity: 0.22 })
    );
    orbit.rotation.set(index * Math.PI / 3, index * Math.PI / 4, index * Math.PI / 5);
    group.add(orbit);
  }
  group.scale.setScalar(0.8);
  return group;
}

const nucleus = createNucleus();
atlas.add(nucleus);

function seededRandom(seed = 0x5f3759df) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createStarLayer({ count, innerRadius, outerRadius, size, opacity, palette, seed }) {
  const random = seededRandom(seed);
  const positions = [];
  const colors = [];
  for (let index = 0; index < count; index += 1) {
    const radius = innerRadius + random() * (outerRadius - innerRadius);
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    const color = new THREE.Color(palette[Math.floor(random() * palette.length)]);
    const luminosity = 0.55 + random() * 0.45;
    colors.push(color.r * luminosity, color.g * luminosity, color.b * luminosity);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
}

function createNebula() {
  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: innerWidth <= 560 ? 0.58 : 0.78 }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: [
      "varying vec3 vDirection;",
      "void main() {",
      "  vDirection = normalize(position);",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform float uTime;",
      "uniform float uIntensity;",
      "varying vec3 vDirection;",
      "float hash(vec3 p) {",
      "  p = fract(p * 0.3183099 + vec3(.1, .7, .3));",
      "  p *= 17.0;",
      "  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));",
      "}",
      "float noise(vec3 p) {",
      "  vec3 i = floor(p);",
      "  vec3 f = fract(p);",
      "  f = f * f * (3.0 - 2.0 * f);",
      "  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),",
      "                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),",
      "             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),",
      "                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);",
      "}",
      "float fbm(vec3 p) {",
      "  float value = 0.0;",
      "  float amplitude = 0.52;",
      "  for (int octave = 0; octave < 4; octave++) {",
      "    value += noise(p) * amplitude;",
      "    p = p * 2.03 + vec3(1.7, 4.2, 2.9);",
      "    amplitude *= 0.5;",
      "  }",
      "  return value;",
      "}",
      "void main() {",
      "  vec3 direction = normalize(vDirection);",
      "  vec3 sweep = direction * 3.1 + vec3(uTime * 0.002, 0.0, 0.0);",
      "  float cloud = fbm(sweep);",
      "  float ribbon = exp(-pow(direction.y * 1.25 - direction.x * 0.34 + 0.08, 2.0) * 8.0);",
      "  float wisps = smoothstep(0.48, 0.82, cloud) * ribbon;",
      "  float violetPocket = smoothstep(0.2, 0.95, direction.x * 0.5 + direction.y * 0.35 + 0.45);",
      "  vec3 blue = vec3(0.025, 0.15, 0.25);",
      "  vec3 teal = vec3(0.04, 0.28, 0.30);",
      "  vec3 violet = vec3(0.17, 0.055, 0.27);",
      "  vec3 color = mix(blue, teal, cloud) + violet * violetPocket * wisps * 0.8;",
      "  float alpha = (0.035 + wisps * 0.18) * uIntensity;",
      "  gl_FragColor = vec4(color, alpha);",
      "}"
    ].join("\n"),
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return {
    mesh: new THREE.Mesh(new THREE.SphereGeometry(132, 48, 32), material),
    uniforms
  };
}

function createOrbitalSilhouettes() {
  const group = new THREE.Group();
  const colors = [0x6ef6d8, 0x6aa8ff, 0xa47cff];
  for (let index = 0; index < 5; index += 1) {
    const radius = 29 + index * 3.8;
    const points = [];
    for (let segment = 0; segment <= 180; segment += 1) {
      const angle = segment / 180 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.34, 0));
    }
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0.035,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    orbit.rotation.set(0.35 + index * 0.39, index * 0.63, index * 0.47);
    group.add(orbit);
  }
  return group;
}

function createCosmicEnvironment() {
  const group = new THREE.Group();
  const compact = innerWidth <= 760;
  const starLayers = [
    createStarLayer({ count: compact ? 420 : 720, innerRadius: 42, outerRadius: 65, size: 0.075, opacity: 0.54, palette: [0xb8d9ff, 0xffffff, 0x9ef7ef], seed: 101 }),
    createStarLayer({ count: compact ? 620 : 1050, innerRadius: 66, outerRadius: 96, size: 0.12, opacity: 0.42, palette: [0x759cc9, 0xc0d8ff, 0xa88ee8], seed: 202 }),
    createStarLayer({ count: compact ? 760 : 1320, innerRadius: 97, outerRadius: 128, size: 0.18, opacity: 0.28, palette: [0x436687, 0x7187b4, 0x735b9c], seed: 303 })
  ];
  starLayers.forEach((layer) => group.add(layer));

  const dust = createStarLayer({
    count: compact ? 120 : 220,
    innerRadius: 24,
    outerRadius: 38,
    size: 0.11,
    opacity: 0.16,
    palette: Object.values(CATEGORY_META).map((category) => category.color),
    seed: 404
  });
  dust.name = "atomic-dust";
  group.add(dust);

  const nebula = createNebula();
  nebula.mesh.renderOrder = -100;
  group.add(nebula.mesh);
  const orbitals = createOrbitalSilhouettes();
  group.add(orbitals);
  scene.add(group);
  return { group, starLayers, dust, nebula, orbitals };
}

const cosmicEnvironment = createCosmicEnvironment();

let activeLayout = "spiral";
let hoveredSprite = null;
let selectedSprite = null;
let activeCategory = null;
let soundEnabled = false;
let pointerMoved = false;
let pointerInside = false;
let frameCount = 0;
let autoResumeTimer = null;
let autoResumeAt = 0;
let displayedCountdown = null;
const AUTO_RESUME_DELAY_MS = 5000;
const pointer = new THREE.Vector2(-2, -2);
const raycaster = new THREE.Raycaster();
const tooltip = document.querySelector("#tooltip");
const detailPanel = document.querySelector("#element-panel");
const autoStatus = document.querySelector("#auto-status");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.body.dataset.layout = activeLayout;

function updateHalo() {
  const positions = haloGeometry.attributes.position.array;
  sprites.forEach((sprite, index) => {
    positions[index * 3] = sprite.position.x;
    positions[index * 3 + 1] = sprite.position.y;
    positions[index * 3 + 2] = sprite.position.z;
  });
  haloGeometry.attributes.position.needsUpdate = true;
}

function playTone(frequency, duration = 0.045) {
  if (!soundEnabled) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.025, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
  oscillator.addEventListener("ended", () => audio.close());
}

function updateAutoStatus() {
  if (reducedMotion || activeLayout === "table") {
    if (displayedCountdown !== "static") {
      autoStatus.textContent = reducedMotion ? "AUTO · OFF" : "STATIC VIEW";
      autoStatus.className = "auto-status static";
      displayedCountdown = "static";
    }
    return;
  }

  if (controls.autoRotate && autoResumeAt === 0) {
    if (displayedCountdown !== "on") {
      autoStatus.textContent = "AUTO · ON";
      autoStatus.className = "auto-status";
      displayedCountdown = "on";
    }
    return;
  }

  if (!controls.autoRotate && autoResumeAt === 0) {
    if (displayedCountdown !== "interacting") {
      autoStatus.textContent = "INTERACTING";
      autoStatus.className = "auto-status counting";
      displayedCountdown = "interacting";
    }
    return;
  }

  const seconds = Math.max(0, Math.ceil((autoResumeAt - performance.now()) / 1000));
  if (displayedCountdown !== seconds) {
    autoStatus.textContent = "RESUME · " + seconds + "s";
    autoStatus.className = "auto-status counting";
    displayedCountdown = seconds;
  }
}

function cancelAutoResume() {
  if (autoResumeTimer) clearTimeout(autoResumeTimer);
  autoResumeTimer = null;
  autoResumeAt = 0;
}

function pauseAutoRotationForInteraction() {
  controls.autoRotate = false;
  cancelAutoResume();
  displayedCountdown = null;
  updateAutoStatus();
}

function scheduleAutoRotationResume() {
  pauseAutoRotationForInteraction();

  if (reducedMotion || activeLayout === "table") {
    return;
  }

  autoResumeAt = performance.now() + AUTO_RESUME_DELAY_MS;
  autoResumeTimer = setTimeout(() => {
    autoResumeTimer = null;
    autoResumeAt = 0;
    if (activeLayout !== "table" && !reducedMotion) controls.autoRotate = true;
    updateAutoStatus();
  }, AUTO_RESUME_DELAY_MS);
  displayedCountdown = null;
  updateAutoStatus();
}

function setHovered(sprite) {
  if (hoveredSprite === sprite) return;
  if (hoveredSprite) hoveredSprite.material.color.set(0xffffff);
  hoveredSprite = sprite;
  if (!sprite) {
    tooltip.classList.remove("visible");
    canvas.style.cursor = "grab";
    return;
  }
  sprite.material.color.set(sprite.userData.element.color);
  const element = sprite.userData.element;
  tooltip.innerHTML = "<strong>" + element.atomicNumber + " · " + element.name + "</strong><span>" + element.categoryLabel + " · " + element.electronDisplay + "</span>";
  tooltip.classList.add("visible");
  canvas.style.cursor = "pointer";
  playTone(190 + element.atomicNumber * 2.2);
}

function relationshipCameraDistance() {
  if (innerWidth <= 560) return 45;
  if (innerWidth <= 900) return 33;
  return 25;
}

function spiralCameraDistance() {
  if (innerWidth <= 560) return 42;
  if (innerWidth <= 900) return 31;
  return 25;
}

function applyLayoutCamera(layout) {
  if (layout === "table") {
    camera.position.set(0, 0, 30);
    controls.target.set(0, -1.2, 0);
  } else if (layout === "relations") {
    camera.position.set(0, 1.1, relationshipCameraDistance());
    controls.target.set(0, 0, 0);
  } else if (layout === "spiral") {
    camera.position.set(0, 4, spiralCameraDistance());
    controls.target.set(0, 0, 0);
  } else {
    camera.position.set(0, 3.5, 29);
    controls.target.set(0, 0, 0);
  }
}

function positionTooltip(event) {
  const margin = 18;
  const left = Math.min(event.clientX + margin, innerWidth - 175);
  const top = Math.min(event.clientY + margin, innerHeight - 70);
  tooltip.style.transform = "translate(" + left + "px, " + top + "px)";
}

function inspectElement(sprite) {
  selectedSprite = sprite;
  setHovered(null);
  const element = sprite.userData.element;
  document.querySelector("#detail-number").textContent = String(element.atomicNumber).padStart(3, "0");
  document.querySelector("#detail-symbol").textContent = element.symbol;
  document.querySelector("#detail-mass").textContent = element.atomicMass;
  document.querySelector("#detail-category").textContent = element.categoryLabel.toUpperCase();
  document.querySelector("#detail-category").style.color = element.color;
  document.querySelector("#detail-name").textContent = element.name;
  document.querySelector("#detail-config").textContent = element.electronDisplay;
  document.querySelector("#detail-description").textContent = element.description;
  document.querySelector("#detail-period").textContent = element.period;
  document.querySelector("#detail-group").textContent = element.group || "—";
  document.querySelector("#detail-phase").textContent = element.standardState || "Unknown";
  document.querySelector("#detail-block").textContent = element.block + "-block";
  const tile = document.querySelector("#detail-tile");
  tile.style.setProperty("--element-color", element.color);
  const shellBars = document.querySelector("#shell-bars");
  shellBars.style.setProperty("--element-color", element.color);
  shellBars.replaceChildren(...element.shells.map((count) => {
    const bar = document.createElement("i");
    bar.style.height = Math.max(3, count / 32 * 30) + "px";
    bar.title = count + " electrons";
    return bar;
  }));
  detailPanel.classList.add("visible");
  scheduleAutoRotationResume();
  playTone(260 + element.atomicNumber * 3, 0.09);
}

function setLayout(layout) {
  activeLayout = layout;
  document.body.dataset.layout = layout;
  document.querySelectorAll(".view-button").forEach((button) => button.classList.toggle("active", button.dataset.layout === layout));
  const copy = {
    spiral: {
      eyebrow: "PERIODIC HELIX",
      title: "One turn per period,",
      accent: "families on shared rails.",
      body: "Atomic number descends a continuous helix while same-group elements stack on vertical rails — a modern take on de Chancourtois' 1862 telluric screw."
    },
    table: {
      eyebrow: "STANDARD TABLE",
      title: "The familiar grid,",
      accent: "given depth.",
      body: "Periods run across rows, groups descend through columns, and orbital blocks occupy separate layers."
    },
    shells: {
      eyebrow: "PERIOD RINGS",
      title: "Seven periods,",
      accent: "arranged as rings.",
      body: "This view groups elements by period. It is a structural metaphor, not a literal Bohr-shell model."
    },
    relations: {
      eyebrow: "RELATIONSHIP SPHERE",
      title: "See the families,",
      accent: "not just the list.",
      body: "Periods form latitude bands, main-table groups follow arcs, and the f-series occupy offset belts."
    }
  }[layout];
  document.querySelector("#intro-eyebrow").textContent = copy.eyebrow;
  document.querySelector("#intro-title-main").textContent = copy.title;
  document.querySelector("#intro-title-accent").textContent = copy.accent;
  document.querySelector("#intro-copy").textContent = copy.body;
  elementPath.visible = layout !== "relations";
  relationshipSphere.visible = layout === "relations";
  if (layout !== "relations") rebuildElementPath(layout);
  pathUniforms.uIntensity.value = layout === "table" ? 0.35 : 1;
  nucleus.visible = layout !== "table";
  nucleus.scale.setScalar(layout === "relations" ? 1.55 : 0.8);
  nucleus.traverse((child) => {
    if (child.material) child.material.depthTest = layout !== "relations";
  });
  controls.autoRotate = layout !== "table" && !selectedSprite && !reducedMotion;
  applyLayoutCamera(layout);
  scheduleAutoRotationResume();
  playTone(layout === "spiral" ? 280 : layout === "table" ? 360 : layout === "relations" ? 520 : 440, 0.08);
}

function buildLegend() {
  const legend = document.querySelector(".legend");
  Object.entries(CATEGORY_META).forEach(([category, meta]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = category;
    button.style.setProperty("--legend-color", meta.color);
    button.innerHTML = "<i></i>" + meta.label;
    button.addEventListener("click", () => {
      activeCategory = activeCategory === category ? null : category;
      legend.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item.dataset.category === activeCategory));
      sprites.forEach((sprite) => {
        sprite.material.opacity = !activeCategory || sprite.userData.element.category === activeCategory ? 0.96 : 0.09;
      });
      playTone(320, 0.07);
    });
    legend.append(button);
  });
}

buildLegend();
updateHalo();
applyLayoutCamera(activeLayout);

canvas.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / innerHeight) * 2 + 1;
  pointerMoved = true;
  pointerInside = true;
  positionTooltip(event);
});

canvas.addEventListener("pointerleave", () => {
  pointer.set(-2, -2);
  pointerInside = false;
  setHovered(null);
});

canvas.addEventListener("click", () => {
  if (hoveredSprite) inspectElement(hoveredSprite);
});

document.querySelectorAll(".view-button").forEach((button) => {
  button.addEventListener("click", () => setLayout(button.dataset.layout));
});
document.querySelector("#close-detail").addEventListener("click", () => {
  detailPanel.classList.remove("visible");
  selectedSprite = null;
  scheduleAutoRotationResume();
});
document.querySelector("#focus-reset").addEventListener("click", () => {
  applyLayoutCamera(activeLayout);
  controls.update();
  scheduleAutoRotationResume();
});

controls.addEventListener("start", pauseAutoRotationForInteraction);
controls.addEventListener("end", scheduleAutoRotationResume);

const aboutDialog = document.querySelector("#about-dialog");
document.querySelector("#info-toggle").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#close-about").addEventListener("click", () => aboutDialog.close());
document.querySelector("#sound-toggle").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.setAttribute("aria-pressed", String(soundEnabled));
  playTone(420, 0.1);
});

function animate(time) {
  requestAnimationFrame(animate);
  frameCount += 1;
  const targetPositions = layouts[activeLayout];
  let stillMoving = false;
  sprites.forEach((sprite, index) => {
    const distance = sprite.position.distanceTo(targetPositions[index]);
    if (distance > 0.003) stillMoving = true;
    sprite.position.lerp(targetPositions[index], reducedMotion ? 1 : 0.075);
    const emphasized = sprite === hoveredSprite || sprite === selectedSprite;
    const isFSeriesRow = sprite.userData.element.tableRow >= 7;
    const restingScale = activeLayout === "relations" ? (isFSeriesRow ? 0.78 : 0.84) : 1;
    const targetScale = emphasized ? 1.48 : restingScale;
    sprite.userData.baseScale += (targetScale - sprite.userData.baseScale) * 0.16;
    sprite.scale.set(sprite.userData.baseScale, sprite.userData.baseScale * 1.17, 1);
  });
  if (stillMoving) updateHalo();

  if (pointerInside && (pointerMoved || frameCount % 3 === 0)) {
    raycaster.setFromCamera(pointer, camera);
    const cameraHemisphere = camera.position.clone().normalize();
    const visibleSprites = sprites.filter((sprite) => {
      const matchesCategory = !activeCategory || sprite.userData.element.category === activeCategory;
      const facesCamera = activeLayout !== "relations" || sprite.position.clone().normalize().dot(cameraHemisphere) > 0.08;
      return matchesCategory && facesCamera;
    });
    const intersections = raycaster.intersectObjects(visibleSprites, false);
    const target = intersections[0]?.object || null;
    setHovered(target === selectedSprite ? null : target);
    pointerMoved = false;
  }

  const seconds = time * 0.001;
  if (!reducedMotion) pathUniforms.uTime.value = seconds;
  pathUniforms.uFade.value += ((stillMoving ? 0 : 1) - pathUniforms.uFade.value) * 0.08;
  nucleus.rotation.x = seconds * 0.08;
  nucleus.rotation.y = seconds * 0.13;
  if (activeLayout === "relations") {
    const pulse = 1 + Math.sin(seconds * 2.2) * 0.13;
    nucleus.children[1].scale.setScalar(pulse);
  } else {
    nucleus.children[1].scale.setScalar(1);
  }
  nucleus.children.slice(2).forEach((orbit, index) => { orbit.rotation.z += 0.0015 * (index + 1); });
  halo.material.opacity = 0.38 + Math.sin(seconds * 1.4) * 0.12;
  if (!reducedMotion) {
    cosmicEnvironment.nebula.uniforms.uTime.value = seconds;
    cosmicEnvironment.starLayers[0].rotation.y = seconds * 0.0035;
    cosmicEnvironment.starLayers[1].rotation.y = -seconds * 0.0018;
    cosmicEnvironment.starLayers[1].rotation.x = seconds * 0.0006;
    cosmicEnvironment.starLayers[2].rotation.y = seconds * 0.0008;
    cosmicEnvironment.dust.rotation.y = seconds * 0.0045;
    cosmicEnvironment.dust.rotation.z = Math.sin(seconds * 0.05) * 0.08;
    cosmicEnvironment.orbitals.rotation.y = seconds * 0.0022;
  }
  updateAutoStatus();
  controls.update();
  composer.render();
}

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (activeLayout === "relations" || activeLayout === "spiral") applyLayoutCamera(activeLayout);
});

setTimeout(() => document.querySelector("#loading").classList.add("done"), 650);
animate(0);
