// Representative nuclides used by the central atom visualization.
// Natural elements use the isotope with the greatest listed isotopic composition
// in NIST's Atomic Weights and Isotopic Compositions database. Elements without a
// natural-abundance entry use the bracketed nuclide on IUPAC's periodic table.
export const REPRESENTATIVE_ISOTOPE_SOURCE = Object.freeze({
  natural: "NIST Atomic Weights and Isotopic Compositions",
  naturalUrl: "https://www.nist.gov/pml/atomic-weights-and-isotopic-compositions-relative-atomic-masses",
  radioactive: "IUPAC Periodic Table of the Elements (4 May 2022)",
  radioactiveUrl: "https://iupac.org/what-we-do/periodic-table-of-elements/",
});

const massNumbers = [
  1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40,
  39, 40, 45, 48, 51, 52, 55, 56, 59, 58, 63, 64, 69, 74, 75, 80, 79, 84,
  85, 88, 89, 90, 93, 98, 97, 102, 103, 106, 107, 114, 115, 120, 121, 130,
  127, 132, 133, 138, 139, 140, 141, 142, 145, 152, 153, 158, 159, 164,
  165, 166, 169, 174, 175, 180, 181, 184, 187, 192, 193, 195, 197, 202,
  205, 208, 209, 209, 210, 222, 223, 226, 227, 232, 231, 238, 237, 244,
  243, 247, 247, 251, 252, 257, 258, 259, 262, 267, 268, 269, 270, 269,
  277, 281, 282, 285, 286, 290, 290, 293, 294, 294,
];

const naturalAtomicNumbers = new Set([
  ...Array.from({ length: 42 }, (_, index) => index + 1).filter((number) => number !== 43),
  ...Array.from({ length: 40 }, (_, index) => index + 44).filter((number) => number !== 61),
  90, 91, 92,
]);

export const REPRESENTATIVE_ISOTOPE_MASS = Object.freeze(
  Object.fromEntries(massNumbers.map((massNumber, index) => [index + 1, massNumber])),
);

export function representativeIsotope(element) {
  const atomicNumber = Number(element.atomicNumber);
  const massNumber = REPRESENTATIVE_ISOTOPE_MASS[atomicNumber];
  if (!massNumber) throw new RangeError("No representative isotope for atomic number " + atomicNumber);
  const natural = naturalAtomicNumbers.has(atomicNumber);
  return Object.freeze({
    symbol: element.symbol,
    notation: massNumber + "-" + element.name,
    massNumber,
    protons: atomicNumber,
    neutrons: massNumber - atomicNumber,
    electrons: atomicNumber,
    basis: natural ? "most abundant naturally occurring isotope" : "IUPAC bracketed representative nuclide",
    source: natural ? REPRESENTATIVE_ISOTOPE_SOURCE.natural : REPRESENTATIVE_ISOTOPE_SOURCE.radioactive,
    sourceUrl: natural ? REPRESENTATIVE_ISOTOPE_SOURCE.naturalUrl : REPRESENTATIVE_ISOTOPE_SOURCE.radioactiveUrl,
  });
}
