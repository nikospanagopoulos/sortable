(() => {
  "use strict";

  const { data, table, searchSort } = window.heroApp;

  // Loads the heroes first, then starts search and sort; a failed load is shown in the page.
  data.loadHeroes().then(
    (heroes) => searchSort.init(heroes),
    (error) =>
      table.showError(
        error instanceof Error
          ? `Unable to load hero records: ${error.message}`
          : "Unable to load hero records.",
      ),
  );
})();