import { makeElementSortable } from './canvas.js';
import { CONTAINER_TAGS } from '../config/elements.js';
import * as cssState from './cssState.js';
import { compileAndRenderCss } from './cssEditor.js';

export function rehydrateCanvas(html, cssData) {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = html;

    cssState.deserialize(cssData);

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

function getStorageUsagePercent() {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        totalBytes += (key.length + val.length) * 2;
    }
    return (totalBytes / 5 / 1024 / 1024) * 100;
}

function estimateTemplateSize(template) {
    return (template.html.length + JSON.stringify(template.cssData).length) * 2;
}

export function warnStorageQuota(template) {
    const usedPct = getStorageUsagePercent();
    const templateBytes = estimateTemplateSize(template);
    const quota = 5 * 1024 * 1024;
    const remainingBytes = Math.max(0, quota * (1 - usedPct / 100));
    if (templateBytes > remainingBytes * 0.5) {
        return confirm('This template is large relative to your remaining storage. Continue?');
    }
    return true;
}

export function instantiateTemplate(template, mode) {
    if (!warnStorageQuota(template)) return false;

    const canvas = document.getElementById('canvas');
    const html = template.html;

    if (mode === 'replace') {
        rehydrateCanvas(html, template.cssData);
    } else if (mode === 'append') {
        const existingHtml = canvas.innerHTML;
        rehydrateCanvas(existingHtml + html, template.cssData);
    }

    if (template.tokens) {
        if (mode === 'replace') {
            cssState.setTokens(template.tokens);
        } else {
            cssState.setTokens({ ...cssState.getTokens(), ...template.tokens });
        }
        if (window.rebuildTokenUI) window.rebuildTokenUI();
    }

    if (window.saveProject) {
        const proj = document.getElementById('select-project');
        if (proj && proj.value) window.saveProject(proj.value, false);
    }

    return true;
}
