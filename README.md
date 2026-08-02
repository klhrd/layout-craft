# LayoutCraft Studio

A vanilla-JavaScript low-code web editor. Drag elements onto a canvas, stack
visual CSS blocks, edit properties inline, and export clean HTML/CSS — no
framework, no build step beyond Vite for the dev server.

---

## Features

- **Dual editing modes** — Visual layout (drag/drop components) + CSS Expert
  mode (stack property blocks under a selector like LEGO bricks).
- **Live selector detector** — every CSS rule box has a 🎯 Detect toggle that
  blinks all matching canvas elements.
- **Visual property editors** — color swatches, alignment buttons, sliders,
  font pickers, opacity, box-shadow, spacing diagram.
- **Per-element inspector** — edit ID/Class/text content + dynamic attributes;
  8-point resize handles; hierarchy controls (move up/down, wrap, unwrap,
  lift-out).
- **Layers panel** — tree view of canvas elements with visibility/lock toggles.
- **Context menu** — duplicate, copy/paste styles, wrap in `<div>`, edit text.
- **Keyboard shortcuts** — Ctrl+Z/Y undo/redo, Ctrl+C/V copy/paste, Ctrl+D
  duplicate, arrow nudge, Ctrl+/ toggle mode, Shift+arrow nudge 10px.
- **Responsive preview** — Desktop / Tablet (768px) / Mobile (375px) frames.
- **Canvas rulers + snap-to-grid** — draggable guide lines, 16px grid overlay.
- **Light/dark theme** with CSS custom properties + two locales (en, zh-TW) —
  static UI is fully localized via `data-i18n` attributes (menus, toolbars,
  modals, placeholders, tooltips) applied at boot by `i18nApplier.js`.
- **Template marketplace** — 22 starter templates across marketing, app
  shells, forms and e-commerce (heroes, feature grids, pricing, dashboards,
  product grids, checkout…), insertable via **Replace** or **Append** with
  storage quota warning. Drop extra templates into `public/templates/`
  (manifest-driven, no code changes) to extend the gallery of your own
  install — subfolders bundle multiple variants, optional preview images,
  and templates can seed design tokens.
- **File-first sharing** — projects export/import as `.lcproj` JSON (File menu
  or drag the file onto the window); exports include single-file HTML with
  inlined CSS.
- **Design tokens** — CSS custom properties (colors, spacing, type scale) live
  in a token panel inside the CSS sidebar, persist with the project (LocalStorage
    - `.lcproj`), and export as a `:root { … }` block in every CSS output. Every
      CSS value input and Inspector row has a token picker: insert `var(--name)` or
      save the current value as a token; renaming a token rewrites all references.
- **Optional cloud sync** — Supabase auth (email magic-link / GitHub OAuth),
  debounced push after edits, pull on start, "Cloud is newer — Pull / Keep
  local" conflict prompt. Fully offline-capable when env vars are absent.
- **Realtime collaboration** — Yjs CRDT bridge for canvas DOM + CSS state,
  remote cursor/selection overlay (10 Hz), Follow mode, anonymous read-only
  join.
- **Multi-project LocalStorage** with 5 MB meter and 85% red warning.
- **Export** — standalone HTML/CSS, whole-site ZIP (HTML + CSS + images in an
  `assets/` folder), React JSX, Vue SFC, or Web Component (Custom Element with
  shadow DOM). The export system is a small registry — third-party formats
  plug in via `window.registerExportTarget` (see
  [`docs/export-plugin.md`](docs/export-plugin.md)).
- **Offline PWA** — installable manifest + zero-dependency service worker
  (precaches the whole app at build time, cache-first serving) so the editor
  boots fully offline after the first visit.
- **AI assistant** — generate a component from a natural-language prompt
  (`"a pricing section with three tiers"`) or restyle a selected element
  (`"make it dark with rounded corners"`) via any OpenAI-compatible endpoint
  (OpenAI, OpenRouter, Ollama, LM Studio…). Bring your own API key — stored
  only in this browser, never in the project file. Results land as **Insert**
  (merged into canvas + CSS rules + design tokens), **Replace**, or
  **Apply Changes** on the selected element's rule (see
  [`docs/ai-assistant.md`](docs/ai-assistant.md)).
- **Undo/redo** — bounded command stack with debounced history entries.

## Quick start

```bash
npm install
npm run dev      # Vite dev server (hot reload) → http://localhost:5173
```

### Common commands

```bash
npm run build          # Production bundle into dist/
npm run preview        # Preview the built bundle locally
npm run lint           # ESLint
npm run format:check   # Prettier formatting check
npm test               # Run unit tests once
npm run test:watch     # Unit tests in watch mode
```

### Self-hosting

LayoutCraft is an open-source, self-hostable, local-first tool. The production
build is a static site (`dist/`) that runs with zero backend — just serve it:

```bash
npm run build
# then host dist/ anywhere (nginx, GitHub Pages, Netlify, ...)
```

One-command Docker self-host (nginx container on `http://localhost:8080`):

```bash
docker compose up -d --build
```

See [`docs/self-hosting.md`](docs/self-hosting.md) for the full guide
(nginx config, deploy options, optional Supabase sync, Docker build args).

### Cloud sync setup

Cloud sync is an **optional add-on and is disabled by default** (the product
is account-free — see [`docs/ROADMAP.md`](docs/ROADMAP.md)). If you self-host
and want sync for your own instance, create a `.env` (or `.env.development` /
`.env.production`) in the repo root with your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then run the migration in [`docs/migrations/supabase-migration.sql`](docs/migrations/supabase-migration.sql)
in your Supabase SQL editor to create the `projects` table with Row-Level
Security, and re-enable the commented-out auth UI (search for "account-free
positioning" in `src/js/app.js` and `index.html`). Without env vars, all cloud
operations are silently skipped — the app runs fully offline with LocalStorage
only.

### Deployment

Pushing to `master` triggers GitHub Actions, which runs `npm ci && npm run build`
and deploys the `dist/` folder to GitHub Pages.

## Project structure

```text
layout-craft/
├── index.html               # App entry (workspace HTML scaffold)
├── Dockerfile               # Multi-stage build (node → nginx)
├── docker-compose.yml       # One-command self-host
├── nginx.conf               # nginx config for the Docker image
├── package.json             # npm scripts + dependencies
├── vite.config.js           # Vite dev/build/preview config
├── vitest.config.js         # Vitest config (happy-dom env)
├── jsconfig.json            # Editor type-awareness + path aliases
├── .env.example             # Supabase env var placeholders
├── AGENTS.md                # Instructions for AI agents and humans
├── public/
│   └── templates/           # Drop-in template folder (manifest-driven)
├── docs/                    # All project documentation (see below)
└── src/
    ├── css/
    │   └── editor.css       # Editor UI, canvas, blink animation styles
    └── js/
        ├── app.js           # Entry point: orchestrates all modules
        ├── config/          # Pure data modules (no DOM access)
        │   ├── codegen.js        # JSX attr map, boolean attrs, void elements
        │   ├── components.js     # Pre-built component library
        │   ├── cssDictionary.js  # CSS property block catalogue
        │   ├── devices.js        # Preview breakpoint presets (desktop/tablet/mobile)
        │   ├── elements.js       # Draggable HTML element catalogue + tag labels
        │   ├── i18n.js           # t() lookup dictionary (en/zh-TW)
        │   ├── styleProps.js     # Inspector style editor grid (font/color/spacing widgets)
        │   └── templates.js      # 22 built-in starter templates
        └── modules/         # DOM-aware feature modules
            ├── canvas.js        # Drag/drop + SortableJS wiring
            ├── canvasHelpers.js # Snap grid, guides, resize handles
            ├── contextMenu.js   # Right-click context menu
            ├── cssEditor.js     # Visual CSS Rules (drag/drop/delete)
            ├── cssState.js      # Mutable CSS state (tree data model)
            ├── exporter.js      # Preview mode + export dropdown (registry-driven)
            ├── exportRegistry.js # Export targets registry + plugin hook
            ├── followMode.js    # Collab Follow mode + peer highlight
            ├── history.js       # Undo/redo command stack
            ├── i18nApplier.js   # data-i18n static-UI localizer (boot)
            ├── icons.js         # Inline SVG icon set + MutationObserver
            ├── importer.js      # HTML/CSS paste import + sanitisation
            ├── inspector.js     # Property inspector + dynamic attrs
            ├── layers.js        # Layers tree panel
            ├── modalA11y.js     # Focus trap + dialog semantics for modals
            ├── presence.js      # Remote cursor/selection overlay
            ├── projectFile.js   # .lcproj export/import + drag-and-drop
            ├── storage.js       # Multi-project LocalStorage + quota meter
            ├── sync.js          # Optional Supabase cloud sync
            ├── templateGallery.js # Template gallery modal
            ├── templateLoader.js  # Template replace/append insertion
            ├── tokenEditor.js   # Design tokens panel (:root CSS variables)
            ├── tokenPicker.js   # var(--token) picker popup
            ├── yjsAdapter.js    # Yjs DOM<->Y.Doc + cssState<->Y.Map bridge
            ├── zipWriter.js     # Zero-dep ZIP writer (CompressionStream)
            ├── aiAssistant.js   # BYOK AI generation (OpenAI-compatible)
            └── codegen/
                ├── domWalker.js  # DOM tree walker for exporters
                ├── htmlExport.js # Pure HTML/CSS builders + zip pipeline
                ├── jsxExport.js  # React JSX export
                ├── vueExport.js  # Vue SFC export
                └── wcExport.js   # Web Component export
```

## Documentation

All project docs live in [`docs/`](docs/):

| Document                                                                           | Description                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                                               | Development roadmap (short/mid/long-term plan + branch status + execution log) |
| [`docs/handoff.md`](docs/handoff.md)                                               | Handoff snapshot with architecture rules and known quirks                      |
| [`docs/progress.md`](docs/progress.md)                                             | UX Overhaul progress log (items #1–#11)                                        |
| [`docs/branch-audit.md`](docs/branch-audit.md)                                     | Historical audit of all stale feature branches                                 |
| [`docs/undo-redo.md`](docs/undo-redo.md)                                           | Undo/redo history stack design                                                 |
| [`docs/advanced-css-blocks.md`](docs/advanced-css-blocks.md)                       | `@media` / `@keyframes` / custom properties design                             |
| [`docs/nested-components.md`](docs/nested-components.md)                           | Nested sortable containers design                                              |
| [`docs/export-jsx-vue.md`](docs/export-jsx-vue.md)                                 | React JSX / Vue SFC export design                                              |
| [`docs/import-flow.md`](docs/import-flow.md)                                       | HTML/CSS paste import design                                                   |
| [`docs/web-component-export.md`](docs/web-component-export.md)                     | Web Component (Custom Element) export design                                   |
| [`docs/backend-sync.md`](docs/backend-sync.md)                                     | Supabase cloud sync design (P2b)                                               |
| [`docs/self-hosting.md`](docs/self-hosting.md)                                     | Self-hosting guide: install, deploy, Docker, optional Supabase sync (P4a)      |
| [`docs/i18n-theming.md`](docs/i18n-theming.md)                                     | i18n + light/dark theme design                                                 |
| [`docs/collab.md`](docs/collab.md)                                                 | Realtime Yjs collaboration design (P3a)                                        |
| [`docs/template-marketplace.md`](docs/template-marketplace.md)                     | Template marketplace design (P3b)                                              |
| [`docs/export-plugin.md`](docs/export-plugin.md)                                   | Export plugin contract: registry + `window.registerExportTarget` (P5f)         |
| [`docs/ai-assistant.md`](docs/ai-assistant.md)                                     | AI assistant: providers, reply contract, scope notes (P4e)                     |
| [`docs/migrations/supabase-migration.sql`](docs/migrations/supabase-migration.sql) | Supabase `projects` table + RLS migration                                      |
| [`public/templates/README.md`](public/templates/README.md)                         | Drop-in template folder format (`manifest.json` + JSON files)                  |

See [`AGENTS.md`](AGENTS.md) for the canonical commands and conventions that
agents (and humans) should follow when working on this repo.
