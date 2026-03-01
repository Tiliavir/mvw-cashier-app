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
- [ ] Use standard HTML features as far as possible.
- [ ] Use CSS for styles and animations.
- [ ] Use JS only for features, where it is necessary - try to stick to HTML and CSS when ever possible.
- [ ] If it helps with the multi page website to resue HTML components or to structure the code: use Hugo.
- [ ] Do not use othe frameworks or libraries.
- [ ] Use the languages and concepts according to Web best practices.
- [ ] Lint everything - avoid adding no-linter comments!
- [ ] Simplicity is Key! Keep it simple and stupid. That makes thins reliable.
- [ ] Add a CLAUDE.md describing the project, its architecture, concept and ideas for later reference.

### 1) Pages / MPA structure
- [ ] Define the set of pages after the refactor (e.g. `index.html`, `settings.html`, `create.html`, `edit.html`, `stats.html`).
- [ ] Extract the **initial creation** form into its own HTML page (name + route/URL to be confirmed).
- [ ] on the initial creation page, allow the event import with a json upload
- [ ] Extract the **edit** form into its own HTML page (name + route/URL to be confirmed).
- [ ] The edit page identifies the event o be edited with a parameter in the URL
- [ ] When the to be edited event does not exist, an error is displayed explaining the issue and guiding the user back to the referer URL
- [ ] settings can be exported from the edit page.

### 2) Navigation & "feels like SPA" transitions
- [ ] Use CSS View Transitions / View Transitions API for navigation between the pages that used to be in-app views.
- [ ] transitions that feel like "next" in the process should animate as a navigation to the right (next page comes from the right). That means: from the initial page to the main page is "go right". From the main page to settings and from settings to stats and edit is also right. Back animations and close animations are "coming from the left".
- [ ] If browsers do not allow animations or the users wishes no animations: no animations are used.
- [ ] Header, Navigation, Main Section should be animated. Opening an item is animated.

### 3) State / persistence across pages
- [ ] Persistance relies solely on the localStorage. If parameters need to be passed for pure navigation or page state: use URL parametes.
- [ ] The existing storage of events in the local storage should not be effected by this change - if there are changes, they have to be backwards compatible.

### 4) Statistics page
- [ ] Add a `stats.html` (or similar) page that is reachable once an event is selected in settings.
- [ ] In the event list, the user has an option to either edit an event or to view its stats.
- [ ] The stats page should show:
  - [ ] Total revenue
  - [ ] Number of transactions
  - [ ] Items sold per product
  - [ ] Time range (entire event vs selectable range)
  - [ ] transactions over time in a simple visualization
- [ ] when the stats page is opened with an inexisting event: an error is displayed explaining the issue and guiding the user back to the referer URL.

### 5) Fix touch drag & drop
- [ ] The edit page and the initial page has a drag and drop feature to reorder items.
- [ ] This is not working on touch devices. Fix it. For this use standard HTML functionality if possible.

### 6) Initial Page
- [ ] On the initial page, the user has a hint, explaining, that "Pfand" can be entered with a negative vaule.
- [ ] An example configuration can be loaded next to the import functionality. This contains: Softdrinks / Bier / Wasser / Wein / Schorle / Pfand + / Pfand - / Grillwurst / Bratwurst / Pommes / Steak / Kaffee / Kuchen / Torte.

### 7) Main Page
- [ ] allow users to reduce the amound of a selected item
- [ ] reorder the buttons on the bottom so that they are next to each other and so, that cancel is left (red) and next transaction is right (green).

