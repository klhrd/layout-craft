# Nested Components — Design Document (Mid-term #4)

Status: **planning**. This branch holds the design only; implementation
commits will follow after this plan is reviewed.

## Goal

Make LayoutCraft's drag-and-drop support true parent/child nesting, so
authors can drop a card into a grid, a button into a card, an icon into
a button, etc. — without destroying the existing Sortable groups.

## Current state

- `canvas.js` already calls `makeElementSortable()` on container tags
  (`div`, `section`, `header`, ...) when dropped, and the canvas body
  itself is Sortable.
- SortableJS is configured with `group: 'shared-nested'`, so in
  principle nesting works, but UX shortcomings make it rough:
    - Dropping onto a leaf (e.g. `<p>`) `appendChild`s the new child
      even though leaf tags are not containers → invalid DOM.
    - There is no visual hover-highlight for the container that would
      receive the drop, so users miss their target.
    - After load (`storage.js loadProject`) containers re-bind Sortable
      correctly, but the canvas body does too, which can double-drop.
    - The Inspector's "delete" removes the selected node but its
      children go with it — there is no way to drag a child out first.

## Requirements

- Only container tags accept children; dropping onto a leaf should
  either fall back to the closest ancestor container or be cancelled
  with a brief red flash.
- Highlight the receiving container on `dragenter` and clear it on
  `dragleave` / `drop`.
- Children can be moved between containers (Sortable `group:
'shared-nested'` already enables this — verify with tests).
- `canvas.js handleDrop` must not `appendChild` to a non-container
  target; resolve the nearest ancestor container first.
- Persist/load roundtrip in `storage.js` must preserve the nesting
  shape and rebind Sortables recursively (already happens; add a test).
- Provide a small "Lift out" affordance in the Inspector to promote a
  selected element one level up the tree (optional follow-up).

## Design choices

### Container detection helper

`canvas.js` exports `isContainer(el)`:

```js
const CONTAINER_TAGS = [
    'div',
    'section',
    'header',
    'footer',
    'main',
    'aside',
    'nav',
    'form',
    'ul',
    'ol',
    'table',
    'tbody',
    'thead',
    'tr',
    'dl',
];
function isContainer(el) {
    return CONTAINER_TAGS.includes(el.tagName.toLowerCase());
}
```

Used by `handleDrop` to walk up `el.parentNode` until a container is
found; treats `canvas` itself as the root container.

### Drop target resolution

In `handleDrop`:

```js
let target = e.target;
if (target === canvas) target = canvas;
else if (!isContainer(target)) {
    let ancestor = target.closest(CONTAINER_TAGS.join(','));
    target = ancestor || canvas;
}
```

Drop happens against `target`. The leaf-walk fallback prevents
invalid DOM like `<p><div></div></p>`.

### Hover highlight

- `dragover` on each container toggles a `drop-target-active` class
  (CSS outline in `editor.css`).
- Use event delegation on `canvas` rather than binding per element.
  SortableJS's own `ghostClass` already outlines moving items; this
  is a separate concern for the _destination_.
- Clear the class on `drop` and `dragend`.

### Inspector "Lift out"

A new button in `inspector.js` "⬆ Lift out": calls
`selectedElement.parentNode.parentNode.insertBefore(selectedElement,
selectedElement.parentNode)` then `deselectAll()` + `selectElement`
re-select. Wrapped in an undo command (see undo-redo doc).

### Persistence unchanged

`storage.js` already serialises `canvas.innerHTML` and walks container
tags on load to rebind Sortable. Add a regression test ensuring a
nested snapshot roundtrips.

## Suggested commit plan for this branch

| #   | Commit title                                                    |
| --- | --------------------------------------------------------------- |
| 1   | `Add nested-components design document` (this file)             |
| 2   | `Export isContainer() helper and CONTAINER_TAGS list`           |
| 3   | `Resolve drop target to nearest container ancestor (canvas.js)` |
| 4   | `Add .drop-target-active hover highlight via event delegation`  |
| 5   | `Add "Lift out" button to inspector (with UID swap)`            |
| 6   | `Add regression tests for nested drop + loadProject roundtrip`  |
| 7   | `Mark Mid-term #4 complete in ROADMAP`                          |

## Open questions

1. Should `<tr>` accept `<td>`/`<th>` but not other containers?
   Current plan: **yes**; differentiate per-tag accept lists in a
   later commit (optional hardening).
2. Should dropping move (default) or copy (hold Alt)? Current plan:
   **move only**; copy is a non-goal for this iteration.
3. Should the hover highlight show depth (e.g. nested containers get
   progressively lighter / numbered)? Current plan: **single outline
   only**; depth visualization deferred.
