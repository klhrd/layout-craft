# Drop-in Templates Folder

Templates placed here are picked up at runtime and merged into the Template
Gallery alongside the built-in ones. This lets you extend the gallery of your
own install without touching source code — copy the built `dist/templates/`
folder next to your deployed site, or edit it directly in `public/` before
building.

## How it works

1. `manifest.json` lists the templates (id, title, category, tags, and the
   JSON file containing the actual markup/styles).
2. Each referenced file holds the template content: `{ "html": "...",
"cssData": { ".selector": { "prop": "value" } } }`.
3. On app start, the gallery fetches `./templates/manifest.json` (relative to
   the served root). If it is missing, the built-in 5 templates are shown —
   the app never breaks over a missing manifest.

## Example

```json
// manifest.json
{
    "templates": [
        {
            "id": "my-hero",
            "title": "My Hero",
            "category": "marketing",
            "tags": ["hero", "landing"],
            "file": "my-hero.json"
        }
    ]
}
```

```json
// my-hero.json
{
    "html": "<section class=\"my-hero\"><h1>Hello</h1></section>",
    "cssData": {
        ".my-hero": { "background": "#0f172a", "padding": "80px", "textAlign": "center" }
    }
}
```

Categories used by the built-in gallery UI: `marketing`, `appshell`,
`forms`, `ecommerce` — pick one of these so the category filter shows it.

See `manifest.example.json` in this folder for a copy-paste start.
