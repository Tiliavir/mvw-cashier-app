# Next Steps / Open Questions

## 1. Landing page vs. direct cashier

Should `index.html` always be the cashier, or should it be a landing/redirect page that routes based on app state? Currently it redirects to `create.html` if no active event is found.

## 2. Component reuse via Hugo

As the page count grows, shared HTML structures (header, nav, common scripts) will require copy-paste maintenance. Consider using [Hugo](https://gohugo.io/) as a static site generator for partial/component reuse once the overhead is justified.

## 3. Statistics chart type

Confirm whether the simple SVG bar chart (one bar per transaction, grouped by hour when > 50 transactions) is sufficient, or if a more detailed time-series table/chart is preferred. Alternative: show a table with timestamps instead of a visual chart.

## 4. Export/import format

Confirm that the event settings export format `{ name: string, items: [{ name, price, color }] }` is the agreed-upon schema. Consider versioning the format (e.g. `{ version: 1, name, items }`) for future compatibility.

## 5. Stats for open events

Should the statistics page be accessible for events that are still open (not yet closed)? Currently it works for all events regardless of `closed` status.

## 6. Multi-device / sync

All data is localStorage-only and device-specific. If multi-device support is needed in the future, a backend sync mechanism would be required.

## 7. Accessibility (a11y) review

A dedicated accessibility audit would be beneficial — especially for the item grid (keyboard navigation), drag-and-drop (keyboard alternative), and the SVG chart (screen reader support).
