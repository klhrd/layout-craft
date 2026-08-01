# Export Plugin Contract (P5f)

The exporter is a small registry of **export targets**. Third-party targets
plug in without forking the repo — register one from the console, a
bookmarklet, or a `<script>` you ship next to your own install.

## Registering a target

```js
window.registerExportTarget({
    id: 'my-format',           // unique, non-empty string
    label: '🚀 My Format',     // shown in the export dropdown
    generate(ctx) {            // sync or async
        return { files: [
            { name: 'out.txt', data: 'hello' },
        ] };
    },
});
```

`window.registerExportTarget` is exposed by `initExporter()`. The same
function is exported by the module as `registerTarget`.

## The context object

`generate` receives one argument, `ctx`:

| field          | type        | description                                  |
| -------------- | ----------- | -------------------------------------------- |
| `innerHtml`    | `string`    | Canvas HTML with editor classes cleaned      |
| `cssCode`      | `string`    | CSS wrapped with header comment + body reset |
| `rawCssCode`   | `string`    | Raw compiled CSS, no wrapper                 |
| `canvasClone`  | `Element`   | Cloned canvas element (for DOM walkers)      |

## The result object

```js
{ files: [{ name: string, data: string | Uint8Array }] }
```

- `data` as string is downloaded as UTF-8 text (data URI).
- `data` as `Uint8Array` is downloaded as a binary Blob
  (`application/zip` for `.zip` names, otherwise `application/octet-stream`).
- Multiple files download in order — e.g. the built-in HTML+CSS target
  produces `index.html` and `style.css`.

Errors thrown by `generate` are not swallowed by design (they surface in the
console); targets should catch their own failures if they want a graceful UI.

## Validation

`registerExportTarget` throws on:
- missing/empty `id`,
- missing/empty `label`,
- missing `generate` function,
- duplicate `id` (built-in ids: `html-single`, `zip`, `html`, `react`,
  `vue`, `wc`).

## Internal architecture

| module                        | role                                      |
| ----------------------------- | ----------------------------------------- |
| `modules/codegen/htmlExport.js` | Pure builders: `buildExportHtml`, `buildSingleFileHtml`, `buildExportCss`, `cleanStyles`, `extractDataImages`, `buildSiteZip` |
| `modules/codegen/jsxExport.js`  | React JSX builder                        |
| `modules/codegen/vueExport.js`  | Vue SFC builder                          |
| `modules/codegen/wcExport.js`   | Web Component builder                    |
| `modules/exportRegistry.js`    | Registry: built-in targets + `registerExportTarget` / `getExportTargets` (DOM-free) |
| `modules/exporter.js`          | Preview mode + dropdown UI + downloads; re-exports the codegen builders for compatibility |

Built-in targets are pure modules — anything you can build by hand in
`generate` has the same behaviour as the built-ins.
