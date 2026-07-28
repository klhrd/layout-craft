# JSX / Vue Export — Design Document (Mid-term #3)

Status: **planning**. This branch holds the design only; implementation
commits will follow after this plan is reviewed.

## Goal

Extend the exporter so that, alongside the current standalone
`index.html` + `style.css` download, the user can export the canvas
state as:

1. **React JSX** — a single `App.jsx` plus an extracted `style.css`
2. **Vue 3 SFB** — a single `App.vue` (template + scoped style)

Both outputs should compile / run in a fresh Vite project with the same
DOM shape as the canvas produces today (no LayoutCraft editor chrome).

## Requirements

- New UI: a small export dropdown / modal letting the user pick the
  target (HTML, React, Vue). Keep the existing single-click HTML
  export path for muscle memory.
- No runtime dependency on React or Vue in the editor itself; the
  exports are pure string templates.
- Style export reuses `getActiveCssCode()` exactly as today; no
  behaviour drift between HTML and React/Vue exports.
- Element attributes that are invalid in JSX (`class`, `for`, ...) are
  rewritten (`className`, `htmlFor`, ...) at export time.
- Inline styles / event handlers are out of scope for this iteration —
  LayoutCraft does not currently author them, so the templates just
  use the className / id mapping.

## Design choices

### Codegen module

New file: `src/js/modules/codegen/`:

- `htmlExport.js` — moves existing HTML bundler here (pure function
  `(canvasClone, css) => { html, css }`).
- `jsxExport.js` — `(canvasClone, css) => { jsx, css }`. Walks the DOM
  clone, rewrites props, indents the JSX tree, names the root
  component `App`.
- `vueExport.js` — wraps the HTML in `<template>`, dumps CSS into a
  `<style scoped>`, returns one combined string.

### Shared DOM walker

`codegen/domWalker.js` exposes:

```js
walk(node, visitors, depth)   // depth-first
attrMap(node)                 // { class, id, ...sanitised }
```

The HTML exporter keeps the original attrs; the JSX exporter rewrites
the keys (per the table below); the Vue exporter passes attrs through.

### Attribute rewrite table (JSX)

| DOM         | JSX          |
| ----------- | ------------ |
| `class`     | `className`  |
| `for`       | `htmlFor`    |
| `tabindex`  | `tabIndex`   |
| `readonly`  | `readOnly`   |
| `maxlength` | `maxLength`  |
| `colspan`   | `colSpan`    |
| `rowspan`   | `rowSpan`    |
| others      | unchanged    |

Boolean attrs (`disabled`, `required`, `checked`) →
`{true}` / `{false}` based on presence.

### UI affordance

Promote `btn-export` from a button to a small dropdown revealing three
choices (HTML download today's behavior, React, Vue). Implemented as a
popover anchored to the button. No new dependencies; vanilla DOM.

### Project naming

The component name is `App`; the files are `App.jsx` / `App.vue`. The
download bundle for React is two files (`App.jsx` + `style.css`); the
Vue bundle is one file (`App.vue`).

## Suggested commit plan for this branch

| # | Commit title                                                       |
| - | ------------------------------------------------------------------ |
| 1 | `Add export-jsx-vue design document` (this file)                  |
| 2 | `Extract HTML exporter into codegen/htmlExport.js (pure function)`|
| 3 | `Add codegen/domWalker.js with attr rewrite table for JSX`        |
| 4 | `Implement codegen/jsxExport.js producing App.jsx + style.css`     |
| 5 | `Implement codegen/vueExport.js producing App.vue (scoped style)` |
| 6 | `Replace export button with a dropdown popover in exporter.js`     |
| 7 | `Add unit tests for each codegen (snapshot the output)`            |
| 8 | `Mark Mid-term #3 complete in ROADMAP`                            |

## Open questions

1. Should the React export include a minimal `vite.config` + README so
   the user can `npm install && npm run dev`? Current plan: **yes**, ship
   a tiny `package.json` skeleton + `vite.config.js` + `App.jsx`. Vue
   gets the same treatment (`@vitejs/plugin-vue`).
2. Do we want a "copy to clipboard" option in addition to the
   download? (Useful for pasting into an existing project.) Current
   plan: **defer**; only download.
3. Self-closing tags in JSX require `<img ... />`, `<input ... />`
   etc. The walker already knows void elements from `elements.js`
   (or hard-coded). Confirm scope covers all current component tags.
