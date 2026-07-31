import { describe, it, expect, beforeEach } from 'vitest';
import {
    initCssState,
    setRule,
    getRule,
    deleteRule,
    getAllRules,
    getBlocks,
    addBlock,
    removeBlock,
    getBlock,
    hasNestedRule,
    setNestedProperty,
    getNestedProperty,
    serialize,
    deserialize,
    getTokens,
    setTokens,
    setToken,
    deleteToken,
    replaceTokenRef,
    getProperty,
} from '../src/js/modules/cssState.js';

beforeEach(() => {
    initCssState();
});

describe('flat API (backward compat)', () => {
    it('setRule/getRule roundtrip', () => {
        setRule('.foo', { color: 'red' });
        expect(getRule('.foo')).toEqual({ color: 'red' });
    });

    it('deleteRule removes the rule', () => {
        setRule('.foo', { color: 'red' });
        deleteRule('.foo');
        expect(getRule('.foo')).toBeUndefined();
    });

    it('getAllRules returns top-level rules as [selector, styles] entries', () => {
        setRule('.a', { x: '1' });
        setRule('.b', { y: '2' });
        const entries = getAllRules();
        expect(entries).toHaveLength(2);
        expect(entries[0]).toEqual(['.a', { x: '1' }]);
    });
});

describe('tree API', () => {
    it('addBlock without parentSelector appends at top level', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        const blocks = getBlocks();
        expect(blocks).toHaveLength(1);
        expect(blocks[0].type).toBe('media');
    });

    it('addBlock with parentSelector adds nested child', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        addBlock({ type: 'rule', selector: '.card', styles: {} }, '@media (max-width: 600px)');
        const parent = getBlock('@media (max-width: 600px)');
        expect(parent.children).toHaveLength(1);
        expect(parent.children[0].selector).toBe('.card');
    });

    it('removeBlock removes by selector from top level', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        removeBlock('@media (max-width: 600px)');
        expect(getBlocks()).toHaveLength(0);
    });

    it('removeBlock with parentSelector removes nested child', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        addBlock({ type: 'rule', selector: '.card', styles: {} }, '@media (max-width: 600px)');
        removeBlock('.card', '@media (max-width: 600px)');
        const parent = getBlock('@media (max-width: 600px)');
        expect(parent.children).toHaveLength(0);
    });
});

describe('nested property access', () => {
    it('setNestedProperty/getNestedProperty roundtrip', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        setNestedProperty('@media (max-width: 600px)', '.card', 'color', 'blue');
        expect(getNestedProperty('@media (max-width: 600px)', '.card', 'color')).toBe('blue');
    });

    it('hasNestedRule returns true/false', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        expect(hasNestedRule('.card', '@media (max-width: 600px)')).toBe(false);
        setNestedProperty('@media (max-width: 600px)', '.card', 'color', 'blue');
        expect(hasNestedRule('.card', '@media (max-width: 600px)')).toBe(true);
    });
});

describe('serialization', () => {
    it('serialize/deserialize roundtrip preserves tree structure', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        setNestedProperty('@media (max-width: 600px)', '.card', 'color', 'red');
        const data = serialize();
        expect(Array.isArray(data)).toBe(true);
        expect(data[0].type).toBe('media');
        expect(data[0].children[0].styles.color).toBe('red');

        initCssState();
        deserialize(data);
        const restored = getBlocks();
        expect(restored).toHaveLength(1);
        expect(restored[0].children[0].styles.color).toBe('red');
    });

    it('deserialize upgrades old flat format', () => {
        const oldData = { '.foo': { color: 'red' }, '.bar': { margin: '0' } };
        deserialize(oldData);
        const blocks = getBlocks();
        expect(blocks).toHaveLength(2);
        expect(blocks[0].type).toBe('rule');
        expect(blocks[0].selector).toBe('.foo');
        expect(blocks[0].styles.color).toBe('red');
    });
});

describe('design tokens', () => {
    it('setToken/getTokens roundtrip', () => {
        setToken('--color-primary', '#2563eb');
        setToken('--space', '16px');
        expect(getTokens()).toEqual({ '--color-primary': '#2563eb', '--space': '16px' });
    });

    it('setToken ignores names that do not start with --', () => {
        setToken('color-primary', '#2563eb');
        expect(getTokens()).toEqual({});
    });

    it('setToken overwrites existing token', () => {
        setToken('--color-primary', '#2563eb');
        setToken('--color-primary', '#111111');
        expect(getTokens()['--color-primary']).toBe('#111111');
    });

    it('deleteToken removes the token', () => {
        setToken('--color-primary', '#2563eb');
        deleteToken('--color-primary');
        expect(getTokens()).toEqual({});
    });

    it('setTokens replaces all tokens and tolerates empty input', () => {
        setToken('--a', '1');
        setTokens({ '--x': '2', '--y': '3' });
        expect(getTokens()).toEqual({ '--x': '2', '--y': '3' });
        setTokens();
        expect(getTokens()).toEqual({});
    });

    it('initCssState clears tokens', () => {
        setToken('--color-primary', '#2563eb');
        initCssState();
        expect(getTokens()).toEqual({});
    });
});

describe('replaceTokenRef', () => {
    it('rewrites var() references in top-level rules', () => {
        setRule('.a', { color: 'var(--old-name)', fontSize: '16px' });
        replaceTokenRef('--old-name', '--new-name');
        expect(getProperty('.a', 'color')).toBe('var(--new-name)');
        expect(getProperty('.a', 'fontSize')).toBe('16px');
    });

    it('rewrites multiple occurrences inside one value', () => {
        setRule('.a', { background: 'linear-gradient(var(--c), var(--c) 50%, #fff)' });
        replaceTokenRef('--c', '--brand');
        expect(getProperty('.a', 'background')).toBe('linear-gradient(var(--brand), var(--brand) 50%, #fff)');
    });

    it('rewrites references in nested rules (media query children)', () => {
        addBlock({ type: 'media', selector: '@media (max-width: 600px)', children: [] });
        setNestedProperty('@media (max-width: 600px)', '.card', 'color', 'var(--c)');
        replaceTokenRef('--c', '--brand');
        expect(getNestedProperty('@media (max-width: 600px)', '.card', 'color')).toBe('var(--brand)');
    });

    it('leaves other token references untouched', () => {
        setRule('.a', { color: 'var(--keep)' });
        replaceTokenRef('--gone', '--brand');
        expect(getProperty('.a', 'color')).toBe('var(--keep)');
    });
});
