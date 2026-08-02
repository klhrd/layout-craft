# AI Assistant (P4e)

The AI Assistant generates components from a natural-language prompt and
maps them onto the tool's existing pipeline (canvas + CSS rule tree + design
tokens). It can also restyle an element that is already on the canvas. It is
**bring-your-own-key**: no LayoutCraft account, no proxy, no backend — the
editor calls your chosen OpenAI-compatible endpoint directly from the browser.

## How to use

1. Click the **AI** button in the toolbar.
2. Open **Settings** and fill in:
    - **Base URL** — defaults to `https://api.openai.com/v1`.
    - **Model** — defaults to `gpt-4o-mini`.
    - **API key** — stored only in the browser's localStorage (`lc.aiConfig`),
      never written into the project file (`.lcproj`).
3. **Generate a component** — type a prompt, e.g. _"A pricing section with
   three tiers and a highlighted middle plan"_, and click **Generate**.
4. Review the live preview + raw JSON, then **Insert Below** (appends to the
   canvas, merges CSS rules and tokens) or **Replace Canvas**.
5. **Edit the selected element** — select a canvas element that already has a
   CSS rule (its class must exist in the Visual CSS Rules sidebar), then open
   the AI modal. The panel switches to edit mode ("Editing: .selector") and
   shows an **Apply Changes** button instead of Insert/Replace. Describe the
   new look, e.g. _"Make it dark with rounded corners"_, click **Generate**,
   review, then **Apply Changes**. The rule is replaced by the model's full
   property set; the canvas DOM is not touched.

## Providers

Any OpenAI-compatible `/chat/completions` endpoint works:

| Provider   | Base URL                         | Notes                            |
| ---------- | -------------------------------- | -------------------------------- |
| OpenAI     | `https://api.openai.com/v1`      | default                          |
| OpenRouter | `https://openrouter.ai/api/v1`   | many models, one key             |
| Ollama     | `http://localhost:11434/v1`      | fully local, e.g. model `llama3` |
| LM Studio  | `http://localhost:1234/v1`       | fully local                      |
| Groq       | `https://api.groq.com/openai/v1` | fast open models                 |

## The contract

The model is told the full list of CSS properties the editor can represent
(from `cssDictionary`) plus the built-in template ids, and is asked to reply
with **only** a JSON object:

```json
{
    "html": "<section class=\"...\">…</section>",
    "cssData": { ".selector": { "css-property": "value" } },
    "tokens": { "--custom-prop": "value" }
}
```

- `tokens` is optional; when provided the model is told to reference them via
  `var()`.
- Parsing tolerates fenced code blocks and prose around the JSON.
- On **Insert**, `cssData` merges into the existing rule tree (an existing
  selector keeps its other properties) and tokens merge with existing
  project tokens winning on conflicts — same policy as template append.
- On **Replace**, the canvas is rehydrated exactly like applying a template.

### Edit-mode contract

When a canvas element is selected, the modal switches to **edit mode**. The
model is told the exact selector and its current property set, and is asked
to reply with **only** a JSON object:

```json
{
    "cssData": { ".hero": { "css-property": "value" } }
}
```

- The reply must restate the selector exactly and include the **full desired
  property set** for that rule (keep every unchanged property, adjust only
  what the request changes). No `html`, no `tokens`.
- Replies carrying `html` are rejected.
- On **Apply Changes**, the target rule is **replaced** with the reply's
  property set (insert mode merges; edit replies are the complete set, so a
  merge would leak stale properties). The canvas DOM is untouched.

## Scope notes

- v1 generates components (insert/replace) and edits a selected element's
  style (apply). The prompt vocabulary is shared with the rest of the tool.
- Keys are per-browser, not per-project. Self-hosters can pre-seed
  `localStorage['lc.aiConfig']` for their team.

## Internals

`src/js/modules/aiAssistant.js`:

| export                       | role                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `getCssProps()`              | flat property list from `CSS_DICTIONARY` (custom `--*` props excluded)                    |
| `getTemplateIds()`           | ids from `TEMPLATES`                                                                      |
| `getSelectionTarget()`       | first class with a rule on the selected element → `{ selector, currentStyles }` or `null` |
| `buildMessages(prompt)`      | system + user messages for `/chat/completions` (component mode)                           |
| `buildEditMessages(prompt)`  | system + user messages for edit mode (selector + full property set)                       |
| `parseAssistantReply()`      | text → `{ html, cssData, tokens }` or `null`                                              |
| `parseEditReply()`           | text → `{ cssData }` or `null` (html-bearing replies rejected)                            |
| `requestCompletion()`        | POST to `{baseUrl}/chat/completions`, returns reply text                                  |
| `applyAiResult()`            | insert (merge) or replace (rehydrate) the canvas                                          |
| `applyAiEdit()`              | replace the target rule with the reply's full property set                                |
| `initAiAssistant()`          | modal/settings wiring incl. edit-mode detection (called from `app.js`)                    |
| `getAiConfig`/`saveAiConfig` | localStorage persistence (`lc.aiConfig`)                                                  |
