import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// These functions don't need DOM at module level, so static import is fine.
import { buildExportHtml, buildExportCss, buildSingleFileHtml, cleanStyles } from '../src/js/modules/exporter.js';

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
