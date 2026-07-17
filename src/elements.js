import rawElements from "periodic-table/data.json" with { type: "json" };
import { ATOMIC_MASS_DISPLAY } from "./atomic-masses.js";

export const CATEGORY_META = {
  "alkali metal": { label: "Alkali metal", color: "#ff5f57", prose: "a highly reactive, soft metal with one valence electron" },
  "alkaline earth metal": { label: "Alkaline earth", color: "#ff9f43", prose: "a reactive metal with two valence electrons" },
  "transition metal": { label: "Transition metal", color: "#ffd166", prose: "a dense d-block metal with versatile bonding behavior" },
  "post-transition metal": { label: "Post-transition", color: "#6ee7b7", prose: "a comparatively soft p-block metal" },
  metalloid: { label: "Metalloid", color: "#4de1c1", prose: "an element bridging metallic and nonmetallic behavior" },
  nonmetal: { label: "Reactive nonmetal", color: "#53b9ff", prose: "a reactive nonmetal whose covalent chemistry shapes matter" },
  halogen: { label: "Halogen", color: "#8b7cff", prose: "a reactive salt-forming nonmetal with seven valence electrons" },
  "noble gas": { label: "Noble gas", color: "#d783ff", prose: "a low-reactivity gas with a filled valence shell" },
  lanthanoid: { label: "Lanthanide", color: "#ff7eb6", prose: "a rare-earth f-block metal" },
  actinoid: { label: "Actinide", color: "#ef6ef0", prose: "a radioactive f-block metal" },
  unknown: { label: "Predicted chemistry", color: "#9aa7b8", prose: "a short-lived synthetic element with incompletely measured bulk properties" }
};

const facts = {
  H: "The lightest atom and the principal fuel of stars, it accounts for most ordinary matter by mass in the universe.",
  He: "First identified in the Sun's spectrum, it remains liquid near absolute zero and is essential to cryogenics.",
  Li: "Its high electrochemical potential and low mass make it central to rechargeable battery chemistry.",
  B: "Its electron-deficient bonding produces exceptionally hard ceramics and heat-resistant borosilicate glass.",
  C: "Four valence electrons let it form chains, rings, graphene sheets, diamond lattices, and the molecular framework of life.",
  N: "Atmospheric nitrogen is stabilized by a strong triple bond; biological fixation turns it into usable compounds.",
  O: "A powerful oxidizer and the terminal electron acceptor in aerobic respiration.",
  Ne: "Electrical excitation gives this noble gas its characteristic orange-red emission.",
  Na: "A soft, reactive metal whose ions regulate fluid balance and electrical signaling in living cells.",
  Al: "A thin self-healing oxide layer protects this light metal from further corrosion.",
  Si: "Its controllable semiconductor behavior underpins integrated circuits and photovoltaic cells.",
  P: "Phosphate groups store chemical energy, structure DNA, and mineralize bone.",
  Cl: "Chloride is abundant in seawater, while elemental chlorine is a powerful oxidizing disinfectant.",
  Fe: "Its variable oxidation states support steelmaking, catalysis, and oxygen transport in hemoglobin.",
  Cu: "Excellent conductivity and a protective patina make it useful in wiring, plumbing, and architecture.",
  Br: "One of only two elements liquid under standard ambient conditions.",
  Ag: "It has the highest electrical conductivity of any element and readily forms light-sensitive halides.",
  I: "Thyroid hormones require this halogen to regulate metabolism and development.",
  Xe: "Though a noble gas, it forms stable compounds with highly electronegative fluorine and oxygen.",
  W: "Its exceptionally high melting point suits cutting tools, high-temperature alloys, and filaments.",
  Pt: "A corrosion-resistant catalyst used in fuel cells, chemical synthesis, and pollution control.",
  Au: "Relativistic effects help produce its distinctive color and exceptional resistance to oxidation.",
  Hg: "The only metal liquid at standard ambient conditions; its vapor and compounds are toxic.",
  U: "Its fissile isotope uranium-235 can sustain a nuclear chain reaction.",
  Og: "Only a few atoms have been produced; relativistic effects may make it less inert than lighter noble gases."
};

const periodRows = [
  ["H", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "He"],
  ["Li", "Be", "", "", "", "", "", "", "", "", "", "", "B", "C", "N", "O", "F", "Ne"],
  ["Na", "Mg", "", "", "", "", "", "", "", "", "", "", "Al", "Si", "P", "S", "Cl", "Ar"],
  ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
  ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
  ["Cs", "Ba", "", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
  ["Fr", "Ra", "", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]
];

const tablePositions = new Map();
periodRows.forEach((row, period) => row.forEach((symbol, group) => {
  if (symbol) tablePositions.set(symbol, { period: period + 1, group: group + 1, tableRow: period });
}));

"La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu".split(" ").forEach((symbol, index) => {
  tablePositions.set(symbol, { period: 6, group: index === 0 ? 3 : null, tableRow: 7, tableColumn: index + 2 });
});
"Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr".split(" ").forEach((symbol, index) => {
  tablePositions.set(symbol, { period: 7, group: index === 0 ? 3 : null, tableRow: 8, tableColumn: index + 2 });
});

const nobleCores = {
  He: "1s2",
  Ne: "1s2 2s2 2p6",
  Ar: "1s2 2s2 2p6 3s2 3p6",
  Kr: "1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6",
  Xe: "1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6",
  Rn: "1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6 6s2 4f14 5d10 6p6"
};

const superscripts = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

function prettyConfiguration(configuration) {
  return configuration.replace(/(\d+)$/g, (value) => value.split("").map((digit) => superscripts[digit]).join(""))
    .replace(/(\d+)(?=\s)/g, (value) => value.split("").map((digit) => superscripts[digit]).join(""));
}

export function expandElectronConfiguration(configuration) {
  return configuration.replace(/^\[([A-Za-z]+)\]\s*/, (_, core) => (nobleCores[core] || "") + " ").trim();
}

function shellPopulation(configuration) {
  const expanded = expandElectronConfiguration(configuration);
  const shells = [0, 0, 0, 0, 0, 0, 0];
  for (const match of expanded.matchAll(/(\d)[spdf](\d+)/g)) shells[Number(match[1]) - 1] += Number(match[2]);
  return shells.filter((count, index) => count > 0 || shells.slice(index + 1).some(Boolean));
}

function normalizeCategory(value, symbol, atomicNumber) {
  if (atomicNumber >= 109) return "unknown";
  if (symbol === "Lr") return "actinoid";
  if (symbol === "Po") return "post-transition metal";
  if (value === "metal") return "post-transition metal";
  if (value === "lanthanoid" || value === "actinoid") return value;
  return CATEGORY_META[value] ? value : "unknown";
}

function orbitalBlock(layout, symbol, atomicNumber) {
  if (symbol === "He" || layout.group === 1 || layout.group === 2) return "s";
  if (symbol === "La" || symbol === "Ac") return "d";
  if ((atomicNumber >= 58 && atomicNumber <= 71) || (atomicNumber >= 90 && atomicNumber <= 103)) return "f";
  if (layout.group >= 13) return "p";
  return "d";
}

export const elements = rawElements.map((raw) => {
  const layout = tablePositions.get(raw.symbol);
  const category = normalizeCategory(raw.groupBlock, raw.symbol, raw.atomicNumber);
  const meta = CATEGORY_META[category];
  const year = raw.yearDiscovered === "Ancient" ? "known since antiquity" : "identified in " + raw.yearDiscovered;
  const measured = raw.electronegativity ? " Its Pauling electronegativity is " + raw.electronegativity + "." : "";
  const conventionProse = raw.symbol === "La"
    ? "a rare-earth d-block metal placed at the head of the lanthanoid series"
    : raw.symbol === "Ac"
      ? "a radioactive d-block metal placed at the head of the actinoid series"
      : meta.prose;
  const description = facts[raw.symbol] || raw.name + " is " + conventionProse + ", " + year + "." + measured;
  return {
    ...raw,
    atomicMass: ATOMIC_MASS_DISPLAY[raw.symbol],
    standardState: raw.atomicNumber >= 109 || raw.symbol === "At" ? "unknown" : raw.standardState,
    category,
    categoryLabel: meta.label,
    color: meta.color,
    description,
    electronDisplay: prettyConfiguration(raw.electronicConfiguration),
    orbitals: [...expandElectronConfiguration(raw.electronicConfiguration).matchAll(/(\d)([spdf])(\d+)/g)]
      .map(([, shell, type, electrons]) => ({ shell: Number(shell), type, electrons: Number(electrons) })),
    shells: shellPopulation(raw.electronicConfiguration),
    block: orbitalBlock(layout, raw.symbol, raw.atomicNumber),
    period: layout.period,
    group: layout.group,
    tableRow: layout.tableRow,
    tableColumn: layout.tableColumn ?? Math.max((layout.group || 3) - 1, 0)
  };
});

export function getElement(symbol) {
  return elements.find((element) => element.symbol === symbol);
}
