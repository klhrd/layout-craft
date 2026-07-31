import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These functions don't need DOM at module level, so static import is fine.
import {
    buildExportHtml,
    buildExportCss,
    buildSingleFileHtml,
    cleanStyles,
    extractDataImages,
    buildSiteZip,
} from '../src/js/modules/exporter.js';
import zlib from 'node:zlib';

const PNG_DATA_URI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

function findAscii(bytes, text) {
    const needle = new TextEncoder().encode(text);
    outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) {
            if (bytes[i + j] !== needle[j]) continue outer;
        }
        return i;
    }
    return -1;
}

describe('buildExportHtml', () => {
    it('wraps inner HTML in a full document template', () => {
        const result = buildExportHtml('<p>Hello</p>');
        expect(result).toContain('<!DOCTYPE html>');
        expect(result).toContain('<title>LayoutCraft Site</title>');
        expect(result).toContain('<p>Hello</p>');
        expect(result).toContain('<link rel="stylesheet" href="style.css">');
    });

    it('trims leading/trailing whitespace from inner HTML', () => {
        const result = buildExportHtml('  \n  <div>foo</div>  \n  ');
        expect(result).toMatch(/<div>foo<\/div>/);
    });

    it('includes the body wrapper tags', () => {
        const result = buildExportHtml('<span>content</span>');
        expect(result).toMatch(/<body>\n<span>content<\/span>\n<\/body>/);
    });
});

describe('cleanStyles', () => {
    it('removes selected-element class from the element', () => {
        const el = document.createElement('div');
        el.classList.add('selected-element', 'keep-me');
        cleanStyles(el);
        expect(el.classList.contains('selected-element')).toBe(false);
        expect(el.classList.contains('keep-me')).toBe(true);
    });

    it('recursively removes selected-element from children', () => {
        const parent = document.createElement('div');
        parent.classList.add('selected-element');
        const child = document.createElement('span');
        child.classList.add('selected-element');
        parent.appendChild(child);

        cleanStyles(parent);

        expect(parent.classList.contains('selected-element')).toBe(false);
        expect(child.classList.contains('selected-element')).toBe(false);
    });

    it('does not throw on an element with no children', () => {
        const el = document.createElement('br');
        expect(() => cleanStyles(el)).not.toThrow();
    });
});

describe('buildSingleFileHtml', () => {
    it('inlines CSS in a <style> block and omits the stylesheet link', () => {
        const result = buildSingleFileHtml('<p>Hi</p>', '.p { color: red; }');
        expect(result).toContain('<style>');
        expect(result).toContain('.p { color: red; }');
        expect(result).not.toContain('style.css');
    });
});

describe('buildExportCss', () => {
    it('prepends the header and body reset before the given CSS code', () => {
        const result = buildExportCss('.foo { color: red; }');
        expect(result).toMatch(/LayoutCraft Visual CSS Builder/);
        expect(result).toMatch(/body \{ margin: 0; padding: 0; font-family: sans-serif; \}/);
        expect(result).toContain('.foo { color: red; }');
    });

    it('handles empty CSS string', () => {
        const result = buildExportCss('');
        expect(result).toContain('body { margin: 0;');
        expect(result).toContain('Generated via LayoutCraft');
    });
});

describe('extractDataImages', () => {
    it('extracts data:image URIs into assets with proper extension', () => {
        const { html, assets } = extractDataImages(`<img src="${PNG_DATA_URI}">`);
        expect(html).toBe('<img src="./assets/img-1.png">');
        expect(assets).toHaveLength(1);
        expect(assets[0].name).toBe('assets/img-1.png');
        expect(assets[0].data[0]).toBe(0x89);
        expect(assets[0].data[1]).toBe(0x50);
        expect(assets[0].data[2]).toBe(0x4e);
        expect(assets[0].data[3]).toBe(0x47);
    });

    it('numbers multiple images sequentially', () => {
        const { html, assets } = extractDataImages(`<img src="${PNG_DATA_URI}"><img src="${PNG_DATA_URI}">`);
        expect(html).toContain('img-1.png');
        expect(html).toContain('img-2.png');
        expect(assets).toHaveLength(2);
    });

    it('leaves non-data src attributes untouched', () => {
        const { html, assets } = extractDataImages('<img src="https://example.com/logo.png">');
        expect(html).toContain('https://example.com/logo.png');
        expect(assets).toHaveLength(0);
    });

    it('handles svg mime type', () => {
        const svgUri = 'data:image/svg+xml;base64,PHN2Zy8+';
        const { html, assets } = extractDataImages(`<img src="${svgUri}">`);
        expect(html).toContain('assets/img-1.svg');
        expect(assets[0].name).toBe('assets/img-1.svg');
    });
});

describe('buildSiteZip', () => {
    it('bundles index.html, style.css and extracted assets into a zip', async () => {
        const bytes = await buildSiteZip(`<h1>Hi</h1><img src="${PNG_DATA_URI}">`, '.h1 { color: red; }');
        expect(findAscii(bytes, 'index.html')).toBeGreaterThanOrEqual(0);
        expect(findAscii(bytes, 'style.css')).toBeGreaterThanOrEqual(0);
        expect(findAscii(bytes, 'assets/img-1.png')).toBeGreaterThanOrEqual(0);

        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        expect(view.getUint32(0, true)).toBe(0x04034b50);
        const nameLen = view.getUint16(26, true);
        const method = view.getUint16(8, true);
        const compSize = view.getUint32(18, true);
        const payload = bytes.subarray(30 + nameLen, 30 + nameLen + compSize);
        const decoded = method === 8 ? zlib.inflateRawSync(payload) : payload;
        const htmlText = new TextDecoder().decode(decoded);
        expect(htmlText).toContain('<h1>Hi</h1>');
        expect(htmlText).toContain('href="style.css"');
    });

    it('works with no images (no assets folder needed)', async () => {
        const bytes = await buildSiteZip('<p>Plain</p>', '.p {}');
        expect(findAscii(bytes, 'index.html')).toBeGreaterThanOrEqual(0);
        expect(findAscii(bytes, 'style.css')).toBeGreaterThanOrEqual(0);
        expect(findAscii(bytes, 'assets/')).toBe(-1);
    });
});

describe('preview mode', () => {
    let exporter;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = `
            <div id="canvas"></div>
            <button id="btn-preview"></button>
            <button id="btn-export"></button>
            <div id="live-styles"></div>
            <div id="editor-form"></div>
            <div id="no-selection-msg" class="hidden"></div>
            <div id="select-project"><option>Test</option></div>
        `;
        vi.clearAllMocks();
        exporter = await import('../src/js/modules/exporter.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('initExporter sets up preview button click listener toggles preview-mode body class', () => {
        exporter.initExporter();
        document.getElementById('btn-preview').click();
        expect(document.body.classList.contains('preview-mode')).toBe(true);
    });

    it('exiting preview removes toolbar and exit button', () => {
        exporter.initExporter();
        document.getElementById('btn-preview').click();

        const exitBtn = document.getElementById('btn-exit-preview');
        expect(exitBtn).not.toBeNull();

        exitBtn.click();
        expect(document.body.classList.contains('preview-mode')).toBe(false);
        expect(document.getElementById('btn-exit-preview')).toBeNull();
    });
});

describe('downloadFile helper', () => {
    it('buildExportHtml produces a downloadable HTML string', () => {
        const html = buildExportHtml('<p>test</p>');
        expect(html).toContain('<p>test</p>');
        expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    });

    it('buildExportCss produces a downloadable CSS string', () => {
        const css = buildExportCss('.x { color: blue; }');
        expect(css).toContain('.x { color: blue; }');
        expect(css).toContain('/* Generated via LayoutCraft');
    });
});
