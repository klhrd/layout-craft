# AGENTS.md

Instructions for AI agents (and humans) working on LayoutCraft Studio.

## Commands

Run these from the repository root. They are the canonical commands for
linting, formatting, and future testing.

```bash
# Install dev dependencies (ESLint, Prettier, plugins)
npm install

# Lint all files (ESLint)
npm run lint

# Lint and auto-fix what ESLint can fix
npm run lint:fix

# Format all files with Prettier (writes in place)
npm run format

# Check formatting without writing (useful in CI / pre-commit)
npm run format:check
```

Always run `npm run lint` and `npm run format:check` before committing.
They must exit cleanly. If a change introduces new lint or format issues,
fix them within the same commit so the tree stays green.

## Module boundaries

- `src/js/app.js` — entry point; orchestrates Canvas, Inspector, Exporter,
  Storage, mode switcher, and the visual CSS rule builder.
- `src/js/config/` — pure configuration: `elements.js`, `cssDictionary.js`,
  `i18n.js`. No DOM access here; these are data only.
- `src/js/modules/canvas.js` — drag/drop + Sortable wiring.
- `src/js/modules/inspector.js` — element property editor + dynamic attrs.
- `src/js/modules/exporter.js` — preview/export preview flow.
- `src/js/modules/storage.js` — multi-project LocalStorage manager + meter.
- `src/js/config/i18n.js` — `t(path, ...args)` lookups with English default.
  Add new user-facing strings here; do not hardcode strings in module code.

## Conventions

- Vanilla ES Modules. No bundler yet (planned in a later phase).
- Default language is English; new strings go through `t()`.
- Comments may be added only when they explain non-obvious intent; we do
  not duplicate what the code already says.
- Line endings: project uses CRLF on Windows checkout via git autocrlf;
  Prettier is set to `endOfLine: "auto"` to avoid formatter churn.
