(() => {
  "use strict";

  const PAGE_SIZES = new Set(["10", "20", "50", "100", "all"]);

  const tableBody = document.querySelector("#hero-table-body");
  const pageSizeSelect = document.querySelector("#page-size");
  const previousButton = document.querySelector("#previous-page");
  const nextButton = document.querySelector("#next-page");
  const pageIndicator = document.querySelector("#page-indicator");
  const resultCount = document.querySelector("#result-count");
  const loadError = document.querySelector("#load-error");

  const state = {
    visibleHeroes: [],
    page: 1,
    pageSize: 20,
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

  // Builds one table row; the powerstats come in the same order as their columns.
  const makeRow = (hero) => {
    const row = document.createElement("tr");
    row.dataset.heroId = String(hero.id);
    row.append(
      makeIconCell(hero),
      makeCell(hero.name),
      makeCell(hero.fullName),
      ...Object.values(hero.powerstats).map(makeCell),
      makeCell(hero.race),
      makeCell(hero.gender),
      makeCell(hero.height),
      makeCell(hero.weight),
      makeCell(hero.placeOfBirth),
      makeCell(hero.alignment),
    );
    return row;
  };

  const getTotalPages = () =>
    state.pageSize === Infinity
      ? 1
      : Math.max(1, Math.ceil(state.visibleHeroes.length / state.pageSize));

  // Draws the current page of the visible heroes and updates the counters and buttons.
  const renderPage = () => {
    const totalHeroes = state.visibleHeroes.length;
    const totalPages = getTotalPages();
    state.page = Math.min(state.page, totalPages);

    const start =
      state.pageSize === Infinity ? 0 : (state.page - 1) * state.pageSize;
    const end =
      state.pageSize === Infinity
        ? totalHeroes
        : Math.min(start + state.pageSize, totalHeroes);

    tableBody.replaceChildren(
      ...state.visibleHeroes.slice(start, end).map(makeRow),
    );
    resultCount.textContent =
      `Showing ${totalHeroes === 0 ? 0 : start + 1}–${end} of ${totalHeroes} heroes`;
    pageIndicator.textContent = `Page ${state.page} of ${totalPages}`;
    previousButton.disabled = state.page <= 1;
    nextButton.disabled = state.page >= totalPages;
  };

  // Replaces the list that is shown and goes back to the first page.
  const setVisibleHeroes = (heroes) => {
    state.visibleHeroes = heroes;
    state.page = 1;
    renderPage();
  };

  // Shows a load error in place of the table and disables the pagination.
  const showError = (message) => {
    loadError.hidden = false;
    loadError.textContent = message;
    resultCount.textContent = "Hero records could not be loaded.";
    pageIndicator.textContent = "Page 1 of 1";
    previousButton.disabled = true;
    nextButton.disabled = true;
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
    if (state.page < getTotalPages()) {
      state.page += 1;
      renderPage();
    }
  });

  window.heroApp = window.heroApp || {};
  window.heroApp.table = { setVisibleHeroes, showError };
})();