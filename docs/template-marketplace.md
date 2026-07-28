# Template Marketplace — Design Document (Long-term #3)

Status: **planning**. This branch holds the design only; implementation
will not start until Long-term #1 (backend-sync) lands, since the
marketplace needs a hosted catalogue.

## Goal

Ship a curated library of common layouts (navbar, hero, pricing table,
dashboard, footer) that the user can import into the canvas with one
click, customise visually, and re-export. Turns LayoutCraft from a
blank canvas editor into a starter-kit aggregator.

## Requirements

- A "Templates" gallery reachable from the control bar.
- Each template ships as a self-contained JSON snapshot (canvas HTML
  string + `activeCssData`), loaded through the existing
  `rehydrateCanvas` helper (factored out in Mid-term #5).
- Categories: marketing, app shell, forms, e-commerce.
- Built-in starter templates bundled with the app; user-uploaded
  templates deferred to a future "Community" iteration.
- Insert options:
  1. **Replace canvas** (current canvas contents discarded)
  2. **Append to canvas** (insert at the end — useful for sticky
     footers / navbars added atop custom content)
- After insertion, the regular Inspector / CSS builder edit every
  element, so templates are not sealed black boxes.
- LocalStorage-friendly: warn before importing a template larger than
  ~50% of the remaining LocalStorage quota.

## Design choices

### Catalogue storage

Two tiers:

1. **Built-in catalogue** lives in the repo under
   `src/js/config/templates.js` (pure data, no DOM). Shipped with the
   bundle. Ideal for the initial ~10 MVP templates (navbar, hero,
   pricing, footer, blog card, login form, dashboard shell).
2. **Hosted catalogue** (supabase table `templates` joined to user
   uploads in Long-term #1's backend). Treated as a read-only RSS
   feed with stars and tags.

### Template schema

```js
{
  id: 'hero-centered',
  title: 'Centered Hero',
  category: 'marketing',
  tags: ['landing','hero','cta'],
  thumbnail: 'data:image/svg+xml;...',     // lightweight SVG
  html: '<section class="hero">...</section>',
  cssData: {
    '.hero': { 'min-height':'100vh','display':'flex', ... },
    '.hero h1': { 'font-size':'3rem', ... },
  },
}
```

A helper `instantiateTemplate(t, mode)` calls `rehydrateCanvas`.
`rehydrateCanvas` is shared with the importer so we get sanitize + RLS
hardening for free.

### Gallery UI

A modal grid similar to Figma's templates picker. Filtering by category
and search by title/tag. Click → preview popover with thumbnail and
"Replace" / "Append" buttons.

### Authoring flow

Tight loop:
1. Build a layout visually in LayoutCraft.
2. "Save as template" exports the canvas + CSS to the in-browser
   template editor (a stub JSON output dialog).
3. Submit-to-hosted (community upload) gated by auth + a moderation
   queue is a follow-up; v1 only ships built-in templates.

## Suggested commit plan for this branch

| # | Commit title                                                    |
| - | ------------------------------------------------------------- |
| 1 | `Add template-marketplace design document` (this file)        |
| 2 | `Author 5 MVP templates (navbar, hero, pricing, footer, login)` |
| 3 | `Add src/js/config/templates.js catalogue module`             |
| 4 | `Build the gallery modal (filter / search / preview popover)`  |
| 5 | `Implement Replace / Append insertion via rehydrateCanvas`    |
| 6 | `Add "Save as template" dialog exporting JSON stub`           |
| 7 | `Add regression tests for each MVP template`                  |
| 8 | `Document the templates flow in README`                       |
| 9 | `Mark Long-term #3 complete in ROADMAP`                       |

## Open questions

1. Should built-in templates be shipped as separate `.json` files
   under `src/templates/`, or as one `templates.js` ES module?
   Current plan: **one JS module** matches the convention of
   `elements.js` / `cssDictionary.js`.
2. Licensing of any third-party template sourced from existing OSS UI
   kits: must be MIT-compatible. Current plan: **hand-author all MVP
   templates in-repo** to avoid licensing headaches.
3. Should template categories be i18n-translated? Current plan: **yes**,
   via the existing `i18n.js` module once full zh-TW lands.
