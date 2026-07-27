# LayoutCraft Studio - Development Roadmap

This document tracks the planned development of LayoutCraft Studio, organized by phase. Items under the Short-term phase are the immediate priorities on the `feature/development-roadmap` branch.

## Current Status

- **Branch**: `master` (clean, in sync with `origin/master`)
- **Active branch**: `feature/development-roadmap`
- **Stack**: Vanilla ES Modules, no bundler, no tests, no linter
- **Scope**: Single-page editor (`index.html` + 9 source files under `src/`)
- **Features shipped**: dual-mode editor (Visual / CSS Expert), drag-and-drop components, CSS building blocks with live visual inputs, selector blinking detector, multi-project LocalStorage storage with capacity meter and auto-save, ZIP/HTML export

---

## Short-term (Foundational Engineering)

> Goal: establish a maintainable, testable, and reproducible codebase before adding more features.

### 1. Switch default language to English

- Migrate README.md and in-app UI strings to English as the primary language (a Traditional Chinese section/reference can remain as secondary).
- Introduce a lightweight i18n dictionary module (`src/js/config/i18n.js`) so future locales can be added without touching component code.
- Update commit messages, comments, and this roadmap to English as the working convention.

### 2. Linting and formatting

- Add ESLint + Prettier with sane defaults for ES Modules.
- Add `npm run lint` and `npm run format` scripts together with an `AGENTS.md` note so the commands are discoverable for future tooling.
- Fix whatever the first lint pass surfaces (unused vars, missing semis, etc.).

### 3. Unit testing baseline

- Introduce Vitest (zero-config, native ESM friendly).
- Prioritize pure-logic modules first: `storage.js` (UTF-16 byte calculation, quota detection, snapshot serialize/restore), `exporter.js` (HTML/CSS bundling), `cssDictionary.js` and `elements.js` config shape.
- Target a minimal coverage floor on these modules before moving on.

### 4. Build tooling

- Introduce Vite for both dev server and production bundling.
- Keep the current "no-build" dev experience intact where possible; Vite should be additive, not a rewrite of import paths.
- Wire up a `dist/` build output and update the GitHub Actions workflow to deploy the bundled artifact.

### 5. Type safety groundwork

- Add `jsconfig.json` with module resolution and path aliases so editors surface real errors across modules.
- (Optional follow-up) evaluate migrating critical modules to TypeScript once builds are stable.

### 6. Documentation pass

- Ensure README reflects the new tooling (`npm run dev`, `npm run build`, `npm test`).
- Document the module boundaries and event flow in `AGENTS.md` for future contributors and tooling.

---

## Mid-term (Feature Expansion)

> Goal: extend editor capabilities to cover more real-world authoring scenarios.

### 1. Undo / Redo history stack

- Command-based history with bounded buffer and keyboard shortcuts (Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z).

### 2. Advanced CSS building blocks

- Media queries (`@media`), pseudo-classes (`:hover`, `:focus`), CSS custom properties, and keyframes.
- Grouped/nested rule blocks in CSS Expert mode.

### 3. Component export formats

- Extend exporter beyond ZIP/HTML to JSX (React) and Vue SFB templates for the current canvas state.

### 4. Nested components

- Parent/child drag-and-drop with Sortable groups, enabling cards containing buttons, grids containing cards, etc.

### 5. Import flow

- Reverse-parse existing HTML/CSS pastes back into building blocks and canvas components.

---

## Long-term (Product Positioning)

> Goal: take LayoutCraft from a local editor to a shareable development tool.

### 1. Backend sync

- Replace LocalStorage-only persistence with optional cloud storage (Supabase or Firebase) to lift the 5MB cap and enable cross-device work.

### 2. Multi-user collaboration

- Real-time multiplayer editing on a shared project (operational transform or CRDT-backed).

### 3. Template marketplace

- Ship a curated library of common layouts (navbar, hero, pricing table, dashboard) importable in one click.

### 4. Internationalization & theming

- Add English as default plus Traditional/Simplified Chinese, Japanese, etc. via the i18n dictionary introduced in the short term.
- Light/dark UI theme toggle.

### 5. Web Component export

- Package each block as a reusable Custom Element with shadow DOM for downstream projects.

---

## Branch Strategy

| Branch                        | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| `master`                      | Stable, deployable builds                                                  |
| `feature/development-roadmap` | Planning + short-term foundational work (this branch)                      |
| `feature/*`                   | Individual feature branches cut from `master` after short-term phase lands |

---

## Progress Log

- [x] Create `feature/development-roadmap` branch
- [x] Draft this roadmap document
- [x] Short-term #1: Default English language + i18n dictionary (`src/js/config/i18n.js`); all UI strings / comments / labels migrated to English (app.js, storage.js, canvas.js, inspector.js, exporter.js, cssDictionary.js, elements.js)
- [ ] Short-term #2: ESLint + Prettier
- [ ] Short-term #3: Vitest baseline
- [ ] Short-term #4: Vite build pipeline
- [ ] Short-term #5: jsconfig.json
- [ ] Short-term #6: README + AGENTS.md documentation pass
