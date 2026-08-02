# Handoff — LayoutCraft Studio

State as of commit `81ddb05` on `master` (2026-07-28).

---

## Quick start

```bash
npm install        # already done
npm run dev        # Vite dev server (hot reload)
npm test           # 19 tests, all green
npm run lint       # ESLint — clean
npm run format     # Prettier — clean
```

---

## Project structure

```
index.html              ← entry HTML (no inline styles; classes drive layout)
src/
├── css/
│   └── editor.css      ← single CSS file (canvas-preview.css merged in)
├── js/
│   ├── app.js          ← entry point; orchestrates all modules
│   ├── config/
│   │   ├── i18n.js     ← translation lookups (t())
│   │   ├── elements.js ← draggable HTML element catalogue
│   │   └── cssDictionary.js ← CSS property block catalogue
│   └── modules/
│       ├── history.js  ← undo/redo command stack (bounded buffer)
│       ├── canvas.js   ← SortableJS drag/drop + nested containers
│       ├── inspector.js← element property editor (ID/class/text/attrs)
│       ├── exporter.js ← preview mode + download HTML/CSS
│       └── storage.js  ← multi-project LocalStorage + usage meter
test/
├── history.test.js     ← 7 tests (undo/redo stack behaviour)
├── i18n.test.js        ← 7 tests (lookup, fallback, setLocale)
├── storage.meter.test.js ← 5 tests (byte calc, capacity, serialisation)
└── _localStorageHarness.js ← fake localStorage for Node tests
```

---

## What's shipped

| Feature                                             | Status                 |
| --------------------------------------------------- | ---------------------- |
| Dual-mode editor (Visual / CSS Expert)              | Done                   |
| Drag-and-drop HTML elements onto canvas             | Done                   |
| CSS building blocks with live value inputs          | Done                   |
| Selector blinking detector                          | Done                   |
| Multi-project LocalStorage + 5 MB meter             | Done                   |
| Export HTML/CSS download                            | Done                   |
| Preview mode                                        | Done                   |
| **Undo/Redo history stack** (Ctrl+Z / Ctrl+Shift+Z) | **Done — Mid-term #1** |
| CSS skeleton cleanup (no inline styles, no dupes)   | Done                   |

---

## Architecture rules (from AGENTS.md)

- **Vanilla ES Modules** — no framework; bundled by Vite for production.
- **SortableJS** loaded from jsdelivr CDN in `index.html`.
- **`i18n.js`** (`t(path, ...args)`) for all user-facing strings; never hardcode.
- **New strings** go into `i18n.js` under the `en` locale.
- **`config/` modules** are pure data — no DOM access.
- **`modules/` modules** handle DOM interaction.
- **`app.js`** is the only file that imports from both `config/` and `modules/`.
- Comments only for non-obvious intent; do not duplicate the code.

---

## Git history (master, last 20 commits)

All feature work since the initial scaffold is now on `master`. The full branch
cleanup is documented in `docs/branch-audit.md`.

Key merge commits:

```
81ddb05 Update ROADMAP: mark Mid-term #1 done
3401ef3 Merge feature/ui-skeleton-cleanup (undo/redo + CSS cleanup)
89ad4c9..531d42b Merge 9 design-doc branches (Mid-term #2–#5, Long-term #1–#5)
```

---

## Testing

| Test file               | Tests | What it covers                                                                                                    |
| ----------------------- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| `history.test.js`       | 7     | push, undo, redo, splice on new push after undo, bounded buffer, invalid command ignored, subscribe               |
| `i18n.test.js`          | 7     | string/nested key lookup, fallback to `en`, function leaf with args, missing key → raw path, setLocale, getLocale |
| `storage.meter.test.js` | 5     | UTF-16 byte calc, 5 MB percentage, colour thresholds, save with showAlert, save with false                        |

Plus 20 more files under `test/` (cssState, canvas, exporter, projectFile,
aiAssistant, tokenEditor, i18nApplier, modalA11y, windowHooks, …).

Run: `npm test` (Vitest, happy-dom environment) — currently **259 tests across
23 files**.

---

## Known quirks / gotchas

- **CSS outlines on canvas children** — In edit mode, every `.canvas-container *`
  gets a dashed border and min-height so empty elements are visible. This is
  stripped in preview mode.
- **`.hidden` class** — Defined as `display: none !important` in `editor.css`
  and toggled on both `#no-selection-msg` and `#editor-form` by the inspector.
- **Debounced history commands** — Field edits (ID, class, text content, CSS
  block values) use a 400 ms trailing debounce so a single undo reverts the
  whole edit, not each keystroke.
- **`buildNewElement` in canvas.js** — The redo path re-creates elements rather
  than re-inserting the original DOM node (which may have been modified or
  removed). Both the drop and redo paths call the same `buildNewElement(tag)`.
- **LocalStorage 5 MB limit** — Native browser quota. The meter calculates UTF-16
  byte usage across all keys under the `layoutcraft_proj_*` prefix.
- **CSS.escape() in app.js** — The redo/rollback for CSS block value edits
  uses `CSS.escape()` on the selector when querying `.css-rule-box`. Make sure
  any new query follows the same pattern.
- **Module-level `window.*` hooks** — `cssEditor.js` / `tokenEditor.js`
  unconditionally assign `window.rebuildCssRulesUI` / `window.rebuildTokenUI`
  at module load (tests must stub these AFTER importing the module — a
  "skip if present" guard breaks under `vi.resetModules()` because the stale
  closure reads the old cssState; see dev-notes).
- **i18n marking rules** — `data-i18n` elements must be leaf text nodes
  (children are replaced by the localized text); `t()` does not substitute
  `{0}` placeholders — keys needing arguments must be function leaves.
  Locales: en, zh-TW (ja was dropped).
- **Modal a11y** — `modalA11y.js` watches `style` attributes for open/close;
  Escape is handled in the capture phase with `stopImmediatePropagation` to
  beat app.js's global Escape → deselectAll.

---

## What's done (all Mid-term features complete)

| Priority              | Feature                                                | Status  |
| --------------------- | ------------------------------------------------------ | ------- |
| Mid-term (Feature) #1 | Undo/Redo history stack                                | ✅ Done |
| Mid-term (Feature) #2 | Advanced CSS blocks (`@media`, `:hover`, custom props) | ✅ Done |
| Mid-term (Feature) #3 | Export to React JSX / Vue SFB                          | ✅ Done |
| Mid-term (Feature) #4 | Nested sortable containers                             | ✅ Done |
| Mid-term (Feature) #5 | Import/parse pasted HTML/CSS                           | ✅ Done |

## Next steps (Long-term roadmap)

| Priority     | Feature                                                |
| ------------ | ------------------------------------------------------ |
| Long-term #1 | Backend sync (Supabase/Firebase) — lift 5MB cap        |
| Long-term #2 | Multi-user collaboration (realtime multiplayer)        |
| Long-term #3 | Template marketplace (curated layout library)          |
| Long-term #4 | i18n & theming (additional locales, dark mode toggle)  |
| Long-term #5 | Web Component export (Custom Elements with shadow DOM) |

Design docs for each exist in `docs/`. Cut a new branch from `master` and start implementing.
