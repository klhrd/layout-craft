import { describe, it, expect, beforeEach } from 'vitest';
import { importFromPaste } from '../src/js/modules/importer.js';

beforeEach(() => {
    globalThis.Sortable = class {
        constructor() {}
        destroy() {}
    };
});

beforeEach(() => {
    const existing = document.getElementById('canvas');
    if (existing) existing.remove();

    const c = document.createElement('div');
    c.id = 'canvas';
    document.body.appendChild(c);
});

describe('importFromPaste', () => {
    it('parses basic HTML and strips script tags', () => {
        importFromPaste('<div class="hero"><h1>Hello</h1><script>alert(1)</script></div>', '');

        const canvas = document.getElementById('canvas');
        expect(canvas.innerHTML).not.toContain('<script>');
        expect(canvas.innerHTML).toContain('Hello');
    });

    it('removes on* attributes from imported nodes', () => {
        importFromPaste('<button onclick="alert(1)">Click</button>', '');
        const canvas = document.getElementById('canvas');
        expect(canvas.innerHTML).not.toContain('onclick');
        expect(canvas.innerHTML).toContain('Click');
    });
});
