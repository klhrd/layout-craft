import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { COMPONENTS } from './config/components.js';
import { t } from './config/i18n.js';
import * as cssState from './config/cssState.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector, selectElement, deselectAll } from './modules/inspector.js';
import { initLayers, refreshLayers } from './modules/layers.js';
import { initCanvasHelpers } from './modules/canvasHelpers.js';
import { initContextMenu } from './modules/contextMenu.js';
import { initExporter } from './modules/exporter.js';
import { importFromPaste } from './modules/importer.js';
import { initStorage, saveProject } from './modules/storage.js';
import * as history from './modules/history.js';
import { push as pushHistory } from './modules/history.js';

const liveStyles = document.getElementById('live-styles');
const visualCssContainer = document.getElementById('visual-css-container');
const inputNewSelector = document.getElementById('input-new-selector');
const btnAddSelector = document.getElementById('btn-add-selector');

// Temporary backward compat — will be removed after all modules migrate.
window.activeCssData = cssState.getRawData();
let draggedCssBlockData = null;

document.addEventListener('DOMContentLoaded', () => {
    cssState.initCssState();
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initLayers();
    initContextMenu();
    initCanvasHelpers();
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
    initHistoryUI();
    initOutlinesToggle();
    initImporter();

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
        if (cssState.hasRule(selectorText)) {
            alert('This CSS selector already exists!');
            return;
        }

        cssState.setRule(selectorText, {});
        createRuleBoxUI(selectorText);
        inputNewSelector.value = '';
        compileAndRenderCss();
        const currentProj = document.getElementById('select-project').value;
        if (currentProj) saveProject(currentProj, false);

        pushHistory({
            label: `add rule ${selectorText}`,
            perform: () => {
                if (cssState.hasRule(selectorText)) return;
                cssState.setRule(selectorText, {});
                createRuleBoxUI(selectorText);
                compileAndRenderCss();
                if (currentProj) saveProject(currentProj, false);
            },
            rollback: () => {
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${selectorText}"]`);
                if (box) box.remove();
                cssState.deleteRule(selectorText);
                compileAndRenderCss();
                if (currentProj) saveProject(currentProj, false);
            },
        });
    });

    const btnAddMedia = document.getElementById('btn-add-media');
    if (btnAddMedia) {
        btnAddMedia.addEventListener('click', () => {
            const selector = '@media (max-width: 768px)';
            if (cssState.getBlock(selector)) {
                alert('A media block with this query already exists.');
                return;
            }
            const block = { type: 'media', selector, children: [] };
            cssState.addBlock(block);
            createContainerBoxUI(block);
            compileAndRenderCss();
            const currentProj = document.getElementById('select-project').value;
            if (currentProj) saveProject(currentProj, false);
        });
    }

    const btnAddKeyframes = document.getElementById('btn-add-keyframes');
    if (btnAddKeyframes) {
        btnAddKeyframes.addEventListener('click', () => {
            const selector = '@keyframes slide-in';
            if (cssState.getBlock(selector)) {
                alert('A keyframes block with this name already exists.');
                return;
            }
            const block = { type: 'keyframes', selector, children: [] };
            cssState.addBlock(block);
            createContainerBoxUI(block);
            compileAndRenderCss();
            const currentProj = document.getElementById('select-project').value;
            if (currentProj) saveProject(currentProj, false);
        });
    }
}

function createContainerBoxUI(block) {
    const container = document.createElement('div');
    container.className = 'css-rule-box css-container-box';
    container.setAttribute('data-selector', block.selector);

    const isMedia = block.type === 'media';
    const label = isMedia ? 'Media Query' : 'Keyframes';

    container.innerHTML = `
        <div class="css-rule-header">
            <div style="display: flex; align-items: center; gap: 4px; flex:1;">
                <span style="color:#6366f1;font-size:0.75rem;font-weight:600;text-transform:uppercase">${label}</span>
                <input type="text" class="editable-selector-input" value="${block.selector}" style="font-family:monospace">
                <span style="color: #94a3b8">{</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-delete-rule" data-type="${block.type}">❌ Delete</button>
            </div>
        </div>
        <div class="css-rule-body-dropzone"></div>
        <button class="btn-add-nested-rule" style="margin:6px 0 0 auto;display:block;background:none;border:1px dashed #6366f1;color:#6366f1;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:0.8rem">+ Add Nested Rule</button>
        <div style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
    `;

    const selectorInput = container.querySelector('.editable-selector-input');
    const deleteBtn = container.querySelector('.btn-delete-rule');
    const dropzone = container.querySelector('.css-rule-body-dropzone');
    const addNestedBtn = container.querySelector('.btn-add-nested-rule');

    let currentSelector = block.selector;

    selectorInput.addEventListener('change', () => {
        const newSel = selectorInput.value.trim();
        if (!newSel || newSel === currentSelector) {
            selectorInput.value = currentSelector;
            return;
        }
        // Update the internal block
        const existingBlock = cssState.getBlock(currentSelector);
        if (existingBlock) existingBlock.selector = newSel;

        currentSelector = newSel;
        container.setAttribute('data-selector', newSel);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    deleteBtn.addEventListener('click', () => {
        cssState.removeBlock(currentSelector);
        container.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    addNestedBtn.addEventListener('click', () => {
        const ruleSelector = isMedia
            ? prompt('Enter selector for nested rule (e.g., .card):')
            : prompt('Enter keyframe step (e.g., 50% or to):');
        if (!ruleSelector) return;
        if (cssState.getBlock(ruleSelector, currentSelector)) {
            alert('A nested rule with this selector already exists in this container.');
            return;
        }
        const nestedBlock = { type: 'rule', selector: ruleSelector, styles: {} };
        cssState.addBlock(nestedBlock, currentSelector);

        const nestedUI = createNestedRuleBoxUI(nestedBlock, currentSelector);
        dropzone.appendChild(nestedUI);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    // Render any existing nested children
    if (block.children) {
        for (const child of block.children) {
            const nestedUI = createNestedRuleBoxUI(child, currentSelector);
            dropzone.appendChild(nestedUI);
        }
    }

    visualCssContainer.appendChild(container);
}

function createNestedRuleBoxUI(block, parentSelector) {
    const ruleBox = document.createElement('div');
    ruleBox.className = 'css-rule-box css-nested-rule';
    ruleBox.setAttribute('data-selector', block.selector);
    if (parentSelector) ruleBox.setAttribute('data-parent-selector', parentSelector);

    ruleBox.innerHTML = `
        <div class="css-rule-header">
            <div style="display: flex; align-items: center; gap: 4px;">
                <input type="text" class="editable-selector-input" value="${block.selector}">
                <span style="color: #94a3b8">{</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-hunt-elements" style="font-size:0.75rem">${t('ui.detection.detect')}</button>
                <button class="btn-delete-rule">❌</button>
            </div>
        </div>
        <div class="css-rule-body-dropzone"></div>
        <div style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
    `;

    const selectorInput = ruleBox.querySelector('.editable-selector-input');
    const huntBtn = ruleBox.querySelector('.btn-hunt-elements');
    const deleteBtn = ruleBox.querySelector('.btn-delete-rule');
    const dropzone = ruleBox.querySelector('.css-rule-body-dropzone');

    let currentSelector = block.selector;

    selectorInput.addEventListener('change', () => {
        const newSelector = selectorInput.value.trim();
        if (!newSelector || newSelector === currentSelector) {
            selectorInput.value = currentSelector;
            return;
        }
        const parentBlock = cssState.getBlock(parentSelector);
        if (parentBlock) {
            const existing = parentBlock.children && parentBlock.children.find((b) => b.selector === newSelector);
            if (existing) {
                alert('A nested rule with this selector already exists in this container.');
                selectorInput.value = currentSelector;
                return;
            }
        }

        // Rename in state
        const blockData = cssState.getBlock(currentSelector, parentSelector);
        if (blockData) blockData.selector = newSelector;

        if (huntBtn.classList.contains('active')) {
            toggleCanvasBlinking(currentSelector, false);
            toggleCanvasBlinking(newSelector, true);
        }
        currentSelector = newSelector;
        ruleBox.setAttribute('data-selector', newSelector);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
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
        cssState.removeBlock(currentSelector, parentSelector);
        ruleBox.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    // Render existing style properties
    if (block.styles) {
        for (const [prop, val] of Object.entries(block.styles)) {
            let labelName = prop;
            for (const cat of Object.values(CSS_DICTIONARY)) {
                const found = cat.items.find((i) => i.property === prop);
                if (found) {
                    labelName = found.label;
                    break;
                }
            }
            addAppliedBlockUI(dropzone, block.selector, prop, labelName, val);
        }
    }

    return ruleBox;
}

// Exposed globally: when an old project is loaded, accurately rebuild the
// rule boxes and input fields in the right-side UI from persisted data.
window.refreshLayers = function () {
    refreshLayers();
};

window.rebuildCssRulesUI = function () {
    visualCssContainer.innerHTML = '';
    for (const block of cssState.getBlocks()) {
        if (block.type === 'rule') {
            createRuleBoxUI(block.selector);
            const ruleBox = visualCssContainer.querySelector(`.css-rule-box[data-selector="${block.selector}"]`);
            if (ruleBox && block.styles) {
                const dropzone = ruleBox.querySelector('.css-rule-body-dropzone');
                for (const [prop, val] of Object.entries(block.styles)) {
                    let labelName = prop;
                    for (const cat of Object.values(CSS_DICTIONARY)) {
                        const found = cat.items.find((i) => i.property === prop);
                        if (found) {
                            labelName = found.label;
                            break;
                        }
                    }
                    addAppliedBlockUI(dropzone, block.selector, prop, labelName, val);
                }
            }
        } else if (block.type === 'media' || block.type === 'keyframes') {
            createContainerBoxUI(block);
        }
    }
};

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
        if (cssState.hasRule(newSelector)) {
            alert(t('ui.detection.selectorExistsAlert'));
            selectorInput.value = currentSelector;
            return;
        }

        const oldSelector = currentSelector;

        cssState.renameRule(oldSelector, newSelector);

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
                if (!cssState.hasRule(oldSelector)) return;
                cssState.renameRule(oldSelector, newSelector);
                const box = visualCssContainer.querySelector(`.css-rule-box[data-selector="${oldSelector}"]`);
                if (box) box.setAttribute('data-selector', newSelector);
                const inputEl = box && box.querySelector('.editable-selector-input');
                if (inputEl) inputEl.value = newSelector;
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                if (!cssState.hasRule(newSelector)) return;
                cssState.renameRule(newSelector, oldSelector);
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
        const oldStyles = cssState.getRule(oldSelector) ? { ...cssState.getRule(oldSelector) } : {};
        cssState.deleteRule(oldSelector);
        ruleBox.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `delete rule ${oldSelector}`,
            perform: () => {
                if (cssState.hasRule(oldSelector)) return;
                cssState.deleteRule(oldSelector);
                const existing = visualCssContainer.querySelector(`.css-rule-box[data-selector="${oldSelector}"]`);
                if (existing) existing.remove();
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                cssState.setRule(oldSelector, oldStyles);
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
        if (cssState.getProperty(currentSelector, property)) {
            draggedCssBlockData = null;
            return;
        }

        const selector = currentSelector;
        cssState.setProperty(selector, property, defaultValue);
        addAppliedBlockUI(dropzone, selector, property, label, defaultValue);
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
        draggedCssBlockData = null;

        pushHistory({
            label: `add block ${property} on ${selector}`,
            perform: () => {
                if (cssState.getProperty(selector, property)) return;
                cssState.setProperty(selector, property, defaultValue);
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
                cssState.deleteProperty(selector, property);
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
    let editTimer = null;
    let editOldVal = value;
    valueInput.addEventListener('input', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        const parentSelector = parentBox.getAttribute('data-parent-selector') || null;

        const hasRule = parentSelector
            ? cssState.hasNestedRule(currentSelector, parentSelector)
            : cssState.hasRule(currentSelector);
        if (!hasRule) return;

        if (editTimer === null) {
            editOldVal = parentSelector
                ? (cssState.getNestedProperty(parentSelector, currentSelector, property) ?? value)
                : (cssState.getProperty(currentSelector, property) ?? value);
        }

        if (parentSelector) {
            cssState.setNestedProperty(parentSelector, currentSelector, property, valueInput.value);
        } else {
            cssState.setProperty(currentSelector, property, valueInput.value);
        }
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
        if (editTimer) clearTimeout(editTimer);
        editTimer = setTimeout(() => {
            editTimer = null;
            const capturedOld = editOldVal;
            const capturedNew = valueInput.value;
            const capturedSelector = currentSelector;
            const capturedParent = parentSelector;
            const capturedProj = proj;
            pushHistory({
                label: `edit ${property} on ${capturedSelector}`,
                perform: () => {
                    if (capturedParent) {
                        if (!cssState.hasNestedRule(capturedSelector, capturedParent)) return;
                        cssState.setNestedProperty(capturedParent, capturedSelector, property, capturedNew);
                    } else {
                        if (!cssState.hasRule(capturedSelector)) return;
                        cssState.setProperty(capturedSelector, property, capturedNew);
                    }
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
                    if (capturedParent) {
                        if (!cssState.hasNestedRule(capturedSelector, capturedParent)) return;
                        cssState.setNestedProperty(capturedParent, capturedSelector, property, capturedOld);
                    } else {
                        if (!cssState.hasRule(capturedSelector)) return;
                        cssState.setProperty(capturedSelector, property, capturedOld);
                    }
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
        }, 400);
    });

    block.querySelector('.btn-remove-block').addEventListener('click', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        if (!cssState.hasRule(currentSelector)) return;
        const oldVal = cssState.getProperty(currentSelector, property);
        cssState.deleteProperty(currentSelector, property);
        const removedBlock = block;
        block.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `delete block ${property} on ${currentSelector}`,
            perform: () => {
                if (cssState.getProperty(currentSelector, property)) return;
                cssState.deleteProperty(currentSelector, property);
                const existing = dropzone.querySelector(`.applied-css-block[data-prop="${property}"]`);
                if (!existing && removedBlock.parentNode !== dropzone) {
                    dropzone.appendChild(removedBlock);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                cssState.setProperty(currentSelector, property, oldVal);
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

function emitBlock(block, indent) {
    const pad = '  '.repeat(indent);
    if (block.type === 'media' || block.type === 'keyframes') {
        let out = `${pad}${block.selector} {\n`;
        if (block.children) {
            for (const child of block.children) {
                out += emitBlock(child, indent + 1);
            }
        }
        if (block.styles) {
            for (const [prop, val] of Object.entries(block.styles)) {
                out += `${pad}  ${prop}: ${val};\n`;
            }
        }
        out += `${pad}}\n\n`;
        return out;
    }
    // rule
    let out = `${pad}${block.selector} {\n`;
    if (block.styles) {
        for (const [prop, val] of Object.entries(block.styles)) {
            out += `${pad}  ${prop}: ${val};\n`;
        }
    }
    out += `${pad}}\n\n`;
    return out;
}

export function compileAndRenderCss() {
    let cssString = '';
    for (const block of cssState.getBlocks()) {
        cssString += emitBlock(block, 0);
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
function initImporter() {
    const btnImport = document.getElementById('btn-import');
    const modal = document.getElementById('import-modal');
    const btnCancel = document.getElementById('btn-import-cancel');
    const btnSubmit = document.getElementById('btn-import-submit');
    const htmlInput = document.getElementById('import-html-input');
    const cssInput = document.getElementById('import-css-input');

    if (!btnImport || !modal) return;

    btnImport.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    btnCancel.addEventListener('click', () => {
        modal.style.display = 'none';
        htmlInput.value = '';
        cssInput.value = '';
    });

    btnSubmit.addEventListener('click', () => {
        const html = htmlInput.value.trim();
        if (!html) return;
        importFromPaste(html, cssInput.value.trim());
        modal.style.display = 'none';
        htmlInput.value = '';
        cssInput.value = '';

        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            htmlInput.value = '';
            cssInput.value = '';
        }
    });
}

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
