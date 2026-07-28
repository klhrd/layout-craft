# Backend Sync — Design Document (Long-term #1)

Status: **planning**. This branch holds the design only; implementation
will not start until at least the mid-term features land.

## Goal

Replace LocalStorage-only persistence with an optional cloud backend so
projects are no longer locked to a single browser + 5 MB cap. Sync
across devices is the explicit target.

## Requirements

- Optional: works fully offline; if the user never signs in, everything
  behaves exactly as today (LocalStorage path).
- Sign in with a lightweight identity (email link, GitHub OAuth, or
  magic link) — no password storage.
- Project list + project snapshots live in cloud storage keyed by user.
- Conflict resolution: per-project last-write-wins with timestamp
  comparison; if a remote is newer than local, prompt before
  overwriting.
- Background sync: a debounced 5-second timer after edits pushes; pull
  on app start and when the user explicitly hits "Refresh from cloud".
- Keeps the LocalStorage path fully intact for offline / unauthenticated
  use, so this is purely additive.

## Design choices

### Provider: Supabase (preferred) vs Firebase

Decision: **Supabase**.
- Postgres + row-level security → simpler security model than Firestore
  rules for a per-user project table.
- JS SDK is ~50 kB and works with Vite easily.
- Free tier comfortably covers a hobby project.
- Auth: Supabase Auth supports email magic links + GitHub OAuth out of
  the box.

Schema:
```sql
-- supabase migration
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  html text not null,
  css_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);
-- RLS: each user can only see / write their own rows
```

### Client architecture

New module `src/js/modules/sync.js` exposing:
```js
signInWithEmail(email);       // sends magic link
signInWithGitHub();
signOut();
isAuthenticated();
pullProjects();               // list + latest snapshot per name
pushProject(projectName);     // upsert by (user_id, name)
pullProject(projectName);     // fetch single snapshot
onAuthChange(listener);
```

`storage.js` keeps its local-first API. `sync.js` wraps it:
- After every `saveProject(name, false)`, debounce-push to the cloud.
- On app start, if authenticated, pull the project list and refresh the
  dropdown; if remote update timestamp is newer than local, trigger a
  "Cloud is newer — Pull / Keep local" UI.
- Manual "💾 Save now" button gets a ⃂ cloud variant: "☁ Save to cloud"
  + "☁ Pull from cloud".

### Auth UX

Add a sign-in affordance to `.right-actions`:
- When anonymous: `Sign in` (opacity 60%).
- When signed-in: avatar / handle as tooltip; click reveals `Sign out`.
- Local state lives in `localStorage`, so sign-out does not wipe data.

### Offline-first contract

Every mutating path in `storage.js` continues to call
`localStorage.setItem`. `sync.js` is fire-and-forget; if offline or
signed-out, push is dropped silently. A small toast confirms success on
manual cloud-save.

### Dependencies

- `@supabase/supabase-js` (npm install) — bundled via Vite.
- Vite env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  injected via `.env.development` / `.env.production` (gitignored).

## Suggested commit plan for this branch

| #  | Commit title                                                       |
| -- | ------------------------------------------------------------------ |
| 1  | `Add backend-sync design document` (this file)                     |
| 2  | `Install @supabase/supabase-js; wire env vars + .env.example`     |
| 3  | `Add supabase migration SQL (projects table + RLS)`              |
| 4  | `Create src/js/modules/sync.js with auth + pull/push primitives`  |
| 5  | `Add sign-in / sign-out affordance in the control bar`            |
| 6  | `Wire storage.js to debounced cloud pushes after every save`      |
| 7  | `Add cloud-aware Refresh button + conflict prompt UI`              |
| 8  | `Add e2e-style test (mocked supabase client) covering push/pull` |
| 9  | `Document the cloud flow in README and AGENTS.md`                 |
| 10 | `Mark Long-term #1 complete in ROADMAP`                           |

## Open questions

1. Do we want per-project sharing (read-only public link)? Current
   plan: **defer** to a Long-term #2-followup; the collab branch is a
   logical place to add shared-project RLS.
2. Should we encrypt snapshots client-side before upload (zero-knowledge)?
   Current plan: **no** — rely on RLS + TLS; encryption adds UX cost
   (lost key = lost data) that isn't justified yet.
3. Image upload (`<img src=...>` pasted references) is not addressed
   here — defer to a future asset-pipeline feature.
