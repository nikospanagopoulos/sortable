(() => {
  "use strict";

  const DATA_URL =
    "https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json";
  const POWERSTATS = [
    "intelligence",
    "strength",
    "speed",
    "durability",
    "power",
    "combat",
  ];

  // Conversion factors to the base units: kilograms for weight, centimeters for height.
  const UNIT_FACTORS = { kg: 1, tons: 1000, cm: 1, meters: 100 };

  // Turns a missing value (null, undefined, "" or "-") into "" and everything else into text.
  const asText = (value) =>
    value === null || value === undefined || value === "" || value === "-"
      ? ""
      : String(value);

  // The second item of an array like ["6'8", "203 cm"] is the metric one.
  const displayUnitValue = (value) =>
    Array.isArray(value) ? value[value.length - 1] : value;

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

  // Keeps the text shown in the table and adds the numbers used for sorting and filtering.
  function flattenHero(hero) {
    const powerstats = hero.powerstats || {};
    const appearance = hero.appearance || {};
    const biography = hero.biography || {};

    const heightCm = parseMeasure(displayUnitValue(appearance.height));
    const weightKg = parseMeasure(displayUnitValue(appearance.weight));

    return {
      id: hero.id,
      raw: hero,
      icon: asText(hero.images && hero.images.xs),
      name: asText(hero.name),
      fullName: asText(biography.fullName),
      powerstats: Object.fromEntries(
        POWERSTATS.map((stat) => [stat, asText(powerstats[stat])]),
      ),
      powerstatNumbers: Object.fromEntries(
        POWERSTATS.map((stat) => [stat, Number(powerstats[stat])]),
      ),
      race: asText(appearance.race),
      gender: asText(appearance.gender),
      height: heightCm === null ? "" : asText(displayUnitValue(appearance.height)),
      weight: weightKg === null ? "" : asText(displayUnitValue(appearance.weight)),
      heightCm,
      weightKg,
      placeOfBirth: asText(biography.placeOfBirth),
      alignment: asText(biography.alignment),
    };
  }

  // Downloads the hero list and returns it flattened; throws when the request or the data is bad.
  async function loadHeroes() {
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`Hero data request failed (${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Hero data response was not a list");
    }

    return data.map(flattenHero);
  }

  window.heroApp = window.heroApp || {};
  // flattenHero and parseMeasure are exposed for testing in the console.
  window.heroApp.data = { loadHeroes, flattenHero, parseMeasure };
})();