import { buildJsxExport } from './codegen/jsxExport.js';
import { buildVueExport } from './codegen/vueExport.js';
import { exportAsWebComponent } from './codegen/wcExport.js';
import {
    buildExportHtml,
    buildSingleFileHtml,
    buildExportCss,
    buildSiteZip,
} from './codegen/htmlExport.js';

const targets = [];

export function registerExportTarget(target) {
    if (!target || typeof target.id !== 'string' || !target.id.trim()) {
        throw new Error('Export target requires a non-empty string id');
    }
    if (typeof target.label !== 'string' || !target.label.trim()) {
        throw new Error(`Export target "${target.id}" requires a label`);
    }
    if (typeof target.generate !== 'function') {
        throw new Error(`Export target "${target.id}" requires a generate(ctx) function`);
    }
    if (targets.some((existing) => existing.id === target.id)) {
        throw new Error(`Export target "${target.id}" is already registered`);
    }
    targets.push(target);
    return target;
}

export function getExportTargets() {
    return [...targets];
}

registerExportTarget({
    id: 'html-single',
    label: '📄 Single-file HTML (inlined CSS)',
    generate({ innerHtml, cssCode }) {
        return { files: [{ name: 'index.html', data: buildSingleFileHtml(innerHtml, cssCode) }] };
    },
});

registerExportTarget({
    id: 'zip',
    label: '📦 Whole-site ZIP (HTML + CSS + assets)',
    async generate({ innerHtml, cssCode }) {
        return { files: [{ name: 'site.zip', data: await buildSiteZip(innerHtml, cssCode) }] };
    },
});

registerExportTarget({
    id: 'html',
    label: '🌐 HTML + CSS',
    generate({ innerHtml, cssCode }) {
        return {
            files: [
                { name: 'index.html', data: buildExportHtml(innerHtml) },
                { name: 'style.css', data: buildExportCss(cssCode) },
            ],
        };
    },
});

registerExportTarget({
    id: 'react',
    label: '⚛️ React JSX + CSS',
    generate({ cssCode, canvasClone }) {
        return {
            files: [
                { name: 'App.jsx', data: buildJsxExport(canvasClone) },
                { name: 'style.css', data: buildExportCss(cssCode) },
            ],
        };
    },
});

registerExportTarget({
    id: 'vue',
    label: '💚 Vue SFB (scoped)',
    generate({ cssCode, canvasClone }) {
        return { files: [{ name: 'App.vue', data: buildVueExport(canvasClone, cssCode) }] };
    },
});

registerExportTarget({
    id: 'wc',
    label: '🧩 Web Component (.js)',
    generate({ canvasClone, rawCssCode }) {
        return { files: [{ name: 'layout-craft-block.js', data: exportAsWebComponent(canvasClone, rawCssCode) }] };
    },
});
