import { ELEMENT_CATEGORIES } from '../config/elements.js';
import { t } from '../config/i18n.js';
import { push as pushHistory } from './history.js';

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
let dynamicPropsContainer = null; // Keep this one.

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
    // Fix: directly grab the reserved container from HTML instead of using parentNode.insertBefore.
    dynamicPropsContainer = document.getElementById('dynamic-properties');

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

export function deselectAll() {
    selectedElement = null;
    document.querySelectorAll('.canvas *').forEach((el) => el.classList.remove('selected-element'));
    editorForm.classList.add('hidden');
    noSelectionMsg.classList.remove('hidden');
    if (dynamicPropsContainer) dynamicPropsContainer.innerHTML = '';
}
