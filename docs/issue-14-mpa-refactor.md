# Issue #14 – Refactor to MPA

> **Tracking issue:** https://github.com/Tiliavir/mvw-cashier-app/issues/14

Die Seite soll eine Multi Page Application sein.
Löse die Formulare zur Initialen Erstellung und das Editierformular heraus in eigene html Seiten. css view transitions damit es für den user noch aussieht wie eine SPA.

Erstelle dann zusätzlich eine Statistik Seite, wenn man in den Einstellungen ein Event auswählt.

Fixe den bug, dass drag and drop mit Touch nicht funktioniert.

---

## ✅ Acceptance criteria checklist (draft — please refine)

### 1) Pages / MPA structure
- [ ] Define the set of pages after the refactor (e.g. `index.html`, `settings.html`, `create.html`, `edit.html`, `stats.html`).
- [ ] Extract the **initial creation** form into its own HTML page (name + route/URL to be confirmed).
- [ ] Extract the **edit** form into its own HTML page (name + route/URL to be confirmed).
- [ ] Specify how the edit page identifies what to edit (e.g. `edit.html?id=<...>` or path-based routing).
- [ ] Specify what happens when the edit target is missing/invalid (error state).

### 2) Navigation & "feels like SPA" transitions
- [ ] Use CSS View Transitions / View Transitions API for navigation between the pages that used to be in-app views.
- [ ] Specify which transitions are required (between all pages vs only create/edit/settings/stats).
- [ ] Define fallback behavior for browsers that don't support View Transitions (no animation is acceptable vs required alternative).
- [ ] Confirm which elements should appear continuous/shared across transitions (header/nav, selected item, main content, etc.).

### 3) State / persistence across pages
- [ ] Define how app state is persisted across full page navigations (localStorage/sessionStorage/query params/other).
- [ ] Define storage keys/schema expectations (if applicable) and whether a migration is needed.

### 4) Statistics page
- [ ] Add a `stats.html` (or similar) page that is reachable once an event is selected in settings.
- [ ] Specify where the entry point is (button/link in settings vs navbar).
- [ ] Define what to show when **no event** is selected (disabled link, redirect, message, etc.).
- [ ] Define the exact stats required (pick at least a minimal set):
  - [ ] Total revenue
  - [ ] Number of transactions
  - [ ] Items sold per product
  - [ ] Time range (entire event vs selectable range)
  - [ ] Export (CSV/JSON) yes/no
- [ ] Define empty/error states (event with no data, corrupted data, etc.).

### 5) Fix touch drag & drop
- [ ] Identify which drag-and-drop interaction is broken on touch (what is dragged, where it's dropped).
- [ ] Define target platforms/browsers to support (e.g. iOS Safari latest, Android Chrome latest).
- [ ] Define expected gesture behavior (long-press vs immediate drag) and scroll interaction.
- [ ] Done when: verified on real device or emulator that the touch interaction works without regressions.
