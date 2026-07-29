# LayoutCraft Studio — Development Roadmap

This document tracks the planned development of LayoutCraft Studio, organized
by priority and annotated with the corresponding feature branch name.

## Current Status

- **Branch**: `feature/backend-sync` (P2b implementation)
- **Stack**: Vite + Vitest + ESLint + Prettier + Supabase SDK (Vanilla ES Modules)
- **Scope**: Single-page editor (`index.html` + source files under `src/`)
- **Tests**: tests across 12 files, all green
- **Lint / Format**: clean

---

## What's Shipped (all on `master`)

| Item                                                                              | Branch                        |
| --------------------------------------------------------------------------------- | ----------------------------- |
| Short-term #1–6 (i18n, lint, tests, build, jsconfig, docs)                        | —                             |
| Mid-term Feature #1–5 (undo/redo, advanced CSS, JSX/Vue export, nested, import)   | `feature/*` (merged)          |
| UI menu restructure + Material Symbols                                            | `feature/ui-menu-restructure` |
| Inspector hierarchy controls + component CSS extraction                           | —                             |
| Responsive preview (breakpoint buttons)                                           | `feature/responsive-preview`  |
| Visual property editors (slider, spacing, opacity, font-family, box-shadow)       | same                          |
| Keyboard shortcuts (Ctrl+D, Ctrl+/, Shift+arrow)                                  | same                          |
| Canvas rulers + 8-point resize handles                                            | same                          |
| Light/Dark theme + CSS variables + zh-TW/ja i18n                                  | `feature/i18n-theming`        |
| Snap-to-grid alignment guides                                                     | `feature/snap-to-grid`        |
| Collapsible Visual CSS Rules + WebKit scrollbar styling                           | —                             |
| Icons — no longer depend on Material Symbols font ligatures                       | —                             |
| Bug fixes (mode switcher body class, locale init order, icon swap, undo/redo CSS) | —                             |

---

## Future Engineering Plan

All items below use the naming convention `feature/<kebab-name>`.

### P0 — Bug fixes / polish

No known blocking bugs. If new issues arise, fix on master directly or use
`feature/fix-<short-desc>`.

### P1 — Architecture & tech debt

#### P1a. Split app.js into smaller modules

**Branch**: `feature/split-app-modules`
**Effort**: ~14 days

`app.js` is ~1444 lines and growing. Extract into:

- `src/js/modules/cssEditor.js` — Visual CSS Rules creation, drag/drop, delete
- `src/js/modules/keyboard.js` — all keyboard shortcut bindings
- Keep `app.js` as the orchestrator (imports + DOMContentLoaded)

#### P1b. Expand test coverage

**Branch**: `feature/expand-test-coverage`
**Effort**: ~10–14 days

Currently 49 tests cover only `cssState`, `history`, `i18n`, `storage` (low-level utils).
No tests for UI modules:

| File           | Lines | Tests needed                                                          |
| -------------- | ----- | --------------------------------------------------------------------- |
| `app.js`       | ~1444 | ~10 (createRuleBoxUI, add/remove rule, CSS block drag/drop)           |
| `canvas.js`    | ~400  | ~15 (drop element, build template, extractComponentStyles, undo/redo) |
| `inspector.js` | ~500  | ~10 (select element, update attributes, hierarchy)                    |
| `exporter.js`  | ~200  | ~5–8 (generate HTML, generate CSS, preview mode)                      |

#### P1c. Move cssState from config/ to modules/

**Branch**: `feature/css-state-module`
**Effort**: ~2 days

`cssState.js` lives in `config/` but is mutable state (setRule, getProperty,
undo/redo). Move to `src/js/modules/cssState.js` and update all imports.

#### P1d. Migrate icons to inline SVGs

**Branch**: `feature/svg-icons`
**Effort**: ~5–7 days

Material Symbols font has external dependency and fails in certain environments.
Replace all `<span class="mat-icon">ligature</span>` with inline SVG icons.
Evaluate Lucide or build a small custom SVG set.

### P2 — New features (by practical value)

#### P2a. Web Component export

**Branch**: `feature/web-component-export`
**Effort**: ~7–10 days

Extend exporter to generate a `.js` file with a Custom Element:

- `customElements.define('layout-craft-block', class extends HTMLElement { … })`
- Template + styles embedded in shadow DOM
- Downstream users drop script tag and use the element anywhere

#### P2b. Backend cloud sync

**Branch**: `feature/backend-sync`
**Effort**: ~14–21 days

Use Supabase (free tier) to lift the 5 MB LocalStorage cap:

- Supabase project setup (`projects` table with JSON content)
- `storage.js`: `saveToCloud(name, content)` / `loadFromCloud(id)`
- Open Project modal shows local + cloud entries
- Conflict resolution: timestamp compare + user choice dialog
- Storage meter reflects cloud usage

### P3 — Long-term vision

#### P3a. Multi-user collaboration

**Branch**: `feature/collab`
**Effort**: ~30 days

Yjs + WebSocket for realtime multiplayer editing:

- Yjs document syncs canvas state + cssState
- Cursor presence overlay on canvas
- Chat / comment sidebar per element
- Requires backend server (Supabase Realtime or custom WebSocket)

#### P3b. Template marketplace

**Branch**: `feature/template-marketplace`
**Effort**: ~21 days

- 20+ curated layouts (landing page, blog, dashboard, e-commerce, portfolio…)
- Each template is a JSON project file, importable in one click
- Browse / search UI
- Community submission pipeline (future)

---

## Suggested Execution Order

```
P1a  (split app.js)          ✅ done
P1b  (expand test coverage)  ✅ done
P1c  (cssState module)       ✅ done (with P1a)
P2a  (Web Component export)  ✅ done
P1d  (SVG icons)             ✅ done
P2b  (backend cloud sync)    ✅ done
P3a  (collaboration)         ⏳ pending
P3b  (template marketplace)  ⏳ pending
```

---

## Branch Strategy

`master` is the source of GitHub Pages deployment. Feature branches are cut
from the latest `master` and merge back when green.

| Branch                         | Item | Status              |
| ------------------------------ | ---- | ------------------- |
| `master`                       | —    | Stable, deployable  |
| `feature/split-app-modules`    | P1a  | ✅ Merged to master |
| `feature/expand-test-coverage` | P1b  | ✅ Merged to master |
| `feature/css-state-module`     | P1c  | ✅ merged with P1a  |
| `feature/svg-icons`            | P1d  | ✅ Merged to master  |
| `feature/web-component-export` | P2a  | ✅ Merged to master |
| `feature/backend-sync`         | P2b  | ⏳ Done, NOT merged  |
| `feature/collab`               | P3a  | Pending             |
| `feature/template-marketplace` | P3b  | Pending             |

### Execution log

| Date | Action |
|------|--------|
| 2026-07-29 | P1b (tests) + P2a (Web Component export) assigned to subagents, both merged |
| 2026-07-29 | P1a (split app.js) + P1c (cssState module) done in `feature/split-app-modules`, merged |
| 2026-07-29 | P1d (svg icons) done in `feature/svg-icons`, merged to master |
| 2026-07-29 | P2b (backend cloud sync) done in `feature/backend-sync`, not yet merged |
