import { makeZip } from '../zipWriter.js';

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

export function cleanStyles(element) {
    element.classList.remove('selected-element');
    Array.from(element.children).forEach((child) => cleanStyles(child));
}

const MIME_EXT = {
    png: 'png',
    jpeg: 'jpg',
    jpg: 'jpg',
    gif: 'gif',
    webp: 'webp',
    'svg+xml': 'svg',
};

export function extractDataImages(html) {
    const assets = [];
    let counter = 0;
    const rewritten = html.replace(
        /src="(data:image\/([a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+))"/g,
        (match, uri, mime, b64) => {
            counter++;
            const ext = MIME_EXT[mime] || 'bin';
            const filename = `assets/img-${counter}.${ext}`;
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            assets.push({ name: filename, data: bytes });
            return `src="./${filename}"`;
        },
    );
    return { html: rewritten, assets };
}

export async function buildSiteZip(innerHtml, cssCode) {
    const { html, assets } = extractDataImages(innerHtml);
    const files = [
        { name: 'index.html', data: buildExportHtml(html) },
        { name: 'style.css', data: buildExportCss(cssCode) },
        ...assets,
    ];
    return makeZip(files);
}
