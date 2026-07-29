import { ELEMENT_CATEGORIES } from '../config/elements.js';
import * as cssState from './cssState.js';
import { t } from '../config/i18n.js';
import { push as pushHistory } from './history.js';
import { compileAndRenderCss } from '../app.js';
import { showResizeHandles, hideResizeHandles } from './canvasHelpers.js';

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
const btnLiftOut = document.getElementById('btn-lift-out');
let dynamicPropsContainer = null;
let styleEditorContainer = null;
let hierarchyContainer = null;
let hierarchyParentName = null;

// Counter for auto-generated classes (e.g. ._lc-1, ._lc-2).

// The set of CSS properties shown in the quick style editor.
// `widget` selects the input type: 'color', 'select', 'align', 'fontSize', or 'text' (default).
const STYLE_PROPS = [
    { key: 'color', labelKey: 'ui.inspector.color', widget: 'color' },
    { key: 'background-color', labelKey: 'ui.inspector.bgColor', widget: 'color' },
    { key: 'font-size', labelKey: 'ui.inspector.fontSize', widget: 'fontSize' },
    { key: 'font-weight', labelKey: 'ui.inspector.fontWeight', widget: 'select' },
    { key: 'text-align', labelKey: 'ui.inspector.textAlign', widget: 'align' },
    { key: 'font-family', labelKey: 'ui.inspector.fontFamily', widget: 'fontFamily' },
    { key: 'width', labelKey: 'ui.inspector.width', widget: 'unitSlider' },
    { key: 'height', labelKey: 'ui.inspector.height', widget: 'unitSlider' },
    { key: 'gap', labelKey: 'ui.inspector.gap', widget: 'unitSlider' },
    { key: 'border-radius', labelKey: 'ui.inspector.borderRadius', widget: 'unitSlider' },
    { key: 'opacity', labelKey: 'ui.inspector.opacity', widget: 'opacity' },
    { key: 'padding', labelKey: 'ui.inspector.padding', widget: 'spacing' },
    { key: 'margin', labelKey: 'ui.inspector.margin', widget: 'spacing' },
    { key: 'box-shadow', labelKey: 'ui.inspector.boxShadow', widget: 'boxShadow' },
];

const FONT_WEIGHT_OPTIONS = [
    { value: '100', label: '100 Thin' },
    { value: '200', label: '200 Extra Light' },
    { value: '300', label: '300 Light' },
    { value: '400', label: '400 Normal' },
    { value: '500', label: '500 Medium' },
    { value: '600', label: '600 Semi Bold' },
    { value: '700', label: '700 Bold' },
    { value: '800', label: '800 Extra Bold' },
    { value: '900', label: '900 Black' },
];

const FONT_SIZE_PRESETS = [
    { value: '0.75rem', label: 'XS' },
    { value: '0.875rem', label: 'SM' },
    { value: '1rem', label: 'Base' },
    { value: '1.25rem', label: 'LG' },
    { value: '1.5rem', label: 'XL' },
    { value: '2rem', label: '2XL' },
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
    hierarchyContainer = document.getElementById('hierarchy-controls');
    hierarchyParentName = document.getElementById('hierarchy-parent-name');

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

    // Hierarchy controls
    const btnMoveUp = document.getElementById('btn-move-up');
    const btnMoveDown = document.getElementById('btn-move-down');
    const btnWrapDiv = document.getElementById('btn-wrap-div');
    const btnWrapSection = document.getElementById('btn-wrap-section');
    const btnUnwrap = document.getElementById('btn-unwrap');

    function siblingMove(direction) {
        return () => {
            if (!selectedElement || !selectedElement.parentNode) return;
            const el = selectedElement;
            const parent = el.parentNode;
            if (direction === 'up' && el.previousElementSibling) {
                parent.insertBefore(el, el.previousElementSibling);
            } else if (direction === 'down' && el.nextElementSibling) {
                parent.insertBefore(el.nextElementSibling, el);
            } else return;
            selectElement(el);
        };
    }
    if (btnMoveUp) btnMoveUp.addEventListener('click', siblingMove('up'));
    if (btnMoveDown) btnMoveDown.addEventListener('click', siblingMove('down'));

    if (btnWrapDiv) {
        btnWrapDiv.addEventListener('click', () => wrapSelected('div'));
    }
    if (btnWrapSection) {
        btnWrapSection.addEventListener('click', () => wrapSelected('section'));
    }

    if (btnUnwrap) {
        btnUnwrap.addEventListener('click', () => {
            if (!selectedElement || !selectedElement.parentNode) return;
            const el = selectedElement;
            const parent = el.parentNode;
            const grandparent = parent.parentNode;
            if (!grandparent || parent === canvas) return;
            const children = Array.from(el.childNodes);
            children.forEach((child) => grandparent.insertBefore(child, parent));
            el.remove();
            deselectAll();
        });
    }

    if (btnLiftOut) {
        btnLiftOut.addEventListener('click', () => {
            if (!selectedElement) return;
            const el = selectedElement;
            const parent = el.parentNode;
            const grandparent = parent && parent.parentNode;
            if (!grandparent || parent === canvas) return;

            const next = el.nextSibling;
            const oldParent = parent;

            grandparent.insertBefore(el, parent);
            selectElement(el);

            pushHistory({
                label: 'Lift out element',
                perform: () => {
                    grandparent.insertBefore(el, oldParent);
                    selectElement(el);
                },
                rollback: () => {
                    oldParent.insertBefore(el, next);
                    selectElement(el);
                },
            });
        });
    }
}

function wrapSelected(tag) {
    if (!selectedElement) return;
    const el = selectedElement;
    const parent = el.parentNode;
    if (!parent) return;
    const wrapper = document.createElement(tag);
    parent.insertBefore(wrapper, el);
    wrapper.appendChild(el);
    selectElement(el);
    pushHistory({
        label: `Wrap in ${tag}`,
        perform: () => {
            parent.insertBefore(wrapper, el);
            wrapper.appendChild(el);
            selectElement(el);
        },
        rollback: () => {
            const wp = wrapper.parentNode;
            if (wp) {
                wp.insertBefore(el, wrapper);
                wrapper.remove();
            }
            selectElement(el);
        },
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
    renderHierarchy(el);
    showResizeHandles(el);
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
    const existing = el.className
        .split(/\s+/)
        .filter((c) => c && c !== 'selected-element' && c !== 'el-hover')
        .find((c) => cssState.hasRule(`.${CSS.escape(c)}`));
    if (existing) return `.${CSS.escape(existing)}`;

    const userClass = el.className
        .split(/\s+/)
        .filter((c) => c && c !== 'selected-element' && c !== 'el-hover' && !c.startsWith('_lc-'))
        .find(() => true);
    if (userClass) {
        const sel = `.${CSS.escape(userClass)}`;
        if (!cssState.hasRule(sel)) {
            cssState.setRule(sel, {});
        }
        return sel;
    }

    const autoClass = el.className.split(/\s+/).find((c) => c.startsWith('_lc-'));
    if (autoClass) {
        const sel = `.${CSS.escape(autoClass)}`;
        if (!cssState.hasRule(sel)) {
            cssState.setRule(sel, {});
        }
        return sel;
    }

    const newClass = `_lc-${cssState.nextClassIndex()}`;
    el.classList.add(newClass);
    const sel = `.${CSS.escape(newClass)}`;
    cssState.setRule(sel, {});
    return sel;
}

/* ── Widget factory functions ── */

function createColorWidget(initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'color-widget';

    const input = document.createElement('input');
    input.type = 'color';
    input.value = initialValue || '#000000';

    const swatch = document.createElement('span');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = input.value;
    swatch.addEventListener('click', () => input.click());

    input.addEventListener('input', () => {
        swatch.style.backgroundColor = input.value;
        onChange(input.value);
    });

    wrapper.appendChild(swatch);
    wrapper.appendChild(input);
    return wrapper;
}

function createSelectWidget(options, initialValue, onChange) {
    const select = document.createElement('select');
    select.className = 'style-select';
    options.forEach((opt) => {
        const el = document.createElement('option');
        el.value = opt.value;
        el.textContent = opt.label;
        if (opt.value === initialValue) el.selected = true;
        select.appendChild(el);
    });
    select.addEventListener('change', () => onChange(select.value));
    return select;
}

function createAlignWidget(initialValue, onChange) {
    const group = document.createElement('div');
    group.className = 'align-group';

    const values = [
        { v: 'left', label: 'format_align_left' },
        { v: 'center', label: 'format_align_center' },
        { v: 'right', label: 'format_align_right' },
        { v: 'justify', label: 'format_align_justify' },
    ];
    values.forEach(({ v, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'align-btn' + (v === initialValue ? ' active' : '');
        btn.innerHTML = `<span class="mat-icon">${label}</span>`;
        btn.dataset.value = v;
        btn.addEventListener('click', () => {
            group.querySelectorAll('.align-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            onChange(v);
        });
        group.appendChild(btn);
    });
    return group;
}

function createFontSizeWidget(initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'fontsize-widget';

    const presetsRow = document.createElement('div');
    presetsRow.className = 'fontsize-presets';
    FONT_SIZE_PRESETS.forEach(({ value, label }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fs-preset-btn' + (value === initialValue ? ' active' : '');
        btn.textContent = label;
        btn.dataset.value = value;
        btn.addEventListener('click', () => {
            presetsRow.querySelectorAll('.fs-preset-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            customInput.value = value;
            onChange(value);
        });
        presetsRow.appendChild(btn);
    });

    const customInput = document.createElement('input');
    customInput.type = 'text';
    customInput.className = 'fs-custom';
    customInput.placeholder = 'custom';
    customInput.value = FONT_SIZE_PRESETS.some((p) => p.value === initialValue) ? '' : initialValue || '';
    customInput.addEventListener('input', () => {
        presetsRow.querySelectorAll('.fs-preset-btn').forEach((b) => b.classList.remove('active'));
        onChange(customInput.value);
    });

    wrapper.appendChild(presetsRow);
    wrapper.appendChild(customInput);
    return wrapper;
}

/* ── Helper: parse "16px" → { num: 16, unit: 'px' } ── */
function parseUnitValue(val) {
    if (!val) return { num: null, unit: 'px' };
    const m = String(val).match(/^([\d.]+)\s*(px|rem|em|%)$/);
    return m ? { num: parseFloat(m[1]), unit: m[2] } : { num: null, unit: 'px' };
}

/* ── UnitSlider widget (slider + unit select) ── */
function createUnitSliderWidget(initialValue, onChange, { min = 0, max = 200, step = 1 } = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'unitslider-widget';

    const { num, unit } = parseUnitValue(initialValue);
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'unitslider-range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = num !== null ? String(Math.max(min, Math.min(max, num))) : '0';

    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'unitslider-num';
    numInput.min = String(min);
    numInput.max = String(max);
    numInput.step = String(step);
    numInput.value = slider.value;

    const unitSelect = document.createElement('select');
    unitSelect.className = 'unitslider-unit';
    ['px', 'rem', 'em', '%'].forEach((u) => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        if (u === unit) opt.selected = true;
        unitSelect.appendChild(opt);
    });

    function updateValue() {
        const v = numInput.value;
        const u = unitSelect.value;
        onChange(v + u);
    }

    slider.addEventListener('input', () => {
        numInput.value = slider.value;
        updateValue();
    });
    numInput.addEventListener('input', () => {
        slider.value = numInput.value;
        updateValue();
    });
    unitSelect.addEventListener('change', updateValue);

    wrapper.appendChild(slider);
    wrapper.appendChild(numInput);
    wrapper.appendChild(unitSelect);
    return wrapper;
}

/* ── Opacity slider (0–1, step 0.05) ── */
function createOpacityWidget(initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'opacity-widget';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'opacity-range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.05';
    slider.value = initialValue || '1';

    const label = document.createElement('span');
    label.className = 'opacity-label';
    label.textContent = Math.round(parseFloat(slider.value) * 100) + '%';

    slider.addEventListener('input', () => {
        label.textContent = Math.round(parseFloat(slider.value) * 100) + '%';
        onChange(slider.value);
    });

    wrapper.appendChild(slider);
    wrapper.appendChild(label);
    return wrapper;
}

/* ── Font-family system font dropdown ── */
const FONT_OPTIONS = [
    { value: '', label: 'Default' },
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica' },
    { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
    { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
    { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
    { value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', label: 'Segoe UI' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
];

function createFontFamilyWidget(initialValue, onChange) {
    const select = document.createElement('select');
    select.className = 'style-select';
    FONT_OPTIONS.forEach(({ value, label }) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === initialValue) opt.selected = true;
        select.appendChild(opt);
    });
    select.addEventListener('change', () => onChange(select.value));
    return select;
}

/* ── Spacing diagram for margin / padding ── */
function createSpacingWidget(initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'spacing-widget';

    const diag = document.createElement('div');
    diag.className = 'spacing-diagram';

    const center = document.createElement('div');
    center.className = 'spacing-center';
    center.textContent = 'box';
    diag.appendChild(center);

    const directions = ['top', 'right', 'bottom', 'left'];
    const parsers = {
        top: { pos: 'spacing-top', placeholder: 'T' },
        right: { pos: 'spacing-right', placeholder: 'R' },
        bottom: { pos: 'spacing-bottom', placeholder: 'B' },
        left: { pos: 'spacing-left', placeholder: 'L' },
    };

    // Parse shorthand. e.g. "10px 20px" → top:10px right:20px bottom:10px left:20px
    const parts = initialValue ? initialValue.split(/\s+/) : [];
    function valFor(dir) {
        const idx = directions.indexOf(dir);
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return parts[idx < 2 ? 0 : 1];
        if (parts.length === 3) return parts[idx < 1 ? 0 : idx < 2 ? 1 : 2];
        if (parts.length >= 4) return parts[idx] || '';
        return '';
    }

    const inputs = {};
    directions.forEach((dir) => {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'spacing-input ' + parsers[dir].pos;
        inp.placeholder = parsers[dir].placeholder;
        inp.value = valFor(dir);
        inputs[dir] = inp;
        diag.appendChild(inp);
    });

    function rebuildShorthand() {
        const vals = directions.map((d) => inputs[d].value.trim());
        // Collapse trailing empties
        while (vals.length > 1 && vals[vals.length - 1] === '' && vals[vals.length - 2] === '') {
            vals.pop();
        }
        while (vals.length > 2 && vals[vals.length - 1] === '' && vals[vals.length - 2] === '') {
            vals.pop();
        }
        while (vals.length > 1 && vals.every((v) => v === vals[0])) {
            vals.length = 1;
        }
        onChange(vals.join(' '));
    }

    directions.forEach((dir) => {
        inputs[dir].addEventListener('input', rebuildShorthand);
    });

    wrapper.appendChild(diag);
    return wrapper;
}

/* ── Box-shadow editor ── */
function createBoxShadowWidget(initialValue, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'shadow-widget';

    // Parse "10px 10px 5px rgba(0,0,0,0.3)" or similar
    const parts = initialValue ? initialValue.split(/\s+/) : [];
    const offsetX = parts[0] || '0';
    const offsetY = parts[1] || '0';
    const blur = parts[2] || '0';
    const color = parts.slice(3).join(' ') || '#000000';

    const row1 = document.createElement('div');
    row1.className = 'shadow-row';

    const xLabel = document.createElement('label');
    xLabel.textContent = 'X';
    const xInput = document.createElement('input');
    xInput.type = 'text';
    xInput.className = 'shadow-input';
    xInput.placeholder = '0';
    xInput.value = offsetX;

    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y';
    const yInput = document.createElement('input');
    yInput.type = 'text';
    yInput.className = 'shadow-input';
    yInput.placeholder = '0';
    yInput.value = offsetY;

    row1.appendChild(xLabel);
    row1.appendChild(xInput);
    row1.appendChild(yLabel);
    row1.appendChild(yInput);

    const row2 = document.createElement('div');
    row2.className = 'shadow-row';

    const bLabel = document.createElement('label');
    bLabel.textContent = 'Blur';
    const bInput = document.createElement('input');
    bInput.type = 'text';
    bInput.className = 'shadow-input';
    bInput.placeholder = '0';
    bInput.value = blur;

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'shadow-color';
    // try to extract hex from rgba
    const colorMatch = color.match(/#[0-9a-fA-F]{3,8}/);
    colorPicker.value = colorMatch ? colorMatch[0] : '#000000';

    row2.appendChild(bLabel);
    row2.appendChild(bInput);
    row2.appendChild(colorPicker);

    function rebuildShadow() {
        const val = [xInput.value || '0', yInput.value || '0', bInput.value || '0', colorPicker.value].join(' ');
        onChange(val);
    }

    [xInput, yInput, bInput, colorPicker].forEach((el) => {
        el.addEventListener('input', rebuildShadow);
    });

    wrapper.appendChild(row1);
    wrapper.appendChild(row2);
    return wrapper;
}

/* ── Render the inline style editor ── */
function renderStyleEditor(el) {
    if (!styleEditorContainer) return;
    styleEditorContainer.innerHTML = '';

    const selector = ensureElementHasClass(el);
    const rule = cssState.getRule(selector);
    if (!rule) return;

    const title = document.createElement('div');
    title.className = 'style-title';
    title.textContent = t('ui.inspector.styles');
    styleEditorContainer.appendChild(title);

    STYLE_PROPS.forEach(({ key, labelKey, widget }) => {
        const row = document.createElement('div');
        row.className = 'style-row';

        const label = document.createElement('label');
        label.textContent = t(labelKey);

        let editTimer = null;
        let oldVal = rule[key] || '';
        const currentVal = rule[key] || '';

        const makeCommit = (newVal) => {
            const capturedOld = oldVal;
            const capturedNew = newVal;
            const capturedSel = selector;
            pushHistory({
                label: `Edit ${key}`,
                perform: () => {
                    cssState.setProperty(capturedSel, key, capturedNew);
                    compileAndRenderCss();
                },
                rollback: () => {
                    cssState.setProperty(capturedSel, key, capturedOld);
                    compileAndRenderCss();
                    if (selectedElement) renderStyleEditor(selectedElement);
                },
            });
            oldVal = newVal;
        };

        const handleChange = (val) => {
            if (val.trim() === '' || val === undefined) {
                delete rule[key];
                if (Object.keys(rule).length === 0 && selector.startsWith('._lc-')) {
                    cssState.deleteRule(selector);
                    const cls = selector.slice(2);
                    el.classList.remove(cls);
                }
            } else {
                rule[key] = val;
            }
            compileAndRenderCss();
            if (editTimer) clearTimeout(editTimer);
            editTimer = setTimeout(() => makeCommit(val), 400);
        };

        let control;
        if (widget === 'color') {
            control = createColorWidget(currentVal, handleChange);
        } else if (widget === 'select') {
            control = createSelectWidget(FONT_WEIGHT_OPTIONS, currentVal || '400', handleChange);
        } else if (widget === 'align') {
            control = createAlignWidget(currentVal || 'left', handleChange);
        } else if (widget === 'fontSize') {
            control = createFontSizeWidget(currentVal, handleChange);
        } else if (widget === 'fontFamily') {
            control = createFontFamilyWidget(currentVal, handleChange);
        } else if (widget === 'unitSlider') {
            const opts =
                key === 'border-radius'
                    ? { min: 0, max: 100, step: 1 }
                    : key === 'gap'
                      ? { min: 0, max: 80, step: 1 }
                      : { min: 0, max: 800, step: 1 };
            control = createUnitSliderWidget(currentVal, handleChange, opts);
        } else if (widget === 'opacity') {
            control = createOpacityWidget(currentVal, handleChange);
        } else if (widget === 'spacing') {
            control = createSpacingWidget(currentVal, handleChange);
        } else if (widget === 'boxShadow') {
            control = createBoxShadowWidget(currentVal, handleChange);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = key;
            input.value = currentVal;
            input.addEventListener('input', () => handleChange(input.value));
            control = input;
        }

        row.appendChild(label);
        row.appendChild(control);
        styleEditorContainer.appendChild(row);
    });
}

function renderHierarchy(el) {
    if (!hierarchyContainer || !hierarchyParentName) return;
    hierarchyContainer.classList.remove('hidden');
    const parent = el.parentNode;
    if (parent && parent !== canvas) {
        hierarchyParentName.textContent = `<${parent.tagName.toLowerCase()}>`;
    } else {
        hierarchyParentName.textContent = 'canvas (root)';
    }
}

export function deselectAll() {
    selectedElement = null;
    document.querySelectorAll('.canvas *').forEach((el) => el.classList.remove('selected-element'));
    editorForm.classList.add('hidden');
    noSelectionMsg.classList.remove('hidden');
    if (dynamicPropsContainer) dynamicPropsContainer.innerHTML = '';
    if (styleEditorContainer) styleEditorContainer.innerHTML = '';
    if (hierarchyContainer) hierarchyContainer.classList.add('hidden');
    hideResizeHandles();
}
