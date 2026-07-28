# Internationalization & Theming — Design Document (Long-term #4)

Status: **planning**. This branch holds the design only; implementation
can proceed independently of the long-term backend work.

## Goal

Two related UX features that complete the editor for international
and accessibility-conscious users:

1. **Localization**: English is the default (already shipped), plus
   Traditional Chinese (`zh-TW`) partial seed exists; add Simplified
   Chinese (`zh-CN`), Japanese (`ja`), Spanish (`es`) as full
   translations once the rest of the editor settles.
2. **Theming**: light/dark UI toggle (editor chrome only; the user's
   canvas stays style-agnostic so exported HTML is unaffected).

## Requirements

### Localization

- All user-visible strings flow through `t(path, ...args)` from
  `src/js/config/i18n.js` — already enforced since Short-term #1.
- Locale persisted in `localStorage` keyed `layoutcraft_locale`.
- Switching locale applies instantly without reload.
- A `lang` selector in the control bar (compact flag / two-letter
  dropdown).
- Completing `zh-TW` becomes a contribution hook: ship with the
  strings that are already defined, and tag the rest as TODO via a
  visible `[untranslated]` sentinel so contributors can grep for gaps.
- Numbers / dates: project names, storage meter, and any future dates
  format via `Intl.NumberFormat` / `Intl.DateTimeFormat` keyed by
  active locale.

### Theming

- CSS custom properties drive theme colors. A `data-theme="light|dark"`
  attribute on `<html>` switches the variables.
- Default is `light`, respecting `prefers-color-scheme` only on first
  run; thereafter the user's choice is stored in
  `localStorage` (`layoutcraft_theme`).
- The toggle lives next to the lang selector in the control bar.
- The canvas preview area is _not_ themed: it must show the user's
  chosen colors; only the editor chrome (control bar, sidebars,
  Inspector panel, dialog backgrounds) is themed.

## Design choices

### i18n — completing the dictionary

The current dictionary (`src/js/config/i18n.js`) has English populated
fully and `zh-TW` partially. Plan:

1. Run a sweep commit that fills every missing key in `zh-TW`, marking
   anything contentious with a code comment.
2. Add `zh-CN` directly translated from `zh-TW`, with a conversion
   pass to detect region-specific terms.
3. For `ja` and `es`, set up the dictionary skeleton (English copies
   for now) and tag the file with a contribution badge; ship v1 with
   only the toast message strings translated so users see feedback
   in the right language at minimum.
4. Add a `localeApplied` event from `setLocale()` that panels
   subscribe to so their dynamic re-render uses the new strings.

### Theming implementation

- `src/css/theme.css` (new) defines `:root[data-theme="light"]` and
  `:root[data-theme="dark"]` variable blocks referencing the
  existing hard-coded colors in `editor.css` / `canvas-preview.css`.
- Refactor `editor.css` to consume the variables instead of literal
  hex colors (large but mechanical).
- `theme.js` module exposes `getTheme()` / `setTheme(theme)` /
  `toggleTheme()`; persists to `localStorage`; toggles the
  `data-theme` attr on `document.documentElement`.
- Canvas preview clone (used by exporter.js) must inject the user's CSS
  _only_, never the theme variables — done today already because
  `compileAndRenderCss` writes to `#live-styles`.

## Suggested commit plan for this branch

| #   | Commit title                                                       |
| --- | ------------------------------------------------------------------ |
| 1   | `Add i18n-theming design document` (this file)                     |
| 2   | `Extract color tokens into src/css/theme.css (light/dark)`         |
| 3   | `Refactor editor.css to consume theme variables`                   |
| 4   | `Add theme.js module + data-theme attr + localStorage persistence` |
| 5   | `Add light/dark toggle UI in the control bar`                      |
| 6   | `Add lang selector dropdown wired to setLocale + persist`          |
| 7   | `Fire localeApplied event; subscribe dynamic panels`               |
| 8   | `Complete zh-TW dictionary + add zh-CN / ja / es scaffolds`        |
| 9   | `Switch project list to Intl formatting; localize storage meter`   |
| 10  | `Mark Long-term #4 complete in ROADMAP`                            |

## Open questions

1. Per-project theme (e.g. dark canvas + light editor)? Current plan:
   **no** — the editor is themed, the canvas is the user's design.
2. Does the lang selector allow a "browser default" option that
   follows `navigator.languages`? Current plan: **yes**, as the
   initial value when nothing is persisted.
3. Right-to-left support for `ar` / `he`? Current plan: **defer** — only
   add `ar` once the editor chrome is RTL-safe, which requires layout
   flips across all panels.
