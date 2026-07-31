import { CSS_DICTIONARY } from '../config/cssDictionary.js';
import { t } from '../config/i18n.js';
import * as cssState from './cssState.js';
import { push as pushHistory } from './history.js';
import { saveProject } from './storage.js';
import { createTokenPickerButton } from './tokenPicker.js';

const liveStyles = document.getElementById('live-styles');
const visualCssContainer = document.getElementById('visual-css-container');
const inputNewSelector = document.getElementById('input-new-selector');
const btnAddSelector = document.getElementById('btn-add-selector');

export let draggedCssBlockData = null;
export function setDraggedCssBlockData(data) {
    draggedCssBlockData = data;
}

export function initVisualCssActions() {
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

export function initCssEditorCollapse() {
    const toggle = document.getElementById('css-editor-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
        toggle.parentElement.classList.toggle('collapsed');
    });
}

export function initRuleBoxCollapse() {
    if (!visualCssContainer) return;
    visualCssContainer.addEventListener('click', (e) => {
        const toggle = e.target.closest('.css-rule-toggle');
        if (!toggle) return;
        const ruleBox = toggle.closest('.css-rule-box');
        if (!ruleBox) return;
        const collapsed = ruleBox.classList.toggle('collapsed');
        toggle.title = collapsed ? t('ui.detection.expand') : t('ui.detection.collapse');
    });
}

export function createContainerBoxUI(block) {
    const container = document.createElement('div');
    container.className = 'css-rule-box css-container-box';
    container.setAttribute('data-selector', block.selector);

    const isMedia = block.type === 'media';
    const label = isMedia ? 'Media Query' : 'Keyframes';

    container.innerHTML = `
        <div class="css-rule-header">
            <button type="button" class="css-rule-toggle" title="${t('ui.detection.collapse')}"><span class="mat-icon">keyboard_arrow_down</span></button>
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
        <div class="css-rule-close" style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
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
            <button type="button" class="css-rule-toggle" title="${t('ui.detection.collapse')}"><span class="mat-icon">keyboard_arrow_down</span></button>
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
        <div class="css-rule-close" style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
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

export function createRuleBoxUI(selector) {
    const ruleBox = document.createElement('div');
    ruleBox.className = 'css-rule-box';
    ruleBox.setAttribute('data-selector', selector);

    ruleBox.innerHTML = `
        <div class="css-rule-header">
            <button type="button" class="css-rule-toggle" title="${t('ui.detection.collapse')}"><span class="mat-icon">keyboard_arrow_down</span></button>
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
        <div class="css-rule-close" style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
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
        // ignore invalid selector
    }
}

export function addAppliedBlockUI(dropzone, initialSelector, property, label, value) {
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

    const tokenPicker = createTokenPickerButton({
        currentValue: value,
        onPick: (val) => {
            valueInput.value = val;
            valueInput.dispatchEvent(new Event('input'));
        },
    });
    const controlsRow = block.querySelector('div');
    controlsRow.insertBefore(tokenPicker, controlsRow.querySelector('.btn-remove-block'));
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
    const tokens = cssState.getTokens();
    const tokenEntries = Object.entries(tokens);
    if (tokenEntries.length) {
        cssString += ':root {\n';
        for (const [name, value] of tokenEntries) {
            cssString += `  ${name}: ${value};\n`;
        }
        cssString += '}\n\n';
    }
    for (const block of cssState.getBlocks()) {
        cssString += emitBlock(block, 0);
    }
    liveStyles.textContent = cssString;
}

export function getActiveCssCode() {
    return liveStyles.textContent;
}
