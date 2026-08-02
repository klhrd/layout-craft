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

## 2026-07-31 — P5e template ecosystem (in progress)

- Goal: templates become a drop-in ecosystem — folders with variants,
  optional preview images (no server needed), tokens support (P5b
  groundwork exists in `instantiateTemplate`).
- Current drop-in format: single `manifest.json` listing flat `.json`
  files next to it; `manifest.json` itself is NOT shipped (only the
  example), so drop-ins are dormant until a user renames it. Preview
  images and multi-variant folders don't exist yet.
- DECIDED (keep it simple, stay backwards-compatible):
    - Manifest entries keep `id/title/category/tags/file`; gain optional
      `preview` (relative path or data URI). `file` may include a folder
      path (`my-hero/hero.json`) — the fetch already concatenates.
      "A template folder with multiple variants" = several manifest
      entries pointing into the same folder. No new schema concept.
    - Template JSONs may carry `tokens` — gallery passes them through;
      `instantiateTemplate` already seeds them.
    - Gallery cards render `<img>` when `preview` exists (SVG/PNG/JPEG/
      data URI), emoji icon otherwise. Lazy-loading.
    - Ship a real `manifest.json` this time (my-hero folder with two
      variants + hand-written SVG preview) so the mechanism is actually
      exercised out of the box. Delete `manifest.example.json`.
    - SVG preview instead of PNG: no image pipeline in the repo (same
      call as P5d icon). Browsers render SVG in `<img>` fine.
- Storage-quota warning (templateLoader) counts html+cssData only —
  preview images are not stored in the project, so no quota impact.
- DONE: committed on `feature/template-ecosystem` (gallery + folder
  structure + tests, then prettier). 207 tests green, lint/format/build
  clean, preview-served assets verified, merged to master. Remaining in
  the plan: P5f (stable export/plugin extension points).

## 2026-07-31 — P5f export plugin extension points (in progress)

- Goal: stabilize the exporter API into a documented contract + a small
  registry so third-party export targets plug in without forking.
- Current state: export menu items are hardcoded in `initExporter`;
  `doExport(format)` is an if/else chain. Pure builders (`buildExportHtml`,
  `buildSingleFileHtml`, `buildExportCss`, `cleanStyles`, `extractDataImages`,
  `buildSiteZip`) live in `exporter.js` next to DOM code — importing that
  module from a registry would run `document.getElementById` at load time
  and break tests.
- DECIDED:
    - Move the pure builders to `src/js/modules/codegen/htmlExport.js`
      (sibling of jsx/vue/wc exporters); `exporter.js` re-exports them so
      existing imports/tests keep working. This makes every export target a
      pure module — the "stabilized API" is literally the codegen contract.
    - New `src/js/modules/exportRegistry.js` (DOM-free): built-in targets
      registered at module load (html-single, zip, html, react, vue, wc),
      plus `registerExportTarget(target)` for third parties with validation
      (unique id, label, generate function) and `getExportTargets()`.
    - Target contract: `generate({ innerHtml, cssCode, canvasClone })`
      returns `{ files: [{ name, data }] }` (data: string | Uint8Array),
      sync or async. Exporter renders the dropdown from the registry and
      downloads each file (data-URI for text, Blob for bytes).
    - Public hook: `window.registerExportTarget` exposed by the exporter so
      users can drop a snippet into the console/devtools or a bookmarklet
      without forking. Documented in `docs/export-plugin.md`.
- DONE: committed on `feature/plugin-extension-points` (refactor +
  registry tests + contract doc + prettier). 217 tests green, lint/format/
  build clean, merged to master. **P5 complete** — the whole P4/P5 plan
  is shipped.

## 2026-07-31 — P4e AI CSS assistant (done)

- The last remaining roadmap item (P4e / P5a): natural-language
  component/CSS generation, bring-your-own-key, no account.
- DECIDED scope (smallest useful slice):
    - OpenAI-compatible `/chat/completions` via the user's own endpoint —
      default baseUrl `https://api.openai.com/v1`, model `gpt-4o-mini`,
      configurable (works with OpenRouter, Ollama, LM Studio, etc.).
      No backend, no proxy; key stored in localStorage only (`lc.aiConfig`),
      never in `.lcproj`.
    - One prompt box → JSON result `{ html, cssData, tokens? }` →
      **Insert** (append to canvas, merge cssData + tokens) or **Replace**
      (rehydrate canvas, same semantics as a template replace).
    - "Edit selected element" (targeting an existing rule) is deferred —
      v1 is component generation mapped onto the template pipeline, exactly
      what the roadmap says. Noted in the doc.
    - The system prompt embeds the supported CSS property list (from
      `cssDictionary`) and template ids (from `templates.js`) so the model
      stays inside the tool's vocabulary; reply parsing tolerates fenced
      code blocks and prose around the JSON.
    - AI result cssData merges into the rule tree via `cssState.setRule`
      (existing selectors keep their other properties); tokens merge with
      existing project tokens winning (same policy as template append).
    - API-key/endpoint settings live in a collapsible section of the AI
      modal; no network call happens until Send is clicked.
- i18n strings under `ui.ai.*` in en/zh-TW/ja.
- SHIPPED: `src/js/modules/aiAssistant.js` (see `docs/ai-assistant.md`):
  `buildMessages/getCssProps/getTemplateIds`, tolerant
  `parseAssistantReply`, `requestCompletion` (fetch POST with auth header,
  throws on missing key / non-OK / empty reply), `applyAiResult(insert|replace)`
  with token merge (project wins) and rule merge via `cssState.setRule`,
  `getAiConfig/saveAiConfig`; `initAiAssistant` wires the AI modal (collapsible
  settings, prompt, preview + raw JSON, insert/replace/cancel), hooked from
  `app.js` via dynamic import. Toolbar `#btn-ai` + modal in `index.html`,
  `.ai-*` styles in `editor.css`.
- TEST FIX: cssEditor.js module-level code overwrites any
  `window.rebuildCssRulesUI` stub; the test DOM must include the visual CSS
  container (`#visual-css-container`) and `applyAiResult` guards the UI-refresh
  calls (tests run outside a full DOM). Generate only fills the result
  preview — the canvas is untouched until Insert/Replace, matching the UI.
- +12 tests in `test/aiAssistant.test.js` (229 total green); lint, format,
  build clean. **Full roadmap complete.**

## 2026-08-02 �X i18n applied pipeline + ja removal

- AUDIT FINDING: index.html had data-i18n attributes (added with P4e) that
  nothing ever applied; locale switching left ~90% of static UI in English.
  Locale switching uses location.reload() + applySavedLocale() on boot, so
  the fix hooks applyI18n() there (no live re-apply needed).
- New src/js/modules/i18nApplier.js: applyI18n(root) maps data-i18n ->
  textContent, data-i18n-placeholder -> placeholder, data-i18n-title ->
  title; unknown keys (t() returns the raw path) leave hardcoded fallback
  text untouched; root===document also sets <html lang>.
  IMPORTANT: mark only leaf text spans �X a data-i18n element with child
  markup (e.g. .mat-icon) has its children replaced by textContent.
- DECISION (user): drop the ja locale �X dictionaries were complete and
  matching (117 keys x 3) but View menu only offered en/zh-TW and app.js
  only handled those two. setLocale('ja') now silently falls back to en
  (DICTIONARY has no ja entry). README/docs updated to "two locales".
- New i18n keys: ui.menus._, ui.toolbar._, ui.placeholder._, ui.editor._,
  ui.importModal._, ui.templateModal._, ui.aiModal._, ui.openModal._ in
  en + zh-TW. Reused existing keys where sensible (ui.project.new/save,
  ui.toolbar.aiButton 'AI' is its own short key, ui.templates.category*).
- LATENT BUG FIXED: exporter.js used `export { x } from` re-export syntax
  (no local binding) but called cleanStyles()/buildExportCss() internally �X
  would throw ReferenceError at runtime. Changed to import + export.
  (Found by eslint no-undef during this branch.)
- test/i18nApplier.test.js (7 tests): text/placeholder/title application,
  icon-preservation (leaf span marking), unknown-key fallback, locale
  re-apply, ja fallback to en. gotcha: after vi.resetModules(), statically
  imported setLocale() and the dynamically imported applier see different
  module instances �X import i18n dynamically in the test too.
- 236 tests green; lint + format + build clean.

## 2026-08-02 �X Modal a11y (focus trap + dialog semantics)

- All five modals (.modal-overlay: import, template, AI, open, conflict)
  plus the template preview overlay lacked role=dialog, aria-modal, focus
  trapping and Escape-to-close; Tab could reach the page behind a modal.
- New src/js/modules/modalA11y.js, ZERO-INVASION approach: a MutationObserver
  on the style attribute detects open/close (every modal toggles
  display:none/flex), so no existing display-toggle code had to change.
  Nested overlays resolve to the innermost open one (DOM order = preview
  overlay sits after template-modal), so Escape closes the preview first.
- Escape is handled in the capture phase with stopImmediatePropagation to
  suppress app.js's global Escape->deselectAll while a modal is open.
- Focus restore: previous activeElement is re-focused when the last modal
  closes (matches the trigger-button UX); Tab/Shift+Tab wrap inside the
  modal (happy-dom tests confirm activeElement behaviour).
- destroyModalA11y() exported for tests. +5 tests (241 total).
