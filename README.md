# 🛠️ LayoutCraft Studio

A low-code (no-code / low-code) visual web editor built with vanilla JavaScript. Features drag-and-drop component layout, visual CSS block stacking, real-time selector detection (blink highlight), and multi-project LocalStorage management.

---

## 📂 Directory Tree

```text
layout-craft/
├── index.html                  # App entry (workspace HTML scaffold)
├── package.json                # npm scripts and dev dependencies
├── vite.config.js             # Vite dev/build/preview config
├── vitest.config.js           # Vitest config (jsdom env)
├── jsconfig.json              # Editor type-awareness + path aliases
├── ROADMAP.md                 # Development roadmap
├── AGENTS.md                  # Instructions for AI agents and humans
└── src/
    ├── css/
    │   ├── canvas-preview.css # Canvas element rendering and preview mode styles
    │   └── editor.css         # Editor UI, CSS blocks, blink animation styles
    └── js/
        ├── app.js             # Main entry (init, global compile, event dispatch)
        ├── config/
        │   ├── cssDictionary.js # CSS property block dictionary (names + defaults)
        │   ├── elements.js     # Component library (Layout, Typography, Forms, ...)
        │   └── i18n.js         # t() lookup dictionary; English is the default locale
        └── modules/
            ├── canvas.js       # Canvas core (drag/drop, Sortable wiring)
            ├── exporter.js     # Export/preview module (bundles HTML/CSS, downloads)
            ├── inspector.js    # Property inspector (edit ID/Class/text + dynamic attrs)
            └── storage.js      # Storage manager (multi-project snapshots, auto-save, quota meter)
```

---

## 🚀 Core Features

### 1. 🧱 Dual editing modes

- **🎨 Visual Mode**: Focus on page skeleton layout. Drag Layout / Typography / Forms components in from the left, and use the right-hand `Inspector` to edit text, ID, or Class directly.
- **💻 CSS Expert Mode**: Click to create a CSS selector box (e.g. `.card`), then drag CSS property blocks into the box from the left like LEGO bricks — no hand-written CSS required.

### 2. Visual property inputs

- After a CSS block is dropped into a selector, a dedicated **input field** appears for it.
- Each input subscribes to `input` events so that changes (e.g. `padding: 20px`) are reflected on the canvas instantly.

### 3. 🎯 Selector detector (blinking)

- Every CSS rule box has a `🎯 Detect` toggle in the top-right corner.
- Toggling it ON highlights all matching canvas elements and starts a breathing blink animation, so you always see exactly which elements the rule affects.

### 4. 📊 Multi-project storage with quota guard

- Create multiple independent projects with **+ New** and switch between them via the dropdown.
- Silent auto-save every 30 seconds as a safety net.
- The top-right **Storage Use** meter precisely computes UTF-16 byte sizes and turns red above 85% to prevent blowing the browser's 5MB LocalStorage quota.

---

## 🛠️ Development and Setup

The project uses **native ES Modules** and is served and bundled by **Vite**. SortableJS is still pulled from a CDN via a `<script>` tag; the rest of the source is bundled by Vite directly.

### Prerequisites

- Node.js 20+ (with npm)

### Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the dev server (hot reload):

```bash
npm run dev
```

3. Open the URL Vite prints (defaults to `http://localhost:5173`) and start building.

### Other common commands

```bash
# Package a production bundle into dist/
npm run build

# Preview the built bundle locally
npm run preview

# Run ESLint
npm run lint

# Check formatting with Prettier
npm run format:check

# Run unit tests
npm test
```

### Deployment

Pushing to `master` triggers GitHub Actions, which runs `npm ci && npm run build`
and deploys the `dist/` folder to GitHub Pages.
