import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('applyI18n', () => {
    let applier;
    let i18n;

    beforeEach(async () => {
        vi.resetModules();
        i18n = await import('../src/js/config/i18n.js');
        i18n.setLocale('en');
        document.body.innerHTML = `
            <button id="save-btn"><span class="mat-icon">save</span><span data-i18n="ui.menus.save">Save</span></button>
            <span id="pure" data-i18n="ui.panels.inspector">Inspector</span>
            <input id="ph" type="text" data-i18n-placeholder="ui.labels.idPlaceholder" placeholder="e.g., hero-section" />
            <button id="tt" data-i18n-title="ui.toolbar.templates" title="Templates"></button>
            <span id="unknown" data-i18n="ui.does.not.exist">Keep me</span>
            <span id="mat-icon-only" class="mat-icon">palette</span>
        `;
        applier = await import('../src/js/modules/i18nApplier.js');
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('applies textContent to data-i18n elements', () => {
        applier.applyI18n(document);
        expect(document.getElementById('pure').textContent).toBe('Inspector');
    });

    it('does not clobber child icons when the marked element is a leaf span', () => {
        applier.applyI18n(document);
        const saveBtn = document.getElementById('save-btn');
        expect(saveBtn.querySelector('.mat-icon')).not.toBeNull();
        expect(saveBtn.querySelector('[data-i18n]').textContent).toBe('Save');
    });

    it('applies placeholder and title attributes', () => {
        applier.applyI18n(document);
        expect(document.getElementById('ph').placeholder).toBe('e.g., hero-section');
        expect(document.getElementById('tt').title).toBe('Templates');
    });

    it('leaves unknown keys untouched', () => {
        applier.applyI18n(document);
        expect(document.getElementById('unknown').textContent).toBe('Keep me');
    });

    it('leaves non-marked icons untouched', () => {
        applier.applyI18n(document);
        expect(document.getElementById('mat-icon-only').textContent).toBe('palette');
    });

    it('re-applies after a locale switch', () => {
        i18n.setLocale('zh-TW');
        applier.applyI18n(document);
        expect(document.getElementById('pure').textContent).toBe('檢查器');
        expect(document.getElementById('ph').placeholder).toBe('例如 hero-section');
        expect(document.getElementById('tt').title).toBe('模板');
        expect(i18n.getLocale()).toBe('zh-TW');
    });

    it('removed ja locale falls back to en', () => {
        i18n.setLocale('ja');
        expect(i18n.getLocale()).toBe('en');
        applier.applyI18n(document);
        expect(document.getElementById('pure').textContent).toBe('Inspector');
    });
});
