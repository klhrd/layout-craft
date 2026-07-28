# Realtime Collaboration — Design Document (Long-term #2)

Status: **planning**. This branch holds the design only; implementation
will not start until Long-term #1 (backend-sync) lands, since collab
needs the same backend + identity.

## Goal

Let multiple users edit the same project simultaneously, seeing each
other's cursor / selection and merging edits in real time, similar to
Figma's multiplayer experience.

## Requirements

- Built atop the Supabase backend from Long-term #1 (Postgres +
  Realtime feeds).
- Per-project session room keyed by project id.
- Live presence: each peer broadcasts `{ id, displayName, cursor pos,
  selected selector }` at ~10 Hz.
- Edit merge: every canvas / CSS mutation is a CRDT-friendly delta,
  not a full-snapshot replace, otherwise two simultaneous edits thrash.
- "Following" mode: a user can pin their viewport to another peer's
  selection to watch them work.
- Graceful fallback for anonymous users: they may observe but not edit
  (read-only join) so public review is possible without sign-in.
- Persistence must still go through `storage.js`-equivalent pipeline,
  so online + offline produce the same artefacts.

## Design choices

### CRDT vs OT

Decision: **Yjs** with `y-webrtc` as a fallback and `y-supabase`
adapter (community) for the delivery layer.

Rationale:
- Yjs CRDTs are mergeable without a central coordinator → no server
  logic beyond relaying.
- Yjs supports nested maps + arrays, which map cleanly to the canvas
  DOM tree (each node becomes `Y.XmlElement`) and to the visual CSS
  block tree (a `Y.Map` of selectors → `Y.Map` of property → value).
- Supabase Realtime can transport updates via broadcast channels; or
  `y-websocket` over a small Node worker deployed to Vercel/Render.

Alternative (OT via custom server): rejected because of ongoing server
ownership + complexity; Yjs lets us stay on a serverless edges plan.

### Yjs document shape

```
Y.Doc
├─ canvas : Y.XmlFragment       // mirrors the live canvas DOM
│    └─ per-element Y.XmlElement with attrs + text
└─ css    : Y.Map<selector, Y.Map<prop, val>>
```

A thin adapter in `src/js/modules/yjsAdapter.js`:
- applies Yjs changes onto the real DOM (observer-driven)
- captures local DOM / CSS edits and pushes into the Yjs doc

Avoid re-rendering the whole canvas on each delta; use Yjs observers +
mutation-specific patches (mount, attribute change, text change,
remove).

### Presence channel

Use Supabase Broadcast (or a separate WebSocket) to publish presence
at 10 Hz:
- cursor `(projectId, opacity, xPct, yPct)`
- selection `selectorOrId` (resolved against DOM)

Each peer renders remote cursors as small floating labels in the
canvas overlay.

### Convergence guarantees

Yjs CRDTs already guarantee eventual convergence. We additionally:
- Persist Yjs state to the projects table on a debounced 3-second timer
  (replaces the snapshot model in Long-term #1 once Yjs is on).
- On project load, try to load the Yjs state vector; if absent, seed
  from the existing snapshot HTML + CSS data.

### Offline-first contract

If a peer is offline, their Yjs document still mutates and converges
once reconnected — Yjs handles this natively. Persistence continues to
mirror to LocalStorage, so reload-without-network still shows the last
known state.

## Suggested commit plan for this branch

| #  | Commit title                                                         |
| -- | ------------------------------------------------------------------ |
| 1  | `Add collab design document` (this file)                            |
| 2  | `Install yjs + y-supabase; wire presence channel`                   |
| 3  | `Create src/js/modules/yjsAdapter.js DOM<->Y.XmlFragment bridge`    |
| 4  | `Map cssData to Y.Map and observer-driven compile updates`          |
| 5  | `Render remote cursors and selection labels as a canvas overlay`     |
| 6  | `Add presence broadcast at 10 Hz; debounce local edits`            |
| 7  | `Add Follow mode + read-only anonymous join`                       |
| 8  | `Replace snapshot-based persistence with Yjs state vector`         |
| 9  | `Add a quasi-e2e test with two virtual peers`                       |
| 10 | `Document collab flow in README and AGENTS.md`                     |
| 11 | `Mark Long-term #2 complete in ROADMAP`                            |

## Open questions

1. Do we limit room size? Current plan: **8 active editors** soft cap,
   above which the UI switches to read-only observers + one driver
   (Figma-style). Hardening deferred.
2. Should chat be in scope? Current plan: **no** — outboard as a
   follow-up; start with cursors + selection only.
3. Conflict with undo/redo: Yjs-native `Y.UndoManager` should
   supersede our local history stack once collab lands; the undo-redo
   document notes this integration point.
