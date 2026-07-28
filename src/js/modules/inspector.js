import { ELEMENT_CATEGORIES } from '../config/elements.js';
import { t } from '../config/i18n.js';
import { push as pushHistory } from './history.js';
import { compileAndRenderCss } from '../app.js';

// src/js/modules/inspector.js: top-level variable declarations.
let selectedElement = null;

const canvas = document.getElementById('canvas');
const editorForm = document.getElementById('editor-form');
const noSelectionMsg = document.getElementById('no-selection-msg');
const selectedTagName = document.getElementById('selected-tag-name');
const inputId = document.getElementById('input-id');
const inputClass = document.getElementById('input-class');
const inputText = document.getElementById('input-text');
const btnDelete = document.getElementById('btn-delete');
let dynamicPropsContainer = null;
let styleEditorContainer = null;

// Counter for auto-generated classes (e.g. ._lc-1, ._lc-2).
if (window._lcCounter === undefined) window._lcCounter = 1;

// The set of CSS properties shown in the quick style editor.
const STYLE_PROPS = [
    { key: 'color', labelKey: 'ui.inspector.color' },
    { key: 'background-color', labelKey: 'ui.inspector.bgColor' },
    { key: 'font-size', labelKey: 'ui.inspector.fontSize' },
    { key: 'font-weight', labelKey: 'ui.inspector.fontWeight' },
    { key: 'text-align', labelKey: 'ui.inspector.textAlign' },
    { key: 'padding', labelKey: 'ui.inspector.padding' },
    { key: 'margin', labelKey: 'ui.inspector.margin' },
    { key: 'border-radius', labelKey: 'ui.inspector.borderRadius' },
];

// Tiny debounce help: collapse rapid keystrokes into a single history
// command so undo can roll back a whole "padding: 20px -> 40px" change
// rather than every character. The trailing edge fires the callback
// with the *new* and *old* snapshots collected at the leading edge.
function makeDebouncedField(read, write, labelFor) {
    let timer = null;
    let appliedOld = null;
    let appliedTargetEl = null;
    return (el, newValue, oldValue) => {
        if (timer === null) {
            appliedOld = oldValue;
            appliedTargetEl = el;
        } else {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = null;
            const capturedTarget = appliedTargetEl;
            const capturedOld = appliedOld;
            const capturedNew = read(capturedTarget);
            pushHistory({
                label: labelFor,
                perform: () => {
                    if (capturedTarget) write(capturedTarget, capturedNew);
                },
                rollback: () => {
                    if (capturedTarget) write(capturedTarget, capturedOld);
                },
            });
            appliedTargetEl = null;
            appliedOld = null;
        }, 400);
    };
}

// Field-specific debounced recorders. The closures hold `read`/`write`
// helpers so the debounced callback knows how to capture and replay the
// change independent of the input elements (which may be re-rendered
// before the undo fires).
const recordIdChange = makeDebouncedField(
    (el) => el.id,
    (el, v) => {
        el.id = v;
        if (inputId) inputId.value = v;
    },
    'Edit ID',
);
const recordClassChange = makeDebouncedField(
    (el) => el.className.replace('selected-element', '').trim(),
    (el, v) => {
        el.className = v + ' selected-element';
        if (inputClass) inputClass.value = v;
    },
    'Edit classes',
);
const recordTextChange = makeDebouncedField(
    (el) =>
        Array.from(el.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join(''),
    (el, v) => {
        const existing = Array.from(el.childNodes).find((n) => n.nodeType === Node.TEXT_NODE);
        if (existing) existing.textContent = v;
        else el.prepend(document.createTextNode(v));
        if (inputText) inputText.value = v;
    },
    'Edit text content',
);

export function initInspector() {
    dynamicPropsContainer = document.getElementById('dynamic-properties');
    styleEditorContainer = document.getElementById('style-editor');

    canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target === canvas) {
            deselectAll();
            return;
        }
        selectElement(e.target);
    });

    // Base attribute listeners (removed inputCss listener since global CSS is handled in app.js).
    inputId.addEventListener('input', () => {
        if (!selectedElement) return;
        const oldVal = selectedElement.id;
        selectedElement.id = inputId.value;
        recordIdChange(selectedElement, inputId.value, oldVal);
    });
    inputClass.addEventListener('input', () => {
        if (!selectedElement) return;
        const oldVal = selectedElement.className.replace('selected-element', '').trim();
        selectedElement.className = inputClass.value + ' selected-element';
        recordClassChange(selectedElement, inputClass.value, oldVal);
    });
    inputText.addEventListener('input', () => {
        if (!selectedElement) return;
        const oldVal = Array.from(selectedElement.childNodes)
            .filter((n) => n.nodeType === Node.TEXT_NODE)
            .map((n) => n.textContent)
            .join('');
        const textNode = Array.from(selectedElement.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = inputText.value;
        else selectedElement.prepend(document.createTextNode(inputText.value));
        recordTextChange(selectedElement, inputText.value, oldVal);
    });

    btnDelete.addEventListener('click', () => {
        if (!selectedElement) return;
        const el = selectedElement;
        const parent = el.parentNode;
        const next = el.nextSibling;
        if (!parent) {
            deselectAll();
            return;
        }
        el.remove();
        pushHistory({
            label: 'Delete element',
            perform: () => {
                if (next && next.parentNode === parent) parent.insertBefore(el, next);
                else parent.appendChild(el);
                selectElement(el);
            },
            rollback: () => {
                // Restore into its former spot.
                if (next && next.parentNode === parent) parent.insertBefore(el, next);
                else parent.appendChild(el);
                selectElement(el);
            },
        });
        deselectAll();
    });
}

export function selectElement(el) {
    deselectAll();
    selectedElement = el;
    selectedElement.classList.add('selected-element');

    noSelectionMsg.classList.add('hidden');
    editorForm.classList.remove('hidden');

    const tagName = el.tagName.toLowerCase();
    selectedTagName.textContent = tagName;

    inputId.value = el.id || '';
    inputClass.value = el.className.replace('selected-element', '').trim();

    inputText.value = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent.trim())
        .join('');

    renderDynamicAttributes(tagName, el);
    renderStyleEditor(el);
}

// Dynamically render href, src, etc. fields based on the component's tag.
function renderDynamicAttributes(tagName, el) {
    dynamicPropsContainer.innerHTML = ''; // Clear previous dynamic fields first.

    let foundItem = null;
    for (const category of Object.values(ELEMENT_CATEGORIES)) {
        foundItem = category.items.find((item) => item.tag === tagName);
        if (foundItem) break;
    }

    if (foundItem && foundItem.attributes) {
        // A per-field debounced recorder so each attribute input gets its
        // own undo command (separate from the base ID/class/text fields).
        const recorders = foundItem.attributes.map((attr) =>
            makeDebouncedField(
                (target) => target.getAttribute(attr) || '',
                (target, v) => {
                    if (v.trim() === '') target.removeAttribute(attr);
                    else target.setAttribute(attr, v);
                },
                `Edit ${attr}`,
            ),
        );
        foundItem.attributes.forEach((attr, i) => {
            const label = document.createElement('label');
            label.textContent = attr.toUpperCase();

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = t('ui.inspector.enterAttrPlaceholder', attr);
            input.value = el.getAttribute(attr) || '';

            input.addEventListener('input', () => {
                const oldVal = el.getAttribute(attr) || '';
                if (input.value.trim() === '') {
                    el.removeAttribute(attr);
                } else {
                    el.setAttribute(attr, input.value);
                }
                recorders[i](el, input.value, oldVal);
            });

            dynamicPropsContainer.appendChild(label);
            dynamicPropsContainer.appendChild(input);
        });
    }
}

/* ── Select-to-style ── */

// Ensure the element has a tracked class in activeCssData.
// Returns the class name used.
function ensureElementHasClass(el) {
    // Check if element already has a class we track.
    const existing = el.className
        .split(/\s+/)
        .filter((c) => c && c !== 'selected-element' && c !== 'el-hover')
        .find((c) => window.activeCssData[`.${CSS.escape(c)}`]);
    if (existing) return `.${CSS.escape(existing)}`;

    // Use existing user-assigned class that isn't auto-generated.
    const userClass = el.className
        .split(/\s+/)
        .filter((c) => c && c !== 'selected-element' && c !== 'el-hover' && !c.startsWith('_lc-'))
        .find((c) => true);
    if (userClass) {
        const sel = `.${CSS.escape(userClass)}`;
        if (!window.activeCssData[sel]) {
            window.activeCssData[sel] = {};
        }
        return sel;
    }

    // Find an existing auto-generated class on the element.
    const autoClass = el.className.split(/\s+/).find((c) => c.startsWith('_lc-'));
    if (autoClass) {
        const sel = `.${CSS.escape(autoClass)}`;
        if (!window.activeCssData[sel]) {
            window.activeCssData[sel] = {};
        }
        return sel;
    }

    // Generate a fresh one.
    const newClass = `_lc-${window._lcCounter++}`;
    el.classList.add(newClass);
    const sel = `.${CSS.escape(newClass)}`;
    window.activeCssData[sel] = {};
    return sel;
}

// Render the inline style editor for the selected element.
function renderStyleEditor(el) {
    if (!styleEditorContainer) return;
    styleEditorContainer.innerHTML = '';

    // Use ensureElementHasClass to find or create the rule class.
    const selector = ensureElementHasClass(el);
    const rule = window.activeCssData[selector];
    if (!rule) return;

    // Section title.
    const title = document.createElement('div');
    title.className = 'style-title';
    title.textContent = t('ui.inspector.styles');
    styleEditorContainer.appendChild(title);

    // One input per CSS property.
    STYLE_PROPS.forEach(({ key, labelKey }) => {
        const row = document.createElement('div');
        row.className = 'style-row';

        const label = document.createElement('label');
        label.textContent = t(labelKey);

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = key;
        input.value = rule[key] || '';

        // Debounce + undo.
        let editTimer = null;
        let oldVal = rule[key] || '';
        const commitChange = (newVal) => {
            const capturedOld = oldVal;
            const capturedNew = newVal;
            const capturedSel = selector;
            pushHistory({
                label: `Edit ${key}`,
                perform: () => {
                    window.activeCssData[capturedSel][key] = capturedNew;
                    compileAndRenderCss();
                },
                rollback: () => {
                    window.activeCssData[capturedSel][key] = capturedOld;
                    compileAndRenderCss();
                    // Update the input if element is still selected.
                    if (selectedElement && styleEditorContainer) {
                        const inp = styleEditorContainer.querySelector(`input[placeholder="${key}"]`);
                        if (inp) inp.value = capturedOld;
                    }
                },
            });
            oldVal = newVal;
        };

        input.addEventListener('input', () => {
            const val = input.value;
            if (val.trim() === '') {
                delete rule[key];
                // Remove the rule entirely if no properties left and it's auto-generated.
                if (Object.keys(rule).length === 0 && selector.startsWith('._lc-')) {
                    delete window.activeCssData[selector];
                    // Remove the class from the element.
                    const cls = selector.slice(2); // strip ._
                    el.classList.remove(cls);
                }
            } else {
                rule[key] = val;
            }
            compileAndRenderCss();
            if (editTimer) clearTimeout(editTimer);
            editTimer = setTimeout(() => {
                commitChange(val);
            }, 400);
        });

        row.appendChild(label);
        row.appendChild(input);
        styleEditorContainer.appendChild(row);
    });
}

export function deselectAll() {
    selectedElement = null;
    document.querySelectorAll('.canvas *').forEach((el) => el.classList.remove('selected-element'));
    editorForm.classList.add('hidden');
    noSelectionMsg.classList.remove('hidden');
    if (dynamicPropsContainer) dynamicPropsContainer.innerHTML = '';
    if (styleEditorContainer) styleEditorContainer.innerHTML = '';
}
