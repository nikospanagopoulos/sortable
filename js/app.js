(() => {
  "use strict";

  const { data, table, searchSort, detail, urlState } = window.heroApp;

  // Loads the heroes first, then starts search, sort, the detail view and the URL state; a failed load is shown in the page.
  data.loadHeroes().then(
    (heroes) => {
      searchSort.init(heroes);
      detail.init(heroes);
      urlState.init();
    },
    (error) =>
      table.showError(
        error instanceof Error
          ? `Unable to load hero records: ${error.message}`
          : "Unable to load hero records.",
      ),
  );
})();