(() => {
  "use strict";

  // Table column order, used to give every header its key.
  const COLUMN_KEYS = [
    "icon",
    "name",
    "fullName",
    "intelligence",
    "strength",
    "speed",
    "durability",
    "power",
    "combat",
    "race",
    "gender",
    "height",
    "weight",
    "placeOfBirth",
    "alignment",
  ];
  const NUMERIC_FIELDS = { height: "heightCm", weight: "weightKg" };

  const searchInput = document.querySelector("#search-input");
  const tableHead = document.querySelector("#hero-table thead");

  const sortState = { key: "name", direction: "asc" };
  let searchQuery = "";
  let allHeroes = [];
  const changeListeners = [];

  // Returns the value used to compare a hero on a column: a number, a lowercase string, or null when missing.
  function getSortValue(hero, key) {
    if (key === "icon") return hero.id;
    if (key in hero.powerstatNumbers) return hero.powerstatNumbers[key];
    if (key in NUMERIC_FIELDS) return hero[NUMERIC_FIELDS[key]];

    const text = hero[key];
    if (typeof text !== "string") return null;

    const cleaned = text.trim();
    if (cleaned === "" || cleaned === "-") return null;

    return cleaned.toLowerCase();
  }

  // Compares two sort values; missing values (null) always come last, whatever the direction.
  function compareValues(a, b, direction) {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;

    const sign = direction === "desc" ? -1 : 1;
    const result = typeof a === "number" ? a - b : a.localeCompare(b);

    return result * sign;
  }

  // Returns a new list of heroes sorted by the given column and direction; the original list is not changed.
  function sortHeroes(heroes, key, direction) {
    return [...heroes].sort((heroA, heroB) =>
      compareValues(getSortValue(heroA, key), getSortValue(heroB, key), direction)
    );
  }

  // Sorts ascending on a new column; flips the direction when the same column is clicked again.
  function toggleSort(key) {
    if (sortState.key === key) {
      sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    } else {
      sortState.key = key;
      sortState.direction = "asc";
    }
  }

  // Lowercase column names mapped to their keys, so "placeofbirth" and "placeOfBirth" both work; the icon is not searchable.
  const SEARCH_FIELDS = Object.fromEntries(
    COLUMN_KEYS.filter((key) => key !== "icon").map((key) => [key.toLowerCase(), key])
  );

  // Splits the query on spaces, but keeps quoted text like placeOfBirth:"new york" together.
  const TOKEN_PATTERN = /(?:[^\s"]+|"[^"]*"?)+/g;

  // What a value can start with; "!=" must come before "!".
  const OPERATOR_PREFIXES = [
    ["!=", "notEqual"],
    [">", "greater"],
    ["<", "less"],
    ["=", "equal"],
    ["!", "exclude"],
  ];

  // Splits a "field:value" token; returns null when the token is plain text or the field is unknown.
  function splitFieldToken(token) {
    const colon = token.indexOf(":");
    if (colon === -1) return null;

    const field = SEARCH_FIELDS[token.slice(0, colon).toLowerCase()];
    if (!field) return null;

    return { field, rawValue: token.slice(colon + 1).replace(/"/g, "") };
  }

  // Reads the operator at the start of a value: ">80" gives { operator: "greater", value: "80" }.
  function parseOperator(rawValue) {
    const prefix = OPERATOR_PREFIXES.find(([symbol]) => rawValue.startsWith(symbol));
    if (!prefix) return { operator: "include", value: rawValue.trim() };

    const [symbol, operator] = prefix;
    return { operator, value: rawValue.slice(symbol.length).trim() };
  }

  // Turns the search text into conditions; plain words together become one name search.
  function parseQuery(text) {
    const conditions = [];
    const plainWords = [];

    for (const token of text.match(TOKEN_PATTERN) ?? []) {
      const fieldToken = splitFieldToken(token);
      if (!fieldToken) {
        plainWords.push(token.replace(/"/g, ""));
        continue;
      }

      const { operator, value } = parseOperator(fieldToken.rawValue);
      if (value !== "") conditions.push({ field: fieldToken.field, operator, value });
    }

    if (plainWords.length > 0) {
      conditions.push({ field: "name", operator: "include", value: plainWords.join(" ") });
    }
    return conditions;
  }

  function matchesNumber(heroValue, operator, value) {
    const target = Number(value);

    switch (operator) {
      case "greater":
        return heroValue > target;
      case "less":
        return heroValue < target;
      case "notEqual":
      case "exclude":
        return heroValue !== target;
      default:
        return heroValue === target;
    }
  }

  function matchesText(heroValue, operator, value) {
    const target = value.toLowerCase();

    switch (operator) {
      case "include":
        return heroValue.includes(target);
      case "exclude":
        return !heroValue.includes(target);
      case "equal":
        return heroValue === target;
      case "notEqual":
        return heroValue !== target;
      default:
        return false; // greater and less only make sense for numbers
    }
  }

  // True when the hero fits one condition; a missing value only fits "exclude" and "notEqual".
  function matchesCondition(hero, { field, operator, value }) {
    const heroValue = getSortValue(hero, field);
    if (heroValue === null) return operator === "exclude" || operator === "notEqual";

    return typeof heroValue === "number"
      ? matchesNumber(heroValue, operator, value)
      : matchesText(heroValue, operator, value);
  }

  // Returns the heroes that fit every condition of the query; an empty query keeps everyone.
  function filterHeroes(heroes, query) {
    const conditions = parseQuery(query);
    if (conditions.length === 0) return heroes;

    return heroes.filter((hero) =>
      conditions.every((condition) => matchesCondition(hero, condition))
    );
  }

  // Marks the sorted header with aria-sort so the stylesheet can show the direction.
  function updateSortIndicators() {
    for (const header of tableHead.querySelectorAll("th")) {
      const isActive = header.dataset.key === sortState.key;
      const direction = sortState.direction === "asc" ? "ascending" : "descending";
      header.setAttribute("aria-sort", isActive ? direction : "none");
    }
  }

  // Filters first (fewer rows to sort), sorts the result and hands it to the table.
  function updateView() {
    if (allHeroes.length === 0) return;

    const filtered = filterHeroes(allHeroes, searchQuery);
    const sorted = sortHeroes(filtered, sortState.key, sortState.direction);
    window.heroApp.table.setVisibleHeroes(sorted);
    changeListeners.forEach((listener) => listener());
  }

  // Returns the current search text and sort, so other modules (like the URL) can save them.
  function getState() {
    return { query: searchQuery, key: sortState.key, direction: sortState.direction };
  }

  // Restores a saved search and sort; an unknown column is ignored.
  function setState({ query, key, direction }) {
    if (COLUMN_KEYS.includes(key)) {
      sortState.key = key;
      sortState.direction = direction === "desc" ? "desc" : "asc";
    }
    searchQuery = query ?? "";
    searchInput.value = searchQuery;
    updateSortIndicators();
    updateView();
  }

  // Calls the listener every time the shown list changes.
  function onChange(listener) {
    changeListeners.push(listener);
  }

  function handleSearchInput(event) {
    searchQuery = event.target.value;
    updateView();
  }

  function handleHeaderClick(event) {
    const header = event.target.closest("th");
       if (!header || !header.dataset.key) return;
    toggleSort(header.dataset.key);
    updateSortIndicators();
    updateView();
  }

  // Receives the flattened heroes, connects the events and shows the first sorted view.
  function init(heroes) {
    allHeroes = heroes;

    tableHead.querySelectorAll("th").forEach((header, index) => {
      header.dataset.key = COLUMN_KEYS[index];
    });

    searchQuery = searchInput.value;
    searchInput.addEventListener("input", handleSearchInput);
    tableHead.addEventListener("click", handleHeaderClick);

    updateSortIndicators();
    updateView();
  }

  window.heroApp = window.heroApp || {};
  // The other functions are exposed for testing in the console.
  window.heroApp.searchSort = {
    init,
    getState,
    setState,
    onChange,
    getSortValue,
    compareValues,
    sortHeroes,
    parseQuery,
    matchesCondition,
    filterHeroes,
  };
})();