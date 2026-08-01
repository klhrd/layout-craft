import { CSS_DICTIONARY } from '../config/cssDictionary.js';
import { TEMPLATES } from '../config/templates.js';
import { t } from '../config/i18n.js';
import * as cssState from './cssState.js';
import { rehydrateCanvas } from './templateLoader.js';
import { makeElementSortable } from './canvas.js';

const AI_CONFIG_KEY = 'lc.aiConfig';

export function getAiConfig() {
    try {
        return JSON.parse(localStorage.getItem(AI_CONFIG_KEY)) || {};
    } catch (e) {
        return {};
    }
}

export function saveAiConfig(config) {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

export function getCssProps() {
    const props = [];
    for (const section of Object.values(CSS_DICTIONARY)) {
        for (const item of section.items) {
            if (!item.property.startsWith('--')) props.push(item.property);
        }
    }
    return props;
}

export function getTemplateIds() {
    return TEMPLATES.map((tmpl) => tmpl.id);
}

export function buildMessages(prompt, { cssProps, templateIds }) {
    const system = `You are a component generator for a visual web builder.
The tool can represent CSS with these properties: ${cssProps.join(', ')}.
Reusable template ids exist for: ${templateIds.join(', ')}.
Respond with ONLY a JSON object, no prose, in this exact shape:
{"html": "<valid HTML snippet>", "cssData": {"<selector>": {"<css-property>": "<value>"}}, "tokens": {"--custom-prop": "<value>"}}
Use simple, class-based selectors that match the html. The tokens object is optional; when provided, reference tokens from cssData with var() and give the element a class that uses them.`;
    return [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
    ];
}

export function parseAssistantReply(text) {
    if (typeof text !== 'string' || !text.trim()) return null;
    let candidate = text.trim();
    const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) candidate = fenced[1].trim();
    const jsonMatch = candidate.match(/\{[\s\S]*\}/);
    if (jsonMatch) candidate = jsonMatch[0];
    try {
        const data = JSON.parse(candidate);
        if (typeof data.html !== 'string' || !data.html.trim()) return null;
        if (!data.cssData || typeof data.cssData !== 'object' || Array.isArray(data.cssData)) return null;
        return {
            html: data.html,
            cssData: data.cssData,
            tokens: data.tokens && typeof data.tokens === 'object' ? data.tokens : {},
        };
    } catch (e) {
        return null;
    }
}

export async function requestCompletion({ baseUrl, apiKey, model }, messages) {
    if (!apiKey) throw new Error(t('ui.ai.noKey'));
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
        throw new Error(`${t('ui.ai.requestError')} (${res.status})`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error(t('ui.ai.emptyReply'));
    return content;
}

export function applyAiResult(result, mode) {
    const tokens = cssState.getTokens();
    cssState.setTokens({ ...result.tokens, ...tokens });
    if (window.rebuildTokenUI) window.rebuildTokenUI();

    if (mode === 'replace') {
        rehydrateCanvas(result.html, result.cssData);
        return;
    }

    const canvas = document.getElementById('canvas');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = result.html.trim();
    while (wrapper.firstChild) {
        canvas.appendChild(wrapper.firstChild);
    }
    for (const [selector, rule] of Object.entries(result.cssData)) {
        if (!rule || typeof rule !== 'object') continue;
        const existing = cssState.getRule(selector) || {};
        cssState.setRule(selector, { ...existing, ...rule });
    }
    canvas.querySelectorAll('[class]').forEach((el) => makeElementSortable(el));
    try {
        if (window.rebuildCssRulesUI) window.rebuildCssRulesUI();
        if (window.refreshLayers) window.refreshLayers();
    } catch (e) {
        // Silently skip UI refresh when running outside a full DOM environment (tests).
    }
}

export function initAiAssistant() {
    const modal = document.getElementById('ai-modal');
    const btnOpen = document.getElementById('btn-ai');
    const btnClose = document.getElementById('btn-ai-close');
    const sendBtn = document.getElementById('btn-ai-send');
    const promptInput = document.getElementById('ai-prompt');
    const statusEl = document.getElementById('ai-status');
    const resultArea = document.getElementById('ai-result');
    const settingsToggle = document.getElementById('btn-ai-settings');
    const settingsSection = document.getElementById('ai-settings');
    const baseUrlInput = document.getElementById('ai-base-url');
    const modelInput = document.getElementById('ai-model');
    const apiKeyInput = document.getElementById('ai-api-key');
    const insertBtn = document.getElementById('btn-ai-insert');
    const replaceBtn = document.getElementById('btn-ai-replace');

    if (!modal || !btnOpen) return;

    const config = getAiConfig();
    baseUrlInput.value = config.baseUrl || 'https://api.openai.com/v1';
    modelInput.value = config.model || 'gpt-4o-mini';
    apiKeyInput.value = config.apiKey || '';

    let lastResult = null;

    const setStatus = (msg) => {
        statusEl.textContent = msg || '';
        statusEl.style.display = msg ? 'block' : 'none';
    };

    const renderResult = () => {
        if (!lastResult) {
            resultArea.innerHTML = '';
            return;
        }
        resultArea.innerHTML = `<div class="ai-result-preview">${lastResult.html}</div><pre class="ai-result-raw">${escapeHtml(JSON.stringify(lastResult, null, 2))}</pre>`;
    };

    const applyResult = (mode) => {
        if (!lastResult) return;
        applyAiResult(lastResult, mode);
        resultArea.innerHTML = '';
        lastResult = null;
        setStatus(t('ui.ai.applied'));
        const proj = document.getElementById('select-project');
        if (proj && proj.value && window.saveProject) window.saveProject(proj.value, false);
    };

    btnOpen.addEventListener('click', () => {
        promptInput.value = '';
        resultArea.innerHTML = '';
        lastResult = null;
        setStatus('');
        modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    settingsToggle.addEventListener('click', () => {
        settingsSection.classList.toggle('hidden');
    });

    sendBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        saveAiConfig({
            baseUrl: baseUrlInput.value.trim(),
            model: modelInput.value.trim(),
            apiKey: apiKeyInput.value.trim(),
        });
        setStatus(t('ui.ai.working'));
        sendBtn.disabled = true;
        try {
            const config = getAiConfig();
            const messages = buildMessages(prompt, {
                cssProps: getCssProps(),
                templateIds: getTemplateIds(),
            });
            const reply = await requestCompletion(config, messages);
            const parsed = parseAssistantReply(reply);
            if (!parsed) {
                setStatus(t('ui.ai.badReply'));
                return;
            }
            lastResult = parsed;
            renderResult();
            setStatus('');
        } catch (e) {
            setStatus(e.message);
        } finally {
            sendBtn.disabled = false;
        }
    });

    insertBtn.addEventListener('click', () => applyResult('insert'));
    replaceBtn.addEventListener('click', () => applyResult('replace'));
}

function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
