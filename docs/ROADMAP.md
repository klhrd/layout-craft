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

| Item                                                                              | Branch                            |
| --------------------------------------------------------------------------------- | --------------------------------- |
| Short-term #1–6 (i18n, lint, tests, build, jsconfig, docs)                        | —                                 |
| Mid-term Feature #1–5 (undo/redo, advanced CSS, JSX/Vue export, nested, import)   | `feature/*` (merged)              |
| UI menu restructure + Material Symbols                                            | `feature/ui-menu-restructure`     |
| Inspector hierarchy controls + component CSS extraction                           | —                                 |
| Responsive preview (breakpoint buttons)                                           | `feature/responsive-preview`      |
| Visual property editors (slider, spacing, opacity, font-family, box-shadow)       | same                              |
| Keyboard shortcuts (Ctrl+D, Ctrl+/, Shift+arrow)                                  | same                              |
| Canvas rulers + 8-point resize handles                                            | same                              |
| Light/Dark theme + CSS variables + zh-TW/ja i18n                                  | `feature/i18n-theming`            |
| Snap-to-grid alignment guides                                                     | `feature/snap-to-grid`            |
| Collapsible Visual CSS Rules + WebKit scrollbar styling                           | —                                 |
| Icons — no longer depend on Material Symbols font ligatures                       | —                                 |
| Bug fixes (mode switcher body class, locale init order, icon swap, undo/redo CSS) | —                                 |
| P2b: Backend cloud sync (Supabase auth + push/pull + conflict prompt)             | `feature/backend-sync`            |
| P3b: Template marketplace (5 MVP templates + gallery modal)                       | `feature/template-marketplace`    |
| P3a: Realtime collaboration (Yjs adapter + presence + follow mode)                | `feature/collab`                  |
| P4b–P5f + P4e (file sharing, templates, tokens, AI, PWA, plugin extension points) | `feature/*` (merged)              |
| Applied-i18n pipeline (data-i18n UI + i18nApplier, ja locale dropped)             | `feature/i18n-applied-ui`         |
| Modal accessibility (focus trap + dialog semantics)                               | `feature/modal-a11y`              |
| `.lcproj` version validation + migration (v1 → v2)                                | `feature/project-file-versioning` |
| AI edit mode (restyle selected element)                                           | `feature/ai-edit-selection`       |

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

#### P4e. Optional AI assistant ✅ done

**Branch**: `feature/ai-css-assistant`
**Effort**: ~14 days

- Natural-language CSS/component generation mapped onto the existing
  `cssDictionary` + `templates` catalogues
- Bring-your-own API key setting (stored locally), no account
- ✅ **Done 2026-07-31** — new `aiAssistant.js`: system prompt embeds the
  CSS property list + template ids; reply must be JSON
  `{ html, cssData, tokens? }`; **Insert** merges into the canvas/CSS
  tree/tokens, **Replace** rehydrates. BYOK settings (base URL, model,
  API key) in the AI modal, stored in localStorage only — works with
  OpenAI, OpenRouter, Ollama, LM Studio, etc. Guide: `docs/ai-assistant.md`.
  +12 tests (229 total).

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

#### P5d. Offline PWA ✅ done

**Branch**: `feature/pwa-offline`
**Effort**: ~7–10 days

- Service worker (Vite `vite-plugin-pwa`) + installable manifest
- Boots fully offline from cache; LocalStorage + `.lcproj` flows untouched
- Sharpens the "local-first" positioning without adding any account surface
- ✅ **Done 2026-07-31** — zero-dependency SW: `scripts/pwa.js` Vite plugin
  scans `dist/` in `closeBundle`, hashes the file list, and writes
  `dist/sw.js` with the precache list inlined (cache name `lc-<hash>`;
  stale caches purged on activate). Install precaches every asset,
  fetch is cache-first with network fallback — CDN scripts (SortableJS)
  work offline after the first visit. `public/manifest.webmanifest` +
  maskable SVG icon, `theme-color` meta, SW registration in `index.html`
  (dev 404 ignored). +6 tests (202 total).
- Known limits: iOS home-screen lacks a PNG icon (falls back to a
  screenshot); non-CORS third-party resources are never cached.

### Long-term (ecosystem direction)

#### P5e. Template ecosystem loop ✅ done

**Branch**: `feature/template-ecosystem`
**Effort**: ~14 days

- Drop-in templates support tokens (via P5b) and an optional preview image;
  gallery shows remote-friendly previews without a server
- A template folder can bundle multiple `.lcproj`-style variants
- Community sharing = drop a folder into `public/templates/`, no backend
- ✅ **Done 2026-07-31** — manifest entries gain optional `preview` (path or
  data URI); template JSONs may carry `tokens` (seeded on apply via
  `instantiateTemplate`); `file` supports subfolder paths so one folder
  bundles multiple variants. Gallery cards render the preview image
  (lazy-loaded) with the emoji icon as fallback. Shipped a real
  `manifest.json` with `my-hero/` (dark + light variants, shared
  `preview.svg`, token-seeded) replacing the dormant example. +5 tests
  (207 total).

#### P5f. Stable export/plugin extension points ✅ done

**Branch**: `feature/plugin-extension-points`
**Effort**: ~14–21 days

- Stabilize the exporter API (`buildExportHtml` / `buildExportCss` /
  `buildSingleFileHtml` / zip pipeline) into a documented contract
- Third-party export targets plug in via a small registry, no fork required
- ✅ **Done 2026-07-31** — pure builders extracted to
  `codegen/htmlExport.js` (sibling of jsx/vue/wc exporters; `exporter.js`
  re-exports them). New DOM-free `exportRegistry.js`: six built-in targets
  plus validated `registerExportTarget` (unique id, label, `generate`),
  exposed as `window.registerExportTarget`. Contract:
  `generate({ innerHtml, cssCode, rawCssCode, canvasClone })` →
  `{ files: [{ name, data }] }` (string | Uint8Array), sync or async;
  dropdown and dispatch driven entirely by the registry. Documented in
  `docs/export-plugin.md`. +10 tests (217 total).

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
P4e  (AI assistant)          ✅ done (optional, shipped)
P5b  (token-aware inspector) ✅ done
P5c  (zip export)            ✅ done
P5d  (offline PWA)           ✅ done
P5e  (template ecosystem)    ✅ done
P5f  (plugin extension)      ✅ done — P5 complete, roadmap complete
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
| `feature/ai-css-assistant`        | P4e  | ✅ Merged to master |
| `feature/token-aware-inspector`   | P5b  | ✅ Merged to master |
| `feature/zip-export`              | P5c  | ✅ Merged to master |
| `feature/pwa-offline`             | P5d  | ✅ Merged to master |
| `feature/template-ecosystem`      | P5e  | ✅ Merged to master |
| `feature/plugin-extension-points` | P5f  | ✅ Merged to master |
| `feature/i18n-applied-ui`         | —    | ✅ Merged to master |
| `feature/modal-a11y`              | —    | ✅ Merged to master |
| `feature/project-file-versioning` | —    | ✅ Merged to master |
| `feature/ai-edit-selection`       | —    | ✅ Merged to master |

### Execution log

| Date       | Action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-29 | P1b (tests) + P2a (Web Component export) assigned to subagents, both merged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 2026-07-29 | P1a (split app.js) + P1c (cssState module) done in `feature/split-app-modules`, merged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-07-29 | P1d (svg icons) done in `feature/svg-icons`, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2026-07-30 | P2b (backend cloud sync) done in `feature/backend-sync`, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-07-30 | P3b (template marketplace) done in `feature/template-marketplace` — 5 MVP templates, gallery modal, replace/append insertion, tests, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2026-07-30 | P3a (realtime collaboration) done in `feature/collab` — Yjs adapter, presence overlay, follow mode, merged to master                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-31 | Product positioning decided: open-source, self-hostable, local-first tool. No login/account features on the roadmap; cloud sync + collab stay as optional self-hosted add-ons. Future plan rewritten as P4 (self-host quickstart, file-first sharing, template library, design tokens, optional AI assistant).                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-07-31 | P4a (self-host quickstart) done — Dockerfile, docker-compose, nginx.conf, docs/self-hosting.md.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 2026-07-31 | P4b (file-first sharing) done in `feature/file-sharing` — `.lcproj` export/import (File menu + drag-and-drop onto window), single-file HTML export option, drop-in template folder `public/templates/` (manifest-driven, merged into gallery at runtime). +12 tests.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-07-31 | P4c (template library) done in `feature/template-library` — 5 → 22 templates: hero split, feature grid, testimonials, CTA banner, stats, team, blog cards, FAQ, dashboard shell, profile card, chat list, todo list, signup/contact/newsletter forms, product grid, cart summary. Gallery icons for all 22. +17 tests via `it.each` data-structure coverage.                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-07-31 | P4d (design tokens) done in `feature/design-tokens` — token panel in the CSS sidebar (`tokenEditor.js`), per-project token storage (LocalStorage + `.lcproj`), `:root` output in compiled/exported CSS, rehydration on load/import. Also fixed a latent bug: `window.saveProject` was never assigned, so drop-in templates and token saves silently didn't persist — now exposed from app.js. +18 tests; vitest `hookTimeout`/`testTimeout` raised to 30s for parallel workers.                                                                                                                                                                                                                                                                             |
| 2026-07-31 | P5b (token-aware design system UI) done in `feature/token-aware-inspector` — palette-button token popup on every CSS block value input and Inspector style row (insert `var(--name)` / save current value as token via `tokenPicker.js`); `cssState.replaceTokenRef()` rewrites `var()` refs incl. nested rules on token rename; templates `navbar`/`dashboard-layout`/`signup-form` seed tokens on replace and merge on append. +12 tests (185 total).                                                                                                                                                                                                                                                                                                     |
| 2026-07-31 | P5c (whole-site zip export) done in `feature/zip-export` — export dropdown gained "Whole-site ZIP (HTML + CSS + assets)". New zero-dependency `zipWriter.js` (native `CompressionStream` deflate-raw + store fallback, hand-rolled CRC32); `extractDataImages()` moves `data:image` URIs into `assets/` with relative `src` rewrites; `buildSiteZip()` bundles `index.html` + `style.css` + assets. Tests parse + inflate the produced zip (deflate and store paths). +11 tests (196 total).                                                                                                                                                                                                                                                                |
| 2026-07-31 | P5d (offline PWA) done in `feature/pwa-offline` — zero-dep SW via `scripts/pwa.js` Vite plugin (closeBundle scans `dist/`, inlines precache list, cache name `lc-<hash>` with stale-cache purge); cache-first fetch with network fallback so the jsdelivr SortableJS script works offline after first visit; `public/manifest.webmanifest` + maskable SVG icon + `theme-color`; SW registration ignores dev 404s. +6 tests (202 total).                                                                                                                                                                                                                                                                                                                     |
| 2026-07-31 | P5e (template ecosystem) done in `feature/template-ecosystem` — manifest entries support optional `preview` (path/data URI) and subfolder `file` paths (one folder = multiple variants); template JSONs carry `tokens` seeded on apply; gallery cards lazy-load preview images with emoji fallback. Shipped real `manifest.json` + `my-hero/` folder (dark/light variants + `preview.svg` + tokens), removed dormant example files; `public/templates/README.md` documents the folder format. +5 tests (207 total).                                                                                                                                                                                                                                         |
| 2026-07-31 | P5f (export plugin extension points) done in `feature/plugin-extension-points` — pure HTML/CSS builders extracted to `codegen/htmlExport.js` (re-exported by exporter.js for compat); new DOM-free `exportRegistry.js` with 6 built-in targets + validated `registerExportTarget` (exposed as `window.registerExportTarget`); dropdown and dispatch fully registry-driven; contract documented in `docs/export-plugin.md`. +10 tests (217 total) — P5 complete.                                                                                                                                                                                                                                                                                             |
| 2026-07-31 | P4e (AI CSS assistant) done in `feature/ai-css-assistant` — BYOK OpenAI-compatible component generation: system prompt embeds cssDictionary properties + template ids; JSON reply `{ html, cssData, tokens? }` parsed tolerantly; Insert merges (cssData rule merge + token merge) / Replace rehydrates; settings (base URL/model/API key) stored in localStorage only, works with OpenAI/OpenRouter/Ollama/LM Studio; AI modal + toolbar button + `ui.ai.*` i18n (en/zh-TW/ja); guide in `docs/ai-assistant.md`. +12 tests (229 total) — **full roadmap complete**.                                                                                                                                                                                        |
| 2026-08-02 | Post-roadmap polish batch — applied-i18n pipeline in `feature/i18n-applied-ui`: new `i18nApplier.js` (`applyI18n` for data-i18n/-placeholder/-title, boot-time from app.js) + index.html fully marked (menus, toolbar, placeholder card, inspector/layers/css panels, 5 modals); `ui.*` keys en/zh-TW; ja locale dropped (no UI to select it; setLocale('ja') falls back to en). Also fixed latent bug in `exporter.js` — `export { x } from` creates no local binding but the module called `cleanStyles`/`buildExportCss` internally → now import + export. +7 tests (236 total).                                                                                                                                                                         |
| 2026-08-02 | Modal accessibility in `feature/modal-a11y` — new zero-invasion `modalA11y.js`: MutationObserver on the style attribute detects open/close (all modals toggle display), role=dialog/aria-modal/aria-label from `.modal-title`, focus capture + restore, Tab wrapping, Escape handled in capture phase with stopImmediatePropagation (suppresses app.js global Escape→deselectAll); innermost overlay wins (template preview vs gallery). +5 tests (241 total).                                                                                                                                                                                                                                                                                              |
| 2026-08-02 | `.lcproj` version validation + migration in `feature/project-file-versioning` — `validateProjectFile()` now checks version (missing → v1, non-numeric or >2 rejected); new `migrateProjectFile()` seeds empty tokens map for v1 and stamps version 2; `importProjectFile()` migrates right after validation. +7 tests (247 total).                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2026-08-02 | Module-level window hook contract — attempt to skip `window.rebuildCssRulesUI` assignment when present FAILED (stale closure after `vi.resetModules()` reads the old cssState, rules never render; 8 test failures). Contract: module-level `window.*` assignments always run; tests stub AFTER importing. +3 tests in `test/windowHooks.test.js` (250 total). Note: this work went straight to master (`2a791ed`) instead of a branch — lesson recorded in dev-notes.                                                                                                                                                                                                                                                                                      |
| 2026-08-02 | AI edit mode in `feature/ai-edit-selection` — with a canvas element selected (first class that already has a rule), the AI modal switches to edit mode: `getSelectionTarget()` resolves `{ selector, currentStyles }`; `buildEditMessages()` demands a cssData-only reply restating the selector with the full property set; `parseEditReply()` rejects html-bearing replies; `applyAiEdit()` REPLACES the rule (edit replies are the complete set; merging would leak stale properties). Preview HTML now escaped. Also fixed: `parseEditReply` fed an object to a string parser (extracted shared `extractAssistantJson`), and `t()`'s `{0}` placeholders never substituted — `importSuccess`/`editTarget` are now function leaves. +9 tests (259 total). |
