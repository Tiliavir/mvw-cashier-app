# AGENTS.md - MVW Kassierer App

## Overview

MVW Kassierer is a browser-based cashier application for club events (Vereinsfeste). It runs entirely in the browser with no server — all data is persisted in `localStorage`. Users can create events, add items to sell, record transactions, and view statistics.

## Architecture

The app is a **Multi-Page Application (MPA)** built with [Hugo](https://gohugo.io/), with seven pages:

| Page | Layout | Purpose |
|---|---|---|
| Cashier | `layouts/index.html` | Main cash register: item grid, transaction recording |
| Create event | `layouts/create/list.html` | New event setup: name, item list, import/export, liability checkbox |
| Edit event | `layouts/edit/list.html` | Edit items of an existing event |
| Settings | `layouts/settings/list.html` | Overview of active event, all events list |
| Statistics | `layouts/stats/list.html` | Revenue, items sold, transaction chart |
| Impressum | `layouts/impressum/list.html` | Legal notice |
| Haftungsausschluss | `layouts/haftungsausschluss/list.html` | Liability disclaimer |

### Shared TypeScript modules

- **`assets/ts/shared/models.ts`** — Pure model factories and calculation functions. Exports `Models` namespace.
- **`assets/ts/shared/storage.ts`** — localStorage read/write, event/item/transaction operations. Exports `Storage` namespace.
- **`assets/ts/shared/ui.ts`** — Shared UI helpers: rendering, formatting. Exports `UI` namespace.
- **`assets/ts/shared/index.ts`** — Re-exports all shared modules.

Each page app (e.g. `assets/ts/app.ts`, `assets/ts/create/create-app.ts`) imports from `./shared/index`.

### Hugo partials

- **`layouts/partials/head.html`** — Shared `<head>`: meta tags, `<base href>`, compiled CSS, optional view-transitions script.
- **`layouts/partials/scripts-shared.html`** — Shared `<script>` tags for compiled JS.

## localStorage Schema

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
          "change": 2.5
        }
      ],
      "closed": false
    }
  ],
  "activeEventId": "uuid or null"
}
```

## Build Commands

```bash
# Full build: compile + lint + validate + test
npm run build

# Compile assets and Hugo (outputs to public/)
npm run compile

# Lint SCSS and TypeScript
npm run lint

# Validate HTML (requires compile first)
npm run validate

# Run Playwright E2E tests (requires compile first)
npm run test

# Serve locally with Hugo live-reload
npm run dev
```

### Running a Single Test

To run a single Playwright test file:

```bash
npm run compile && npx playwright test tests/e2e/cashier.spec.ts
```

To run a specific test within a file:

```bash
npm run compile && npx playwright test tests/e2e/cashier.spec.ts -g "test name"
```

## Project Structure

```
/
├── assets/ts/              # TypeScript source files
│   ├── app.ts              # Cashier page app
│   ├── create/create-app.ts
│   ├── edit/edit-app.ts
│   ├── settings/settings-app.ts
│   ├── stats/stats-app.ts
│   └── shared/
│       ├── index.ts        # Re-exports all shared modules
│       ├── models.ts       # Pure model factories + calculations
│       ├── storage.ts      # localStorage read/write
│       └── ui.ts           # DOM rendering helpers
├── assets/scss/            # SCSS source files
│   └── style.scss
├── layouts/                # Hugo HTML templates
├── content/                # Page content (Markdown frontmatter)
├── public/                # Compiled Hugo output (gitignored)
├── static/                # Static assets (gitignored: compiled CSS/JS)
├── tests/e2e/             # Playwright E2E tests
- `tests/scripts/run-playwright.js` - Playwright test runner
```

## Code Style Guidelines

### TypeScript

- **Language**: TypeScript (strict mode enabled in tsconfig.json)
- **Module Pattern**: IIFE with namespace exports
  ```typescript
  export const App = (() => {
    function init(): void { ... }
    return { init };
  })();
  ```
- **Interfaces**: Define inline with `interface` keyword, PascalCase
  ```typescript
  interface Event {
    id: string;
    name: string;
    items: Item[];
  }
  ```
- **Types**: Use `Record<string, T>` for dictionary types
- **Functions**: Use `function` declarations, not arrow functions at top level
- **Naming**:
  - Variables/functions: camelCase
  - Interfaces/types: PascalCase
  - File names: kebab-case (e.g., `create-app.ts`)
- **Null handling**: Use explicit null checks, avoid optional chaining for required fields
- **Error handling**: Try-catch with fallback defaults for localStorage operations

### Imports/Exports

- Use namespace exports for shared modules:
  ```typescript
  import { Models, Storage, UI } from './shared/index';
  ```
- Shared modules export via objects:
  ```typescript
  export const Models = {
    createEvent,
    createItem,
    // ...
  };
  export type { Event, Item };
  ```

### SCSS

- Use SCSS variables for colors, spacing, shadows
- BEM-like class naming with dashes (e.g., `.item-tile`, `.tx-bar`)
- Section comments:
  ```scss
  // ─── Section Name ────────────────────────────────────────────────────────────
  ```
- No comments on individual properties
- Use nesting sparingly, prefer flat selectors
- Mobile-first responsive with `@media` queries

### Testing

- E2E tests in `tests/e2e/` using Playwright
- Test utilities in `tests/e2e/utils.ts`
- Use `page.addInitScript()` to seed localStorage for tests
- Use Playwright's `expect()` assertions

## Configuration Files

- `tsconfig.json` - TypeScript config (strict mode, ES2020 target)
- `eslint.config.mjs` - ESLint with TypeScript parser
- `.stylelintrc` - Stylelint for SCSS
- `playwright.config.ts` - Playwright config
- `hugo.toml` - Hugo config with asset pipeline settings

## Key Conventions

1. **Data persistence**: All data in localStorage under key `kassierer_app_v1`
2. **View transitions**: Use CSS View Transitions API with direction handling
3. **Touch support**: Handle both mouse and touch events for drag-and-drop
4. **German locale**: All user-facing text in German
5. **No external dependencies**: Pure browser APIs, no npm runtime deps
