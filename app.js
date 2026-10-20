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
  const PAGE_SIZES = new Set(["10", "20", "50", "100", "all"]);

  const tableBody = document.querySelector("#hero-table-body");
  const pageSizeSelect = document.querySelector("#page-size");
  const previousButton = document.querySelector("#previous-page");
  const nextButton = document.querySelector("#next-page");
  const pageIndicator = document.querySelector("#page-indicator");
  const resultCount = document.querySelector("#result-count");
  const loadError = document.querySelector("#load-error");

  const state = {
    heroes: [],
    visibleHeroes: [],
    page: 1,
    pageSize: 20,
  };

  const asText = (value) =>
    value === null || value === undefined || value === "" ? "" : String(value);
  const displayUnitValue = (value) =>
    Array.isArray(value) ? value[value.length - 1] : value;

  const flattenHero = (hero) => {
    const powerstats = hero.powerstats || {};
    const appearance = hero.appearance || {};
    const biography = hero.biography || {};

    return {
      id: hero.id,
      icon: asText(hero.images && hero.images.xs),
      name: asText(hero.name),
      fullName: asText(biography.fullName),
      powerstats: Object.fromEntries(
        POWERSTATS.map((stat) => [stat, asText(powerstats[stat])]),
      ),
      race: asText(appearance.race),
      gender: asText(appearance.gender),
      height: asText(displayUnitValue(appearance.height)),
      weight: asText(displayUnitValue(appearance.weight)),
      placeOfBirth: asText(biography.placeOfBirth),
      alignment: asText(biography.alignment),
    };
  };

  const makeCell = (value) => {
    const cell = document.createElement("td");
    cell.textContent = value || "—";
    return cell;
  };

  const makeIconCell = (hero) => {
    const cell = document.createElement("td");
    if (!hero.icon) {
      cell.textContent = "—";
      return cell;
    }

    const image = document.createElement("img");
    image.src = hero.icon;
    image.alt = `${hero.name} icon`;
    image.loading = "lazy";
    cell.append(image);
    return cell;
  };

  const renderPage = () => {
    const totalHeroes = state.visibleHeroes.length;
    const totalPages =
      state.pageSize === Infinity
        ? 1
        : Math.max(1, Math.ceil(totalHeroes / state.pageSize));
    state.page = Math.min(state.page, totalPages);

    const start =
      state.pageSize === Infinity ? 0 : (state.page - 1) * state.pageSize;
    const end =
      state.pageSize === Infinity
        ? totalHeroes
        : Math.min(start + state.pageSize, totalHeroes);
    const fragment = document.createDocumentFragment();

    for (const hero of state.visibleHeroes.slice(start, end)) {
      const row = document.createElement("tr");
      row.dataset.heroId = String(hero.id);
      row.append(
        makeIconCell(hero),
        makeCell(hero.name),
        makeCell(hero.fullName),
        ...POWERSTATS.map((stat) => makeCell(hero.powerstats[stat])),
        makeCell(hero.race),
        makeCell(hero.gender),
        makeCell(hero.height),
        makeCell(hero.weight),
        makeCell(hero.placeOfBirth),
        makeCell(hero.alignment),
      );
      fragment.append(row);
    }

    tableBody.replaceChildren(fragment);
    resultCount.textContent =
      `Showing ${totalHeroes === 0 ? 0 : start + 1}–${end} of ${totalHeroes} heroes`;
    pageIndicator.textContent = `Page ${state.page} of ${totalPages}`;
    previousButton.disabled = state.page <= 1;
    nextButton.disabled = state.page >= totalPages;
  };

  pageSizeSelect.addEventListener("change", () => {
    const selectedSize = pageSizeSelect.value;
    if (!PAGE_SIZES.has(selectedSize)) {
      pageSizeSelect.value = "20";
      return;
    }
    state.pageSize = selectedSize === "all" ? Infinity : Number(selectedSize);
    state.page = 1;
    renderPage();
  });

  previousButton.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      renderPage();
    }
  });

  nextButton.addEventListener("click", () => {
    const totalPages =
      state.pageSize === Infinity
        ? 1
        : Math.max(1, Math.ceil(state.visibleHeroes.length / state.pageSize));
    if (state.page < totalPages) {
      state.page += 1;
      renderPage();
    }
  });

  window.heroTable = {
    getHeroes: () => state.heroes,
    setVisibleHeroes: (heroes) => {
      state.visibleHeroes = heroes;
      state.page = 1;
      renderPage();
    },
    render: renderPage,
  };

  const loadHeroes = async () => {
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) {
        throw new Error(`Hero data request failed (${response.status})`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Hero data response was not a list");
      }

      state.heroes = data.map(flattenHero);
      state.visibleHeroes = state.heroes;
      renderPage();
    } catch (error) {
      loadError.hidden = false;
      loadError.textContent =
        error instanceof Error
          ? `Unable to load hero records: ${error.message}`
          : "Unable to load hero records.";
      resultCount.textContent = "Hero records could not be loaded.";
      pageIndicator.textContent = "Page 1 of 1";
      previousButton.disabled = true;
      nextButton.disabled = true;
    }
  };

  loadHeroes();
})();
