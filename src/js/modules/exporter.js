import { deselectAll } from './inspector.js';
import { getActiveCssCode } from '../app.js';
import { cancelActiveInlineEdit } from './canvas.js';
import { t } from '../config/i18n.js';

const canvas = document.getElementById('canvas');
const btnPreview = document.getElementById('btn-preview');
const btnExport = document.getElementById('btn-export');

const DEVICES = [
    { label: 'Desktop', width: null, icon: '🖥️' },
    { label: 'Tablet', width: 768, icon: '📱' },
    { label: 'Mobile', width: 375, icon: '📲' },
];

let activeDeviceIdx = 0;

export function initExporter() {
    btnPreview.addEventListener('click', () => {
        cancelActiveInlineEdit();
        deselectAll();
        document.body.classList.add('preview-mode');
        activeDeviceIdx = 0;

        // Device toolbar at the top of the canvas area
        const toolbar = document.createElement('div');
        toolbar.id = 'preview-toolbar';
        DEVICES.forEach((d, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'preview-device-btn' + (i === 0 ? ' active' : '');
            btn.textContent = `${d.icon} ${d.label}`;
            btn.addEventListener('click', () => {
                toolbar.querySelectorAll('.preview-device-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                activeDeviceIdx = i;
                applyDeviceFrame();
            });
            toolbar.appendChild(btn);
        });

        // Width indicator
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

        // Update width label on resize
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

    btnExport.addEventListener('click', () => {
        const canvasClone = canvas.cloneNode(true);
        const tempPlaceholder = canvasClone.querySelector('.canvas-placeholder');
        if (tempPlaceholder) tempPlaceholder.remove();

        function cleanStyles(element) {
            element.classList.remove('selected-element');
            Array.from(element.children).forEach((child) => cleanStyles(child));
        }
        Array.from(canvasClone.children).forEach((child) => cleanStyles(child));

        const finalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LayoutCraft Site</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${canvasClone.innerHTML.trim()}
</body>
</html>`;

        // Use the CSS code compiled by the visual block builder for the export.
        const finalCSS =
            `/* Generated via LayoutCraft Visual CSS Builder */\nbody { margin: 0; padding: 0; font-family: sans-serif; }\n\n` +
            getActiveCssCode();

        downloadFile('index.html', finalHTML);
        downloadFile('style.css', finalCSS);
    });
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
