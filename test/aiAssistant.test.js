import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { install, reset } from './_localStorageHarness.js';

beforeEach(() => {
    install();
    globalThis.Sortable = class {
        constructor() {}
        destroy() {}
    };
    document.body.innerHTML = `
        <div id="canvas"></div>
        <div id="visual-css-container"></div>
        <div class="canvas-container"></div>
        <div id="ai-modal">
            <button id="btn-ai-settings"></button>
            <div id="ai-settings" class="hidden"></div>
            <textarea id="ai-prompt"></textarea>
            <button id="btn-ai-send"></button>
            <div id="ai-status"></div>
            <div id="ai-edit-target"></div>
            <div id="ai-result"></div>
            <button id="btn-ai-apply"></button>
            <button id="btn-ai-insert"></button>
            <button id="btn-ai-replace"></button>
            <button id="btn-ai-close"></button>
        </div>
        <button id="btn-ai"></button>
        <input id="ai-base-url" />
        <input id="ai-model" />
        <input id="ai-api-key" />
        <select id="select-project"><option>Test</option></select>
        <style id="live-styles"></style>
    `;
    window.rebuildTokenUI = vi.fn();
    window.rebuildCssRulesUI = vi.fn();
    window.refreshLayers = () => {};
    window.saveProject = () => {};
});

afterEach(() => {
    reset();
    vi.unstubAllGlobals();
    vi.resetModules();
    document.body.innerHTML = '';
    delete window.rebuildTokenUI;
    delete window.rebuildCssRulesUI;
    delete window.refreshLayers;
    delete window.saveProject;
});

describe('buildMessages', () => {
    it('embeds the css property list and template ids in the system prompt', async () => {
        const { buildMessages, getCssProps, getTemplateIds } = await import('../src/js/modules/aiAssistant.js');
        const messages = buildMessages('A pricing section', {
            cssProps: ['display', 'gap', 'color'],
            templateIds: ['navbar', 'hero-split'],
        });
        expect(messages[0].role).toBe('system');
        expect(messages[0].content).toContain('display, gap, color');
        expect(messages[0].content).toContain('navbar, hero-split');
        expect(messages[1]).toEqual({ role: 'user', content: 'A pricing section' });

        const props = getCssProps();
        expect(props).toContain('display');
        expect(props).not.toContain('--color-primary');
        expect(getTemplateIds()).toContain('pricing-table');
    });
});

describe('parseAssistantReply', () => {
    it('parses a bare JSON object', async () => {
        const { parseAssistantReply } = await import('../src/js/modules/aiAssistant.js');
        const result = parseAssistantReply('{"html":"<section>Hi</section>","cssData":{".x":{"color":"red"}}}');
        expect(result.html).toBe('<section>Hi</section>');
        expect(result.cssData['.x']).toEqual({ color: 'red' });
        expect(result.tokens).toEqual({});
    });

    it('parses fenced json and tolerates surrounding prose', async () => {
        const { parseAssistantReply } = await import('../src/js/modules/aiAssistant.js');
        const reply = `Here you go:
\`\`\`json
{ "html": "<p>Hello</p>", "cssData": { ".p": { "fontSize": "1rem" } }, "tokens": { "--c": "#fff" } }
\`\`\`
Hope that helps!`;
        const result = parseAssistantReply(reply);
        expect(result.html).toBe('<p>Hello</p>');
        expect(result.tokens).toEqual({ '--c': '#fff' });
    });

    it('returns null for invalid JSON or missing html', async () => {
        const { parseAssistantReply } = await import('../src/js/modules/aiAssistant.js');
        expect(parseAssistantReply('not json at all')).toBeNull();
        expect(parseAssistantReply('{"cssData":{}}')).toBeNull();
        expect(parseAssistantReply('')).toBeNull();
    });
});

describe('requestCompletion', () => {
    it('posts to the chat completions endpoint with the key and returns content', async () => {
        const { requestCompletion } = await import('../src/js/modules/aiAssistant.js');
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ choices: [{ message: { content: '{"html":"<b>ok</b>","cssData":{}}' } }] }),
        }));
        vi.stubGlobal('fetch', fetchMock);
        const content = await requestCompletion(
            { baseUrl: 'https://example.com/v1/', apiKey: 'sk-test', model: 'm1' },
            [{ role: 'user', content: 'hi' }],
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0];
        expect(url).toBe('https://example.com/v1/chat/completions');
        expect(opts.headers.Authorization).toBe('Bearer sk-test');
        expect(JSON.parse(opts.body).model).toBe('m1');
        expect(content).toContain('<b>ok</b>');
    });

    it('throws without an api key', async () => {
        const { requestCompletion } = await import('../src/js/modules/aiAssistant.js');
        await expect(requestCompletion({ baseUrl: 'x', apiKey: '', model: 'm' }, [])).rejects.toThrow();
    });

    it('throws on non-ok responses', async () => {
        const { requestCompletion } = await import('../src/js/modules/aiAssistant.js');
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })),
        );
        await expect(requestCompletion({ baseUrl: 'x', apiKey: 'k', model: 'm' }, [])).rejects.toThrow(/401/);
    });
});

describe('applyAiResult', () => {
    it('inserts html, merges cssData into existing rules, and seeds tokens', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.setRule('.existing', { color: 'blue' });
        cssState.setTokens({ '--keep': '#111' });

        ai.applyAiResult(
            {
                html: '<section class="ai-card"><h2>AI</h2></section>',
                cssData: { '.existing': { padding: '8px' }, '.ai-card': { background: 'var(--c)' } },
                tokens: { '--c': '#2563eb' },
            },
            'insert',
        );

        const canvas = document.getElementById('canvas');
        expect(canvas.querySelector('.ai-card')).not.toBeNull();
        expect(cssState.getRule('.existing')).toEqual({ color: 'blue', padding: '8px' });
        expect(cssState.getTokens()).toMatchObject({ '--c': '#2563eb', '--keep': '#111' });
    });

    it('replace mode rehydrates the canvas', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        document.getElementById('canvas').innerHTML = '<p>Old</p>';
        ai.applyAiResult({ html: '<p>New</p>', cssData: { '.p': { color: 'red' } }, tokens: {} }, 'replace');
        expect(document.getElementById('canvas').innerHTML).toContain('<p>New</p>');
        expect(document.getElementById('canvas').innerHTML).not.toContain('Old');
    });
});

describe('initAiAssistant flow', () => {
    it('generates a component and inserts it into the canvas', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content:
                                    '```json\n{"html":"<div class=\\"ai-hero\\">Hi</div>","cssData":{".ai-hero":{"padding":"20px"}},"tokens":{}}\n```',
                            },
                        },
                    ],
                }),
            })),
        );

        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        ai.initAiAssistant();

        document.getElementById('btn-ai').click();
        document.getElementById('ai-prompt').value = 'A hero section';
        document.getElementById('ai-base-url').value = 'https://api.openai.com/v1';
        document.getElementById('ai-model').value = 'gpt-4o-mini';
        document.getElementById('ai-api-key').value = 'sk-test';
        document.getElementById('btn-ai-send').click();

        await vi.waitFor(() => {
            const pre = document.querySelector('#ai-result pre');
            expect(pre).not.toBeNull();
            expect(pre.textContent).toContain('ai-hero');
        });
        expect(document.getElementById('canvas').querySelector('.ai-hero')).toBeNull();

        document.getElementById('btn-ai-insert').click();
        expect(document.getElementById('canvas').querySelector('.ai-hero')).not.toBeNull();
        expect(cssState.getRule('.ai-hero')).toEqual({ padding: '20px' });
    });

    it('persists settings to localStorage', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        ai.saveAiConfig({ baseUrl: 'http://localhost:11434/v1', model: 'llama3', apiKey: 'x' });
        expect(ai.getAiConfig()).toMatchObject({
            baseUrl: 'http://localhost:11434/v1',
            model: 'llama3',
            apiKey: 'x',
        });
    });
});

describe('buildEditMessages', () => {
    it('tells the model to return the full property set for the given selector', async () => {
        const { buildEditMessages } = await import('../src/js/modules/aiAssistant.js');
        const messages = buildEditMessages('Make it dark', {
            cssProps: ['display', 'color', 'background'],
            selector: '.hero',
            currentStyles: { color: '#222', background: '#fff' },
        });
        const system = messages[0].content;
        expect(system).toContain('.hero');
        expect(system).toContain('{"color":"#222","background":"#fff"}');
        expect(system).toContain('display');
        expect(system).toContain('background');
        expect(messages[1].content).toContain('Make it dark');
        expect(messages[0].role).toBe('system');
        expect(messages[1].role).toBe('user');
    });

    it('never asks the model for html or tokens in edit mode', async () => {
        const { buildEditMessages } = await import('../src/js/modules/aiAssistant.js');
        const system = buildEditMessages('x', {
            cssProps: ['color'],
            selector: '.card',
            currentStyles: {},
        })[0].content;
        expect(system).not.toContain('"html"');
        expect(system).not.toContain('"tokens"');
        expect(system).not.toContain('<html>');
    });
});

describe('getSelectionTarget', () => {
    it('returns the first class with a rule on the selected element', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.setRule('.hero', { color: 'red' });
        cssState.setRule('.fancy', { padding: '4px' });
        document.body.innerHTML = `
            <div class="canvas-container">
                <div class="hero fancy selected-element"></div>
            </div>
        `;
        expect(ai.getSelectionTarget()).toEqual({
            selector: '.hero',
            currentStyles: { color: 'red' },
        });
    });

    it('returns null when no selection or no matching rule', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        expect(ai.getSelectionTarget()).toBeNull();
        cssState.setRule('.hero', { color: 'red' });
        document.body.innerHTML = '<div class="canvas-container"><div class="hero"></div></div>';
        expect(ai.getSelectionTarget()).toBeNull();
        document.body.innerHTML = '<div class="canvas-container"><div class="hero selected-element"></div></div>';
        expect(ai.getSelectionTarget()).not.toBeNull();
    });
});

describe('parseEditReply', () => {
    it('accepts cssData-only replies in fenced blocks', async () => {
        const { parseEditReply } = await import('../src/js/modules/aiAssistant.js');
        const parsed = parseEditReply('```json\n{"cssData":{".hero":{"background":"#111"}}}\n```');
        expect(parsed).toEqual({ cssData: { '.hero': { background: '#111' } } });
    });

    it('rejects replies that carry html or tokens', async () => {
        const { parseEditReply } = await import('../src/js/modules/aiAssistant.js');
        expect(parseEditReply('{"cssData":{".hero":{"background":"#111"}},"html":"<p>x</p>","tokens":{}}')).toBeNull();
        expect(parseEditReply('no json here')).toBeNull();
    });
});

describe('applyAiEdit', () => {
    it('replaces the whole rule with the returned property set', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        window.rebuildCssRulesUI = vi.fn();
        cssState.setRule('.hero', { color: 'red', padding: '4px' });

        ai.applyAiEdit({ cssData: { '.hero': { background: '#111', color: '#eee' } } });

        expect(cssState.getRule('.hero')).toEqual({ background: '#111', color: '#eee' });
        expect(window.rebuildCssRulesUI).toHaveBeenCalledTimes(1);
    });
});

describe('initAiAssistant edit flow', () => {
    it('edits the selected element and applies full replacement', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.setRule('.hero', { color: 'red' });
        const container = document.querySelector('.canvas-container');
        const el = document.createElement('div');
        el.className = 'hero selected-element';
        container.appendChild(el);
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({
                    choices: [
                        {
                            message: {
                                content: '{"cssData":{".hero":{"background":"#111","color":"#eee"}}}',
                            },
                        },
                    ],
                }),
            })),
        );

        ai.initAiAssistant();
        document.getElementById('btn-ai').click();

        const targetEl = document.getElementById('ai-edit-target');
        expect(targetEl.textContent).toBe('Editing: .hero');
        expect(targetEl.style.display).toBe('block');
        expect(document.getElementById('btn-ai-apply').style.display).toBe('inline-flex');
        expect(document.getElementById('btn-ai-insert').style.display).toBe('none');
        expect(document.getElementById('btn-ai-replace').style.display).toBe('none');

        document.getElementById('ai-prompt').value = 'Make it dark';
        document.getElementById('ai-base-url').value = 'https://api.openai.com/v1';
        document.getElementById('ai-model').value = 'gpt-4o-mini';
        document.getElementById('ai-api-key').value = 'sk-test';
        document.getElementById('btn-ai-send').click();

        await vi.waitFor(() => {
            expect(document.querySelector('#ai-result pre')).not.toBeNull();
        });
        document.getElementById('btn-ai-apply').click();

        expect(cssState.getRule('.hero')).toEqual({ background: '#111', color: '#eee' });
    });

    it('shows insert/replace buttons when nothing is selected', async () => {
        const ai = await import('../src/js/modules/aiAssistant.js');
        ai.initAiAssistant();
        document.getElementById('btn-ai').click();
        expect(document.getElementById('ai-edit-target').style.display).toBe('none');
        expect(document.getElementById('btn-ai-apply').style.display).toBe('none');
        expect(document.getElementById('btn-ai-insert').style.display).toBe('');
        expect(document.getElementById('btn-ai-replace').style.display).toBe('');
    });
});
