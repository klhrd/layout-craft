# LayoutCraft Studio - Development Roadmap

This document tracks the planned development of LayoutCraft Studio, organized by phase.

## Current Status

- **Branch**: `master` (clean, in sync with `origin/master`)
- **Stack**: Vite + Vitest + ESLint + Prettier (Vanilla ES Modules)
- **Scope**: Single-page editor (`index.html` + 13 source files under `src/`)
- **Features shipped**: dual-mode editor (Visual / CSS Expert), drag-and-drop components, CSS building blocks with live visual inputs, selector blinking detector, multi-project LocalStorage storage with capacity meter and auto-save, ZIP/HTML export, undo/redo history stack

---

## Short-term (Foundational Engineering)

> Goal: establish a maintainable, testable, and reproducible codebase before adding more features.

### 1. Switch default language to English

- Migrate README.md and in-app UI strings to English as the primary language.
- Introduce a lightweight i18n dictionary module (`src/js/config/i18n.js`).
- Update commit messages, comments, and this roadmap to English as the working convention.

### 2. Linting and formatting

- Add ESLint + Prettier with sane defaults for ES Modules.
- Add `npm run lint` and `npm run format` scripts together with an `AGENTS.md` note.
- Fix whatever the first lint pass surfaces.

### 3. Unit testing baseline

- Introduce Vitest (zero-config, native ESM friendly).
- Prioritize pure-logic modules first: `storage.js`, `exporter.js`, `cssDictionary.js`, `elements.js`.

### 4. Build tooling

- Introduce Vite for both dev server and production bundling.
- Wire up a `dist/` build output and update the GitHub Actions workflow.

### 5. Type safety groundwork

- Add `jsconfig.json` with module resolution and path aliases.
- (Optional) evaluate migrating critical modules to TypeScript.

### 6. Documentation pass

- Ensure README reflects the new tooling (`npm run dev`, `npm run build`, `npm test`).
- Document module boundaries in `AGENTS.md`.

---

## Mid-term (UX Overhaul)

> Goal: transform the editor from a developer tool into an intuitive visual
> design surface that non-developers can use. Every interaction should feel
> direct, responsive, and polished.

### 1. WYSIWYG canvas

- **Remove edit-mode wireframes.** Dashed borders, min-heights, and coloured
  backgrounds on canvas children currently make the page look like a debug
  view. Replace with a subtle hover-highlight + click-to-select model.
- **Edit-mode toggle.** A per-element "Show outlines" option in the inspector
  for users who still want the wireframe view.
- **Selected-element affordance.** Draw a clean blue outline + 8 resize handles
  on the selected element (like Figma/Webflow).

### 2. Select-to-style (eliminate manual selector workflow)

- **Problem:** currently you must (1) add a class/ID in the inspector, (2) go
  to the CSS Rules panel, (3) type a selector by hand, (4) drag property blocks
  into it. Users should never need to touch a selector.
- **Solution:** when an element is selected, the inspector shows an inline
  **Styles** section with editable CSS properties (font, spacing, colour,
  border, shadow, layout). Changing any value:
    1. Auto-generates a unique class (e.g. `._lc-1`, `._lc-2`) if the element
       doesn't already have one.
    2. Auto-creates a CSS rule for that class in `window.activeCssData`.
    3. Writes the `<style>` tag (same `compileAndRenderCss` mechanism).
    4. The undo stack records the property change.
- **Visual flow:** select → tweak sliders/pickers → see result instantly.
  The "Visual CSS Rules" panel becomes an advanced view for power users who
  still want to see/edit raw selectors, but the default path bypasses it
  entirely.
- **Edge cases:**
    - If the element already has a user-assigned class, edit that class's rule.
    - If multiple elements share the class, editing affects all of them
      (expected WYSIWYG behaviour — the user sees the cascade).
    - Removing all custom styles removes the auto-generated class.

### 3. Inline text editing

- Double-click any text node (p, h1-h6, span, a, button, label, li, td, th)
  to enter edit mode directly on the canvas.
- On Enter or blur, commit the change and push an undo command.
- Escape cancels the edit and reverts to the previous text.

### 4. Visual property editors (replace raw text inputs)

| Current              | Target                                           |
| -------------------- | ------------------------------------------------ |
| `#2563eb` text input | Color swatch + browser color picker              |
| `1.5rem` text input  | Slider + unit selector (px/rem/em/%)             |
| `flex` text input    | Dropdown of valid values for the property        |
| `20px` text input    | Increment/decrement arrows + slider              |
| `center` text input  | One-click alignment buttons (left/center/right)  |
| —                    | Font-family dropdown with system fonts listed    |
| —                    | Font-size: preset buttons (XS, SM, Base, LG, XL) |

- Reusable widget components: `ColorPicker`, `UnitSlider`, `ValueDropdown`,
  `SpacingEditor` (padding/margin with visual 4-direction diagram).

### 5. Layers / outline panel

- Replace or supplement the right-sidebar inspector with a **layers tree**
  showing the full DOM hierarchy of the canvas.
- Click a layer to select the corresponding element on canvas.
- Drag layers to re-parent/re-order elements (mirrored on canvas).
- Eye icon to toggle visibility of any element (hides via CSS).

### 6. Context menu (right-click)

- Right-click any canvas element to show:
    - **Edit text** (if text node)
    - **Duplicate** (clone element + children)
    - **Copy / Paste**
    - **Delete**
    - **Move forward / backward** (z-index / sibling order)
    - **Wrap in** div/section/a (nest the selected element)

### 7. Pre-built component library

- Replace raw HTML tags in the toolbox with styled presets:
    - Hero section (bg image, headline, subtitle, CTA button)
    - Feature card (icon, title, description)
    - Pricing table (3-tier, highlight featured)
    - Navbar (logo + links + mobile hamburger)
    - Contact form (name, email, message, submit)
    - Footer (links, social icons, copyright)
    - Grid gallery (image grid with lightbox placeholder)
- Each preset creates multiple nested elements with inline styles that the
  user can then customise in the inspector.

### 8. Responsive preview

- Add viewport breakpoint buttons to the control bar: Desktop (1440 px),
  Tablet (768 px), Mobile (375 px).
- When a breakpoint is active, the canvas container resizes to that width
  and centres itself in the workspace.
- Add a "Responsive" mode where the user can set per-breakpoint CSS overrides
  (media queries generated automatically).

### 9. Keyboard shortcuts (power-user)

| Shortcut               | Action                               |
| ---------------------- | ------------------------------------ |
| `Delete` / `Backspace` | Delete selected element              |
| `Ctrl+C` / `Ctrl+V`    | Copy / paste selected element        |
| `Ctrl+D`               | Duplicate selected element           |
| `Escape`               | Deselect / cancel inline edit        |
| `Ctrl+A`               | Select all elements (multi-select)   |
| `Ctrl+/`               | Toggle CSS Expert mode               |
| `↑` / `↓` / `←` / `→`  | Nudge selected element position (px) |
| `Shift + arrow`        | Nudge 10 px                          |

### 10. Canvas helpers

- **Snap-to-grid.** Show alignment guide lines when dragging an element
  aligns with another element's edges or centre.
- **Resize handles.** Drag the 8 handles on a selected element to change
  width/height/padding visually on canvas.
- **Ruler.** Optional rulers along the top and left edges of the canvas.

### 11. Empty-state guidance

- Replace the bare "Drag and drop elements here" placeholder with:
    - A **"Start from a template"** button that opens a template picker.
    - A **quick-start grid** showing 3 sample layouts (Landing Page, Blog Post,
      Dashboard) that load pre-built content with one click.
    - Animated tooltip pointing at the toolbox on first visit.

---

## Mid-term (Feature Expansion)

> Goal: extend editor capabilities for advanced users.

### 1. Undo / Redo history stack

- Command-based history with bounded buffer and keyboard shortcuts.
- [`feature/ui-skeleton-cleanup`](/docs/branch-audit.md) — merged into `master`.

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

- Add English as default plus Traditional/Simplified Chinese, Japanese, etc. via the i18n dictionary.
- Light/dark UI theme toggle.

### 5. Web Component export

- Package each block as a reusable Custom Element with shadow DOM for downstream projects.

---

## Branch Strategy

`master` is the source of GitHub Pages deployment; feature branches are cut
from the latest `master` and merge back when green. Each planned item gets its
own `feature/<name>` branch with frequent, focused commits.

Stale branches (already merged into `master` via rebase or sequential merges)
are cleaned up periodically. See [`docs/branch-audit.md`](docs/branch-audit.md)
for the full audit performed on 2026-07-28.

| Branch                         | Roadmap               | Purpose                                         |
| ------------------------------ | --------------------- | ----------------------------------------------- |
| `master`                       | —                     | Stable, deployable builds (GitHub Pages source) |
| —                              | Mid-term (UX) #1      | WYSIWYG canvas                                  |
| —                              | Mid-term (UX) #2      | Select-to-style (auto class + rule generation)  |
| —                              | Mid-term (UX) #3      | Inline text editing                             |
| —                              | Mid-term (UX) #4      | Visual property editors                         |
| —                              | Mid-term (UX) #5      | Layers / outline panel                          |
| —                              | Mid-term (UX) #6      | Context menu                                    |
| —                              | Mid-term (UX) #7      | Pre-built component library                     |
| —                              | Mid-term (UX) #8      | Responsive preview                              |
| —                              | Mid-term (UX) #9      | Keyboard shortcuts                              |
| —                              | Mid-term (UX) #10     | Canvas helpers (grid, resize, rulers)           |
| —                              | Mid-term (UX) #11     | Empty-state guidance                            |
| —                              | Mid-term (Feature) #1 | ✅ **Done** — undo/redo history                 |
| —                              | Mid-term (Feature) #2 | ✅ **Done** — advanced CSS blocks                |
| `feature/export-jsx-vue`       | Mid-term (Feature) #3 | Export to React JSX / Vue SFB                   |
| `feature/nested-components`    | Mid-term (Feature) #4 | Parent/child Sortable groups                    |
| `feature/import-flow`          | Mid-term (Feature) #5 | Reverse-parse pasted HTML/CSS                   |
| `feature/backend-sync`         | Long-term #1          | Cloud storage (Supabase/Firebase)               |
| `feature/collab`               | Long-term #2          | Realtime multiplayer editing                    |
| `feature/template-marketplace` | Long-term #3          | Curated layout template library                 |
| `feature/i18n-theming`         | Long-term #4          | Additional locales + theme toggle               |
| `feature/web-component-export` | Long-term #5          | Export as Custom Elements                       |

---

## Progress Log

- [x] Create `feature/development-roadmap` branch
- [x] Draft this roadmap document
- [x] Short-term #1: Default English language + i18n dictionary
- [x] Short-term #2: ESLint + Prettier
- [x] Short-term #3: Vitest baseline
- [x] Short-term #4: Vite build pipeline
- [x] Short-term #5: jsconfig.json
- [x] Short-term #6: README + AGENTS.md documentation pass
- [x] Mid-term (Feature) #1: Undo/Redo history stack — merged via `feature/ui-skeleton-cleanup`
- [x] Mid-term (Feature) #2: Advanced CSS blocks (`@media`, `:hover`, pseudo, custom props, keyframes) — merged via `feature/advanced-css-blocks`
- [x] Branch cleanup on 2026-07-28: deleted 17 stale/merged branches (see [`docs/branch-audit.md`](docs/branch-audit.md))
