import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Build a minimal localStorage replacement since Vitest 3 + jsdom/happy-dom
// on Node 26 do not expose a `localStorage` global to test code. We install it
// onto `window` (jsdom) and `globalThis` so storage.js — which uses the bare
// `localStorage` global — behaves like a browser.
class MemoryStorage {
    constructor() {
        this._data = new Map();
    }
    getItem(key) {
        return this._data.has(key) ? this._data.get(key) : null;
    }
    setItem(key, value) {
        this._data.set(key, String(value));
    }
    removeItem(key) {
        this._data.delete(key);
    }
    clear() {
        this._data.clear();
    }
    key(index) {
        return Array.from(this._data.keys())[index] ?? null;
    }
    get length() {
        return this._data.size;
    }
}

const install = () => {
    const store = new MemoryStorage();
    Object.defineProperty(globalThis, 'localStorage', {
        value: store,
        configurable: true,
        writable: true,
    });
    if (typeof window !== 'undefined') {
        Object.defineProperty(window, 'localStorage', {
            value: store,
            configurable: true,
            writable: true,
        });
    }
};

const reset = () => {
    delete globalThis.localStorage;
    if (typeof window !== 'undefined') {
        try {
            delete window.localStorage;
        } catch {
            // window.localStorage may be non-configurable; ignore.
        }
    }
};

const mod = await import('../src/js/config/i18n.js');
const t = mod.t;

describe('utils: MemoryStorage harness (used by storage tests)', () => {
    beforeEach(() => install());
    afterEach(() => reset());

    it('gets/sets/clears like the real localStorage', () => {
        expect(localStorage.length).toBe(0);
        localStorage.setItem('k', 'v');
        expect(localStorage.getItem('k')).toBe('v');
        expect(localStorage.key(0)).toBe('k');
        expect(localStorage.length).toBe(1);
        localStorage.removeItem('k');
        expect(localStorage.getItem('k')).toBeNull();
        localStorage.setItem('a', '1');
        localStorage.clear();
        expect(localStorage.length).toBe(0);
    });
});

export { install, reset, t };
