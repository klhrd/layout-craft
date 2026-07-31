import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { install, reset } from './_localStorageHarness.js';
import { TEMPLATES } from '../src/js/config/templates.js';
import { instantiateTemplate } from '../src/js/modules/templateLoader.js';

beforeEach(() => {
    install();

    globalThis.Sortable = class {
        constructor() {}
        destroy() {}
    };

    const existing = document.getElementById('canvas');
    if (existing) existing.remove();

    const c = document.createElement('div');
    c.id = 'canvas';
    document.body.appendChild(c);

    const select = document.createElement('select');
    select.id = 'select-project';
    document.body.appendChild(select);

    const liveStyles = document.createElement('style');
    liveStyles.id = 'live-styles';
    document.body.appendChild(liveStyles);

    window.rebuildCssRulesUI = () => {};
    window.refreshLayers = () => {};
    window.saveProject = () => {};
});

afterEach(() => {
    reset();
    delete window.rebuildCssRulesUI;
    delete window.refreshLayers;
    delete window.saveProject;
});

describe('TEMPLATES data structure', () => {
    it('exports an array of 22 templates', () => {
        expect(Array.isArray(TEMPLATES)).toBe(true);
        expect(TEMPLATES.length).toBe(22);
    });

    it.each(TEMPLATES)('$id has required fields', (tmpl) => {
        expect(tmpl).toHaveProperty('id');
        expect(tmpl).toHaveProperty('title');
        expect(tmpl).toHaveProperty('category');
        expect(tmpl).toHaveProperty('tags');
        expect(tmpl).toHaveProperty('html');
        expect(tmpl).toHaveProperty('cssData');
        expect(typeof tmpl.id).toBe('string');
        expect(typeof tmpl.title).toBe('string');
        expect(typeof tmpl.category).toBe('string');
        expect(Array.isArray(tmpl.tags)).toBe(true);
        expect(typeof tmpl.html).toBe('string');
        expect(typeof tmpl.cssData).toBe('object');
    });

    it('every template html contains at least one HTML tag', () => {
        TEMPLATES.forEach((tmpl) => {
            expect(tmpl.html.trim()).toMatch(/^<[a-z]/i);
        });
    });

    it('every template cssData is non-empty', () => {
        TEMPLATES.forEach((tmpl) => {
            expect(Object.keys(tmpl.cssData).length).toBeGreaterThan(0);
        });
    });
});

describe('instantiateTemplate', () => {
    it('populates canvas innerHTML with replace mode', () => {
        const tmpl = TEMPLATES.find((t) => t.id === 'hero-centered');
        instantiateTemplate(tmpl, 'replace');
        const canvas = document.getElementById('canvas');
        expect(canvas.innerHTML.length).toBeGreaterThan(0);
        expect(canvas.innerHTML).toContain('tmpl-hero');
    });

    it('appends content with append mode', () => {
        const canvas = document.getElementById('canvas');
        canvas.innerHTML = '<div class="existing">hello</div>';

        const tmpl = TEMPLATES.find((t) => t.id === 'navbar');
        instantiateTemplate(tmpl, 'append');

        expect(canvas.innerHTML).toContain('existing');
        expect(canvas.innerHTML).toContain('tmpl-navbar');
    });

    it('returns true on successful instantiation', () => {
        const tmpl = TEMPLATES.find((t) => t.id === 'hero-centered');
        const result = instantiateTemplate(tmpl, 'replace');
        expect(result).toBe(true);
    });

    it('seeds project tokens on replace mode when the template has tokens', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--old', 'x');

        const tmpl = TEMPLATES.find((t) => t.id === 'navbar');
        instantiateTemplate(tmpl, 'replace');
        expect(cssState.getTokens()['--color-primary']).toBe('#2563eb');
        expect(cssState.getTokens()['--old']).toBeUndefined();
    });

    it('merges template tokens into existing ones on append mode', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--keep', 'mine');

        const tmpl = TEMPLATES.find((t) => t.id === 'signup-form');
        instantiateTemplate(tmpl, 'append');
        const tokens = cssState.getTokens();
        expect(tokens['--keep']).toBe('mine');
        expect(tokens['--color-primary']).toBe('#2563eb');
    });

    it('templates without tokens leave the token store untouched', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--keep', 'mine');

        const tmpl = TEMPLATES.find((t) => t.id === 'hero-centered');
        instantiateTemplate(tmpl, 'replace');
        expect(cssState.getTokens()).toEqual({ '--keep': 'mine' });
    });
});
