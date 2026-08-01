import { deselectAll } from './inspector.js';
import { getActiveCssCode } from './cssEditor.js';
import { cancelActiveInlineEdit } from './canvas.js';
import { t } from '../config/i18n.js';
import { DEVICES } from '../config/devices.js';
import { getExportTargets, registerExportTarget } from './exportRegistry.js';

// Pure HTML/CSS builders live in codegen/htmlExport.js — the documented
// export contract (see docs/export-plugin.md). Re-exported here for
// backwards compatibility with existing imports/tests.
export {
    buildExportHtml,
    buildSingleFileHtml,
    buildExportCss,
    cleanStyles,
    extractDataImages,
    buildSiteZip,
} from './codegen/htmlExport.js';

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
    window.registerExportTarget = registerExportTarget;

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

        const targets = getExportTargets();

        targets.forEach((target) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = target.label;
            btn.dataset.target = target.id;
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
                doExport(target);
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

function doExport(target) {
    const canvasClone = getCanvasContent();
    const rawCssCode = getActiveCssCode();
    const cssCode = buildExportCss(rawCssCode);
    const ctx = { innerHtml: canvasClone.innerHTML, cssCode, rawCssCode, canvasClone };
    Promise.resolve(target.generate(ctx)).then((result) => {
        for (const file of result.files) {
            if (file.data instanceof Uint8Array) {
                downloadBytes(
                    file.name,
                    file.data,
                    file.name.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
                );
            } else {
                downloadFile(file.name, file.data);
            }
        }
    });
}

// Public plugin hook: third-party export targets register here
// (contract: docs/export-plugin.md). Also exposed as
// window.registerExportTarget by initExporter().
export function registerTarget(target) {
    return registerExportTarget(target);
}

function downloadBytes(filename, bytes, mime) {
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
