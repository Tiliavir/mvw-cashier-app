# CLAUDE.md – MVW Kassierer App

## Project overview

MVW Kassierer is a browser-based cashier application designed for club events (Vereinsfeste). It runs entirely in the browser with no server — all data is persisted in `localStorage`. Users can create events, add items to sell, record transactions, and view statistics.

## Architecture

The app is structured as a **Multi-Page Application (MPA)** with five pages:

| Page | File | Purpose |
|---|---|---|
| Cashier | `index.html` + `app.js` | Main cash register: item grid, transaction recording |
| Create event | `create.html` + `create-app.js` | New event setup: name, item list, import/export |
| Edit event | `edit.html` + `edit-app.js` | Edit items of an existing event |
| Settings | `settings.html` + `settings-app.js` | Overview of active event, all events list |
| Statistics | `stats.html` + `stats-app.js` | Revenue, items sold, transaction chart |

### Shared JS modules (loaded via `<script>` tags)

- **`models.js`** — Pure model factories and calculation functions. Exports `Models` namespace.
- **`storage.js`** — localStorage read/write, event/item/transaction operations. Exports `Store` namespace.
- **`ui.js`** — Shared UI helpers: `renderSetupItems`, `renderItemGrid`, formatting. Exports `UI` namespace.

Each page script (e.g. `create-app.js`) uses the `Models`, `Store`, and `UI` globals.

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

Navigation between pages uses the [CSS View Transitions API](https://developer.chrome.com/docs/web-platform/view-transitions/) via `@view-transition { navigation: auto; }` in `style.css`.

- **Forward navigation** (default): new page slides in from the right.
- **Back navigation**: set `sessionStorage.setItem('vt-direction', 'back')` before navigating; the destination page reads this and sets `document.documentElement.dataset.direction = 'back'`, triggering the reverse animation.

### Touch drag-and-drop

Item reordering uses HTML5 drag-and-drop for desktop and manual touch event handling for mobile. The touch logic is implemented in `create-app.js` and `edit-app.js` using `touchstart`/`touchmove`/`touchend` with `document.elementFromPoint()` to identify the drop target.

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
├── index.html          # Cashier (redirects to create.html if no active event)
├── create.html         # New event creation
├── edit.html           # Edit event items (URL param: ?id=<eventId>)
├── settings.html       # Settings overview, all events list
├── stats.html          # Statistics for an event (URL param: ?id=<eventId>)
├── style.css           # All styles incl. view transitions
├── models.js           # Model factories + calculations (Models namespace)
├── storage.js          # localStorage operations (Store namespace)
├── ui.js               # Shared UI rendering helpers (UI namespace)
├── app.js              # Cashier page logic
├── create-app.js       # Create page logic
├── edit-app.js         # Edit page logic
├── settings-app.js     # Settings page logic
├── stats-app.js        # Stats page logic
├── CLAUDE.md           # This file
├── docs/
│   ├── issue-14-mpa-refactor.md
│   └── next-steps.md
└── tests/
    └── unit.test.js
```

## Development setup

```bash
npm install
```

### Lint, validate, test

```bash
# Run all checks
npm run build

# Individual checks
node tests/unit.test.js                          # unit tests
npx eslint .                                     # JS linting
npx stylelint style.css                          # CSS linting
npx vnu --skip-non-html index.html create.html edit.html settings.html stats.html  # HTML validation
```

### No build step

This is a plain HTML/CSS/JS project — open any `.html` file directly in a browser or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server
```
