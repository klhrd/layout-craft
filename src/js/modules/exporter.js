import { deselectAll } from './inspector.js';

const canvas = document.getElementById('canvas');
const btnPreview = document.getElementById('btn-preview');
const btnExport = document.getElementById('btn-export');

export function initExporter() {
    // 預覽模式
    btnPreview.addEventListener('click', () => {
        deselectAll();
        document.body.classList.add('preview-mode');

        const exitBtn = document.createElement('button');
        exitBtn.id = 'btn-exit-preview';
        exitBtn.innerHTML = '⬅️ Back to Editor';
        document.body.appendChild(exitBtn);

        exitBtn.addEventListener('click', () => {
            document.body.classList.remove('preview-mode');
            exitBtn.remove();
        });
    });

    // 匯出 Clean HTML/CSS
    btnExport.addEventListener('click', () => {
        const canvasClone = canvas.cloneNode(true);
        const tempPlaceholder = canvasClone.querySelector('.canvas-placeholder');
        if (tempPlaceholder) tempPlaceholder.remove();

        let cssRules = [];
        let classCounter = 1;

        function cleanAndExtractStyles(element) {
            element.classList.remove('selected-element');

            if (element.style.cssText) {
                let className = `el-${element.tagName.toLowerCase()}-${classCounter++}`;
                element.classList.add(className);
                cssRules.push(`.${className} {\n  ${element.style.cssText.replace(/;/g, ';\n  ')}\n}`);
                element.removeAttribute('style');
            }
            Array.from(element.children).forEach(child => cleanAndExtractStyles(child));
        }

        Array.from(canvasClone.children).forEach(child => cleanAndExtractStyles(child));

        const finalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LayoutCraft Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
${canvasClone.innerHTML.trim()}
</body>
</html>`;

        const finalCSS = `/* Generated via LayoutCraft Studio */\nbody { margin: 0; padding: 0; font-family: sans-serif; }\n\n` + cssRules.join('\n\n');

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