# CLAUDE.md - MVW Kassierer App

## Project overview

MVW Kassierer is a browser-based cashier application designed for club events (Vereinsfeste). It runs entirely in the browser with no server — all data is persisted in `localStorage`. Users can create events, add items to sell, record transactions, and view statistics.

## Architecture

The app is structured as a **Multi-Page Application (MPA)** built with [Hugo](https://gohugo.io/), with seven pages:

| Page | Layout | Purpose |
|---|---|---|
| Cashier | `layouts/index.html` | Main cash register: item grid, transaction recording |
| Create event | `layouts/create/list.html` | New event setup: name, item list, import/export, liability checkbox |
| Edit event | `layouts/edit/list.html` | Edit items of an existing event |
| Settings | `layouts/settings/list.html` | Overview of active event, all events list |
| Statistics | `layouts/stats/list.html` | Revenue, items sold, transaction chart |
| Impressum | `layouts/impressum/list.html` | Legal notice (content from `content/impressum/_index.md`) |
| Haftungsausschluss | `layouts/haftungsausschluss/list.html` | Liability disclaimer (content from `content/haftungsausschluss/_index.md`) |

### Shared JS modules (loaded via `<script>` tags)

- **`src/js/shared/models.js`** — Pure model factories and calculation functions. Exports `Models` namespace.
- **`src/js/shared/storage.js`** — localStorage read/write, event/item/transaction operations. Exports `Store` namespace.
- **`src/js/shared/ui.js`** — Shared UI helpers: `renderSetupItems`, `renderItemGrid`, formatting. Exports `UI` namespace.

Each page script (e.g. `src/js/create/create-app.js`) uses the `Models`, `Store`, and `UI` globals. Compiled/minified output goes to `static/` (and is gitignored).

### Hugo partials

- **`layouts/partials/head.html`** — Shared `<head>` section: meta tags, `<base href>`, CSS link, optional view-transitions script (enabled via `viewTransitions: true` in content frontmatter).
- **`layouts/partials/scripts-shared.html`** — Shared `<script>` tags for the four shared JS modules.

## Key concepts

### localStorage schema

Single key `kassierer_app_v1` storing:
```json
{
  "events": [
    {
      "id": "uuid",
      "name": "string",
      "createdAt": "ISO8601",
      "items": [{ "id": "uuid", "name": "string", "price": 2.5, "color": "#hex" }],
      "transactions": [
        {
          "timestamp": "ISO8601",
          "items": [{ "itemId": "uuid", "quantity": 1 }],
          "total": 2.5,
          "received": 5.0,
          "change": 2.5,
          "tip": 0.0
        }
      ],
      "closed": false
    }
  ],
  "activeEventId": "uuid or null"
}
```

### CSS View Transitions

Navigation between pages uses the [CSS View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) via `@view-transition { navigation: auto; }` in `src/scss/style.scss`.

- **Forward navigation** (default): new page slides in from the right.
- **Back navigation**: set `sessionStorage.setItem('vt-direction', 'back')` before navigating; the destination page reads this and sets `document.documentElement.dataset.direction = 'back'`, triggering the reverse animation.
- Pages that need the view-transitions script set `viewTransitions: true` in their content frontmatter.

### Touch drag-and-drop

Item reordering uses HTML5 drag-and-drop for desktop and manual touch event handling for mobile. The touch logic is implemented in `src/js/create/create-app.js` and `src/js/edit/edit-app.js` using `touchstart`/`touchmove`/`touchend` with `document.elementFromPoint()` to identify the drop target.

### Drag-and-drop reorder pattern

```javascript
function onDropReorder(srcId, dstId) {
  const srcIdx = items.findIndex(i => i.id === srcId);
  const dstIdx = items.findIndex(i => i.id === dstId);
  const moved = items.splice(srcIdx, 1)[0];
  items.splice(dstIdx, 0, moved);
}
```

## File structure

```
/
├── hugo.toml               # Hugo configuration (baseURL, title, enableRobotsTXT)
├── content/                # Hugo content (Markdown frontmatter, body for legal pages)
│   ├── _index.md           # Home/cashier page marker (viewTransitions: true)
│   ├── create/_index.md
│   ├── edit/_index.md
│   ├── settings/_index.md  # viewTransitions: true
│   ├── stats/_index.md
│   ├── impressum/_index.md         # Impressum text (fill in contact details)
│   └── haftungsausschluss/_index.md  # Liability disclaimer
├── layouts/                # Hugo HTML templates
│   ├── index.html          # Cashier page layout
│   ├── create/list.html    # New event creation layout
│   ├── edit/list.html      # Edit event items layout
│   ├── settings/list.html  # Settings layout
│   ├── stats/list.html     # Statistics layout
│   ├── impressum/list.html # Impressum layout
│   ├── haftungsausschluss/list.html
│   ├── robots.txt          # Custom robots.txt template
│   └── partials/
│       ├── head.html           # Shared <head> partial
│       └── scripts-shared.html # Shared <script> tags
├── static/                 # Static assets (committed: favicon; gitignored: compiled CSS/JS)
│   └── favicon.svg
├── src/                    # Source files (edit these)
│   ├── js/
│   │   ├── app.js
│   │   ├── create/create-app.js
│   │   ├── edit/edit-app.js
│   │   ├── settings/settings-app.js
│   │   ├── stats/stats-app.js
│   │   └── shared/
│   │       ├── models.js
│   │       ├── storage.js
│   │       ├── ui.js
│   │       └── paths.js
│   └── scss/
│       └── style.scss
├── scripts/
│   └── build-js.js         # JS minification script (terser) → static/
├── postcss.config.js       # PostCSS: autoprefixer + cssnano
├── CLAUDE.md               # This file
└── tests/
    └── unit.test.js
```

**Note:** `public/` (Hugo output) and `static/css/`, `static/js/`, `static/shared/`, `static/create/`, `static/edit/`, `static/settings/`, `static/stats/` (compiled JS) are all gitignored — they are generated by the build pipeline.

## Development setup

```bash
# Install Hugo (required): https://gohugo.io/installation/
# Install Node.js dependencies
npm install
```

### Lint, validate, test

```bash
# Run all checks (compile assets + Hugo build + lint + validate + test)
npm run build

# Compile only (SCSS → static/css, JS → static/**, Hugo → public/)
npm run compile

# Compile assets only (no Hugo)
npm run build:assets

# Individual checks
node tests/unit.test.js                          # unit tests
npx eslint .                                     # JS linting (src/js/)
npx stylelint src/scss/style.scss               # SCSS linting
npx vnu --skip-non-html public/index.html ...   # HTML validation (after compile)
```

### Build pipeline

1. `npm run build:css` — `src/scss/style.scss` → (sass + PostCSS) → `static/css/style.css`
2. `npm run build:js` — `src/js/**/*.js` → (terser) → `static/**/*.js`
3. `npm run build:hugo` — Hugo reads `layouts/`, `content/`, `static/` → generates `public/`

### Local development

```bash
# Serve with Hugo live-reload (requires Hugo in PATH)
hugo server

# Or serve the compiled public/ directory
cd public && python3 -m http.server
```
