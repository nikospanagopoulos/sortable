// Conversion factors to the base units: kilograms for weight, centimeters for height.
const UNIT_FACTORS = { kg: 1, tons: 1000, cm: 1, meters: 100 };

// Converts text like "90,000 tons" to a number in kg or cm; returns null when the value is missing.
function parseMeasure(text) {
  if (typeof text !== "string") return null;

  const match = text
    .replace(/,/g, "")
    .match(/^\s*([\d.]+)\s*([a-z]+)\s*$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const factor = UNIT_FACTORS[match[2].toLowerCase()];
  if (factor === undefined || !(value > 0)) return null;

  return value * factor;
}

// Returns a new list of heroes with numeric fields added for sorting and filtering; the originals are untouched.
function prepareHeroes(heroes) {
  return heroes.map((hero) => ({
    ...hero,
    heightCm: parseMeasure(hero.height),
    weightKg: parseMeasure(hero.weight),
    powerstatNumbers: Object.fromEntries(
      Object.entries(hero.powerstats).map(([stat, value]) => [stat, Number(value)])
    ),
  }));
}