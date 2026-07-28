# Import Flow — Design Document (Mid-term #5)

Status: **planning**. This branch holds the design only; implementation
commits will follow after this plan is reviewed.

## Goal

Reverse the export flow: let the user paste an existing HTML document
(or HTML + CSS pair) and have LayoutCraft reconstruct the canvas DOM
plus the visual CSS rule boxes / property inputs from it.

This makes LayoutCraft a useful onboarding tool for existing sites —
you can import a landing page and tweak it visually rather than
starting from scratch.

## Requirements

- A new `📥 Import` button in the control bar opens a modal with two
  textareas: HTML and CSS.
- Submits:
    1. Parse HTML with `DOMParser` into a detached document.
    2. Move the parsed body's children into the live canvas, re-binding
       Sortable on every container (reusing the loadProject rehydrate
       path in `storage.js`).
    3. Parse CSS with a lightweight tokenizer / or `document.styleSheets`
       injection + read-back, splitting the result into one
       `window.activeCssData` entry per selector.
    4. Re-render the visual CSS rule boxes via the existing
       `window.rebuildCssRulesUI()` path.
- Strips `<script>`, `<style>`, `<link>`, `on*=` attributes from the
  imported markup to avoid XSS / accidental execution inside the
  editor.
- Replaces the default `Default_Project` canvas (blank) so the import
  appears immediately; oversized imports warn via the LocalStorage
  meter (existing path).
- No external dependency; all parsing uses the platform.

## Design choices

### Parser choice

`DOMParser` is available in all evergreen browsers and the Vitest
jsdom environment. It returns a real DOM tree that we can manipulate
with the same APIs the canvas uses, so no tokenizer library is needed.

For CSS:

- Inject the user's CSS string into a `<style>` on a detached
  document, then iterate `document.styleSheets[...].cssRules`.
- Each `CSSStyleRule` → one `activeCssData` entry keyed by
  `selectorText`.
- `CSSMediaRule`, `CSSKeyframesRule`, etc. are skipped in v1 (they
  require the **Advanced CSS Blocks** design from Mid-term #2).
  Keep them in `getActiveCssCode()` only if we add a verbatim
  `@rawCss` bucket for ungrouped rules — optional.

### Sanitization

`sanitizeImportedNode(node)`:

- Remove: `script`, `iframe`¹, `link`, `style`, `meta`, `base`
  (¹ iframe is a _LayoutCraft component_, but user pastes should
  not bring in arbitrary sources — strip its `src` and re-export as
  a LayoutCraft iframe via `elements.js` instead.)
- Remove attributes named `on*` (`onclick`, `oninput`, ...).
- Optionally remove inline `style=""` and convert each rule into a
  `.imported-N` selector; defer this for v2 because it bloats the
  CSS builder.

### UI

Modal built with the same approach as the preview "Back to Editor"
button — minimal DOM, `position: fixed`. Cancel clears textareas and
closes; Import runs the pipeline then closes.

### Decoupling from storage.js

Factor the post-load rehydrate logic out of `storage.js loadProject`
into a shared `rehydrateCanvas(htmlString, cssData)` helper living in
a new `src/js/modules/importer.js`. `storage.js loadProject` calls it
with persisted data; `importer.js importFromPaste` calls it with
parsed data.

## Suggested commit plan for this branch

| #   | Commit title                                                  |
| --- | ------------------------------------------------------------- |
| 1   | `Add import-flow design document` (this file)                 |
| 2   | `Factor rehydrateCanvas helper out of storage.js`             |
| 3   | `Create src/js/modules/importer.js with DOMParser + cssRules` |
| 4   | `Add sanitizeImportedNode (strip scripts / on* attrs)`        |
| 5   | `Surface Import button + modal in index.html and app.js`      |
| 6   | `Wire modal submit to importer.importFromPaste`               |
| 7   | `Add unit tests for importer: parse + sanitize roundtrip`     |
| 8   | `Mark Mid-term #5 complete in ROADMAP`                        |

## Open questions

1. Should import replace the current canvas, merge into it, or open a
   new project? Current plan: **replace**; new-project + import is a
   follow-up.
2. Should we cap import size (e.g. 50 kB HTML, 25 kB CSS) to keep the
   editor responsive? Current plan: **no hard cap**; go through the
   existing LocalStorage meter warning path.
3. Should the importer try to match imported tags against
   `elements.js` so Inspector can render dynamic attributes? Current
   plan: **yes** — `rehydrateCanvas` already walks container tags,
   extend to consult `elements.js.attributes` lists.
