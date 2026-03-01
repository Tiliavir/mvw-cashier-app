# Issue #14 – Refactor to MPA

> **Tracking issue:** https://github.com/Tiliavir/mvw-cashier-app/issues/14

Die Seite soll eine Multi Page Application sein.
Löse die Formulare zur Initialen Erstellung und das Editierformular heraus in eigene html Seiten. css view transitions damit es für den user noch aussieht wie eine SPA.

Erstelle dann zusätzlich eine Statistik Seite, wenn man in den Einstellungen ein Event auswählt.

Erlaube auf der initialen Seite den Export und Import von Event Einstellungen. Export to JSON Download, Import via file uplaod.

Fixe den bug, dass drag and drop mit Touch nicht funktioniert.

---

## ✅ Acceptance criteria checklist

### 0) General guidance
- [x] Use standard HTML features as far as possible.
- [x] Use CSS for styles and animations.
- [x] Use JS only for features, where it is necessary - try to stick to HTML and CSS when ever possible.
- [ ] If it helps with the multi page website to resue HTML components or to structure the code: use Hugo. *(deferred – see docs/next-steps.md)*
- [x] Do not use other frameworks or libraries.
- [x] Use the languages and concepts according to Web best practices.
- [x] Lint everything - avoid adding no-linter comments!
- [x] Simplicity is Key! Keep it simple and stupid. That makes things reliable.
- [x] Add a CLAUDE.md describing the project, its architecture, concept and ideas for later reference.

### 1) Pages / MPA structure
- [x] Define the set of pages after the refactor (`public/index.html`, `public/settings/index.html`, `public/create/index.html`, `public/edit/index.html`, `public/stats/index.html`).
- [x] Extract the **initial creation** form into its own HTML page (`public/create/index.html`).
- [x] On the initial creation page, allow the event import with a json upload.
- [x] Extract the **edit** form into its own HTML page (`public/edit/index.html`).
- [x] The edit page identifies the event to be edited with a parameter in the URL (`?id=<eventId>`).
- [x] When the to-be-edited event does not exist, an error is displayed explaining the issue and guiding the user back to the referer URL.
- [x] Settings can be exported from the edit page.

### 2) Navigation & "feels like SPA" transitions
- [x] Use CSS View Transitions / View Transitions API for navigation between pages.
- [x] Transitions that feel like "next" animate as navigation to the right; back animations come from the left.
- [x] If browsers do not allow animations or the user wishes no animations: no animations are used (`prefers-reduced-motion`).
- [x] View transitions applied to page navigations.

### 3) State / persistence across pages
- [x] Persistence relies solely on localStorage. URL parameters used for page state (event id).
- [x] The existing storage of events in the local storage is not affected by this change.

### 4) Statistics page
- [x] `public/stats/index.html` page is reachable from the settings page (event list → Statistik link).
- [x] In the event list, the user has an option to either edit an event or to view its stats.
- [x] The stats page shows: total revenue, tip, number of transactions, items sold per product, transactions over time (SVG bar chart).
- [x] When the stats page is opened with a non-existing event, an error is displayed with a back link.

### 5) Fix touch drag & drop
- [x] The edit page and the create page have drag-and-drop feature to reorder items.
- [x] Touch drag-and-drop is now implemented using `touchstart`/`touchmove`/`touchend` with `document.elementFromPoint`.

### 6) Initial Page (public/create/index.html)
- [x] Pfand hint: users are shown that "Pfand" can be entered with a negative value.
- [x] Example configuration can be loaded (Softdrinks, Bier, Wasser, Wein, Schorle, Pfand+, Pfand-, Grillwurst, Bratwurst, Pommes, Steak, Kaffee, Kuchen, Torte).
- [x] JSON import via file upload on the create page.

### 7) Main Page (public/index.html – cashier)
- [x] Users can reduce the amount of a selected item (click qty badge).
- [x] Cancel and next transaction buttons are side-by-side: cancel (red, left) and next (green, right).
