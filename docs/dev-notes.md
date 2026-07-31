# Dev Notes — working session log

Ad-hoc notes taken during feature work (decisions, dead-ends, next steps).
Canonical status lives in `progress.md` / `ROADMAP.md`; this file is the
scratchpad of *why* things were done a certain way.

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

## 2026-07-31 — P5c zip export (in progress)

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
- Committed step 1 (zipWriter + exporter integration + tests) already.
