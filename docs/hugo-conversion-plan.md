# Hugo Conversion Plan

## Goal

Convert the repo from a hand-crafted static MPA to a Hugo-based project, eliminating the split between HTML sources and build artifacts in `public/`, adding legal pages, and updating all tooling.

## Checklist

- [x] Create Hugo project (`hugo.toml`, `layouts/`, `content/`, `static/`)
- [x] Create `layouts/partials/head.html` — shared `<head>` with base-URL handling
- [x] Create `layouts/partials/scripts-shared.html` — shared script tags
- [x] Convert 5 existing pages to Hugo layouts (cashier, create, edit, settings, stats)
- [x] Add `layouts/robots.txt` — enable `enableRobotsTXT = true` in config
- [x] Add impressum page (`content/impressum/_index.md` + `layouts/impressum/list.html`)
- [x] Add haftungsausschluss page (`content/haftungsausschluss/_index.md` + layout)
- [x] Add liability checkbox to create page (HTML + JS validation)
- [x] Add CSS for content pages and liability checkbox
- [x] Update `scripts/build-js.js` — output to `static/` instead of `public/`
- [x] Update `package.json` — CSS to `static/css/`, add `build:hugo` step
- [x] Update `.github/workflows/ci.yml` — install Hugo, run full build
- [x] Update `.github/workflows/release.yml` — run Hugo with correct GitHub Pages baseURL
- [x] Update `.gitignore` — add `public/` and `static/` build-artifact dirs
- [x] Move `favicon.svg` to `static/` and delete from `public/`
- [x] Remove old `public/` HTML and compiled JS/CSS from git tracking
- [x] Update `CLAUDE.md` to reflect new structure
- [x] Delete this plan file in final cleanup commit
