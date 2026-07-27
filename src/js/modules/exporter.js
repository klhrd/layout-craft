import { deselectAll } from './inspector.js';
import { getActiveCssCode } from '../app.js'; // Import the visual-CSS-compiled code.
import { t } from '../config/i18n.js';

const canvas = document.getElementById('canvas');
const btnPreview = document.getElementById('btn-preview');
const btnExport = document.getElementById('btn-export');

export function initExporter() {
    btnPreview.addEventListener('click', () => {
        deselectAll();
        document.body.classList.add('preview-mode');
        const exitBtn = document.createElement('button');
        exitBtn.id = 'btn-exit-preview';
        exitBtn.innerHTML = t('ui.backToEditor');
        document.body.appendChild(exitBtn);
        exitBtn.addEventListener('click', () => {
            document.body.classList.remove('preview-mode');
            exitBtn.remove();
        });
    });

    btnExport.addEventListener('click', () => {
        const canvasClone = canvas.cloneNode(true);
        const tempPlaceholder = canvasClone.querySelector('.canvas-placeholder');
        if (tempPlaceholder) tempPlaceholder.remove();

        function cleanStyles(element) {
            element.classList.remove('selected-element');
            Array.from(element.children).forEach(child => cleanStyles(child));
        }
        Array.from(canvasClone.children).forEach(child => cleanStyles(child));

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
        const finalCSS = `/* Generated via LayoutCraft Visual CSS Builder */\nbody { margin: 0; padding: 0; font-family: sans-serif; }\n\n` + getActiveCssCode();

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
