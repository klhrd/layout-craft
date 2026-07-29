import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { COMPONENTS } from './config/components.js';
import { t, setLocale } from './config/i18n.js';
import * as cssState from './modules/cssState.js';
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
let clipboardElement = null;

document.addEventListener('DOMContentLoaded', () => {
    cssState.initCssState();
    applySavedLocale();
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initLayers();
    initContextMenu();
    initCanvasHelpers();
    // Listen for resize-handle commits from canvasHelpers
    document.getElementById('canvas').addEventListener('resize-commit', (e) => {
        const el = e.target;
        const { width, height } = e.detail;
        const classList = Array.from(el.classList).filter((c) => c !== 'selected-element' && c !== 'el-hover');
        const cls = classList.find((c) => cssState.hasRule(`.${CSS.escape(c)}`));
        if (cls) {
            const sel = `.${CSS.escape(cls)}`;
            if (width) cssState.setProperty(sel, 'width', width);
            if (height) cssState.setProperty(sel, 'height', height);
            compileAndRenderCss();
        }
    });
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
    initCssEditorCollapse();
    initHistoryUI();
    initOutlinesToggle();
    initImporter();

    initMenus();
    applySavedTheme();
    initZoom();
    initBreakpoints();

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

function initCssEditorCollapse() {
    const toggle = document.getElementById('css-editor-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        toggle.parentElement.classList.toggle('collapsed');
    });
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
                <button class="btn-delete-rule" data-type="${block.type}">🗑 Delete</button>
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
        const oldSel = currentSelector;
        const existingBlock = cssState.getBlock(oldSel);
        if (existingBlock) existingBlock.selector = newSel;

        currentSelector = newSel;
        container.setAttribute('data-selector', newSel);
        // Sync nested children's parent reference
        container.querySelectorAll('.css-nested-rule').forEach((child) => {
            child.setAttribute('data-parent-selector', newSel);
        });
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    deleteBtn.addEventListener('click', () => {
        const oldSelector = currentSelector;
        const oldBlockData = cssState.getBlock(oldSelector)
            ? JSON.parse(JSON.stringify(cssState.getBlock(oldSelector)))
            : null;
        cssState.removeBlock(oldSelector);
        container.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: isMedia ? `delete media ${oldSelector}` : `delete keyframes ${oldSelector}`,
            perform: () => {
                if (cssState.getBlock(oldSelector)) return;
                cssState.removeBlock(oldSelector);
                const existing = visualCssContainer.querySelector(
                    `.css-rule-box[data-selector="${CSS.escape(oldSelector)}"]`,
                );
                if (existing) existing.remove();
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                if (oldBlockData) {
                    cssState.addBlock(oldBlockData);
                    createContainerBoxUI(oldBlockData);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
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

        pushHistory({
            label: `add nested rule ${ruleSelector} in ${currentSelector}`,
            perform: () => {
                if (cssState.getBlock(ruleSelector, currentSelector)) return;
                cssState.addBlock(nestedBlock, currentSelector);
                const containerUi = visualCssContainer.querySelector(
                    `.css-rule-box[data-selector="${CSS.escape(currentSelector)}"]`,
                );
                if (containerUi) {
                    const zone = containerUi.querySelector('.css-rule-body-dropzone');
                    const ui = createNestedRuleBoxUI(nestedBlock, currentSelector);
                    zone.appendChild(ui);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                cssState.removeBlock(ruleSelector, currentSelector);
                const containerUi = visualCssContainer.querySelector(
                    `.css-rule-box[data-selector="${CSS.escape(currentSelector)}"]`,
                );
                if (containerUi) {
                    const nested = containerUi.querySelector(
                        `.css-nested-rule[data-selector="${CSS.escape(ruleSelector)}"]`,
                    );
                    if (nested) nested.remove();
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
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
                <button class="btn-delete-rule"><span class="mat-icon">close</span></button>
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
        const oldSelector = currentSelector;
        const oldParentSelector = parentSelector;
        const oldStyles = cssState.getBlock(oldSelector, oldParentSelector)
            ? { ...cssState.getBlock(oldSelector, oldParentSelector).styles }
            : {};
        cssState.removeBlock(oldSelector, oldParentSelector);
        ruleBox.remove();
        compileAndRenderCss();
        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);

        pushHistory({
            label: `delete nested rule ${oldSelector}`,
            perform: () => {
                if (cssState.getBlock(oldSelector, oldParentSelector)) return;
                cssState.removeBlock(oldSelector, oldParentSelector);
                const parentUi = visualCssContainer.querySelector(
                    `.css-rule-box[data-selector="${CSS.escape(oldParentSelector)}"]`,
                );
                if (parentUi) {
                    const nested = parentUi.querySelector(
                        `.css-nested-rule[data-selector="${CSS.escape(oldSelector)}"]`,
                    );
                    if (nested) nested.remove();
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
            rollback: () => {
                const nestedBlock = { type: 'rule', selector: oldSelector, styles: oldStyles };
                cssState.addBlock(nestedBlock, oldParentSelector);
                const parentUi = visualCssContainer.querySelector(
                    `.css-rule-box[data-selector="${CSS.escape(oldParentSelector)}"]`,
                );
                if (parentUi) {
                    const zone = parentUi.querySelector('.css-rule-body-dropzone');
                    const ui = createNestedRuleBoxUI(nestedBlock, oldParentSelector);
                    zone.appendChild(ui);
                }
                compileAndRenderCss();
                if (proj) saveProject(proj, false);
            },
        });
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
                <button class="btn-delete-rule">🗑 Delete</button>
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
            <button class="btn-remove-block">🗑</button>
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
        document.body.classList.add('mode-visual');
        document.body.classList.remove('mode-css');
        switchVisualBtn.classList.add('active');
        switchCssBtn.classList.remove('active');
    });
    switchCssBtn.addEventListener('click', () => {
        document.body.classList.add('mode-css');
        document.body.classList.remove('mode-visual');
        switchCssBtn.classList.add('active');
        switchVisualBtn.classList.remove('active');
    });
}

// Menu bar: open/close dropdowns and dispatch menu actions.
function initMenus() {
    const triggers = document.querySelectorAll('.menu-trigger');
    const panels = document.querySelectorAll('.menu-panel');

    triggers.forEach((tr) => {
        tr.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = tr.getAttribute('data-menu');
            const panel = document.getElementById(targetId);
            if (!panel) return;
            const isOpen = panel.classList.contains('open');
            panels.forEach((p) => p.classList.remove('open'));
            if (!isOpen) panel.classList.add('open');
        });
    });

    panels.forEach((p) => {
        p.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            panels.forEach((p2) => p2.classList.remove('open'));

            switch (action) {
                case 'import':
                    document.getElementById('import-modal').style.display = 'flex';
                    break;
                case 'preview':
                    document.getElementById('btn-preview').click();
                    break;
                case 'grid':
                    document.body.classList.toggle('show-grid');
                    break;
                case 'outlines':
                    document.body.classList.toggle('show-outlines');
                    break;
                case 'undo':
                    history.undo();
                    break;
                case 'redo':
                    history.redo();
                    break;
                case 'save':
                    document.getElementById('btn-save-project').click();
                    break;
                case 'export':
                    document.getElementById('btn-export').click();
                    break;
                case 'open':
                    showOpenProjectModal();
                    break;
                case 'copy':
                    copySelectedToClipboard();
                    break;
                case 'paste':
                    pasteFromClipboard();
                    break;
                case 'cut':
                    cutSelectedElement();
                    break;
                case 'rulers':
                    document.body.classList.toggle('show-rulers');
                    break;
                case 'theme-light':
                    setTheme('light');
                    break;
                case 'theme-dark':
                    setTheme('dark');
                    break;
                case 'theme-system':
                    setTheme('system');
                    break;
                case 'locale-en':
                    localStorage.setItem('lc-locale', 'en');
                    location.reload();
                    break;
                case 'locale-zh-TW':
                    localStorage.setItem('lc-locale', 'zh-TW');
                    location.reload();
                    break;
            }
        });
    });

    document.addEventListener('click', () => {
        panels.forEach((p) => p.classList.remove('open'));
    });
}

/* ── Theme toggling ── */
function setTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('theme-dark', prefersDark);
        document.body.classList.remove('theme-light');
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
    }
    localStorage.setItem('lc-theme', theme);
}

function applySavedTheme() {
    const saved = localStorage.getItem('lc-theme');
    if (saved) {
        setTheme(saved);
    } else {
        // Default to system
        setTheme('system');
    }
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = localStorage.getItem('lc-theme') || 'system';
        if (current === 'system') setTheme('system');
    });
}

function applySavedLocale() {
    const saved = localStorage.getItem('lc-locale');
    if (saved) {
        setLocale(saved);
    }
}

function initZoom() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomLabel = document.getElementById('zoom-level');
    const canvas = document.getElementById('canvas');
    if (!zoomIn || !zoomOut || !zoomLabel || !canvas) return;

    let zoom = 1;
    const MIN = 0.25;
    const MAX = 2;

    function applyZoom() {
        canvas.style.transform = `scale(${zoom})`;
        canvas.style.width = `${100 / zoom}%`;
        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
        canvas.classList.toggle('zoomed', zoom !== 1);
    }

    zoomIn.addEventListener('click', () => {
        zoom = Math.min(MAX, Math.round((zoom + 0.1) * 100) / 100);
        applyZoom();
    });

    zoomOut.addEventListener('click', () => {
        zoom = Math.max(MIN, Math.round((zoom - 0.1) * 100) / 100);
        applyZoom();
    });
}

function initBreakpoints() {
    const buttons = document.querySelectorAll('.bp-toggle .btn-secondary[data-bp]');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const bp = btn.dataset.bp;
            buttons.forEach((b) => b.classList.remove('active'));
            if (bp === 'none') {
                document.body.removeAttribute('data-bp');
            } else {
                document.body.setAttribute('data-bp', bp);
                btn.classList.add('active');
            }
        });
    });
}

function initOutlinesToggle() {
    document.getElementById('btn-outlines')?.addEventListener('click', () => {
        document.body.classList.toggle('show-outlines');
    });
}

function showOpenProjectModal() {
    const modal = document.getElementById('open-modal');
    const list = document.getElementById('open-project-list');
    const btnCancel = document.getElementById('btn-open-cancel');
    if (!modal || !list) return;

    // Populate project list
    const raw = localStorage.getItem('layoutcraft_project_list');
    const projects = raw ? JSON.parse(raw) : ['Default_Project'];
    list.innerHTML = '';
    projects.forEach((proj) => {
        const item = document.createElement('div');
        item.className = 'open-project-item';

        const name = document.createElement('span');
        name.className = 'open-project-name';
        name.textContent = proj.replace(/_/g, ' ');

        const actions = document.createElement('span');
        actions.className = 'open-project-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn-secondary';
        loadBtn.innerHTML = '<span class="mat-icon">folder_open</span> Load';
        loadBtn.addEventListener('click', () => {
            document.getElementById('select-project').value = proj;
            document.getElementById('select-project').dispatchEvent(new Event('change'));
            modal.style.display = 'none';
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-secondary';
        delBtn.style.color = '#ef4444';
        delBtn.innerHTML = '<span class="mat-icon">delete</span> Delete';
        delBtn.addEventListener('click', () => {
            if (!confirm(`Delete "${proj.replace(/_/g, ' ')}"?`)) return;
            localStorage.removeItem(`layoutcraft_proj_${proj}`);
            const updated = JSON.parse(localStorage.getItem('layoutcraft_project_list')) || [];
            const idx = updated.indexOf(proj);
            if (idx !== -1) updated.splice(idx, 1);
            if (updated.length === 0) updated.push('Default_Project');
            localStorage.setItem('layoutcraft_project_list', JSON.stringify(updated));
            showOpenProjectModal();
        });

        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);
        item.appendChild(name);
        item.appendChild(actions);
        list.appendChild(item);
    });

    modal.style.display = 'flex';

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

function copySelectedToClipboard() {
    const sel = document.querySelector('.canvas-container .selected-element');
    if (sel) clipboardElement = sel.cloneNode(true);
}

function pasteFromClipboard() {
    if (!clipboardElement) return;
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
}

function cutSelectedElement() {
    const sel = document.querySelector('.canvas-container .selected-element');
    if (!sel) return;
    clipboardElement = sel.cloneNode(true);
    const parent = sel.parentNode;
    const next = sel.nextSibling;
    sel.remove();
    deselectAll();
    pushHistory({
        label: 'Cut element',
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
}

// Undo/Redo toolbar buttons + global keyboard shortcuts.
// Buttons reflect canUndo/canRedo via the history subscribe channel.
function initImporter() {
    const modal = document.getElementById('import-modal');
    const btnCancel = document.getElementById('btn-import-cancel');
    const btnSubmit = document.getElementById('btn-import-submit');
    const htmlInput = document.getElementById('import-html-input');
    const cssInput = document.getElementById('import-css-input');

    if (!modal) return;

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

    btnUndo.title = t('ui.history.undo');
    btnRedo.title = t('ui.history.redo');

    const applyState = ({ canUndo, canRedo }) => {
        btnUndo.disabled = !canUndo;
        btnUndo.style.opacity = canUndo ? '1' : '0.45';
        btnRedo.disabled = !canRedo;
        btnRedo.style.opacity = canRedo ? '1' : '0.45';
    };
    history.subscribe(applyState);

    btnUndo.addEventListener('click', () => history.undo());
    btnRedo.addEventListener('click', () => history.redo());

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
            copySelectedToClipboard();
            return;
        }

        // Paste
        if (ctrl && key === 'v') {
            if (!clipboardElement) return;
            e.preventDefault();
            pasteFromClipboard();
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

        // Ctrl+D — Duplicate selected element
        if (ctrl && key === 'd') {
            e.preventDefault();
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            const parent = sel.parentNode;
            if (!parent) return;
            const clone = sel.cloneNode(true);
            const next = sel.nextSibling;
            if (next) parent.insertBefore(clone, next);
            else parent.appendChild(clone);
            selectElement(clone);
            pushHistory({
                label: 'Duplicate element',
                perform: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(clone, next);
                    else parent.appendChild(clone);
                    selectElement(clone);
                },
                rollback: () => {
                    clone.remove();
                    selectElement(sel);
                },
            });
            return;
        }

        // Ctrl+/ — Toggle mode
        if (ctrl && key === '/') {
            e.preventDefault();
            const isVisual = document.body.classList.contains('mode-visual');
            const visualBtn = document.getElementById('switch-visual');
            const cssBtn = document.getElementById('switch-css');
            if (isVisual) {
                document.body.classList.add('mode-css');
                document.body.classList.remove('mode-visual');
                if (cssBtn) cssBtn.classList.add('active');
                if (visualBtn) visualBtn.classList.remove('active');
            } else {
                document.body.classList.add('mode-visual');
                document.body.classList.remove('mode-css');
                if (visualBtn) visualBtn.classList.add('active');
                if (cssBtn) cssBtn.classList.remove('active');
            }
            return;
        }

        // Arrow keys — nudge selected element by 1px (or 10px with Shift)
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const delta = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
            const deltaX = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
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
