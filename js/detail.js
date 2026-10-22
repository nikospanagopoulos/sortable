(() => {
  "use strict";

  const SECTIONS = ["powerstats", "biography", "appearance", "work", "connections"];

  const dialog = document.querySelector("#hero-dialog");
  const tableBody = document.querySelector("#hero-table-body");

  let heroesById = new Map();

  // Turns a key like "placeOfBirth" into a readable label: "Place of birth".
  function makeLabel(key) {
    const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  // Lists are joined with commas; missing values are shown as a dash.
  function formatValue(value) {
    const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    return text === "" || text === "-" ? "—" : text;
  }

  function makeSection(name, fields) {
    const section = document.createElement("section");
    const heading = document.createElement("h3");
    const list = document.createElement("dl");

    heading.textContent = makeLabel(name);
    for (const [key, value] of Object.entries(fields)) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = makeLabel(key);
      description.textContent = formatValue(value);
      list.append(term, description);
    }

    section.append(heading, list);
    return section;
  }

  function makeImage(hero) {
    const image = document.createElement("img");
    image.src = hero.images.lg;
    image.alt = `${hero.name} large portrait`;
    return image;
  }

  function makeContent(hero) {
    const content = document.createElement("div");
    const header = document.createElement("header");
    const title = document.createElement("h2");
    const closeButton = document.createElement("button");
    const body = document.createElement("div");
    const info = document.createElement("div");

    content.className = "hero-detail";
    body.className = "hero-detail-body";
    title.textContent = hero.name;
    closeButton.type = "button";
    closeButton.textContent = "Close";
    closeButton.addEventListener("click", close);

    info.append(
      ...SECTIONS.filter((name) => hero[name]).map((name) =>
        makeSection(name, hero[name]),
      ),
    );
    if (hero.images && hero.images.lg) body.append(makeImage(hero));
    body.append(info);

    header.append(title, closeButton);
    content.append(header, body);
    return content;
  }

  function open(id) {
    const hero = heroesById.get(Number(id));
    if (!hero) return;

    dialog.replaceChildren(makeContent(hero.raw));
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function handleRowClick(event) {
    const row = event.target.closest("tr");
    if (row) open(row.dataset.heroId);
  }

  // A click on the dark backdrop (the dialog itself, not its content) closes the dialog.
  function handleDialogClick(event) {
    if (event.target === dialog) close();
  }

  function init(heroes) {
    heroesById = new Map(heroes.map((hero) => [hero.id, hero]));
    tableBody.addEventListener("click", handleRowClick);
    dialog.addEventListener("click", handleDialogClick);
  }

  window.heroApp = window.heroApp || {};
  window.heroApp.detail = { init, open, close };
})();