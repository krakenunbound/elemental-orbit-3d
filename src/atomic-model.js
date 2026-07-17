import * as THREE from "three";
import { representativeIsotope } from "./isotopes.js";

export const ATOM_COLORS = Object.freeze({
  proton: "#ff625f",
  neutron: "#a78bfa",
  electron: "#6ef6d8",
  s: "#55dfff",
  p: "#a679ff",
  d: "#ffd166",
  f: "#ff69b4",
});

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  });
}

function nucleonPositions(count, radius, seed) {
  const random = seededRandom(seed);
  const positions = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const fraction = (index + 0.5) / count;
    const r = radius * Math.cbrt(fraction) * (0.84 + random() * 0.16);
    const y = 1 - 2 * fraction;
    const planar = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * goldenAngle + random() * 0.28;
    positions.push(new THREE.Vector3(Math.cos(theta) * planar * r, y * r, Math.sin(theta) * planar * r));
  }
  return positions;
}

function instancedSpheres(positions, color, radius) {
  const geometry = new THREE.SphereGeometry(radius, 10, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.25,
    roughness: 0.38,
    metalness: 0.05,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(positions.length, 1));
  const matrix = new THREE.Matrix4();
  positions.forEach((position, index) => mesh.setMatrixAt(index, matrix.makeTranslation(position.x, position.y, position.z)));
  mesh.count = positions.length;
  return mesh;
}

function ringGeometry(radius) {
  const points = Array.from({ length: 129 }, (_, index) => {
    const angle = index / 128 * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
  return new THREE.BufferGeometry().setFromPoints(points);
}

function orbitalPoint(type, radius, random, index) {
  const sign = random() < 0.5 ? -1 : 1;
  const spread = () => (random() - 0.5) * radius * 0.42;
  if (type === "s") {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = radius * Math.cbrt(random());
    return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
  }
  if (type === "p") {
    const axis = index % 3;
    const coordinate = sign * radius * (0.28 + random() * 0.72);
    const point = [spread(), spread(), spread()];
    point[axis] = coordinate;
    return point;
  }
  if (type === "d") {
    const angle = (index % 4) * Math.PI / 2 + (random() - 0.5) * 0.48;
    const lobe = radius * (0.28 + random() * 0.72);
    return [Math.cos(angle) * lobe, spread(), Math.sin(angle) * lobe];
  }
  const angle = (index % 8) * Math.PI / 4 + (random() - 0.5) * 0.32;
  const lobe = radius * (0.3 + random() * 0.7);
  return [Math.cos(angle) * lobe, Math.sin(angle * 2) * lobe * 0.65, Math.sin(angle) * lobe];
}

function createCloud(orbitals, seed) {
  const group = new THREE.Group();
  const random = seededRandom(seed);
  for (const orbital of orbitals) {
    const positions = [];
    const count = Math.min(360, Math.max(90, orbital.electrons * 44));
    const radius = 0.72 + orbital.shell * 0.48;
    for (let index = 0; index < count; index += 1) positions.push(...orbitalPoint(orbital.type, radius, random, index));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: ATOM_COLORS[orbital.type],
      size: 0.032,
      transparent: true,
      opacity: 0.13 + orbital.electrons / 90,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    group.add(new THREE.Points(geometry, material));
  }
  return group;
}

function createGenericCore() {
  const group = new THREE.Group();
  group.name = "generic-atomic-origin";
  group.add(new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.12, 2),
    new THREE.MeshBasicMaterial({ color: 0x78ffe2, wireframe: true, transparent: true, opacity: 0.25 }),
  ));
  group.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xb8fff1, transparent: true, opacity: 0.78 }),
  ));
  for (let index = 0; index < 3; index += 1) {
    const orbit = new THREE.Line(ringGeometry(1.62), new THREE.LineBasicMaterial({
      color: index === 0 ? 0x6ef6d8 : 0x65728c,
      transparent: true,
      opacity: 0.22,
    }));
    orbit.rotation.set(index * Math.PI / 3, index * Math.PI / 4, index * Math.PI / 5);
    group.add(orbit);
  }
  return group;
}

export function createAtomicModel() {
  const root = new THREE.Group();
  root.name = "selected-atom-model";
  const presentation = new THREE.Group();
  root.add(presentation);
  const light = new THREE.PointLight(0xb8fff1, 7, 14, 2);
  root.add(light);
  let mode = "shell";
  let selected = null;
  let generic = createGenericCore();
  presentation.add(generic);
  const electrons = [];

  function clearPresentation() {
    electrons.length = 0;
    for (const child of [...presentation.children]) {
      presentation.remove(child);
      disposeObject(child);
    }
  }

  function rebuild(element) {
    clearPresentation();
    selected = element || null;
    if (!element) {
      generic = createGenericCore();
      presentation.add(generic);
      return null;
    }

    const isotope = representativeIsotope(element);
    const nuclearRadius = 0.48 + Math.cbrt(isotope.massNumber) * 0.065;
    const nucleons = nucleonPositions(isotope.massNumber, nuclearRadius, element.atomicNumber * 1709);
    const random = seededRandom(element.atomicNumber * 7919);
    const shuffled = nucleons.map((position) => ({ position, order: random() })).sort((a, b) => a.order - b.order);
    const protonPositions = shuffled.slice(0, isotope.protons).map((entry) => entry.position);
    const neutronPositions = shuffled.slice(isotope.protons).map((entry) => entry.position);
    const nucleonRadius = Math.max(0.075, Math.min(0.16, nuclearRadius / Math.cbrt(isotope.massNumber) * 0.7));
    const nucleus = new THREE.Group();
    nucleus.name = "representative-isotope-nucleus";
    nucleus.add(instancedSpheres(protonPositions, ATOM_COLORS.proton, nucleonRadius));
    nucleus.add(instancedSpheres(neutronPositions, ATOM_COLORS.neutron, nucleonRadius));
    presentation.add(nucleus);

    if (mode === "shell") {
      element.shells.forEach((count, shellIndex) => {
        const radius = 1.08 + shellIndex * 0.46;
        const shell = new THREE.Group();
        shell.rotation.set(shellIndex * 0.43, shellIndex * 0.61, shellIndex * 0.18);
        shell.add(new THREE.Line(ringGeometry(radius), new THREE.LineBasicMaterial({
          color: 0x6ef6d8,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })));
        for (let index = 0; index < count; index += 1) {
          const electron = new THREE.Mesh(
            new THREE.SphereGeometry(0.055, 9, 7),
            new THREE.MeshBasicMaterial({ color: ATOM_COLORS.electron }),
          );
          electron.userData = { angle: index / count * Math.PI * 2, speed: 0.22 + shellIndex * 0.035, radius, shell };
          electrons.push(electron);
          shell.add(electron);
        }
        presentation.add(shell);
      });
    } else {
      const cloud = createCloud(element.orbitals, element.atomicNumber * 3571);
      cloud.name = "qualitative-orbital-cloud";
      presentation.add(cloud);
    }
    return isotope;
  }

  function setMode(nextMode) {
    mode = nextMode === "cloud" ? "cloud" : "shell";
    if (selected) rebuild(selected);
  }

  function animate(seconds, reducedMotion) {
    if (!reducedMotion) presentation.rotation.y += selected ? 0.0012 : 0.0018;
    if (!selected) {
      const pulse = 1 + Math.sin(seconds * 2.2) * 0.07;
      presentation.children[1]?.scale.setScalar(pulse);
      return;
    }
    if (mode === "shell" && !reducedMotion) {
      for (const electron of electrons) {
        electron.userData.angle += electron.userData.speed * 0.008;
        electron.position.set(
          Math.cos(electron.userData.angle) * electron.userData.radius,
          0,
          Math.sin(electron.userData.angle) * electron.userData.radius,
        );
      }
    }
  }

  function rotate(deltaX, deltaY) {
    presentation.rotation.y += deltaX * 0.007;
    presentation.rotation.x = THREE.MathUtils.clamp(presentation.rotation.x + deltaY * 0.007, -1.25, 1.25);
  }

  function resetRotation() {
    presentation.rotation.set(-0.12, 0.35, 0);
  }

  resetRotation();
  return { root, rebuild, setMode, animate, rotate, resetRotation, get selected() { return selected; }, get mode() { return mode; } };
}
