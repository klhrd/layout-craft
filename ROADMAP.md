# LayoutCraft Studio - Development Roadmap

This document tracks the planned development of LayoutCraft Studio, organized by phase.

## Current Status

- **Branch**: `master` (clean, in sync with `origin/master`)
- **Stack**: Vite + Vitest + ESLint + Prettier (Vanilla ES Modules)
- **Scope**: Single-page editor (`index.html` + 13 source files under `src/`)
- **Features shipped**: dual-mode editor (Visual / CSS Expert), drag-and-drop components, CSS building blocks with live visual inputs, selector blinking detector, multi-project LocalStorage storage with capacity meter and auto-save, undo/redo history stack, advanced CSS blocks (media/keyframes/nested rules), React JSX / Vue SFB export, nested sortable containers, HTML/CSS import flow, WYSIWYG canvas with hover/select, select-to-style inline editor, layers panel with visibility/lock, context menu, pre-built component library (hero, navbar, card, contact, footer, testimonial, pricing, FAQ), inline text editing, empty-state guidance, menu bar (File/Edit/View) with Material Symbols, zoom controls, inspector hierarchy editing, component CSS auto-extraction

---

## Completed Milestones

> All foundational engineering + all Mid-term Feature Expansion items are done.

- **Short-term #1–6**: English language, ESLint/Prettier, Vitest, Vite, jsconfig, documentation
- **Mid-term (Feature) #1**: Undo/Redo history stack
- **Mid-term (Feature) #2**: Advanced CSS blocks (`@media`, `:hover`, pseudo, custom props, keyframes)
- **Mid-term (Feature) #3**: React JSX / Vue SFB export
- **Mid-term (Feature) #4**: Nested sortable containers
- **Mid-term (Feature) #5**: HTML/CSS import flow

**Partially completed Mid-term UX items:**

| #   | Item                        | Status                                                                                                   |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | WYSIWYG canvas              | ✅ Hover highlight + click-to-select + outline toggle done. Missing: edit-mode toggle, resize handles    |
| 2   | Select-to-style             | ✅ Fully done — auto-class generation + inline style editor                                              |
| 3   | Inline text editing         | ✅ Fully done — double-click, Enter commit, Escape cancel                                                |
| 4   | Visual property editors     | 🟡 Color picker, font-size presets, align buttons done. Missing: sliders, unit selector, spacing diagram |
| 5   | Layers / outline panel      | ✅ Fully done — tree with visibility/lock toggle                                                         |
| 6   | Context menu                | ✅ Fully done — edit text, duplicate, copy/paste, delete, move, wrap                                     |
| 7   | Pre-built component library | ✅ Fully done — 8 components with auto-CSS extraction                                                    |
| 8   | Responsive preview          | ✅ Fully done — Desktop/Tablet/Mobile breakpoint buttons with body[data-bp] constraints                  |
| 9   | Keyboard shortcuts          | ✅ Fully done — Ctrl+Z/C/V/D, Ctrl+/, Del, Escape, arrows (1px), Shift+arrows (10px)                     |
| 10  | Canvas helpers              | 🟡 Rulers (View toggle) + 8-point resize handles done. Snap-to-grid alignment guides pending             |
| 11  | Empty-state guidance        | ✅ Fully done — Quick Start + Load Sample buttons                                                        |

---

## Next-up (Completed — merged to master)

> ✅ All four High Priority UX items have been delivered.

| #   | Item                    | Status                                                                                                                                                                             |
| --- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Responsive preview      | ✅ Desktop (1440px) / Tablet (768px) / Mobile (375px) buttons in toolbar, `body[data-bp]` constrains `.canvas-container`, centered with shadow                                     |
| 2   | Visual property editors | ✅ UnitSlider (range + number + px/rem/em/%), opacity slider, font-family dropdown, spacing diagram (4-direction), box-shadow editor — all with undo                               |
| 3   | Keyboard shortcuts      | ✅ Ctrl+D duplicate, Ctrl+/ toggle mode, Shift+arrow nudge 10px (added alongside existing Ctrl+Z/C/V, Del, Escape, arrows 1px)                                                     |
| 4   | Canvas helpers          | 🟡 Rulers (View > Rulers toggle, top+left with tick marks every 16px) + 8-point resize handles on selected element complete. **Snap-to-grid alignment guides** remains future work |

### Remaining: Snap-to-grid alignment guides

- When dragging an element, show temporary guide lines (`canvas-guide`-style) when its edges align with another element's edges or centre.
- Use `getBoundingClientRect` comparisons during drag events.
- Guide lines should auto-hide after the drag ends.

---

## Mid-term (Feature Expansion — completed)

> All five feature-expansion items are merged into `master`.

| #   | Feature                    | Branch                        |
| --- | -------------------------- | ----------------------------- |
| 1   | Undo / Redo history stack  | `feature/ui-skeleton-cleanup` |
| 2   | Advanced CSS blocks        | `feature/advanced-css-blocks` |
| 3   | React JSX / Vue SFB export | `feature/export-jsx-vue`      |
| 4   | Nested sortable containers | `feature/nested-components`   |
| 5   | HTML/CSS import flow       | `feature/import-flow`         |

---

## Long-term (Product Positioning)

> Goal: take LayoutCraft from a local editor to a shareable, cross-platform development tool.

### 1. Backend cloud sync

- Replace LocalStorage-only persistence with optional cloud storage (Supabase or Firebase).
- On first save, offer "Save to cloud" which creates/updates a remote project.
- Automatic sync: local changes push to cloud; cloud changes pull on page load.
- List remote projects alongside local ones in the Open Project modal.
- Storage meter shows cloud usage instead of the 5MB LocalStorage cap.

### 2. Light/Dark theme + i18n expansion

- Add a **theme toggle** in View > Appearance (Light / Dark / System).
- Define CSS custom properties for all colours (`--bg-main`, `--text-main`, `--primary`, etc.) and swap the palette via a `body.theme-dark` class.
- Expand the i18n dictionary to full coverage for **Traditional Chinese (zh-TW)** and **Japanese (ja)**.
- Add a locale picker in the menu bar (e.g. View > Language > English / 中文 / 日本語).
- Persist theme + locale preference in localStorage.

### 3. Web Component export

- Package each block or the full page as a reusable **Custom Element** with shadow DOM.
- The exporter generates a `.js` file that registers `<layout-craft-block>` with the block's template + styles embedded.
- Downstream users drop the script tag and use the element anywhere.

### 4. Multi-user collaboration

- Real-time multiplayer editing on a shared project.
- Use operational transform or CRDT (Yjs) for conflict-free merging.
- Cursor presence: show other users' cursors and selections on the canvas.
- Chat / comment sidebar for design feedback.

### 5. Template marketplace

- Ship a curated library of 20+ production-ready layouts (landing page, blog, dashboard, e-commerce, portfolio, etc.).
- Each template is a pre-built project with multiple pages and responsive styles.
- Users browse, preview, and import templates in one click from within the editor.
- Community submission pipeline (future).

---

## Branch Strategy

`master` is the source of GitHub Pages deployment; feature branches are cut
from the latest `master` and merge back when green. Each planned item gets its
own `feature/<name>` branch with frequent, focused commits.

Stale branches (already merged into `master` via rebase or sequential merges)
are cleaned up periodically. See [`docs/branch-audit.md`](docs/branch-audit.md).

| Branch                         | Roadmap      | Purpose                                           |
| ------------------------------ | ------------ | ------------------------------------------------- |
| `master`                       | —            | Stable, deployable builds (GitHub Pages source)   |
| `feature/responsive-preview`   | Next-up #1–4 | ✅ Merged — all four items delivered              |
| `feature/backend-sync`         | Long-term #1 | Cloud storage (Supabase/Firebase)                 |
| `feature/i18n-theming`         | Long-term #2 | ✅ Merged — CSS variables + dark theme + zh-TW/ja |
| `feature/web-component-export` | Long-term #3 | Export as Custom Elements                         |
| `feature/collab`               | Long-term #4 | Realtime multiplayer editing                      |
| `feature/template-marketplace` | Long-term #5 | Curated layout template library                   |

---

## Progress Log

- [x] Short-term #1–6: Foundation complete (i18n, lint, tests, build, jsconfig, docs)
- [x] Mid-term (Feature) #1: Undo/Redo — merged `feature/ui-skeleton-cleanup`
- [x] Mid-term (Feature) #2: Advanced CSS blocks — merged `feature/advanced-css-blocks`
- [x] Mid-term (Feature) #3: React JSX / Vue SFB export — merged `feature/export-jsx-vue`
- [x] Mid-term (Feature) #4: Nested sortable containers — merged `feature/nested-components`
- [x] Mid-term (Feature) #5: HTML/CSS import flow — merged `feature/import-flow`
- [x] UI menu bar restructure + Material Symbols + canvas height fix — merged `feature/ui-menu-restructure`
- [x] Inspector hierarchy controls (Move Up/Down, Wrap, Unwrap)
- [x] Component CSS auto-extraction to CSS rule panel on drop
- [x] Responsive preview with breakpoint buttons — merged `feature/responsive-preview`
- [x] Visual property editors (unit slider, spacing diagram, opacity, font-family, box-shadow) — same branch
- [x] Keyboard shortcuts (Ctrl+D duplicate, Ctrl+/ toggle mode, Shift+arrow) — same branch
- [x] Canvas rulers + 8-point resize handles — same branch
- [ ] Snap-to-grid alignment guides (remaining canvas helper)
- [ ] Backend cloud sync (Supabase/Firebase)
- [x] Light/Dark theme toggle + i18n zh-TW / ja — merged `feature/i18n-theming`
- [ ] Web Component export (Custom Elements with shadow DOM)
- [ ] Multi-user realtime collaboration (Yjs / CRDT)
- [ ] Template marketplace (20+ curated layouts)
