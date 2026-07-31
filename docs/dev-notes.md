# Dev Notes — working session log

Ad-hoc notes taken during feature work (decisions, dead-ends, next steps).
Canonical status lives in `progress.md` / `ROADMAP.md`; this file is the
scratchpad of _why_ things were done a certain way.

## 2026-07-31 — P5b token-aware UI (done, merged `5f67842`)

- Token picker lives in its own module (`tokenPicker.js`) instead of being
  bolted into cssEditor/inspector, because two very different hosts share it:
  CSS block value inputs and Inspector style rows. Both call the same
  `createTokenPickerButton({ currentValue, onPick })`.
- "Save as token" reuses the same `ui.tokens.*` i18n keys as the token panel
  (namePrompt/invalidName/exists) — one source of truth for prompt UX.
- `replaceTokenRef` lives in `cssState.js` (data layer) rather than
  tokenEditor, so tests can exercise it without a DOM. It walks the whole
  block tree including media-query children.
- Template tokens seeding: `replace` overwrites, `append` merges (existing
  project tokens win). Deliberate: appending a section shouldn't clobber the
  user's current design system.

## 2026-07-31 — P5c zip export (done, merged)

- Plan: whole-site zip (index.html + styles.css + assets/) as a new export
  option, completing the P4b leftover.
- Open question: zip implementation. jszip dep vs hand-rolled zip with
  CompressionStream + CRC32 table (zero deps). Decision pending exporter.js
  review.
- DECIDED: zero-dependency. `zipWriter.js` uses native `CompressionStream`
  ('deflate-raw', method 8) when available, falls back to store (method 0).
  Hand-written CRC32 table + local/central/EOCD structure. Keeps the bundle
  lean and the self-host story clean (no npm transitive deps for a tiny util).
- Export menu labels stay hardcoded (matching the existing 5 items) — export
  options are content, not UI chrome; not worth i18n churn mid-feature.
- assets/ folder: only `data:image/*;base64` URIs are extracted (paste/
  upload path); external URLs stay as-is. Non-base64 data URIs skipped by
  regex design.
- Verified: tests parse the produced zip (EOCD → central dir → local
  headers) and inflate entries with Node zlib; both deflate and store paths
  covered.
- DONE: committed in 3 commits on `feature/zip-export` (zip writer + tests,
  dev-notes, lint/format fix — `while(true)` tripped `no-constant-condition`,
  rewrote as a `for` loop over the reader). 196 tests green, lint/format/
  build clean, merged to master.

## 2026-07-31 — P5d offline PWA (in progress)

- Plan: service worker + installable manifest so the editor boots fully
  offline; LocalStorage + `.lcproj` flows already work offline by design.
- Open question: `vite-plugin-pwa` (Workbox, standard but adds a dependency
  tree + ~40 kB runtime) vs hand-rolled SW generated at build time.
- DECIDED: zero-dependency, matching the P5c zip decision. A tiny Vite
  plugin (`scripts/pwa.js`) scans `dist/` in `closeBundle`, hashes the file
  list, and writes `dist/sw.js` with the precache list inlined. The SW
  itself is ~25 lines of vanilla: cache-first for same-origin GET, network
  with cache fallback for the rest.
- CRITICAL offline catch: SortableJS loads from jsdelivr CDN via `<script>`.
  A precache-only SW would break the editor offline. So the fetch handler
  also caches cross-origin GET responses (CORS-enabled — jsdelivr sends
  `Access-Control-Allow-Origin: *`), making CDN scripts work offline after
  the first visit. Non-CORS third-party resources are never cached (opaque
  responses fail the `res.ok` check) — acceptable, noted in ROADMAP.
- Cache versioning: SW content = f(file list), so any build that changes
  assets changes the cache name (`lc-<hash>`); `activate` deletes old
  `lc-*` caches. No manual version bumps.
- Icons: SVG manifest icon (Chrome/Edge/Firefox support `image/svg+xml`
  with `purpose: any maskable`). No PNG pipeline in the repo; iOS home
  screen will fall back to a screenshot — accepted, noted.
- Dev mode: `register('./sw.js')` 404s silently (`.catch(() => {})`), no
  PROD gate needed.
- DONE: committed on `feature/pwa-offline` (generator + manifest + html
  wiring, then prettier fix). Build emits `dist/sw.js` with the full
  precache list (verified: sw.js excluded from its own list). `vite
preview` served `/sw.js`, `/manifest.webmanifest`, `/icons/icon.svg`
  all 200. 202 tests green, lint/format/build clean, merged to master.
  Next per execution order: P5e (template ecosystem).
