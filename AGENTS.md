# AGENTS.md

Instructions for AI agents (and humans) working on LayoutCraft Studio.

## Commands

Run these from the repository root. They are the canonical commands for
linting, formatting, and future testing.

```bash
# Install dev dependencies (ESLint, Prettier, plugins)
npm install

# Start the Vite dev server (hot reload)
npm run dev

# Build the production bundle into dist/
npm run build

# Preview the built bundle locally
npm run preview

# Lint all files (ESLint)
npm run lint

# Lint and auto-fix what ESLint can fix
npm run lint:fix

# Format all files with Prettier (writes in place)
npm run format

# Check formatting without writing (useful in CI / pre-commit)
npm run format:check

# Run unit tests once
npm test

# Run unit tests in watch mode
npm run test:watch
```

Always run `npm run lint` and `npm run format:check` (and `npm test` when
touching tested code) before committing. They must exit cleanly. If a change
introduces new lint, format, or test failures, fix them within the same
commit so the tree stays green.

## Module boundaries

- `src/js/app.js` — entry point; orchestrates Canvas, Inspector, Exporter,
  Storage, mode switcher, and the visual CSS rule builder.
- `src/js/config/` — pure configuration: `codegen.js`, `components.js`,
  `cssDictionary.js`, `devices.js`, `elements.js`, `styleProps.js`,
  `templates.js`, `i18n.js`. No DOM access here; these are data only.
- `src/js/modules/canvas.js` — drag/drop + Sortable wiring.
- `src/js/modules/inspector.js` — element property editor + dynamic attrs.
- `src/js/modules/exporter.js` — preview mode + export dropdown UI; the
  dropdown and dispatch are driven by the export registry.
- `src/js/modules/exportRegistry.js` — DOM-free export target registry:
  built-in targets (`html-single`, `zip`, `html`, `react`, `vue`, `wc`) and
  `registerExportTarget`/`getExportTargets`; exposed to the page as
  `window.registerExportTarget`. Contract: `docs/export-plugin.md`.
- `src/js/modules/codegen/htmlExport.js` — pure HTML/CSS builders
  (`buildExportHtml`, `buildSingleFileHtml`, `buildExportCss`,
  `cleanStyles`, `extractDataImages`, `buildSiteZip`); re-exported by
  `exporter.js` for backwards compatibility.
- `src/js/modules/storage.js` — multi-project LocalStorage manager + meter.
- `src/js/modules/tokenEditor.js` — design tokens panel (`--css-*` variables,
  stored per-project, emitted as `:root { … }`).
- `src/js/modules/tokenPicker.js` — `var(--token)` picker popup shared by the
  CSS sidebar value inputs and the Inspector style rows.
- `src/js/modules/zipWriter.js` — zero-dependency ZIP writer (`CompressionStream`
  deflate-raw with store fallback, hand-rolled CRC32); consumed by the exporter
  for the whole-site zip export.
- `src/js/modules/aiAssistant.js` — BYOK AI generation against any
  OpenAI-compatible `/chat/completions` endpoint (config in localStorage
  `lc.aiConfig`, never in project files). `buildMessages()` embeds the CSS
  property list + template ids into the system prompt; results
  `{ html, cssData, tokens? }` apply via insert (merge) or replace
  (rehydrate). Contract: `docs/ai-assistant.md`.
- `src/js/modules/sync.js` — optional cloud sync via Supabase (auth, push/pull,
  debounced background sync, conflict prompt). Gracefully degrades when env vars
  are missing or the user is not authenticated.
- `src/js/config/i18n.js` — `t(path, ...args)` lookups with English default.
  Add new user-facing strings here; do not hardcode strings in module code.
- `src/js/modules/i18nApplier.js` — `applyI18n(root)` applies the active
  locale to static markup (`data-i18n` → textContent,
  `data-i18n-placeholder`, `data-i18n-title`); called from `app.js` on boot.
  Mark only leaf text elements — elements with child markup (icons) have
  children replaced by the localized text.

## Cloud sync setup

To enable cloud sync, create a `.env` file (or `.env.development` / `.env.production`)
in the project root with your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Then run the migration in `docs/supabase-migration.sql` in your Supabase SQL editor
to create the `projects` table with Row-Level Security.

Without these env vars, all cloud operations are silently skipped — the app runs
fully offline with LocalStorage only.

## Conventions

- Vanilla ES Modules bundled by Vite for production (dev runs unbundled).
- SortableJS is loaded from the jsdelivr CDN via a `<script>` tag in
  `index.html`; patch with care when changing the CDN URL or migrating to
  an npm `import`.
- Default language is English; new strings go through `t()`.
- Comments may be added only when they explain non-obvious intent; we do
  not duplicate what the code already says.
- Line endings: project uses CRLF on Windows checkout via git autocrlf;
  Prettier is set to `endOfLine: "auto"` to avoid formatter churn.
