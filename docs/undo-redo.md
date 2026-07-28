# Undo / Redo — Design Document (Mid-term #1)

Status: **planning**. This branch holds the design only; implementation
commits will follow after this plan is reviewed.

## Goal

Give LayoutCraft Studio an undo / redo stack so accidental edits
(delete, property change, dropped block, CSS rule mutation) can be
reverted without losing work.

## Requirements

- Covers: canvas DOM mutations, CSS rule additions/edits/removals,
  attribute edits made through the Inspector.
- Bounded buffer so memory does not balloon with long sessions.
- Keyboard shortcuts: Ctrl / Cmd + Z (undo), Shift + Ctrl / Cmd + Z
  (redo). (Ctrl / Cmd + Y as alias is optional.)
- UI affordance: a small toolbar with disabled `↶ Undo` / `↷ Redo`
  buttons reflecting stack state.
- Coexists with the existing 30-second silent auto-save in `storage.js`
  (snapshots must not dirty state or trigger auto-save churn).
- Works across project switches: switching projects resets the stack.

## Design choices

### Snapshot vs. command pattern

Decision: **command pattern** (mutable references, applied inverse).

Rationale:

- Snapshots of `canvas.innerHTML` + `window.activeCssData` are simple but
  explode in size quickly (5MB LocalStorage already a concern).
- A command object `{ kind, forwards(), backwards() }` records only the
  delta (e.g. "set property `padding` on selector `.card` from `20px`
  to `40px`") so the stack stays cheap.
- Trade-off: requires hooking every mutation path in `app.js`,
  `inspector.js`, `canvas.js`, `storage.js`. The file boundary table is
  small so this is tractable.

### Stack module

New file: `src/js/modules/history.js`.

Public API (no DOM access; pure state):

```js
push(command); // record + clear redo stack
undo(); // call current.backward() + move pointer back
redo(); // move pointer forward + call current.forwards()
canUndo();
canRedo(); // booleans for UI state
reset(); // clear on project switch
subscribe(listener); // UI refresh hook
```

Each `command` object:

```js
{
  label: 'Set padding on .card',
  perform: () => { /* apply forward delta */ },
  rollback: () => { /* undo delta */ },
}
```

The module owner who performs a mutation is responsible for constructing
and pushing the command — history.js does not inspect DOM or CSS state.

### Integration points (ordered by commit plan)

1. canvas.js `handleDrop` — wrap element insert with a command.
2. canvas.js Sortable `onEnd` — wrap any move with a command.
3. inspector.js attribute/text listeners — wrap with commands.
4. app.js CSS rule add / edit / delete / block add / block value edit /
   block delete — wrap each path with a command.
5. inspector.js `btn-delete` — wrap delete with a command.
6. storage.js `loadProject` — call `history.reset()` after rehydration.

### Bounded buffer

Cap at 100 commands (configurable). When `push()` exceeds the cap, drop
the oldest entry. Pointer semantics: when redo stack is cleared by a
new push, any commands past the pointer are discarded.

### UI

Tiny toolbar inside `.control-bar` (or appended to `.right-actions`).
Two buttons bound to `history.undo()` / `history.redo()`; both render
disabled when their respective stack head is empty. The history module
exposes a subscribe channel so the toolbar re-renders on every push /
undo / redo.

### Coexistence with auto-save

The 30-second interval in `app.js` calls `saveProject(name, false)`
(which calls `deselectAll()` first). Auto-save does **not** push
commands — it is a persistence side-effect, not a user action.
Switching projects saves the previous project silently then resets the
stack.

## Suggested commit plan for this branch

| #   | Commit title                                             |
| --- | -------------------------------------------------------- |
| 1   | `Add history.js design document` (this file)             |
| 2   | `Implement history.js command stack with bounded buffer` |
| 3   | `Add undo/redo toolbar UI and subscribe wiring`          |
| 4   | `Wrap canvas.js drop and Sortable move with commands`    |
| 5   | `Wrap inspector.js edits and delete with commands`       |
| 6   | `Wrap app.js CSS rule mutations with commands`           |
| 7   | `Reset history on project switch in storage.js`          |
| 8   | `Add unit tests for history.js (push/undo/redo/bound)`   |
| 9   | `Mark Mid-term #1 complete in ROADMAP`                   |

## Open questions

1. Should the stack cross project switches (i.e. undo into a previous
   project)? Current design: **no** — switching resets.
2. Should drag-sort of nested Sortable groups produce one command per
   drop, or per element? Current design: **one per drop**.
3. Is a deep history of CSS block value keystrokes wanted, or should
   block-value edits be debounced so one undo reverts a whole
   `padding: 20px → 40px` change? Suggested: debounce inputs by 400ms.
