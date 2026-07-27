/**
 * i18n dictionary module for LayoutCraft Studio.
 *
 * Centralizes all user-facing strings so future locales can be added without
 * touching component code. English is the default (`en`) and the only fully
 * populated locale at the moment; a Traditional Chinese (`zh-TW`) entry is
 * started as a reference for future translation work.
 *
 * Usage:
 *   import { t } from './config/i18n.js';
 *   t('ui.save');           // -> 'Save'
 *   t('ui.storage.full');   // -> '...capacity full!...'
 *
 * Switch the active locale at runtime via:
 *   import { setLocale } from './config/i18n.js';
 *   setLocale('zh-TW');
 */

const DEFAULT_LOCALE = 'en';
let currentLocale = DEFAULT_LOCALE;

const DICTIONARY = {
    en: {
        ui: {
            brand: 'LayoutCraft Studio',
            mode: {
                visual: '🎨 Visual Mode',
                css: '💻 CSS Expert Mode',
            },
            project: {
                storageUse: 'Storage Use',
                new: '+ New',
                save: '💾 Save',
                saved: '✅ Saved',
                preview: '👁️ Preview',
                export: '💾 Export Project',
                newPrompt: 'Enter new project name:',
                existsAlert: 'Project name already exists!',
            },
            panels: {
                cssBlocks: 'CSS Blocks',
                layoutCraft: 'LayoutCraft',
                canvasPlaceholder: 'Drag and drop elements here to start building...',
                inspector: 'Inspector',
                noSelection: 'Select an element on the canvas to edit its properties.',
                selectedElement: 'Selected Element',
                deleteElement: 'Delete Element',
                visualCssRules: 'Visual CSS Rules',
                visualCssHint: 'Create a selector, then drag CSS blocks inside it.',
                addSelectorPlaceholder: 'e.g., .my-card or h1:hover',
                addRule: '+ Add Rule',
            },
            labels: {
                id: 'ID',
                classes: 'Classes',
                textContent: 'Text Content',
                idPlaceholder: 'e.g., hero-section',
                classPlaceholder: 'e.g., container text-center',
                textPlaceholder: 'Enter inner text...',
            },
            detection: {
                detect: '🎯 Detect',
                blinking: '🎯 Blinking',
                selectorExistsAlert: 'Name exists!',
            },
            inspector: {
                enterAttrPlaceholder: (attr) => `Enter ${attr}...`,
            },
            storage: {
                meterLabel: (used, total, pct) => `${used} MB / ${total} MB (${pct}%)`,
                capacityFull: '❌ LocalStorage capacity full! Delete some rules or text data.',
                defaultProject: 'Default_Project',
                newInnerText: 'Type something...',
                placeholderImageAlt: 'Placeholder Image',
            },
            backToEditor: '⬅️ Back to Editor',
            newElementText: (tag) => `New ${tag}`,
        },
    },

    // Reference Traditional Chinese translation. Kept partial on purpose;
    // future contributors can complete it to enable zh-TW via setLocale().
    'zh-TW': {
        ui: {
            brand: 'LayoutCraft Studio',
            mode: {
                visual: '🎨 視覺模式',
                css: '💻 CSS 專家模式',
            },
            project: {
                storageUse: '儲存使用量',
                new: '+ 新建',
                save: '💾 儲存',
                saved: '✅ 已儲存',
                preview: '👁️ 預覽',
                export: '💾 匯出專案',
                newPrompt: '輸入新專案名稱：',
                existsAlert: '專案名稱已存在！',
            },
        },
    },
};

/**
 * Look up a dotted path in the active locale dictionary.
 * Supports nested keys via dots (e.g. 'ui.mode.visual').
 * If the function-shaped leaf receives args, it is invoked and its return
 * value used; otherwise the value is returned as-is for strings/numbers.
 *
 * Falls back to the default locale (`en`) when a key is missing for the
 * active locale, and ultimately to the raw key path when neither has it.
 */
export function t(path, ...args) {
    const lookup = (locale) => {
        const parts = path.split('.');
        let node = DICTIONARY[locale];
        for (const part of parts) {
            if (node && typeof node === 'object' && part in node) node = node[part];
            else return undefined;
        }
        return node;
    };

    let value = lookup(currentLocale);
    if (value === undefined) value = lookup(DEFAULT_LOCALE);
    if (value === undefined) return path;

    return typeof value === 'function' ? value(...args) : value;
}

export function setLocale(locale) {
    if (DICTIONARY[locale]) currentLocale = locale;
}

export function getLocale() {
    return currentLocale;
}
