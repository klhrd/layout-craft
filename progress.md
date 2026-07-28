# UX Overhaul — Progress Log

See `ROADMAP.md` → _Mid-term (UX Overhaul)_ for the full spec of each item.

---

| #   | Item                        | Branch                               | Status    |
| --- | --------------------------- | ------------------------------------ | --------- |
| 1   | WYSIWYG canvas              | `feature/ux-wysiwyg-canvas`          | ✅ merged |
| 2   | Select-to-style             | `feature/ux-select-to-style`         | ✅ merged |
| 3   | Inline text editing         | `feature/ux-inline-text-editing`     | ✅ merged |
| 4   | Visual property editors     | `feature/ux-visual-property-editors` | ✅ merged |
| 5   | Layers / outline panel      | `feature/ux-layers-panel`            | ✅ merged |
| 6   | Context menu                | `feature/ux-context-menu`            | ✅ merged |
| 7   | Pre-built component library | `feature/ux-component-library`       | ✅ merged |
| 8   | Responsive preview          | `feature/ux-responsive-preview`      | ✅ merged |
| 9   | Keyboard shortcuts          | `feature/ux-keyboard-shortcuts`      | ✅ merged |
| 10  | Canvas helpers              | `feature/ux-canvas-helpers`          | ✅ merged |
| 11  | Empty-state guidance        | `feature/ux-empty-state`         | ✅ merged |

---

## Refactoring

- **2026-07-28** Consolidate duplicate `buildComponentTree` — `chore/consolidate-buildComponentTree` merged. Deleted redundant `buildComponentTree()` from `canvas.js`, imports `buildComponentTemplate()` from `components.js`. Removed ~40 lines of duplicate code.

## Recent work

_(appended automatically after each branch merge)_

- **2026-07-28** UX #1 WYSIWYG canvas — `feature/ux-wysiwyg-canvas` merged. Removed wireframe dashed borders from default edit mode. Added hover highlight (`.el-hover`) on canvas children. Added "🔲 Outlines" toggle button in control bar to restore wireframe view on demand.
- **2026-07-28** UX #2 Select-to-style — `feature/ux-select-to-style` merged. Added inline "Styles" section in inspector panel. When user edits a CSS property, system auto-generates a unique class (`._lc-N`), creates the CSS rule in `activeCssData`, and compiles live styles. Undo support included.
- **2026-07-28** UX #3 Inline text editing — `feature/ux-inline-text-editing` merged. Double-click any text element (p, h1-h6, span, a, button, label, li, th, td) on canvas to edit directly. Enter commits, Escape cancels, blur commits. Green outline indicates editing state. Undo support included.
- **2026-07-28** UX #4 Visual property editors — `feature/ux-visual-property-editors` merged. Replaced plain text inputs in the inline style editor with visual widgets: color swatch + native picker (color, background-color), dropdown (font-weight), alignment button group (text-align), and font-size presets (XS–2XL) with custom text fallback.
- **2026-07-28** UX #5 Layers / outline panel — `feature/ux-layers-panel` merged. Added a layers tree view in the right sidebar showing all canvas elements with indentation hierarchy. Click to select, eye icon to toggle visibility, lock icon to prevent interaction. Auto-refreshes on DOM changes; rehydrates on project load.
- **2026-07-28** UX #6 Context menu — `feature/ux-context-menu` merged. Right-click any canvas element opens a context menu with: Edit Text (text elements), Duplicate, Delete, Move Up/Down, Copy/Paste Styles, Wrap in &lt;div&gt;. All actions push undo history.
- **2026-07-28** UX #7 Pre-built component library — `feature/ux-component-library` merged. Added a "Components" category in the left toolbox with 9 pre-built blocks (Hero Section, Feature Grid, Navbar, Card, Contact Form, Footer, Testimonial, Pricing Table, FAQ). Each expands into a full DOM tree with inline styles and placeholder content when dropped. Undo/redo support.
- **2026-07-28** UX #8 Responsive preview — `feature/ux-responsive-preview` merged. Preview mode now includes a dark toolbar with device frame buttons: Desktop (full width), Tablet (768px), Mobile (375px). Canvas viewport resizes to match selected device, centered. Live pixel width indicator shown.
- **2026-07-28** UX #9 Keyboard shortcuts — `feature/ux-keyboard-shortcuts` merged. Extended existing Ctrl+Z/Ctrl+Shift+Z with: Ctrl+C copy, Ctrl+V paste, Delete/Backspace delete, Ctrl+A select first element, Escape deselect, arrow keys nudge by 1px.
- **2026-07-28** UX #10 Canvas helpers — `feature/ux-canvas-helpers` merged. Added 16px snap grid overlay toggle (button in control bar). Draggable red guide lines: double-click canvas to place, drag to move, right-click to remove.
- **2026-07-28** UX #11 Empty-state guidance — `feature/ux-empty-state` merged. Replaced simple placeholder text with a styled card (icon, title, subtitle, keyboard hints). Quick Start button drops Navbar + Hero. Load Sample button creates a full sample page.
