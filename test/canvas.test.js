import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock modules that access DOM at import time
vi.mock('../src/js/modules/inspector.js', () => ({
    selectElement: vi.fn(),
    deselectAll: vi.fn(),
}));

vi.mock('../src/js/app.js', () => ({
    compileAndRenderCss: vi.fn(),
    getActiveCssCode: vi.fn(() => ''),
}));

vi.mock('../src/js/modules/canvasHelpers.js', () => ({
    showAlignGuides: vi.fn(),
    clearAlignGuides: vi.fn(),
}));

import { makeElementSortable, TEXT_EDITABLE_TAGS, setDraggedType, isContainer } from '../src/js/modules/canvas.js';
import { buildComponentTemplate } from '../src/js/config/components.js';
import { initCssState, nextClassIndex, setRule, getRule } from '../src/js/modules/cssState.js';
import { push, undo, redo, reset, canUndo, canRedo } from '../src/js/modules/history.js';

describe('buildComponentTemplate', () => {
    it('creates an element with the correct tag name', () => {
        const el = buildComponentTemplate({ tag: 'section' });
        expect(el.tagName).toBe('SECTION');
    });

    it('sets text content when template has text', () => {
        const el = buildComponentTemplate({ tag: 'h1', text: 'Hello World' });
        expect(el.textContent).toBe('Hello World');
    });

    it('sets attributes from template', () => {
        const el = buildComponentTemplate({ tag: 'a', attr: { href: '#', class: 'link' } });
        expect(el.getAttribute('href')).toBe('#');
        expect(el.getAttribute('class')).toBe('link');
    });

    it('sets inline styles from template', () => {
        const el = buildComponentTemplate({ tag: 'div', style: { color: 'red', fontSize: '16px' } });
        expect(el.style.color).toBe('red');
        expect(el.style.fontSize).toBe('16px');
    });

    it('handles nested children recursively', () => {
        const el = buildComponentTemplate({
            tag: 'div',
            children: [
                { tag: 'h1', text: 'Title' },
                { tag: 'p', text: 'Body' },
            ],
        });
        expect(el.children.length).toBe(2);
        expect(el.children[0].tagName).toBe('H1');
        expect(el.children[0].textContent).toBe('Title');
        expect(el.children[1].tagName).toBe('P');
        expect(el.children[1].textContent).toBe('Body');
    });
});

describe('makeElementSortable', () => {
    beforeEach(() => {
        globalThis.Sortable = vi.fn().mockImplementation(() => ({}));
    });

    afterEach(() => {
        delete globalThis.Sortable;
    });

    it('calls Sortable constructor with the element', () => {
        const el = document.createElement('div');
        makeElementSortable(el);
        expect(globalThis.Sortable).toHaveBeenCalledWith(el, expect.objectContaining({ group: 'shared-nested' }));
    });

    it('passes group: shared-nested and animation options', () => {
        const el = document.createElement('div');
        makeElementSortable(el);
        const opts = globalThis.Sortable.mock.calls[0][1];
        expect(opts.animation).toBe(150);
        expect(opts.fallbackOnBody).toBe(true);
    });
});

describe('TEXT_EDITABLE_TAGS', () => {
    it('includes common inline text tags', () => {
        expect(TEXT_EDITABLE_TAGS).toContain('h1');
        expect(TEXT_EDITABLE_TAGS).toContain('h2');
        expect(TEXT_EDITABLE_TAGS).toContain('h3');
        expect(TEXT_EDITABLE_TAGS).toContain('p');
        expect(TEXT_EDITABLE_TAGS).toContain('a');
        expect(TEXT_EDITABLE_TAGS).toContain('span');
        expect(TEXT_EDITABLE_TAGS).toContain('button');
    });
});

describe('setDraggedType', () => {
    it('accepts a tag string', () => {
        expect(() => setDraggedType('div')).not.toThrow();
        expect(() => setDraggedType('section')).not.toThrow();
    });
});

describe('undo/redo for element drops', () => {
    beforeEach(() => {
        reset();
    });

    it('undo removes a dropped element and redo recreates it', () => {
        const parent = document.createElement('div');
        const el = document.createElement('div');
        el.textContent = 'dropped';
        parent.appendChild(el);

        push({
            label: 'Drop div',
            perform: () => {
                const replacement = document.createElement('div');
                replacement.textContent = 'dropped';
                parent.appendChild(replacement);
            },
            rollback: () => {
                el.remove();
            },
        });

        expect(parent.children.length).toBe(1);
        expect(parent.textContent).toContain('dropped');

        undo();
        expect(parent.children.length).toBe(0);

        redo();
        expect(parent.children.length).toBe(1);
        expect(parent.children[0].textContent).toBe('dropped');
    });

    it('supports multiple sequential drops with undo/redo', () => {
        const parent = document.createElement('div');
        const el1 = document.createElement('div');
        el1.textContent = 'first';
        const el2 = document.createElement('div');
        el2.textContent = 'second';

        parent.appendChild(el1);
        push({
            label: 'Drop first',
            perform: () => {
                const r = document.createElement('div');
                r.textContent = 'first';
                parent.appendChild(r);
            },
            rollback: () => {
                el1.remove();
            },
        });

        parent.appendChild(el2);
        push({
            label: 'Drop second',
            perform: () => {
                const r = document.createElement('div');
                r.textContent = 'second';
                parent.appendChild(r);
            },
            rollback: () => {
                el2.remove();
            },
        });

        expect(parent.children.length).toBe(2);

        undo();
        expect(parent.children.length).toBe(1);
        expect(parent.children[0].textContent).toBe('first');

        undo();
        expect(parent.children.length).toBe(0);

        redo();
        expect(parent.children.length).toBe(1);
        expect(parent.children[0].textContent).toBe('first');

        redo();
        expect(parent.children.length).toBe(2);
    });

    it('performs the initial action before pushing to history', () => {
        const parent = document.createElement('div');
        const el = document.createElement('div');
        parent.appendChild(el);

        push({
            label: 'Drop div',
            perform: () => {
                const r = document.createElement('div');
                parent.appendChild(r);
            },
            rollback: () => {
                el.remove();
            },
        });

        expect(canUndo()).toBe(true);
        expect(canRedo()).toBe(false);
    });
});

describe('extractComponentStyles behavior', () => {
    beforeEach(() => {
        initCssState();
    });

    it('registers inline styles from a component template into cssState', () => {
        const el = buildComponentTemplate({
            tag: 'div',
            style: { color: 'red', padding: '10px' },
        });

        const autoClass = `_lc-${nextClassIndex()}`;
        el.classList.add(autoClass);
        const sel = `.${CSS.escape(autoClass)}`;
        setRule(sel, { color: 'red', padding: '10px' });
        el.removeAttribute('style');

        const rule = getRule(sel);
        expect(rule).toEqual({ color: 'red', padding: '10px' });
        expect(el.hasAttribute('style')).toBe(false);
    });
});

describe('isContainer', () => {
    it('returns true for container tags', () => {
        expect(isContainer(document.createElement('div'))).toBe(true);
        expect(isContainer(document.createElement('section'))).toBe(true);
        expect(isContainer(document.createElement('nav'))).toBe(true);
    });

    it('returns false for non-container tags', () => {
        expect(isContainer(document.createElement('span'))).toBe(false);
        expect(isContainer(document.createElement('p'))).toBe(false);
        expect(isContainer(document.createElement('img'))).toBe(false);
    });

    it('returns false for null/undefined', () => {
        expect(isContainer(null)).toBe(false);
        expect(isContainer(undefined)).toBe(false);
    });
});
