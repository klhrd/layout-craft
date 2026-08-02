import { t, getLocale } from '../config/i18n.js';

/**
 * Apply the active locale to static HTML marked with data-i18n attributes.
 *
 * - data-i18n="key"           → textContent
 * - data-i18n-placeholder     → placeholder
 * - data-i18n-title           → title (tooltips)
 *
 * Values are only written when the lookup resolves; unknown keys leave the
 * hardcoded English fallback untouched. The root can be a modal or panel so
 * dynamically injected content is localized on insertion.
 */
export function applyI18n(root = document) {
    const apply = (selector, keyAttr, targetAttr) => {
        root.querySelectorAll(`[${keyAttr}]`).forEach((el) => {
            const key = el.getAttribute(keyAttr);
            const value = t(key);
            if (value !== key) el[targetAttr] = value;
        });
    };

    apply('[data-i18n]', 'data-i18n', 'textContent');
    apply('[data-i18n-placeholder]', 'data-i18n-placeholder', 'placeholder');
    apply('[data-i18n-title]', 'data-i18n-title', 'title');

    if (root === document) {
        const html = document.documentElement;
        if (html) html.lang = getLocale().toLowerCase();
    }
}
