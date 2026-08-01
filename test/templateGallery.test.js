import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { install, reset } from './_localStorageHarness.js';

const ENTRY = {
    id: 'my-hero',
    title: 'My Hero (Dark)',
    category: 'marketing',
    tags: ['hero', 'tokens'],
    file: 'my-hero/hero.json',
    preview: 'my-hero/preview.svg',
};

const CONTENT = {
    html: '<section class="my-hero"><h1>Hello</h1></section>',
    cssData: { '.my-hero': { background: 'var(--hero-bg)' } },
    tokens: { '--hero-bg': '#0f172a' },
};

function stubFetch({ manifest, files }) {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url) => {
            if (url.endsWith('manifest.json')) {
                return { ok: true, json: async () => manifest };
            }
            if (files[url]) {
                return { ok: true, json: async () => files[url] };
            }
            return { ok: false, json: async () => ({}) };
        }),
    );
}

function mountGalleryDom() {
    document.body.innerHTML = `
        <div id="template-modal">
            <h2 id="template-modal-title"></h2>
            <input id="template-search" />
            <div id="template-categories">
                <button class="template-cat-btn" data-cat="all">All</button>
                <button class="template-cat-btn" data-cat="marketing">Marketing</button>
                <button class="template-cat-btn" data-cat="appshell">App Shell</button>
                <button class="template-cat-btn" data-cat="forms">Forms</button>
                <button class="template-cat-btn" data-cat="ecommerce">Ecommerce</button>
            </div>
            <div id="template-grid"></div>
            <button id="btn-template-close"></button>
        </div>
        <button id="btn-templates">Templates</button>
        <div id="template-preview-overlay">
            <div id="template-preview-html"></div>
            <button id="btn-template-replace"></button>
            <button id="btn-template-append"></button>
            <button id="btn-template-preview-cancel"></button>
        </div>
        <div id="canvas"></div>
        <select id="select-project"></select>
    `;
}

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
    window.rebuildTokenUI = () => {};
    window.saveProject = () => {};
});

afterEach(() => {
    reset();
    vi.unstubAllGlobals();
    vi.resetModules();
    document.body.innerHTML = '';
    delete window.rebuildCssRulesUI;
    delete window.refreshLayers;
    delete window.rebuildTokenUI;
    delete window.saveProject;
});

describe('drop-in template loading (P5e)', () => {
    it('merges manifest entries into the gallery with preview images', async () => {
        stubFetch({
            manifest: { templates: [ENTRY] },
            files: { './templates/my-hero/hero.json': CONTENT },
        });
        mountGalleryDom();
        const { initTemplateGallery } = await import('../src/js/modules/templateGallery.js');
        initTemplateGallery();
        document.getElementById('btn-templates').click();
        await vi.waitFor(() => expect(document.querySelectorAll('#template-grid .template-grid-item').length).toBe(23));

        const cards = document.querySelectorAll('#template-grid .template-grid-item');
        const hero = [...cards].find((card) => card.dataset.id === 'my-hero');
        const img = hero.querySelector('.template-grid-item-preview img');
        expect(img).not.toBeNull();
        expect(img.getAttribute('src')).toBe('./templates/my-hero/preview.svg');
    });

    it('falls back to the emoji icon when no preview is set', async () => {
        stubFetch({
            manifest: { templates: [{ ...ENTRY, preview: undefined }] },
            files: { './templates/my-hero/hero.json': CONTENT },
        });
        mountGalleryDom();
        const { initTemplateGallery } = await import('../src/js/modules/templateGallery.js');
        initTemplateGallery();
        document.getElementById('btn-templates').click();
        await vi.waitFor(() => expect(document.querySelectorAll('#template-grid .template-grid-item').length).toBe(23));

        const hero = [...document.querySelectorAll('#template-grid .template-grid-item')].find(
            (card) => card.dataset.id === 'my-hero',
        );
        expect(hero.querySelector('.template-grid-item-preview')).toBeNull();
        expect(hero.querySelector('.template-grid-item-icon')).not.toBeNull();
        expect(hero.querySelector('.template-grid-item-icon').textContent).toBe('📄');
    });

    it('shows built-in templates only when the manifest is missing', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, json: async () => ({}) })),
        );
        mountGalleryDom();
        const { initTemplateGallery } = await import('../src/js/modules/templateGallery.js');
        initTemplateGallery();
        document.getElementById('btn-templates').click();

        const cards = document.querySelectorAll('#template-grid .template-grid-item');
        expect(cards.length).toBe(22);
    });

    it('seeds tokens when a drop-in template is applied', async () => {
        stubFetch({
            manifest: { templates: [ENTRY] },
            files: { './templates/my-hero/hero.json': CONTENT },
        });
        mountGalleryDom();
        const { initTemplateGallery } = await import('../src/js/modules/templateGallery.js');
        initTemplateGallery();
        document.getElementById('btn-templates').click();
        await vi.waitFor(() => expect(document.querySelectorAll('#template-grid .template-grid-item').length).toBe(23));

        document.querySelector('#template-grid .template-grid-item[data-id="my-hero"]').click();
        document.getElementById('btn-template-replace').click();

        const cssState = await import('../src/js/modules/cssState.js');
        expect(cssState.getTokens()).toMatchObject({ '--hero-bg': '#0f172a' });
    });
});
