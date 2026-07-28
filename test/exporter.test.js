import { describe, it, expect } from 'vitest';
import { buildExportHtml, buildExportCss, cleanStyles } from '../src/js/modules/exporter.js';

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
});

describe('buildExportCss', () => {
    it('prepends the header and body reset before the given CSS code', () => {
        const result = buildExportCss('.foo { color: red; }');
        expect(result).toMatch(/LayoutCraft Visual CSS Builder/);
        expect(result).toMatch(/body \{ margin: 0; padding: 0; font-family: sans-serif; \}/);
        expect(result).toContain('.foo { color: red; }');
    });
});
