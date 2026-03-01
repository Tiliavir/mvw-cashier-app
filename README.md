# MVW Kassierer App

A lightweight, browser-based cashier app for club events ("Vereinsfeste"). Built with plain HTML5 and Vanilla JavaScript, stored entirely in `localStorage`, deployable on GitHub Pages with zero build steps.

---

## Features

- 📦 **No frameworks** - plain HTML5, CSS, Vanilla JS (ES6)
- 💾 **Offline-capable** - all data stored in `localStorage`
- 📱 **Mobile-first** responsive layout
- 🎟️ **Event management** - create and close events
- 🛒 **Item tiles** - color-coded, tap to add to cart
- 💶 **Transaction tracking** - total, received amount, change, tip
- 📊 **Settings & history** - view past events with revenue and transaction counts

---

## Getting Started

### 1. Serve locally

Serve the `public/` folder with any static file server:

```bash
npx serve public
# or
cd public && python3 -m http.server
```

Then open the shown local URL in your browser.

### Base URL configuration

The app is hardcoded with `<base href="/">` in all entry pages for local development.

For GitHub Pages deployments, `.github/workflows/release.yml` automatically rewrites the base tag in the deployment artifact to `/<repo>/` (for example `/mvw-cashier-app/`).

### 2. Deploy to GitHub Pages

1. Go to your repository **Settings → Pages**
2. Set Source to **Deploy from a branch** → `main` / `public` folder
3. Save. Your app will be available at `https://<username>.github.io/<repo>/`

Alternatively, push a tag (`v*`) to trigger the release workflow, which automatically deploys to GitHub Pages.

---

## Project Structure

```
/
├── public/
│   ├── index.html      # Cashier page (/)
│   ├── create/
│   │   ├── index.html  # Create page (/create/)
│   │   └── js/create-app.js
│   ├── edit/
│   │   ├── index.html  # Edit page (/edit/?id=...)
│   │   └── js/edit-app.js
│   ├── settings/
│   │   ├── index.html  # Settings page (/settings/)
│   │   └── js/settings-app.js
│   ├── stats/
│   │   ├── index.html  # Stats page (/stats/?id=...)
│   │   └── js/stats-app.js
│   ├── css/style.css   # Mobile-first responsive styles
│   ├── js/app.js       # Cashier logic
│   └── shared/js/
│       ├── models.js   # Pure data model + calculation functions
│       ├── storage.js  # LocalStorage read/write operations
│       └── ui.js       # DOM rendering helpers
├── package.json        # Dev dependencies (linting + HTML validation only)
├── eslint.config.mjs   # ESLint flat config for Vanilla JS
├── .stylelintrc        # Stylelint config (stylelint-config-standard)
├── tests/
│   └── unit.test.js    # Node.js unit tests (no framework needed)
└── .github/
    ├── dependabot.yml
    └── workflows/
        ├── ci.yml          # CI: vnu-jar HTML + stylelint CSS + eslint JS + unit tests
        ├── release.yml     # Release: GitHub Release + GitHub Pages deploy
        └── automerge.yml   # Auto-merge PRs labeled 'automerge'
```

---

## Development Setup

Install dev dependencies (linting and validation only — not needed to run the app):

```bash
npm install
```

Lint CSS and JavaScript:

```bash
npm run lint
```

Validate HTML with vnu-jar:

```bash
npm run validate
```

---

## Running Tests

Tests require only Node.js:

```bash
node tests/unit.test.js
```

---

## LocalStorage Reset

To clear all app data and start fresh, open the browser developer console and run:

```javascript
localStorage.removeItem('kassierer_app_v1');
location.reload();
```

---

## Release

Create a Git tag to trigger a GitHub Release and GitHub Pages deployment:

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Known Limitations

- **No multi-device sync** - data lives only in the browser's `localStorage`
- **No server backup** - if browser data is cleared, all data is lost
- **Single browser** - each device/browser has its own isolated data
- **No export** - there is currently no CSV/JSON export (planned for future versions)

---

## Planned Extensions

The code is structured to easily support:
- CSV / JSON export
- JSON backup download & import
- Multi-user support

---

## License

See [LICENSE](LICENSE).
