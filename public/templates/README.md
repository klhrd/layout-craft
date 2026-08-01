# Drop-in Templates Folder

Templates placed here are picked up at runtime and merged into the Template
Gallery alongside the built-in ones. This lets you extend the gallery of your
own install without touching source code — copy the built `dist/templates/`
folder next to your deployed site, or edit it directly in `public/` before
building.

## How it works

1. `manifest.json` lists the templates (id, title, category, tags, the JSON
   file containing markup/styles, and an optional `preview` image).
2. Each referenced file holds the template content:
   `{ "html": "...", "cssData": { ".selector": { "prop": "value" } } }` —
   an optional `tokens` object (`{ "--name": "value" }`) seeds the project's
   design tokens when the template is applied.
3. On app start, the gallery fetches `./templates/manifest.json` (relative to
   the served root). If it is missing, the built-in templates are shown — the
   app never breaks over a missing manifest.

## Folder layout

Use subfolders to bundle a template family: one folder can hold several
variants plus a shared preview image.

```
public/templates/
├── manifest.json          # gallery entries (required)
└── my-hero/
    ├── hero.json          # variant 1 (dark theme + tokens)
    ├── hero-light.json    # variant 2 (same structure, light tokens)
    └── preview.svg        # optional preview shown in the gallery
```

`preview` is a path relative to `templates/` (or a `data:` URI). Any browser-
renderable format works — SVG, PNG, JPEG, WebP. The gallery shows the image
when `preview` is set, otherwise the per-template emoji icon.

## Example

```json
// manifest.json
{
    "templates": [
        {
            "id": "my-hero",
            "title": "My Hero (Dark)",
            "category": "marketing",
            "tags": ["hero", "landing"],
            "file": "my-hero/hero.json",
            "preview": "my-hero/preview.svg"
        }
    ]
}
```

```json
// my-hero/hero.json
{
    "html": "<section class=\"my-hero\"><h1>Hello</h1></section>",
    "cssData": {
        ".my-hero": { "background": "var(--hero-bg)", "padding": "80px" }
    },
    "tokens": {
        "--hero-bg": "#0f172a"
    }
}
```

Categories used by the built-in gallery UI: `marketing`, `appshell`,
`forms`, `ecommerce` — pick one of these so the category filter shows it.
