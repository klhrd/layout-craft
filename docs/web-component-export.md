# Web Component Export — Design Document (Long-term #5)

Status: **planning**. This branch holds the design only; implementation
will not start until at least Mid-term #3 (JSX/Vue export) lands,
since this builds on the same `codegen/domWalker` infrastructure.

## Goal

Add a third export target alongside HTML / React / Vue: emit each
LayoutCraft block as a self-contained Web Component (Custom Element
with shadow DOM) so downstream projects can drop them in with zero
styling collision risk.

## Requirements

- Each canvas subtree becomes one `<layoutcraft-*>` Custom Element with
  its own shadow DOM, its own scoped styles, and no reliance on a
  global stylesheet.
- Output is a single `bundle.js` registering all components OR a folder
  of `.js` files one-per-component — choose in the export dialog.
- Component names derive from the top-level tag + ID/class (e.g.
  `layoutcraft-hero-section`, fallback to `layoutcraft-card-1`).
- Conflict avoidance: names prefixed with `layoutcraft-` and deduped.
- Attributes / slots: top-level element attrs become Custom Element
  attributes; nested children become slot contents.
- No framework required to consume — works in any modern browser
  with a `<script type="module">` import.

## Design choices

### Codegen path

Reuses `src/js/modules/codegen/domWalker.js` from Mid-term #3.
A new generator `codegen/wcExport.js`:

```
for each top-level child of canvas:
  build componentName (kebab from id/class/tag)
  emit registered CustomElement class:
    class LayoutcraftHero extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `<style>${scopedCssForThisSubtree}</style>${
          subtreeInnerHtmlExcludingStyles
        }`;
      }
    }
  customElements.define('layoutcraft-hero', LayoutcraftHero);
```

### CSS scoping

- The existing `getActiveCssCode()` produces flat CSS. Per component we
  filter the rules whose selector matches an element inside that
  subtree; include matches verbatim in the shadow style. Promises
  no cascade leakage.
- Selectors that span across component boundaries (e.g. `.parent .child`
  where both live in different components) are _not_ supported in v1
  — emit a console warn + a comment in the emitted CSS so the user is
  aware. Future iteration could hoist such rules to a shared base
  stylesheet.

### Naming algorithm

```
slugFrom(tag, id, cls) {
  const stem = id || cls.split(' ')[0] || tag;
  return 'layoutcraft-' + stem
      .toLowerCase()
      .replace(/[^a-z0-9]+/g,'-')
      .replace(/^-|-$/g,'');
}
// + numeric suffix for collisions within the same export
```

### UI

The export dropdown from Mid-term #3 grows a "Web Components" option.
Two file outputs:

- **Single bundle**: `components.js` registering everything
- **Folder zip**: `components/<name>.js` one per component + `index.js`
  barrel; downloadable via the same pattern as the existing exporter
  (no zip dep needed if we keep single-file path; zip path optional
  via a small `jszip` dep).

## Suggested commit plan for this branch

| #   | Commit title                                                   |
| --- | -------------------------------------------------------------- |
| 1   | `Add web-component-export design document` (this file)         |
| 2   | `Extract shared domWalker helpers (if Mid-term #3 hasn't yet)` |
| 3   | `Implement codegen/wcExport.js with single-bundle emitter`     |
| 4   | `Add filter-and-scope CSS for each component subtree`          |
| 5   | `Add naming algorithm with collision dedup`                    |
| 6   | `Add Web Components entry to export dropdown in exporter.js`   |
| 7   | `Add optional jszip folder-zip export`                         |
| 8   | `Add unit tests for name dedup + CSS scoping edge cases`       |
| 9   | `Document Web Component export in README`                      |
| 10  | `Mark Long-term #5 complete in ROADMAP`                        |

## Open questions

1. Should attributes be reflected as setters / getters (so `<layout-
craft-hero title="...">` updates the inner DOM)? Current plan:
   **yes** for `boolean`-style attrs (no); **no** for text content —
   users can rewrite the subtree via `shadowRoot`.
2. Are slot children (nested slots) in scope? Current plan: **one slot
   named "default"** for direct children; named slots deferred.
3. Should the generated components include a small `connectedCallback`
   that calls LayoutCraft's rehydrate logic? Current plan: **no** —
   they are entirely static visual components after export.
