# AI Assistant (P4e)

The AI Assistant generates components from a natural-language prompt and
maps them onto the tool's existing pipeline (canvas + CSS rule tree + design
tokens). It is **bring-your-own-key**: no LayoutCraft account, no proxy, no
backend — the editor calls your chosen OpenAI-compatible endpoint directly
from the browser.

## How to use

1. Click the **AI** button in the toolbar.
2. Open **Settings** and fill in:
    - **Base URL** — defaults to `https://api.openai.com/v1`.
    - **Model** — defaults to `gpt-4o-mini`.
    - **API key** — stored only in the browser's localStorage (`lc.aiConfig`),
      never written into the project file (`.lcproj`).
3. Type a prompt, e.g. _"A pricing section with three tiers and a highlighted
   middle plan"_, and click **Generate**.
4. Review the live preview + raw JSON, then **Insert Below** (appends to the
   canvas, merges CSS rules and tokens) or **Replace Canvas**.

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

## Scope notes

- v1 generates **components** (insert/replace). Editing an already selected
  element by describing a style change is a future extension; the prompt
  vocabulary is already shared with the rest of the tool.
- Keys are per-browser, not per-project. Self-hosters can pre-seed
  `localStorage['lc.aiConfig']` for their team.

## Internals

`src/js/modules/aiAssistant.js`:

| export                       | role                                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `getCssProps()`              | flat property list from `CSS_DICTIONARY` (custom `--*` props excluded) |
| `getTemplateIds()`           | ids from `TEMPLATES`                                                   |
| `buildMessages(prompt)`      | system + user messages for `/chat/completions`                         |
| `parseAssistantReply()`      | text → `{ html, cssData, tokens }` or `null`                           |
| `requestCompletion()`        | POST to `{baseUrl}/chat/completions`, returns reply text               |
| `applyAiResult()`            | insert (merge) or replace (rehydrate) the canvas                       |
| `initAiAssistant()`          | modal/settings wiring (called from `app.js`)                           |
| `getAiConfig`/`saveAiConfig` | localStorage persistence (`lc.aiConfig`)                               |
