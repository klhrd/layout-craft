import { makeElementSortable } from './canvas.js';
import { CONTAINER_TAGS } from '../config/elements.js';
import * as cssState from '../config/cssState.js';
import { compileAndRenderCss } from '../app.js';

function sanitizeImportedNode(node) {
    const REMOVE_TAGS = new Set(['script', 'iframe', 'link', 'style', 'meta', 'base']);
    const walk = (el) => {
        if (REMOVE_TAGS.has(el.tagName && el.tagName.toLowerCase())) {
            el.remove();
            return;
        }
        if (el.attributes) {
            Array.from(el.attributes).forEach((attr) => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        }
        Array.from(el.children).forEach(walk);
    };
    walk(node);
}

function parseCssToBlocks(cssText) {
    const blocks = [];
    if (!cssText.trim()) return blocks;

    const doc = document.implementation.createHTMLDocument('');
    const style = document.createElement('style');
    style.textContent = cssText;
    doc.head.appendChild(style);

    const sheet = style.sheet;
    if (!sheet) return blocks;

    for (let i = 0; i < sheet.cssRules.length; i++) {
        const rule = sheet.cssRules[i];
        if (rule instanceof CSSStyleRule) {
            const styles = {};
            for (let j = 0; j < rule.style.length; j++) {
                const prop = rule.style[j];
                styles[prop] = rule.style.getPropertyValue(prop).trim();
            }
            blocks.push({ type: 'rule', selector: rule.selectorText, styles });
        }
        // Skip @media, @keyframes in v1 — they require the advanced tree model.
    }
    return blocks;
}

function rehydrateAfterImport(html, blocks) {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = html;

    cssState.deserialize(blocks);

    CONTAINER_TAGS.forEach((tag) => {
        canvas.querySelectorAll(tag).forEach((el) => makeElementSortable(el));
    });
    makeElementSortable(canvas);

    try {
        if (window.rebuildCssRulesUI) window.rebuildCssRulesUI();
        if (window.refreshLayers) window.refreshLayers();
        compileAndRenderCss();
    } catch (e) {
        // Silently skip UI refresh when running outside a full DOM environment (tests).
    }
}

export function importFromPaste(htmlInput, cssInput) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');

    sanitizeImportedNode(doc.body);

    const html = doc.body.innerHTML;
    const blocks = parseCssToBlocks(cssInput);

    rehydrateAfterImport(html, blocks);
}
