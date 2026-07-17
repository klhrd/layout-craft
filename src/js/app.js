import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector } from './modules/inspector.js';
import { initExporter } from './modules/exporter.js';

const liveStyles = document.getElementById('live-styles');
const visualCssContainer = document.getElementById('visual-css-container');
const inputNewSelector = document.getElementById('input-new-selector');
const btnAddSelector = document.getElementById('btn-add-selector');

// 儲存目前所有視覺化 CSS 規則的記憶體資料結構
// 格式: { ".my-class": { "color": "red", "padding": "10px" } }
let activeCssData = {}; 
let draggedCssBlockData = null; // 暫存目前正在被拖拽的 CSS 積木基因

document.addEventListener('DOMContentLoaded', () => {
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
});

// 1. 渲染元件庫（預設收合）
function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
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

// 2. 🎛️ 將 CSS 字典渲染成可拖拽的「屬性積木」
function renderCssDictionaryBlocks() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    
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
            
            // 當開始拖拽 CSS 積木時，記錄它的基因資料
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

// 3. 🧱 圖形化 CSS 規則區與積木拖放核心邏輯
function initVisualCssActions() {
    // 點擊「+ Add Rule」按鈕建立一個新選擇器大盒子（例如 .box）
    btnAddSelector.addEventListener('click', () => {
        const selectorText = inputNewSelector.value.trim();
        if (!selectorText) return;
        if (activeCssData[selectorText]) {
            alert('This CSS selector already exists!');
            return;
        }

        activeCssData[selectorText] = {}; // 初始化該選擇器的樣式物件
        createRuleBoxUI(selectorText);
        inputNewSelector.value = '';
        compileAndRenderCss();
    });
}

// 在右側介面建立一個 CSS 選擇器大盒子
function createRuleBoxUI(selector) {
    const ruleBox = document.createElement('div');
    ruleBox.className = 'css-rule-box';
    ruleBox.setAttribute('data-selector', selector);

    ruleBox.innerHTML = `
        <div class="css-rule-header">
            <span>${selector} {</span>
            <button class="btn-delete-rule">❌ Delete</button>
        </div>
        <div class="css-rule-body-dropzone"></div>
        <div style="font-weight: bold; font-size: 0.85rem; color: #334155;">}</div>
    `;

    // 刪除整條 CSS 規則
    ruleBox.querySelector('.btn-delete-rule').addEventListener('click', () => {
        delete activeCssData[selector];
        ruleBox.remove();
        compileAndRenderCss();
    });

    const dropzone = ruleBox.querySelector('.css-rule-body-dropzone');

    // 處理積木丟入大盒子的事件
    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCssBlockData) return; // 確保丟進來的是 CSS 積木而不是畫布元件

        const { property, defaultValue, label } = draggedCssBlockData;
        
        // 如果該選擇器還沒設定過這個屬性，就加入
        if (!activeCssData[selector][property]) {
            activeCssData[selector][property] = defaultValue;
            addAppliedBlockUI(dropzone, selector, property, label, defaultValue);
            compileAndRenderCss();
        }
        
        draggedCssBlockData = null; // 重置
    });

    visualCssContainer.appendChild(ruleBox);
}

// 在大盒子內動態長出「帶有填入格子」的屬性積木
function addAppliedBlockUI(dropzone, selector, property, label, value) {
    const block = document.createElement('div');
    block.className = 'applied-css-block';
    
    block.innerHTML = `
        <span class="block-label">${property}:</span>
        <div style="display: flex; align-items: center;">
            <input type="text" class="block-value-input" value="${value}">
            <button class="btn-remove-block">🗑️</button>
        </div>
    `;

    // 💡【填入的格子】監聽輸入框的即時改動
    const valueInput = block.querySelector('.block-value-input');
    valueInput.addEventListener('input', () => {
        activeCssData[selector][property] = valueInput.value; // 即時同步數值
        compileAndRenderCss(); // 即時渲染畫布
    });

    // 移除單個屬性積木
    block.querySelector('.btn-remove-block').addEventListener('click', () => {
        delete activeCssData[selector][property];
        block.remove();
        compileAndRenderCss();
    });

    dropzone.appendChild(block);
}

// 🔏 核心編譯器：將 activeCssData 物件轉化為真正的標準 CSS 字串，灌入 <style> 標籤中
export function compileAndRenderCss() {
    let cssString = "";
    for (const [selector, styles] of Object.entries(activeCssData)) {
        cssString += `${selector} {\n`;
        for (const [prop, val] of Object.entries(styles)) {
            cssString += `  ${prop}: ${val};\n`;
        }
        cssString += `}\n\n`;
    }
    liveStyles.textContent = cssString; // 毫秒級即時渲染畫布
}

// 取得目前的自訂 CSS 資料，供 Exporter 匯出使用
export function getActiveCssCode() {
    let cssString = "";
    for (const [selector, styles] of Object.entries(activeCssData)) {
        cssString += `${selector} {\n`;
        for (const [prop, val] of Object.entries(styles)) {
            cssString += `  ${prop}: ${val};\n`;
        }
        cssString += `}\n\n`;
    }
    return cssString;
}

// 4. 工作模式切換控制
function initModeSwitcher() {
    const switchVisualBtn = document.getElementById('switch-visual');
    const switchCssBtn = document.getElementById('switch-css');

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