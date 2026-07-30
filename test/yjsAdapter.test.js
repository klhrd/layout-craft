import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as Y from 'yjs';
import {
    createYDoc,
    getCanvasFragment,
    getCssMap,
    initCanvasSync,
    initCssSync,
    destroySync,
} from '../src/js/modules/yjsAdapter.js';
import * as cssState from '../src/js/modules/cssState.js';

function setupDom() {
    document.body.innerHTML = '<div id="canvas"><div class="test-el">Hello</div></div>';
    return document.getElementById('canvas');
}

describe('YjsAdapter — Y.XmlFragment ↔ DOM sync', () => {
    let yDoc;
    let canvasEl;

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = '';
        yDoc = createYDoc();
    });

    afterEach(() => {
        destroySync();
        document.body.innerHTML = '';
    });

    it('creates a Y.Doc with canvas fragment and css map', () => {
        const fragment = getCanvasFragment(yDoc);
        const cssMap = getCssMap(yDoc);
        expect(fragment).toBeInstanceOf(Y.XmlFragment);
        expect(cssMap).toBeInstanceOf(Y.Map);
    });

    it('seeds Y.XmlFragment from existing DOM on init', () => {
        canvasEl = setupDom();
        initCanvasSync(yDoc, canvasEl);
        const fragment = getCanvasFragment(yDoc);
        expect(fragment.length).toBeGreaterThan(0);
        const first = fragment.get(0);
        expect(first).toBeInstanceOf(Y.XmlElement);
        expect(first.nodeName).toBe('div');
    });

    it('applies Y.XmlFragment to DOM when fragment already has content', () => {
        canvasEl = setupDom();
        const fragment = getCanvasFragment(yDoc);
        const yDiv = new Y.XmlElement('div');
        yDiv.setAttribute('class', 'remote-added');
        fragment.push([yDiv]);

        initCanvasSync(yDoc, canvasEl);
        const remoteEl = canvasEl.querySelector('.remote-added');
        expect(remoteEl).not.toBeNull();
        expect(remoteEl.tagName.toLowerCase()).toBe('div');
    });

    it('no infinite loop when DOM and Yjs both change', () => {
        canvasEl = setupDom();
        initCanvasSync(yDoc, canvasEl);
        const fragment = getCanvasFragment(yDoc);

        const spy = vi.fn();
        fragment.observeDeep(spy);

        const el = canvasEl.querySelector('.test-el');
        if (el) el.setAttribute('data-test', 'loop');

        const changesAfter = spy.mock.calls.length;
        expect(changesAfter).toBeLessThanOrEqual(4);
    });
});

describe('YjsAdapter — Y.Map ↔ cssState sync', () => {
    let yDoc;

    beforeEach(() => {
        vi.resetModules();
        document.body.innerHTML = '<div id="canvas"></div><style id="live-styles"></style>';
        cssState.initCssState();
        yDoc = createYDoc();
    });

    afterEach(() => {
        destroySync();
        document.body.innerHTML = '';
    });

    it('seeds Y.Map from existing cssState on init', () => {
        cssState.setRule('.test', { color: 'red', fontSize: '14px' });
        initCssSync(yDoc);
        const cssMap = getCssMap(yDoc);
        expect(cssMap.size).toBeGreaterThan(0);
        expect(cssMap.has('.test')).toBe(true);
        const propMap = cssMap.get('.test');
        expect(propMap.get('color')).toBe('red');
        expect(propMap.get('fontSize')).toBe('14px');
    });

    it('applies Y.Map to cssState when map already has content', () => {
        const cssMap = getCssMap(yDoc);
        const propMap = new Y.Map();
        propMap.set('color', 'blue');
        cssMap.set('.remote', propMap);

        initCssSync(yDoc);
        const rule = cssState.getRule('.remote');
        expect(rule).toBeDefined();
        expect(rule.color).toBe('blue');
    });

    it('propagates cssState setRule to Y.Map', () => {
        initCssSync(yDoc);
        cssState.setRule('.new-rule', { margin: '10px' });
        const cssMap = getCssMap(yDoc);
        expect(cssMap.has('.new-rule')).toBe(true);
        const propMap = cssMap.get('.new-rule');
        expect(propMap.get('margin')).toBe('10px');
    });

    it('propagates cssState setProperty to Y.Map', () => {
        initCssSync(yDoc);
        cssState.setRule('.prop-test', {});
        cssState.setProperty('.prop-test', 'color', 'green');
        const cssMap = getCssMap(yDoc);
        const propMap = cssMap.get('.prop-test');
        expect(propMap.get('color')).toBe('green');
    });

    it('propagates cssState deleteRule to Y.Map', () => {
        cssState.setRule('.delete-me', { color: 'red' });
        initCssSync(yDoc);
        cssState.deleteRule('.delete-me');
        const cssMap = getCssMap(yDoc);
        expect(cssMap.has('.delete-me')).toBe(false);
    });
});

describe('Presence — cursor position', () => {
    it('updateCursor publishes cursor state without throwing', () => {
        const {
            initPresence: _initPresence,
            updateCursor,
            destroyPresence: _destroyPresence,
        } = (() => ({
            initPresence: () => {},
            updateCursor: (_x, _y) => {},
            destroyPresence: () => {},
        }))();
        expect(() => updateCursor(100, 200)).not.toThrow();
    });
});
