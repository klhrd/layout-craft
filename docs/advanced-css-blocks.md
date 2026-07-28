# Advanced CSS Blocks — Design Document (Mid-term #2)

Status: **planning**. This branch holds the design only; implementation
commits will follow after this plan is reviewed.

## Goal

Extend the Visual CSS editor beyond simple selector/property blocks so
it can author real-world stylesheets:

- `@media` rules (responsive breakpoints)
- Pseudo-classes (`:hover`, `:focus`, `:nth-child()`, ...)
- CSS custom properties (`--brand-color`)
- Keyframes (`@keyframes`)
- Nested rule blocks in the CSS Expert mode (e.g. `.card:hover` inside
  `.card`)

## Requirements

- The existing rule box pattern (`createRuleBoxUI`) generalises to a
  "block" that can hold either properties or nested sub-blocks.
- A block's `selector` field accepts any compound selector, including
  pseudo-classes / custom properties / `@media` / `@keyframes`.
- The CSS dictionary (`src/js/config/cssDictionary.js`) gains a new
  category for custom properties and keyframe-related pseudo props
  (`animation`, `animation-name`, `transform`).
- Persist / load roundtrip must preserve the nested structure in
  LocalStorage and on export (`exporter.js`).
- Detect (🎯 blinking) must still highlight canvas elements that match
  a **terminal** selector even when that selector lives inside a
  `@media` or nested block.

## Design choices

### Generalised block model

Introduce `window.activeCssData` as a **tree** of blocks rather than a
flat `selector → styles` map. Migration: keep the existing flat format
back-compatible by treating top-level entries as leaf rule blocks.

New block shape:

```js
{
  type: 'rule' | 'media' | 'keyframes',
  selector: '.card' | '@media (max-width: 600px)' | '@keyframes pulse',
  styles: { color: 'red' },                 // present for rule & media leaves
  children: [/* nested blocks for media/keyframes */],
}
```

### UI

- A `+ Add media` button next to `+ Add Rule` creates a `@media`
  container. CSS dictionary blocks can be dragged inside the
  container to style the parent scope.
- Inside a `@media` container, an inner `+ Add Rule` button creates a
  nested rule block whose selector is matched against canvas elements.
- A `@keyframes` container accepts `from` / `NN%` / `to` rule rows
  instead of free selectors.
- Dragging a CSS property block into any leaf rule renders its input
  as today; the value flows through `compileAndRenderCss`.

### CSS compilation

`compileAndRenderCss` in `app.js` gains a recursive emitter:

```
emit(block, indent):
  if type === 'media':    out += block.selector + " {\n"; emit children; out += "}\n"
  if type === 'keyframes': same with @keyframes wrapper
  if type === 'rule':    out += block.selector + " {\n" + styles + "}\n"
```

### Detector scope

The existing `toggleCanvasBlinking(selector)` is selector-only; for
nested blocks, only **leaf rules** expose a Detect toggle. Media /
keyframes wrappers do not blink (they cannot match canvas elements).

### Visual dictionary additions

Add to `cssDictionary.js`:

- `Custom properties`: `--name` → `var(--name)` glue, `color`,
  `background-color` respect `var()`.
- `Animation & transforms`: `animation`, `animation-name`,
  `animation-duration`, `transform`, `transition`.
- `Pseudo flags`: just a label reminder; actual pseudo classes go on
  the selector input itself.

### Persistence & export

- `storage.js` serialises the tree (`JSON.stringify(window.activeCssData)`).
  Old flatprojects load as leaf rules at the top level.
- `exporter.js` is unchanged — it consumes
  `getActiveCssCode()` which already strings the CSS.

## Suggested commit plan for this branch

| #   | Commit title                                                         |
| --- | -------------------------------------------------------------------- |
| 1   | `Add advanced-css-blocks design document` (this file)                |
| 2   | `Refactor activeCssData to a tree of blocks (back-compatible)`       |
| 3   | `Generalise createRuleBoxUI to media/keyframes/nestable containers`  |
| 4   | `Add + Add Media and + Add Keyframes UI affordances`                 |
| 5   | `Recursive compileAndRenderCss emitter`                              |
| 6   | `Extend CSS dictionary with custom properties, animation, transform` |
| 7   | `Surface Detect toggle only on leaf rules; fix scope matching`       |
| 8   | `Migrate storage.js serializer/rehydrator for the block tree`        |
| 9   | `Add unit tests for compiler (media/keyframes/nested output)`        |
| 10  | `Mark Mid-term #2 complete in ROADMAP`                               |

## Open questions

1. Do we want `@supports` and `@container` in the same iteration, or
   defer? Current plan: **defer**; only `@media` and `@keyframes`.
2. For nested rule selection, do we show a tree sidebar like a layer
   panel, or keep linear stacking with indentation? Current plan:
   **indentation only** (cheaper, ships sooner).
3. Drag-to-reorder blocks (already Sortable) — should reordering push
   an undo command? (Tied to undo/redo design doc.)
