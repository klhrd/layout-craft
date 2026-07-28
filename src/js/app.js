import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { COMPONENTS } from './config/components.js';
import { t } from './config/i18n.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector, selectElement, deselectAll } from './modules/inspector.js';
import { initLayers, refreshLayers } from './modules/layers.js';
import { initContextMenu } from './modules/contextMenu.js';
import { initExporter } from './modules/exporter.js';
import { initStorage, saveProject } from './modules/storage.js';
import * as history from './modules/history.js';
import { push as pushHistory } from './modules/history.js';

const liveStyles = document.getElementById('live-styles');
const visualCssContainer = document.getElementById('visual-css-container');
const inputNewSelector = document.getElementById('input-new-selector');
const btnAddSelector = document.getElementById('btn-add-selector');

// Promote activeCssData to the global scope so storage.js can pack it.
window.activeCssData = {};
let draggedCssBlockData = null;

document.addEventListener('DOMContentLoaded', () => {
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initLayers();
    initContextMenu();
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
    initHistoryUI();
    initOutlinesToggle();

    initStorage(); // Boot the storage manager.

    // Auto-silently save every 30 seconds as a safety net.
    setInterval(() => {
        const currentProj = document.getElementById('select-project').value;
        if (currentProj) saveProject(currentProj, false);
    }, 30000);
});

// 1. Render the element toolbox (collapsed by default).
function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    if (!toolboxContainer) return;
    toolboxContainer.innerHTML = `<div class="brand-title">${t('ui.panels.layoutCraft')}</div>`; // clear & re-add brand title

    for (const category of Object.values(ELEMENT_CATEGORIES)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';
        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category.title;
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed';

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('active');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach((item) => {
            const elBtn = document.createElement('div');
            elBtn.className = 'draggable-item';
            elBtn.setAttribute('draggable', 'true');
            elBtn.textContent = item.label;
            elBtn.addEventListener('dragstart', () => setDraggedType(item.tag));
            itemsContainer.appendChild(elBtn);
        });
        wrapper.appendChild(categoryHeader);
        wrapper.appendChild(itemsContainer);
        toolboxContainer.appendChild(wrapper);
    }

    // Pre-built components category.
    const compWrapper = document.createElement('div');
    compWrapper.className = 'category-wrapper';
    const compHeader = document.createElement('h3');
    compHeader.className = 'category-header';
    compHeader.textContent = t('ui.panels.components');
    const compContainer = document.createElement('div');
    compContainer.className = 'category-items collapsed';
    compContainer.id = 'component-items';

    compHeader.addEventListener('click', () => {
        compHeader.classList.toggle('active');
        compContainer.classList.toggle('collapsed');
    });

    for (const [, component] of Object.entries(COMPONENTS)) {
        const elBtn = document.createElement('div');
        elBtn.className = 'draggable-item';
        elBtn.setAttribute('draggable', 'true');
        elBtn.textContent = component.label;
        elBtn.addEventListener('dragstart', () => {
            setDraggedType('div');
            window.draggedComponent = { label: component.label, template: component.template };
        });
        compContainer.appendChild(elBtn);
    }
    compWrapper.appendChild(compHeader);
    compWrapper.appendChild(compContainer);
    toolboxContainer.appendChild(compWrapper);
}

// 2. Render the CSS dictionary into draggable "property blocks".
function renderCssDictionaryBlocks() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    if (!dictContainer) return;
    dictContainer.innerHTML = `<div class="brand-title">${t('ui.panels.cssBlocks')}</div>`; // clear & re-add brand title

    for (const category of Object.values(CSS_DICTIONARY)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category.title;

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed';

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('active');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach((item) => {
            const blockEl = document.createElement('div');
            blockEl.className = 'css-dict-block';
            blockEl.setAttribute('draggable', 'true');
            blockEl.innerHTML = `<span>${item.label}</span> <small style="color:#94a3b8">${item.property}</small>`;

            blockEl.addEventListener('dragstart', () => {
                draggedCssBlockData = item;
            });

            itemsContainer.appendChild(blockEl);
        });

        wrapper.appendChild(categoryHeader);
        wrapper.appendChild(itemsContainer);
        dictContainer.appendChild(wrapper);
    }
}

// 3. Visual CSS rule area & block drag/drop core logic.
function initVisualCssActions() {
    if (!btnAddSelector) return;
    btnAddSelector.addEventListener('click', () => {
        const selectorText = inputNewSelector.value.trim();
        if (!selectorText) return;
        if (window.activeCssData[selectorText]) {
            alert('This CSS selector already exists!');
            return;
        }

        window.activeCssData[selectorText] = {};
        createRuleBoxUI(selectorText);
        inputNewSelector.value = '';
        compileAndRenderCss();
        const currentProj = document.getElementById('select-project').value;
        if (currentProj) saveProject(currentProj, false);

        pushHistory({
            label: `add rule ${selectorText}`,
            perform: () => {
                if (window.activeCssData[selectorText]) return;
                window.activeCssData[selectorText] = {};
                createRuleBoxUI(selectorText);
                compileAndRenderCss();
                if (currentProj) saveProject(currentProj, false);
            },
            rollback: () => {
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${selectorText}"]`);
                if (box) box.remove();
                delete window.activeCssData[selectorText];
                compileAndRenderCss();
                if (currentProj) saveProject(currentProj, false);
            },
        });
    });
}

// Exposed globally: when an old project is loaded, accurately rebuild the
// rule boxes and input fields in the right-side UI from persisted data.
window.refreshLayers = function () {
    refreshLayers();
};

window.rebuildCssRulesUI = function () {
    visualCssContainer.innerHTML = '';
    for (const [selector, styles] of Object.entries(window.activeCssData)) {
        createRuleBoxUIFromData(selector, styles);
    }
};

function createRuleBoxUIFromData(selector, styles) {
    createRuleBoxUI(selector);
    const ruleBox = visualCssContainer.querySelector(`.css-rule-box[data-selector="${selector}"]`);
    if (!ruleBox) return;
    const dropzone = ruleBox.querySelector('.css-rule-body-dropzone');

    for (const [prop, val] of Object.entries(styles)) {
        let labelName = prop;
        for (const cat of Object.values(CSS_DICTIONARY)) {
            const found = cat.items.find((i) => i.property === prop);
            if (found) {
                labelName = found.label;
                break;
            }
        }
        addAppliedBlockUI(dropzone, selector, prop, labelName, val);
    }
}

function createRuleBoxUI(selector) {
    const ruleBox = document.createElement('div');
    ruleBox.className = 'css-rule-box';
    ruleBox.setAttribute('data-selector', selector);

    ruleBox.innerHTML = `
        <div class="css-rule-header">
            <div style="display: flex; align-items: center; gap: 4px;">
                <input type="text" class="editable-selector-input" value="${selector}">
                <span style="color: #94a3b8">{</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-hunt-elements">${t('ui.detection.detect')}</button>
                <button class="btn-delete-rule">❌ Delete</button>
            </div>
        </div>
        <div class="css-rule-body-dropzone"></div>
        <div style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
    `;

    const selectorInput = ruleBox.querySelector('.editable-selector-input');
    const huntBtn = ruleBox.querySelector('.btn-hunt-elements');
    const deleteBtn = ruleBox.querySelector('.btn-delete-rule');
    const dropzone = ruleBox.querySelector('.css-rule-body-dropzone');

    let currentSelector = selector;

    selectorInput.addEventListener('change', () => {
        const newSelector = selectorInput.value.trim();
        if (!newSelector || newSelector === currentSelector) {
            selectorInput.value = currentSelector;
            return;
        }
        if (window.activeCssData[newSelector]) {
            alert(t('ui.detection.selectorExistsAlert'));
            selectorInput.value = currentSelector;
            return;
        }

        const oldSelector = currentSelector;

        window.activeCssData[newSelector] = window.activeCssData[oldSelector];
        delete window.activeCssData[oldSelector];

        if (huntBtn.classList.contains('active')) {
            toggleCanvasBlinking(currentSelector, false);
            toggleCanvasBlinking(newSelector, true);
        }
        currentSelector = newSelector;
        ruleBox.setAttribute('data-selector', newSelector);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `rename rule ${oldSelector} -> ${newSelector}`,
            perform: () => {
                if (!window.activeCssData[oldSelector]) return;
                window.activeCssData[newSelector] = window.activeCssData[oldSelector];
                delete window.activeCssData[oldSelector];
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${oldSelector}"]`);
                if (box) box.setAttribute('data-selector', newSelector);
                const inputEl = box && box.querySelector('.editable-selector-input');
                if (inputEl) inputEl.value = newSelector;
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                if (!window.activeCssData[newSelector]) return;
                window.activeCssData[oldSelector] = window.activeCssData[newSelector];
                delete window.activeCssData[newSelector];
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${newSelector}"]`);
                if (box) box.setAttribute('data-selector', oldSelector);
                const inputEl = box && box.querySelector('.editable-selector-input');
                if (inputEl) inputEl.value = oldSelector;
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
    });

    huntBtn.addEventListener('click', () => {
        const isActive = huntBtn.classList.toggle('active');
        if (isActive) {
            huntBtn.textContent = t('ui.detection.blinking');
            toggleCanvasBlinking(currentSelector, true);
        } else {
            huntBtn.textContent = t('ui.detection.detect');
            toggleCanvasBlinking(currentSelector, false);
        }
    });

    deleteBtn.addEventListener('click', () => {
        toggleCanvasBlinking(currentSelector, false);
        const oldSelector = currentSelector;
        const oldStyles = { ...window.activeCssData[oldSelector] };
        delete window.activeCssData[oldSelector];
        ruleBox.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `delete rule ${oldSelector}`,
            perform: () => {
                if (window.activeCssData[oldSelector]) return;
                delete window.activeCssData[oldSelector];
                const existing = visualCssContainer.querySelector(`.css-rule-box[data-selector="${oldSelector}"]`);
                if (existing) existing.remove();
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                window.activeCssData[oldSelector] = oldStyles;
                createRuleBoxUI(oldSelector);
                const freshBox = visualCssContainer.querySelector(`.css-rule-box[data-selector="${oldSelector}"]`);
                if (freshBox) {
                    const zone = freshBox.querySelector('.css-rule-body-dropzone');
                    for (const [prop, val] of Object.entries(oldStyles)) {
                        let labelName = prop;
                        for (const cat of Object.values(CSS_DICTIONARY)) {
                            const found = cat.items.find((i) => i.property === prop);
                            if (found) {
                                labelName = found.label;
                                break;
                            }
                        }
                        addAppliedBlockUI(zone, oldSelector, prop, labelName, val);
                    }
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
    });

    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCssBlockData) return;

        const { property, defaultValue, label } = draggedCssBlockData;
        if (window.activeCssData[currentSelector][property]) {
            draggedCssBlockData = null;
            return;
        }

        const selector = currentSelector;
        window.activeCssData[selector][property] = defaultValue;
        addAppliedBlockUI(dropzone, selector, property, label, defaultValue);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
        draggedCssBlockData = null;

        pushHistory({
            label: `add block ${property} on ${selector}`,
            perform: () => {
                if (window.activeCssData[selector][property]) return;
                window.activeCssData[selector][property] = defaultValue;
                // Avoid double-appending: re-find existing block before add.
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${selector}"]`);
                if (box) {
                    const zone = box.querySelector('.css-rule-body-dropzone');
                    const existing = zone && zone.querySelector(`.applied-css-block[data-prop="${property}"]`);
                    if (!existing) addAppliedBlockUI(zone, selector, property, label, defaultValue);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                delete window.activeCssData[selector][property];
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${selector}"]`);
                if (box) {
                    const blocks = box.querySelectorAll(`.applied-css-block[data-prop="${property}"]`);
                    blocks.forEach((b) => b.remove());
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
    });

    visualCssContainer.appendChild(ruleBox);
}

function toggleCanvasBlinking(selector, shouldBlink) {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    try {
        const matchingElements = canvas.querySelectorAll(selector);
        matchingElements.forEach((el) => {
            if (shouldBlink) el.classList.add('css-hunting-active');
            else el.classList.remove('css-hunting-active');
        });
    } catch (e) {
        // Invalid selector for querySelectorAll; safely ignore.
    }
}

function addAppliedBlockUI(dropzone, initialSelector, property, label, value) {
    const block = document.createElement('div');
    block.className = 'applied-css-block';
    block.setAttribute('data-prop', property);
    block.innerHTML = `
        <span class="block-label">${property}:</span>
        <div style="display: flex; align-items: center;">
            <input type="text" class="block-value-input" value="${value}">
            <button class="btn-remove-block">🗑️</button>
        </div>
    `;

    const valueInput = block.querySelector('.block-value-input');
    // Debounced history record so a whole "padding: 20px -> 40px" edit collapses
    // into a single undo command. Same 400ms window as the inspector fields.
    let editTimer = null;
    let editOldVal = value;
    valueInput.addEventListener('input', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        if (!window.activeCssData[currentSelector]) return;
        if (editTimer === null) editOldVal = window.activeCssData[currentSelector][property] ?? value;
        window.activeCssData[currentSelector][property] = valueInput.value;
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
        if (editTimer) clearTimeout(editTimer);
        editTimer = setTimeout(() => {
            editTimer = null;
            const capturedOld = editOldVal;
            const capturedNew = valueInput.value;
            const capturedSelector = currentSelector;
            const capturedProj = proj;
            pushHistory({
                label: `edit ${property} on ${capturedSelector}`,
                perform: () => {
                    if (!window.activeCssData[capturedSelector]) return;
                    window.activeCssData[capturedSelector][property] = capturedNew;
                    const box = visualCssContainer.querySelector(
                        `.css-rule-box[data-selector="${CSS.escape(capturedSelector)}"]`,
                    );
                    const inp =
                        box && box.querySelector(`.applied-css-block[data-prop="${property}"] .block-value-input`);
                    if (inp) inp.value = capturedNew;
                    compileAndRenderCss();
                    if (capturedProj) saveProject(capturedProj, false);
                },
                rollback: () => {
                    if (!window.activeCssData[capturedSelector]) return;
                    window.activeCssData[capturedSelector][property] = capturedOld;
                    const box = visualCssContainer.querySelector(
                        `.css-rule-box[data-selector="${CSS.escape(capturedSelector)}"]`,
                    );
                    const inp =
                        box && box.querySelector(`.applied-css-block[data-prop="${property}"] .block-value-input`);
                    if (inp) inp.value = capturedOld;
                    compileAndRenderCss();
                    if (capturedProj) saveProject(capturedProj, false);
                },
            });
            editOldVal = capturedNew;
        }, 400);
    });

    block.querySelector('.btn-remove-block').addEventListener('click', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        if (!window.activeCssData[currentSelector]) return;
        const oldVal = window.activeCssData[currentSelector][property];
        delete window.activeCssData[currentSelector][property];
        const removedBlock = block;
        block.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `delete block ${property} on ${currentSelector}`,
            perform: () => {
                if (window.activeCssData[currentSelector][property]) return;
                delete window.activeCssData[currentSelector][property];
                const existing = dropzone.querySelector(`.applied-css-block[data-prop="${property}"]`);
                if (!existing && removedBlock.parentNode !== dropzone) {
                    dropzone.appendChild(removedBlock);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                window.activeCssData[currentSelector][property] = oldVal;
                if (removedBlock.parentNode !== dropzone) dropzone.appendChild(removedBlock);
                const inp = removedBlock.querySelector('.block-value-input');
                if (inp) inp.value = oldVal;
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
    });

    dropzone.appendChild(block);
}

export function compileAndRenderCss() {
    let cssString = '';
    for (const [selector, styles] of Object.entries(window.activeCssData)) {
        cssString += `${selector} {\n`;
        for (const [prop, val] of Object.entries(styles)) {
            cssString += `  ${prop}: ${val};\n`;
        }
        cssString += `}\n\n`;
    }
    liveStyles.textContent = cssString;
}

export function getActiveCssCode() {
    return liveStyles.textContent;
}

function initModeSwitcher() {
    const switchVisualBtn = document.getElementById('switch-visual');
    const switchCssBtn = document.getElementById('switch-css');
    if (!switchVisualBtn || !switchCssBtn) return;

    switchVisualBtn.addEventListener('click', () => {
        document.body.className = 'mode-visual';
        switchVisualBtn.classList.add('active');
        switchCssBtn.classList.remove('active');
    });
    switchCssBtn.addEventListener('click', () => {
        document.body.className = 'mode-css';
        switchCssBtn.classList.add('active');
        switchVisualBtn.classList.remove('active');
    });
}

// Outlines toggle — switch between WYSIWYG and wireframe view.
function initOutlinesToggle() {
    const btn = document.getElementById('btn-outlines');
    if (!btn) return;
    btn.textContent = t('ui.canvas.showOutlines');
    let outlinesOn = false;

    btn.addEventListener('click', () => {
        outlinesOn = !outlinesOn;
        document.body.classList.toggle('show-outlines', outlinesOn);
        btn.textContent = outlinesOn ? t('ui.canvas.hideOutlines') : t('ui.canvas.showOutlines');
    });
}

// Undo/Redo toolbar buttons + global keyboard shortcuts.
// Buttons reflect canUndo/canRedo via the history subscribe channel.
function initHistoryUI() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (!btnUndo || !btnRedo) return;

    // Keep DOM labels wired to i18n (re-applied here every emit cycle).
    btnUndo.textContent = t('ui.history.undo');
    btnRedo.textContent = t('ui.history.redo');

    const applyState = ({ canUndo, canRedo }) => {
        btnUndo.disabled = !canUndo;
        btnUndo.style.opacity = canUndo ? '1' : '0.45';
        btnRedo.disabled = !canRedo;
        btnRedo.style.opacity = canRedo ? '1' : '0.45';
    };
    history.subscribe(applyState);

    btnUndo.addEventListener('click', () => history.undo());
    btnRedo.addEventListener('click', () => history.redo());

    // Clipboard for copy/paste.
    let clipboardElement = null;

    // Global keyboard shortcuts.
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (target && target.isContentEditable) return;

        const ctrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // Undo / Redo
        if (ctrl && key === 'z') {
            e.preventDefault();
            if (e.shiftKey) history.redo();
            else history.undo();
            return;
        }

        // Copy
        if (ctrl && key === 'c') {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (sel) {
                clipboardElement = sel.cloneNode(true);
            }
            return;
        }

        // Paste
        if (ctrl && key === 'v') {
            if (!clipboardElement) return;
            e.preventDefault();
            const canvas = document.getElementById('canvas');
            const clone = clipboardElement.cloneNode(true);
            canvas.appendChild(clone);
            selectElement(clone);
            pushHistory({
                label: 'Paste element',
                perform: () => {
                    canvas.appendChild(clone);
                    selectElement(clone);
                },
                rollback: () => {
                    clone.remove();
                },
            });
            return;
        }

        // Select all
        if (ctrl && key === 'a') {
            e.preventDefault();
            const canvas = document.getElementById('canvas');
            const first = canvas.firstElementChild;
            if (first && !first.classList.contains('canvas-placeholder')) selectElement(first);
            return;
        }

        // Delete / Backspace
        if (key === 'delete' || key === 'backspace') {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            e.preventDefault();
            const parent = sel.parentNode;
            const next = sel.nextSibling;
            sel.remove();
            deselectAll();
            pushHistory({
                label: 'Delete element',
                perform: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(sel, next);
                    else parent.appendChild(sel);
                    selectElement(sel);
                },
                rollback: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(sel, next);
                    else parent.appendChild(sel);
                    selectElement(sel);
                },
            });
            return;
        }

        // Escape
        if (key === 'escape') {
            deselectAll();
            return;
        }

        // Arrow keys — nudge selected element by 1px
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            e.preventDefault();
            const delta = key === 'arrowup' ? -1 : key === 'arrowdown' ? 1 : 0;
            const deltaX = key === 'arrowleft' ? -1 : key === 'arrowright' ? 1 : 0;
            const oldTop = parseInt(sel.style.top) || 0;
            const oldLeft = parseInt(sel.style.left) || 0;
            const newTop = oldTop + delta;
            const newLeft = oldLeft + deltaX;
            sel.style.top = `${newTop}px`;
            sel.style.left = `${newLeft}px`;
            pushHistory({
                label: 'Nudge element',
                perform: () => {
                    sel.style.top = `${newTop}px`;
                    sel.style.left = `${newLeft}px`;
                },
                rollback: () => {
                    sel.style.top = `${oldTop}px`;
                    sel.style.left = `${oldLeft}px`;
                },
            });
            return;
        }
    });
}
