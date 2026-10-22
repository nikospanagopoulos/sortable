(() => {
  "use strict";

  const { searchSort, detail } = window.heroApp;

  const DEFAULT_KEY = "name";
  const DEFAULT_DIRECTION = "asc";

  // Applies the search, sort and open hero found in the address bar.
  function restoreFromUrl() {
    const params = new URLSearchParams(window.location.search);

    searchSort.setState({
      query: params.get("q") ?? "",
      key: params.get("sort") ?? DEFAULT_KEY,
      direction: params.get("dir") ?? DEFAULT_DIRECTION,
    });
    if (params.has("hero")) detail.open(params.get("hero"));
  }

  // Writes the current state to the address bar; default values are left out to keep the URL short.
  function saveToUrl() {
    const { query, key, direction } = searchSort.getState();
    const openId = detail.getOpenId();
    const params = new URLSearchParams();

    if (query !== "") params.set("q", query);
    if (key !== DEFAULT_KEY || direction !== DEFAULT_DIRECTION) {
      params.set("sort", key);
      params.set("dir", direction);
    }
    if (openId !== null) params.set("hero", openId);

    const queryString = params.toString();
    const url = queryString === "" ? window.location.pathname : `?${queryString}`;
    window.history.replaceState(null, "", url);
  }

  function init() {
    restoreFromUrl();
    searchSort.onChange(saveToUrl);
    detail.onChange(saveToUrl);
  }

  window.heroApp = window.heroApp || {};
  window.heroApp.urlState = { init };
})();