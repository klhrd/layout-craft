import { deselectAll } from './inspector.js';
import { getActiveCssCode } from './cssEditor.js';
import { cancelActiveInlineEdit } from './canvas.js';
import { t } from '../config/i18n.js';
import { DEVICES } from '../config/devices.js';
import { buildJsxExport } from './codegen/jsxExport.js';
import { buildVueExport } from './codegen/vueExport.js';
import { exportAsWebComponent } from './codegen/wcExport.js';

export function buildExportHtml(innerHtml) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LayoutCraft Site</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${innerHtml.trim()}
</body>
</html>`;
}

export function buildSingleFileHtml(innerHtml, cssCode) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LayoutCraft Site</title>
    <style>
${cssCode}
    </style>
</head>
<body>
${innerHtml.trim()}
</body>
</html>`;
}

export function buildExportCss(cssCode) {
    return `/* Generated via LayoutCraft Visual CSS Builder */\nbody { margin: 0; padding: 0; font-family: sans-serif; }\n\n${cssCode}`;
}

const canvas = document.getElementById('canvas');
const btnPreview = document.getElementById('btn-preview');
const btnExport = document.getElementById('btn-export');

let activeDeviceIdx = 0;

function getCanvasContent() {
    const canvasClone = canvas.cloneNode(true);
    const tempPlaceholder = canvasClone.querySelector('.canvas-placeholder');
    if (tempPlaceholder) tempPlaceholder.remove();
    Array.from(canvasClone.children).forEach((child) => cleanStyles(child));
    return canvasClone;
}

export function initExporter() {
    btnPreview.addEventListener('click', () => {
        cancelActiveInlineEdit();
        deselectAll();
        document.body.classList.add('preview-mode');
        activeDeviceIdx = 0;

        const toolbar = document.createElement('div');
        toolbar.id = 'preview-toolbar';
        DEVICES.forEach((d, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preview-device-btn' + (i === 0 ? ' active' : '');
            btn.innerHTML = `<span class="mat-icon">${d.icon}</span> ${d.label}`;
            btn.addEventListener('click', () => {
                toolbar.querySelectorAll('.preview-device-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                activeDeviceIdx = i;
                applyDeviceFrame();
            });
            toolbar.appendChild(btn);
        });

        const widthLabel = document.createElement('span');
        widthLabel.id = 'preview-width-label';
        toolbar.appendChild(widthLabel);

        document.body.appendChild(toolbar);
        applyDeviceFrame();

        const exitBtn = document.createElement('button');
        exitBtn.id = 'btn-exit-preview';
        exitBtn.innerHTML = t('ui.backToEditor');
        document.body.appendChild(exitBtn);
        exitBtn.addEventListener('click', () => {
            document.body.classList.remove('preview-mode');
            exitBtn.remove();
            toolbar.remove();
            canvas.style.maxWidth = '';
            canvas.style.margin = '';
        });

        const ro = new ResizeObserver(() => {
            if (document.body.classList.contains('preview-mode')) applyDeviceFrame();
        });
        ro.observe(canvas);
    });

    function applyDeviceFrame() {
        const device = DEVICES[activeDeviceIdx];
        const label = document.getElementById('preview-width-label');
        if (device.width) {
            canvas.style.maxWidth = `${device.width}px`;
            canvas.style.margin = '0 auto';
            if (label) label.textContent = `${canvas.offsetWidth}px`;
        } else {
            canvas.style.maxWidth = '';
            canvas.style.margin = '';
            if (label) label.textContent = `${canvas.offsetWidth}px`;
        }
    }

    // Export dropdown
    btnExport.addEventListener('click', (e) => {
        e.stopPropagation();
        const existing = document.getElementById('export-dropdown');
        if (existing) {
            existing.remove();
            return;
        }

        const dropdown = document.createElement('div');
        dropdown.id = 'export-dropdown';
        dropdown.style.cssText = `
            position: fixed; background: #1e293b; border: 1px solid #334155;
            border-radius: 8px; padding: 8px; z-index: 99999;
            display: flex; flex-direction: column; gap: 4px; min-width: 180px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        `;

        const items = [
            { label: '📄 Single-file HTML (inlined CSS)', format: 'html-single' },
            { label: '🌐 HTML + CSS', format: 'html' },
            { label: '⚛️ React JSX + CSS', format: 'react' },
            { label: '💚 Vue SFB (scoped)', format: 'vue' },
            { label: '🧩 Web Component (.js)', format: 'wc' },
        ];

        items.forEach((item) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = item.label;
            btn.style.cssText = `
                background: transparent; border: none; color: #e2e8f0;
                padding: 8px 12px; text-align: left; border-radius: 4px;
                cursor: pointer; font-size: 0.85rem;
            `;
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#334155';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'transparent';
            });
            btn.addEventListener('click', () => {
                doExport(item.format);
                dropdown.remove();
            });
            dropdown.appendChild(btn);
        });

        const rect = btnExport.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 4}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        document.body.appendChild(dropdown);

        const close = (ev) => {
            if (!dropdown.contains(ev.target) && ev.target !== btnExport) {
                dropdown.remove();
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 0);
    });
}

function doExport(format) {
    const canvasClone = getCanvasContent();
    const cssCode = buildExportCss(getActiveCssCode());

    if (format === 'html-single') {
        const html = buildSingleFileHtml(canvasClone.innerHTML, cssCode);
        downloadFile('index.html', html);
    } else if (format === 'html') {
        const html = buildExportHtml(canvasClone.innerHTML);
        downloadFile('index.html', html);
        downloadFile('style.css', cssCode);
    } else if (format === 'react') {
        const jsx = buildJsxExport(canvasClone);
        downloadFile('App.jsx', jsx);
        downloadFile('style.css', cssCode);
    } else if (format === 'vue') {
        const vue = buildVueExport(canvasClone, cssCode);
        downloadFile('App.vue', vue);
    } else if (format === 'wc') {
        const wc = exportAsWebComponent(canvasClone, getActiveCssCode());
        downloadFile('layout-craft-block.js', wc);
    }
}

export function cleanStyles(element) {
    element.classList.remove('selected-element');
    Array.from(element.children).forEach((child) => cleanStyles(child));
}

function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
