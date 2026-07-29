import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLocale, getLocale } from '../src/js/config/i18n.js';

describe('i18n module', () => {
    beforeEach(() => {
        setLocale('en');
    });

    describe('t() lookups', () => {
        it('returns the string for nested dot paths', () => {
            expect(t('ui.mode.visual')).toBe('🎨 Visual Mode');
            expect(t('ui.project.save')).toBe('💾 Save');
        });

        it('returns the raw path when the key is unknown', () => {
            expect(t('ui.does.not.exist')).toBe('ui.does.not.exist');
        });

        it('invokes function leaves with provided args', () => {
            expect(t('ui.storage.meterLabel', '1.23', '5.00', '24.6')).toBe('1.23 MB / 5.00 MB (24.6%)');
            expect(t('ui.newElementText', 'H1')).toBe('New H1');
            expect(t('ui.inspector.enterAttrPlaceholder', 'href')).toBe('Enter href...');
        });
    });

    describe('setLocale() / getLocale()', () => {
        it('switches to a known locale', () => {
            setLocale('zh-TW');
            expect(getLocale()).toBe('zh-TW');
            expect(t('ui.mode.visual')).toBe('🎨 視覺模式');
        });

        it('falls back to English when the zh-TW key is missing', () => {
            setLocale('zh-TW');
            expect(t('ui.project.preview')).toBe('👁️ 預覽');
            expect(t('ui.panels.canvasPlaceholder')).toBe('將元素拖放到此處開始構建...');
        });

        it('ignores unknown locales (keeps the current one)', () => {
            setLocale('en');
            setLocale('fr-FR');
            expect(getLocale()).toBe('en');
        });

        it('falls back to the raw path when both locales miss it', () => {
            expect(t('ui.totally.missing.path')).toBe('ui.totally.missing.path');
        });
    });
});
