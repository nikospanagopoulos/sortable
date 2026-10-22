const test = require("node:test");
const assert = require("node:assert");
const { loadApp } = require("./load-app");

const { data } = loadApp(["data.js"]);
const { searchSort } = loadApp(["data.js", "search-sort.js"]);

// A hero in the shape of all.json; only the fields a test cares about need to be given.
function makeRawHero(id, name, { powerstats = {}, appearance = {}, biography = {} } = {}) {
  return {
    id,
    name,
    powerstats: { intelligence: 50, strength: 50, speed: 50, durability: 50, power: 50, combat: 50, ...powerstats },
    appearance: { gender: "Male", race: "Human", height: ["6'0", "183 cm"], weight: ["180 lb", "82 kg"], ...appearance },
    biography: { fullName: `${name} Full`, placeOfBirth: "Gotham City", alignment: "good", ...biography },
    images: { xs: `${id}-xs.jpg`, lg: `${id}-lg.jpg` },
  };
}

const makeHero = (...args) => data.flattenHero(makeRawHero(...args));
// The app runs in its own VM, so its arrays and objects are copied to plain ones before deepStrictEqual.
const plain = (value) => JSON.parse(JSON.stringify(value));
const names = (heroes) => Array.from(heroes, (hero) => hero.name);
const parseQuery = (text) => plain(searchSort.parseQuery(text));

// ---------- parseMeasure ----------

test("parseMeasure: kilograms and centimeters stay as they are", () => {
  assert.strictEqual(data.parseMeasure("441 kg"), 441);
  assert.strictEqual(data.parseMeasure("203 cm"), 203);
});

test("parseMeasure: tons become kilograms, meters become centimeters", () => {
  assert.strictEqual(data.parseMeasure("90 tons"), 90000);
  assert.strictEqual(data.parseMeasure("62.5 meters"), 6250);
});

test("parseMeasure: commas and spaces are ignored, case does not matter", () => {
  assert.strictEqual(data.parseMeasure("90,000 tons"), 90000000);
  assert.strictEqual(data.parseMeasure("  12 KG "), 12);
});

test("parseMeasure: missing or unusable values give null", () => {
  for (const value of ["-", "", "0 kg", "abc", "10 parsecs", null, undefined, 42]) {
    assert.strictEqual(data.parseMeasure(value), null, `value: ${value}`);
  }
});

// ---------- flattenHero ----------

test("flattenHero: keeps the table text and adds numbers", () => {
  const hero = makeHero(1, "A-Bomb", { appearance: { height: ["6'8", "203 cm"], weight: ["980 lb", "441 kg"] } });
  assert.strictEqual(hero.height, "203 cm");
  assert.strictEqual(hero.heightCm, 203);
  assert.strictEqual(hero.weight, "441 kg");
  assert.strictEqual(hero.weightKg, 441);
  assert.strictEqual(hero.powerstatNumbers.strength, 50);
  assert.strictEqual(hero.raw.id, 1);
});

test("flattenHero: missing values become empty text and null numbers", () => {
  const hero = makeHero(2, "Ghost", {
    appearance: { race: "-", weight: ["- lb", "0 kg"] },
    biography: { placeOfBirth: "-" },
  });
  assert.strictEqual(hero.race, "");
  assert.strictEqual(hero.placeOfBirth, "");
  assert.strictEqual(hero.weight, "");
  assert.strictEqual(hero.weightKg, null);
});

// ---------- loadHeroes ----------

test("loadHeroes: returns the flattened heroes", async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => [makeRawHero(1, "A")] });
  const app = loadApp(["data.js"], fakeFetch);
  const heroes = await app.data.loadHeroes();
  assert.strictEqual(heroes.length, 1);
  assert.strictEqual(heroes[0].name, "A");
});

test("loadHeroes: a failed request throws", async () => {
  const app = loadApp(["data.js"], async () => ({ ok: false, status: 404 }));
  await assert.rejects(app.data.loadHeroes(), /request failed \(404\)/);
});

test("loadHeroes: data that is not a list throws", async () => {
  const app = loadApp(["data.js"], async () => ({ ok: true, json: async () => ({}) }));
  await assert.rejects(app.data.loadHeroes(), /not a list/);
});

// ---------- sorting ----------

test("compareValues: numbers and text, ascending and descending", () => {
  assert.ok(searchSort.compareValues(1, 2, "asc") < 0);
  assert.ok(searchSort.compareValues(1, 2, "desc") > 0);
  assert.ok(searchSort.compareValues("a", "b", "asc") < 0);
  assert.strictEqual(searchSort.compareValues(5, 5, "asc"), 0);
});

test("compareValues: missing values (null) are last in both directions", () => {
  assert.strictEqual(searchSort.compareValues(null, 5, "asc"), 1);
  assert.strictEqual(searchSort.compareValues(null, 5, "desc"), 1);
  assert.strictEqual(searchSort.compareValues(5, null, "asc"), -1);
  assert.strictEqual(searchSort.compareValues(5, null, "desc"), -1);
  assert.strictEqual(searchSort.compareValues(null, null, "asc"), 0);
});

test("getSortValue: powerstats are numbers, weight is in kg, text is lowercase", () => {
  const hero = makeHero(7, "Thor", { powerstats: { strength: 100 }, appearance: { weight: ["1 ton", "2 tons"] } });
  assert.strictEqual(searchSort.getSortValue(hero, "strength"), 100);
  assert.strictEqual(searchSort.getSortValue(hero, "weight"), 2000);
  assert.strictEqual(searchSort.getSortValue(hero, "name"), "thor");
  assert.strictEqual(searchSort.getSortValue(hero, "icon"), 7);
});

test("getSortValue: empty text and unknown numbers give null", () => {
  const hero = makeHero(8, "Nobody", { appearance: { race: "-", weight: ["-", "-"] } });
  assert.strictEqual(searchSort.getSortValue(hero, "race"), null);
  assert.strictEqual(searchSort.getSortValue(hero, "weight"), null);
});

test("sortHeroes: numeric sort is numeric, not alphabetical", () => {
  const heroes = [
    makeHero(1, "Low", { powerstats: { strength: 9 } }),
    makeHero(2, "High", { powerstats: { strength: 100 } }),
    makeHero(3, "Mid", { powerstats: { strength: 20 } }),
  ];
  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "strength", "asc")), ["Low", "Mid", "High"]);
  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "strength", "desc")), ["High", "Mid", "Low"]);
});

test("sortHeroes: missing weights are last, units are compared fairly, input is not changed", () => {
  const heroes = [
    makeHero(1, "Unknown", { appearance: { weight: ["-", "-"] } }),
    makeHero(2, "Giant", { appearance: { weight: ["x", "90 tons"] } }),
    makeHero(3, "Human", { appearance: { weight: ["x", "80 kg"] } }),
  ];
  const before = names(heroes);

  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "weight", "asc")), ["Human", "Giant", "Unknown"]);
  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "weight", "desc")), ["Giant", "Human", "Unknown"]);
  assert.deepStrictEqual(names(heroes), before);
});

test("sortHeroes: the icon column sorts by id", () => {
  const heroes = [makeHero(3, "C"), makeHero(1, "A"), makeHero(2, "B")];
  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "icon", "asc")), ["A", "B", "C"]);
  assert.deepStrictEqual(names(searchSort.sortHeroes(heroes, "icon", "desc")), ["C", "B", "A"]);
});

// ---------- parseQuery ----------

test("parseQuery: an empty query has no conditions", () => {
  assert.deepStrictEqual(parseQuery(""), []);
  assert.deepStrictEqual(parseQuery("   "), []);
});

test("parseQuery: plain words become one name search", () => {
  assert.deepStrictEqual(parseQuery("iron man"), [
    { field: "name", operator: "include", value: "iron man" },
  ]);
});

test("parseQuery: every operator", () => {
  const parse = (text) => parseQuery(text)[0];
  assert.deepStrictEqual(parse("race:human"), { field: "race", operator: "include", value: "human" });
  assert.deepStrictEqual(parse("race:!human"), { field: "race", operator: "exclude", value: "human" });
  assert.deepStrictEqual(parse("strength:>80"), { field: "strength", operator: "greater", value: "80" });
  assert.deepStrictEqual(parse("strength:<30"), { field: "strength", operator: "less", value: "30" });
  assert.deepStrictEqual(parse("strength:=100"), { field: "strength", operator: "equal", value: "100" });
  assert.deepStrictEqual(parse("strength:!=100"), { field: "strength", operator: "notEqual", value: "100" });
});

test("parseQuery: quotes keep a value with spaces together", () => {
  assert.deepStrictEqual(parseQuery('placeOfBirth:"new york"'), [
    { field: "placeOfBirth", operator: "include", value: "new york" },
  ]);
});

test("parseQuery: field names ignore letter case, unknown fields are plain text", () => {
  assert.strictEqual(parseQuery("RACE:Human")[0].field, "race");
  assert.deepStrictEqual(parseQuery("foo:bar"), [
    { field: "name", operator: "include", value: "foo:bar" },
  ]);
});

test("parseQuery: a field with no value yet is ignored", () => {
  assert.deepStrictEqual(parseQuery("race:"), []);
  assert.deepStrictEqual(parseQuery("strength:>"), []);
});

test("parseQuery: several conditions at once", () => {
  const conditions = parseQuery("batman race:human strength:>50");
  assert.strictEqual(conditions.length, 3);
});

// ---------- matchesCondition and filterHeroes ----------

const heroes = [
  makeHero(1, "Batman", { powerstats: { strength: 26 }, appearance: { race: "Human", weight: ["x", "95 kg"] } }),
  makeHero(2, "Superman", { powerstats: { strength: 100 }, appearance: { race: "Kryptonian", weight: ["x", "107 kg"] } }),
  makeHero(3, "Hulk", { powerstats: { strength: 100 }, appearance: { race: "Human / Radiation", weight: ["x", "630 kg"] } }),
  makeHero(4, "Mystery", { powerstats: { strength: 10 }, appearance: { race: "-", weight: ["-", "-"] } }),
];
const filter = (query) => names(searchSort.filterHeroes(heroes, query));

test("filterHeroes: an empty query keeps everyone", () => {
  assert.strictEqual(searchSort.filterHeroes(heroes, "").length, 4);
});

test("filterHeroes: name search ignores letter case and surrounding spaces", () => {
  assert.deepStrictEqual(filter("  MAN "), ["Batman", "Superman"]);
  assert.deepStrictEqual(filter("zzzz"), []);
});

test("filterHeroes: include and exclude on text", () => {
  assert.deepStrictEqual(filter("race:human"), ["Batman", "Hulk"]);
  assert.deepStrictEqual(filter("race:!human"), ["Superman", "Mystery"]);
});

test("filterHeroes: exact match on text", () => {
  assert.deepStrictEqual(filter("race:=human"), ["Batman"]);
  assert.deepStrictEqual(filter("race:!=human"), ["Superman", "Hulk", "Mystery"]);
});

test("filterHeroes: numbers", () => {
  assert.deepStrictEqual(filter("strength:>50"), ["Superman", "Hulk"]);
  assert.deepStrictEqual(filter("strength:<26"), ["Mystery"]);
  assert.deepStrictEqual(filter("strength:=100"), ["Superman", "Hulk"]);
  assert.deepStrictEqual(filter("strength:100"), ["Superman", "Hulk"]);
  assert.deepStrictEqual(filter("strength:!=100"), ["Batman", "Mystery"]);
});

test("filterHeroes: weight is compared in kilograms", () => {
  assert.deepStrictEqual(filter("weight:>100"), ["Superman", "Hulk"]);
  assert.deepStrictEqual(filter("weight:<100"), ["Batman"]);
});

test("filterHeroes: a missing value only fits the negative operators", () => {
  assert.ok(!filter("race:human").includes("Mystery"));
  assert.ok(!filter("weight:>1").includes("Mystery"));
  assert.ok(filter("race:!human").includes("Mystery"));
  assert.ok(filter("weight:!=95").includes("Mystery"));
});

test("filterHeroes: all conditions must match", () => {
  assert.deepStrictEqual(filter("race:human strength:>50"), ["Hulk"]);
  assert.deepStrictEqual(filter("man race:!human strength:=100"), ["Superman"]);
});

test("filterHeroes: > and < on text match nobody, a non-number matches nobody", () => {
  assert.deepStrictEqual(filter("race:>human"), []);
  assert.deepStrictEqual(filter("strength:>abc"), []);
});