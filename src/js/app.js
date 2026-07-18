import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector } from './modules/inspector.js';
import { initExporter } from './modules/exporter.js';
import { initStorage, saveProject } from './modules/storage.js';

const liveStyles = document.getElementById('live-styles');
const visualCssContainer = document.getElementById('visual-css-container');
const inputNewSelector = document.getElementById('input-new-selector');
const btnAddSelector = document.getElementById('btn-add-selector');

// 將 activeCssData 提升為全域物件，以便 storage.js 打包
window.activeCssData = {}; 
let draggedCssBlockData = null;

document.addEventListener('DOMContentLoaded', () => {
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
    
    initStorage(); // 啟動儲存管理器
    
    // 設定每 30 秒自動靜默存檔防呆機制
    setInterval(() => {
        const currentProj = document.getElementById('select-project').value;
        if (currentProj) saveProject(currentProj, false);
    }, 30000);
});

// 1. 渲染元件庫（預設收合）
function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    if (!toolboxContainer) return;
    toolboxContainer.innerHTML = '<div class="brand-title">LayoutCraft</div>'; // 清空防重複並加上標題
    
    for (const [key, category] of Object.entries(ELEMENT_CATEGORIES)) {
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
        
        category.items.forEach(item => {
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
}

// 2. 將 CSS 字典渲染成可拖拽的「屬性積木」
function renderCssDictionaryBlocks() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    if (!dictContainer) return;
    dictContainer.innerHTML = '<div class="brand-title">CSS Blocks</div>'; // 清空防重複並加上標題
    
    for (const [key, category] of Object.entries(CSS_DICTIONARY)) {
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

        category.items.forEach(item => {
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

// 3. 圖形化 CSS 規則區與積木拖放核心邏輯
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
    });
}

// 暴露給全域：當舊檔案被載入時，負責在右側 UI 把大盒子與填入格子精準重新組裝出來
window.rebuildCssRulesUI = function() {
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
            const found = cat.items.find(i => i.property === prop);
            if (found) { labelName = found.label; break; }
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
                <button class="btn-hunt-elements">🎯 Detect</button>
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
        if (!newSelector || newSelector === currentSelector) { selectorInput.value = currentSelector; return; }
        if (window.activeCssData[newSelector]) { alert('Name exists!'); selectorInput.value = currentSelector; return; }

        window.activeCssData[newSelector] = window.activeCssData[currentSelector];
        delete window.activeCssData[currentSelector];
        
        if (huntBtn.classList.contains('active')) {
            toggleCanvasBlinking(currentSelector, false);
            toggleCanvasBlinking(newSelector, true);
        }
        currentSelector = newSelector;
        ruleBox.setAttribute('data-selector', newSelector);
        compileAndRenderCss();
        saveProject(document.getElementById('select-project').value, false);
    });

    huntBtn.addEventListener('click', () => {
        const isActive = huntBtn.classList.toggle('active');
        if (isActive) { huntBtn.textContent = '🎯 Blinking'; toggleCanvasBlinking(currentSelector, true); } 
        else { huntBtn.textContent = '🎯 Detect'; toggleCanvasBlinking(currentSelector, false); }
    });

    deleteBtn.addEventListener('click', () => {
        toggleCanvasBlinking(currentSelector, false);
        delete window.activeCssData[currentSelector];
        ruleBox.remove();
        compileAndRenderCss();
        saveProject(document.getElementById('select-project').value, false);
    });

    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCssBlockData) return;

        const { property, defaultValue, label } = draggedCssBlockData;
        if (!window.activeCssData[currentSelector][property]) {
            window.activeCssData[currentSelector][property] = defaultValue;
            addAppliedBlockUI(dropzone, currentSelector, property, label, defaultValue);
            compileAndRenderCss();
            saveProject(document.getElementById('select-project').value, false);
        }
        draggedCssBlockData = null;
    });

    visualCssContainer.appendChild(ruleBox);
}

function toggleCanvasBlinking(selector, shouldBlink) {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    try {
        const matchingElements = canvas.querySelectorAll(selector);
        matchingElements.forEach(el => {
            if (shouldBlink) el.classList.add('css-hunting-active');
            else el.classList.remove('css-hunting-active');
        });
    } catch (e) {}
}

function addAppliedBlockUI(dropzone, initialSelector, property, label, value) {
    const block = document.createElement('div');
    block.className = 'applied-css-block';
    block.innerHTML = `
        <span class="block-label">${property}:</span>
        <div style="display: flex; align-items: center;">
            <input type="text" class="block-value-input" value="${value}">
            <button class="btn-remove-block">🗑️</button>
        </div>
    `;

    const valueInput = block.querySelector('.block-value-input');
    valueInput.addEventListener('input', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        if (window.activeCssData[currentSelector]) {
            window.activeCssData[currentSelector][property] = valueInput.value;
            compileAndRenderCss();
            saveProject(document.getElementById('select-project').value, false);
        }
    });

    block.querySelector('.btn-remove-block').addEventListener('click', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        if (window.activeCssData[currentSelector]) delete window.activeCssData[currentSelector][property];
        block.remove();
        compileAndRenderCss();
        saveProject(document.getElementById('select-project').value, false);
    });

    dropzone.appendChild(block);
}

export function compileAndRenderCss() {
    let cssString = "";
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
    
    switchVisualBtn.addEventListener('click', () => { document.body.className = 'mode-visual'; switchVisualBtn.classList.add('active'); switchCssBtn.classList.remove('active'); });
    switchCssBtn.addEventListener('click', () => { document.body.className = 'mode-css'; switchCssBtn.classList.add('active'); switchVisualBtn.classList.remove('active'); });
}