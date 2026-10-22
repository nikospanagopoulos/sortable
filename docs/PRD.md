# Superhero Database 🦸‍♂️💀

> *"Finally, a way to keep track of all those spandex-wearing nuisances."*

A vanilla JS web app that fetches, displays, filters, and sorts data on 700+ superheroes — no frameworks, no libraries, just pure spite and JavaScript.

---

## Features

- **Table display** — Shows icon, name, full name, powerstats, race, gender, height, weight, place of birth, and alignment
- **Pagination** — Choose page size: 10, 20 (default), 50, 100, or All
- **Live search** — Filters results by name on every keystroke, no button needed
- **Sorting** — Click any column header to sort ascending; click again to toggle descending. Missing values always sort last. Numeric strings (e.g. `"78 kg"`) sort numerically
- **Detail view** — Click any hero row to see full details and a large image
- **URL state** — Search term, active filters, sort state, page, and selected hero are all reflected in the URL for easy sharing
- **Field-specific search** — Target your search to a specific column
- **Custom search operators** — `include`, `exclude`, `fuzzy`, `=`, `!=`, `>`, `<` (works on numeric fields like weight and height)

---

## Getting Started

No build step required.

```bash
# Clone the repo
git clone <repo-url>
cd sortable

# Serve locally (any static file server works)
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Data Source

Heroes are fetched from the [Superhero API](https://github.com/akabab/superhero-api):

```
https://rawcdn.githack.com/akabab/superhero-api/0.2.0/api/all.json
```

---

## Project Structure

```
sortable/
├── index.html       # Main HTML shell
├── style.css        # Styles
├── app.js           # All application logic
└── README.md
```

---

## Search Operators

| Operator | Example | Description |
|----------|---------|-------------|
| `include` (default) | `man` | Name contains "man" |
| `exclude` | `exclude:bat` | Name does not contain "bat" |
| `fuzzy` | `fuzzy:spder` | Fuzzy match (typo-tolerant) |
| `=` | `alignment=good` | Exact match |
| `!=` | `race!=Human` | Not equal |
| `>` | `weight>100` | Greater than (numeric) |
| `<` | `height<180` | Less than (numeric) |

---

## Notes

- All filtering, sorting, and pagination happen client-side for maximum speed
- The app works entirely offline after the initial data fetch (data is cached by the browser)
