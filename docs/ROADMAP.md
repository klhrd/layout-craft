# LayoutCraft Studio — Development Roadmap

This document tracks the planned development of LayoutCraft Studio, organized
by priority and annotated with the corresponding feature branch name.

## Current Status

- **Branch**: `master`
- **Stack**: Vite + Vitest + ESLint + Prettier + Supabase SDK (Vanilla ES Modules)
- **Scope**: Single-page editor (`index.html` + source files under `src/`)
- **Tests**: 173 tests across 15 files, all green
- **Lint / Format**: clean

## Product Positioning

LayoutCraft Studio is an **open-source, self-hostable, local-first design tool**.

- No mandatory account or login. The app boots fully offline with LocalStorage.
- Cloud sync / realtime collab are **optional add-ons** configured via `.env`
  (Supabase / WebSocket) by whoever self-hosts it. Without env vars the app
  silently runs local-only.
- Sharing is **file-based**: projects export/import as JSON; pages export as
  standalone HTML/CSS. No backend required.
- Consequence: no account-dependent features on the roadmap (no public
  share links, no marketplace accounts, no monetization pipeline).

---

## What's Shipped (all on `master`)

| Item                                                                              | Branch                         |
| --------------------------------------------------------------------------------- | ------------------------------ |
| Short-term #1–6 (i18n, lint, tests, build, jsconfig, docs)                        | —                              |
| Mid-term Feature #1–5 (undo/redo, advanced CSS, JSX/Vue export, nested, import)   | `feature/*` (merged)           |
| UI menu restructure + Material Symbols                                            | `feature/ui-menu-restructure`  |
| Inspector hierarchy controls + component CSS extraction                           | —                              |
| Responsive preview (breakpoint buttons)                                           | `feature/responsive-preview`   |
| Visual property editors (slider, spacing, opacity, font-family, box-shadow)       | same                           |
| Keyboard shortcuts (Ctrl+D, Ctrl+/, Shift+arrow)                                  | same                           |
| Canvas rulers + 8-point resize handles                                            | same                           |
| Light/Dark theme + CSS variables + zh-TW/ja i18n                                  | `feature/i18n-theming`         |
| Snap-to-grid alignment guides                                                     | `feature/snap-to-grid`         |
| Collapsible Visual CSS Rules + WebKit scrollbar styling                           | —                              |
| Icons — no longer depend on Material Symbols font ligatures                       | —                              |
| Bug fixes (mode switcher body class, locale init order, icon swap, undo/redo CSS) | —                              |
| P2b: Backend cloud sync (Supabase auth + push/pull + conflict prompt)             | `feature/backend-sync`         |
| P3b: Template marketplace (5 MVP templates + gallery modal)                       | `feature/template-marketplace` |
| P3a: Realtime collaboration (Yjs adapter + presence + follow mode)                | `feature/collab`               |

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

## P4 — Future plan (aligned with open-source / self-hosted positioning)

All items below are **local-first and account-free**.

#### P4a. Self-host quickstart

**Branch**: `feature/self-host-quickstart`
**Effort**: ~3–5 days

- `npm run build` → static `dist/` deployable anywhere (nginx, GitHub Pages, Netlify)
- Docs: install guide (clone → `npm i` → `npm run dev` / `build`), optional
  Supabase/WebSocket env setup for cloud sync + collab
- `docker-compose.yml` for one-command self-host (static server + optional sync backend)
- ✅ **Done 2026-07-31** — `docs/self-hosting.md` (install, deploy options,
  nginx config, Docker build-args for optional sync), `Dockerfile`
  (multi-stage node→nginx), `docker-compose.yml`, `.dockerignore`, README
  Quick Start / Self-hosting sections updated.

#### P4b. File-first sharing ✅ done

**Branch**: `feature/file-sharing`
**Effort**: ~5–7 days

- Project export/import as `.lcproj` JSON (already exists in storage) → polish as
  drag-in import + one-click export from the menu
- Template gallery consumes the same JSON files; make it a plain folder of
  templates users can drop into their install (`templates/` directory scan)
- Export full static site (HTML + CSS + assets zip) — single-file HTML with
  inlined CSS added as an export option

#### P4c. Template library expansion ✅ done

**Branch**: `feature/template-library`
**Effort**: ~10–14 days

- Grow the 5 MVP templates to 20+ (landing, blog, dashboard, e-commerce, portfolio…)
- Category browse/search UI (no account)
- Community templates = drop-in JSON files, no server

#### P4d. Design tokens ✅ done

**Branch**: `feature/design-tokens`
**Effort**: ~10–14 days

- CSS custom property tokens (colors, spacing, type scale) defined in a token
  panel and shared across rules/projects
- Tokens live in the project JSON, export as `:root { … }`
- ✅ **Done 2026-07-31** — token panel inside the Visual CSS Rules sidebar
  (`src/js/modules/tokenEditor.js`); tokens stored per-project (LocalStorage +
  `.lcproj` files) via `cssState.setToken/getTokens`; compiled to a `:root`
  block at the top of exported CSS; `window.rebuildTokenUI` rehydrates the
  panel on project load/import. Known limitation: tokens are not synced by the
  optional cloud add-on (`sync.js`) — they stay local-first, matching the
  product positioning.

#### P4e. Optional AI assistant

**Branch**: `feature/ai-css-assistant`
**Effort**: ~14 days

- Natural-language CSS/component generation mapped onto the existing
  `cssDictionary` + `templates` catalogues
- Bring-your-own API key setting (stored locally), no account

---

## P5 — Future plan (close the loop on P4, then build the ecosystem)

All items below stay **local-first and account-free**, extending the P4
foundation (file sharing, templates, tokens) rather than adding new services.

### Near-term (finish the current plan)

#### P5a. AI assistant (P4e)

**Branch**: `feature/ai-css-assistant`
**Effort**: ~14 days

The only remaining P4 item — natural-language CSS/component generation mapped
onto the existing `cssDictionary` + `templates` catalogues; bring-your-own API
key stored locally, no account. Recommended before moving to P5 mid-term
items, as it can reuse the token panel and template pipeline.

### Mid-term (make what's shipped feel complete)

#### P5b. Token-aware design system UI ✅ done

**Branch**: `feature/token-aware-inspector`
**Effort**: ~10–14 days

- Color/spacing/font pickers in the Inspector and CSS sidebar can read from
  and write to the token panel (add token from a picked value)
- CSS property value inputs get a `var(--xxx)` dropdown listing current tokens
- Templates gain an optional `tokens` field so drop-in/imported templates can
  seed a project's tokens
- Token rename rewrites `var(--xxx)` references across all rules
- ✅ **Done 2026-07-31** — new `tokenPicker.js` popup (palette button) on every
  CSS block value input and every Inspector style row: lists current tokens,
  inserts `var(--name)`, and offers "Save as token" from the current value.
  `cssState.replaceTokenRef()` rewrites `var()` references (incl. nested rules)
  when a token is renamed in the panel. Templates `navbar`, `dashboard-layout`,
  `signup-form` gained a `tokens` seed field; `instantiateTemplate` seeds on
  replace and merges on append. +12 tests (185 total).

#### P5c. Whole-site zip export ✅ done

**Branch**: `feature/zip-export`
**Effort**: ~5–7 days

- Finish the P4b leftover: export a full static site as a `.zip`
  (HTML + CSS + assets folder) — not just the single-file HTML option
- Export options become: Single-file HTML / HTML+CSS / Whole-site zip
- ✅ **Done 2026-07-31** — export dropdown gained "Whole-site ZIP (HTML +
  CSS + assets)". New zero-dependency `zipWriter.js` writes valid ZIPs
  (local headers + central directory + EOCD) using the browser's native
  `CompressionStream` ('deflate-raw') with a store fallback and a hand-rolled
  CRC32 table. `extractDataImages()` pulls `data:image/*;base64` URIs out of
  the HTML into `assets/img-N.<ext>` and rewrites `src` to relative paths;
  external URLs pass through untouched. +11 tests (196 total).

#### P5d. Offline PWA

**Branch**: `feature/pwa-offline`
**Effort**: ~7–10 days

- Service worker (Vite `vite-plugin-pwa`) + installable manifest
- Boots fully offline from cache; LocalStorage + `.lcproj` flows untouched
- Sharpens the "local-first" positioning without adding any account surface

### Long-term (ecosystem direction)

#### P5e. Template ecosystem loop

**Branch**: `feature/template-ecosystem`
**Effort**: ~14 days

- Drop-in templates support tokens (via P5b) and an optional preview image;
  gallery shows remote-friendly previews without a server
- A template folder can bundle multiple `.lcproj`-style variants
- Community sharing = drop a folder into `public/templates/`, no backend

#### P5f. Stable export/plugin extension points

**Branch**: `feature/plugin-extension-points`
**Effort**: ~14–21 days

- Stabilize the exporter API (`buildExportHtml` / `buildExportCss` /
  `buildSingleFileHtml` / zip pipeline) into a documented contract
- Third-party export targets plug in via a small registry, no fork required

---

## Suggested Execution Order

```
P1a  (split app.js)          ✅ done
P1b  (expand test coverage)  ✅ done
P1c  (cssState module)       ✅ done (with P1a)
P2a  (Web Component export)  ✅ done
P1d  (SVG icons)             ✅ done
P2b  (backend cloud sync)    ✅ done
P3a  (collaboration)         ✅ done
P3b  (template marketplace)  ✅ done
P4a  (self-host quickstart)  ✅ done
P4b  (file-first sharing)    ✅ done
P4c  (template library)      ✅ done
P4d  (design tokens)         ✅ done
P4e  (AI assistant)          next (optional)
P5b  (token-aware inspector) ✅ done
P5c  (zip export)            ✅ done
P5d  (offline PWA)           next
P5e  (template ecosystem)    after P5d
P5f  (plugin extension)      last (needs stable exporter)
```

---

## Branch Strategy

`master` is the source of GitHub Pages deployment. Feature branches are cut
from the latest `master` and merge back when green.

| Branch                            | Item | Status              |
| --------------------------------- | ---- | ------------------- |
| `master`                          | —    | Stable, deployable  |
| `feature/split-app-modules`       | P1a  | ✅ Merged to master |
| `feature/expand-test-coverage`    | P1b  | ✅ Merged to master |
| `feature/css-state-module`        | P1c  | ✅ merged with P1a  |
| `feature/svg-icons`               | P1d  | ✅ Merged to master |
| `feature/web-component-export`    | P2a  | ✅ Merged to master |
| `feature/backend-sync`            | P2b  | ✅ Merged to master |
| `feature/collab`                  | P3a  | ✅ Merged to master |
| `feature/template-marketplace`    | P3b  | ✅ Merged to master |
| `feature/self-host-quickstart`    | P4a  | ✅ Merged to master |
| `feature/file-sharing`            | P4b  | ✅ Merged to master |
| `feature/template-library`        | P4c  | ✅ Merged to master |
| `feature/design-tokens`           | P4d  | ✅ Merged to master |
| `feature/ai-css-assistant`        | P4e  | ⏳ Optional         |
| `feature/token-aware-inspector`   | P5b  | ✅ Merged to master |
| `feature/zip-export`              | P5c  | ✅ Merged to master |
| `feature/pwa-offline`             | P5d  | ⏳ Planned          |
| `feature/template-ecosystem`      | P5e  | ⏳ Planned          |
| `feature/plugin-extension-points` | P5f  | ⏳ Planned          |

### Execution log

| Date       | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | P1b (tests) + P2a (Web Component export) assigned to subagents, both merged                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-07-29 | P1a (split app.js) + P1c (cssState module) done in `feature/split-app-modules`, merged                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-07-29 | P1d (svg icons) done in `feature/svg-icons`, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-07-30 | P2b (backend cloud sync) done in `feature/backend-sync`, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-07-30 | P3b (template marketplace) done in `feature/template-marketplace` — 5 MVP templates, gallery modal, replace/append insertion, tests, merged to master                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-30 | P3a (realtime collaboration) done in `feature/collab` — Yjs adapter, presence overlay, follow mode, merged to master                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-07-31 | Product positioning decided: open-source, self-hostable, local-first tool. No login/account features on the roadmap; cloud sync + collab stay as optional self-hosted add-ons. Future plan rewritten as P4 (self-host quickstart, file-first sharing, template library, design tokens, optional AI assistant).                                                                                                                                                                               |
| 2026-07-31 | P4a (self-host quickstart) done — Dockerfile, docker-compose, nginx.conf, docs/self-hosting.md.                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-07-31 | P4b (file-first sharing) done in `feature/file-sharing` — `.lcproj` export/import (File menu + drag-and-drop onto window), single-file HTML export option, drop-in template folder `public/templates/` (manifest-driven, merged into gallery at runtime). +12 tests.                                                                                                                                                                                                                         |
| 2026-07-31 | P4c (template library) done in `feature/template-library` — 5 → 22 templates: hero split, feature grid, testimonials, CTA banner, stats, team, blog cards, FAQ, dashboard shell, profile card, chat list, todo list, signup/contact/newsletter forms, product grid, cart summary. Gallery icons for all 22. +17 tests via `it.each` data-structure coverage.                                                                                                                                 |
| 2026-07-31 | P4d (design tokens) done in `feature/design-tokens` — token panel in the CSS sidebar (`tokenEditor.js`), per-project token storage (LocalStorage + `.lcproj`), `:root` output in compiled/exported CSS, rehydration on load/import. Also fixed a latent bug: `window.saveProject` was never assigned, so drop-in templates and token saves silently didn't persist — now exposed from app.js. +18 tests; vitest `hookTimeout`/`testTimeout` raised to 30s for parallel workers.              |
| 2026-07-31 | P5b (token-aware design system UI) done in `feature/token-aware-inspector` — palette-button token popup on every CSS block value input and Inspector style row (insert `var(--name)` / save current value as token via `tokenPicker.js`); `cssState.replaceTokenRef()` rewrites `var()` refs incl. nested rules on token rename; templates `navbar`/`dashboard-layout`/`signup-form` seed tokens on replace and merge on append. +12 tests (185 total).                                      |
| 2026-07-31 | P5c (whole-site zip export) done in `feature/zip-export` — export dropdown gained "Whole-site ZIP (HTML + CSS + assets)". New zero-dependency `zipWriter.js` (native `CompressionStream` deflate-raw + store fallback, hand-rolled CRC32); `extractDataImages()` moves `data:image` URIs into `assets/` with relative `src` rewrites; `buildSiteZip()` bundles `index.html` + `style.css` + assets. Tests parse + inflate the produced zip (deflate and store paths). +11 tests (196 total). |
