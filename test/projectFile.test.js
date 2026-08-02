import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { install, reset } from './_localStorageHarness.js';

let mod;
let buildProjectFile;
let validateProjectFile;
let serializeProjectFile;
let migrateProjectFile;

beforeEach(async () => {
    install();
    mod = await import('../src/js/modules/projectFile.js');
    buildProjectFile = mod.buildProjectFile;
    validateProjectFile = mod.validateProjectFile;
    serializeProjectFile = mod.serializeProjectFile;
    migrateProjectFile = mod.migrateProjectFile;
});

afterEach(() => {
    reset();
    document.body.innerHTML = '';
});

describe('buildProjectFile', () => {
    it('creates a .lcproj-shaped object with html and cssData', () => {
        const file = buildProjectFile('My_Project', '<div></div>', { '.x': { color: 'red' } });
        expect(file.app).toBe('layoutcraft');
        expect(file.version).toBe(2);
        expect(file.name).toBe('My_Project');
        expect(file.html).toBe('<div></div>');
        expect(file.cssData).toEqual({ '.x': { color: 'red' } });
        expect(typeof file.updated_at).toBe('string');
    });

    it('defaults cssData to an empty object', () => {
        const file = buildProjectFile('P', '<p></p>');
        expect(file.cssData).toEqual({});
    });

    it('includes design tokens in the file', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--color-primary', '#2563eb');
        const file = buildProjectFile('P', '<div></div>', []);
        expect(file.tokens).toEqual({ '--color-primary': '#2563eb' });
    });
});

describe('validateProjectFile', () => {
    it('accepts a valid file object', () => {
        expect(
            validateProjectFile({
                app: 'layoutcraft',
                version: 1,
                name: 'P',
                html: '<div></div>',
                cssData: {},
                updated_at: '2026-07-31T00:00:00Z',
            }),
        ).toBe(true);
    });

    it('rejects missing app marker', () => {
        expect(validateProjectFile({ html: '<div></div>' })).toBe(false);
    });

    it('rejects wrong app marker', () => {
        expect(validateProjectFile({ app: 'other', html: '<div></div>' })).toBe(false);
    });

    it('rejects non-string html', () => {
        expect(validateProjectFile({ app: 'layoutcraft', html: 42 })).toBe(false);
    });

    it('rejects non-object cssData', () => {
        expect(validateProjectFile({ app: 'layoutcraft', html: '<div></div>', cssData: 'nope' })).toBe(false);
    });

    it('rejects non-object tokens', () => {
        expect(validateProjectFile({ app: 'layoutcraft', html: '<div></div>', tokens: 'nope' })).toBe(false);
    });

    it('accepts missing tokens (older files)', () => {
        expect(validateProjectFile({ app: 'layoutcraft', html: '<div></div>' })).toBe(true);
    });

    it('rejects null and undefined', () => {
        expect(validateProjectFile(null)).toBe(false);
        expect(validateProjectFile(undefined)).toBe(false);
    });

    it('rejects a future version', () => {
        expect(validateProjectFile({ app: 'layoutcraft', version: 3, html: '<div></div>' })).toBe(false);
    });

    it('rejects a non-numeric version', () => {
        expect(validateProjectFile({ app: 'layoutcraft', version: 'two', html: '<div></div>' })).toBe(false);
    });

    it('accepts the current version', () => {
        expect(validateProjectFile({ app: 'layoutcraft', version: 2, html: '<div></div>' })).toBe(true);
    });
});

describe('migrateProjectFile', () => {
    it('upgrades a v1 file (no version field) with an empty token map', () => {
        const migrated = migrateProjectFile({ app: 'layoutcraft', html: '<div></div>', cssData: {} });
        expect(migrated.version).toBe(2);
        expect(migrated.tokens).toEqual({});
        expect(migrated.html).toBe('<div></div>');
    });

    it('keeps existing tokens when migrating', () => {
        const migrated = migrateProjectFile({
            app: 'layoutcraft',
            html: '<div></div>',
            cssData: {},
            tokens: { '--c': '#fff' },
        });
        expect(migrated.version).toBe(2);
        expect(migrated.tokens).toEqual({ '--c': '#fff' });
    });

    it('leaves a current-version file untouched apart from the version stamp', () => {
        const input = { app: 'layoutcraft', version: 2, html: '<p>hi</p>', cssData: { '.p': {} } };
        const migrated = migrateProjectFile(input);
        expect(migrated).toEqual(input);
    });
});

describe('serializeProjectFile', () => {
    it('reads the stored project from localStorage', () => {
        localStorage.setItem(
            'layoutcraft_proj_Stored',
            JSON.stringify({
                html: '<b>hi</b>',
                cssData: { '.b': { fontWeight: '700' } },
                tokens: { '--space': '8px' },
            }),
        );
        const file = serializeProjectFile('Stored');
        expect(file.name).toBe('Stored');
        expect(file.html).toBe('<b>hi</b>');
        expect(file.cssData).toEqual({ '.b': { fontWeight: '700' } });
        expect(file.tokens).toEqual({ '--space': '8px' });
    });

    it('falls back to the canvas content when the project is not stored', () => {
        document.body.innerHTML = '<div id="canvas"><section>fresh</section></div>';
        const file = serializeProjectFile('Unsaved');
        expect(file.html).toContain('<section>fresh</section>');
        expect(Array.isArray(file.cssData)).toBe(true);
    });
});
