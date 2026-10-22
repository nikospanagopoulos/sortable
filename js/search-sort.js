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

  // True when the hero's name contains the search text, ignoring case and surrounding spaces.
  function matchesName(hero, query) {
    return hero.name.toLowerCase().includes(query.trim().toLowerCase());
  }

  // Returns the heroes whose name matches the query; an empty query keeps everyone.
  function filterHeroes(heroes, query) {
    if (query.trim() === "") return heroes;
    return heroes.filter((hero) => matchesName(hero, query));
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
  window.heroApp.searchSort = { init, getSortValue, compareValues, sortHeroes, filterHeroes };
})();