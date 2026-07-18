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

// 在右側介面建立一個全新的、支援「隨時編輯」與「閃爍偵測」的 CSS 選擇器大盒子
function createRuleBoxUI(selector) {
    const ruleBox = document.createElement('div');
    ruleBox.className = 'css-rule-box';
    ruleBox.setAttribute('data-selector', selector);

    // 💡 升級處：將標題改為輸入框（可直接修改），並加入 🎯 Hunt 偵測按鈕
    ruleBox.innerHTML = `
        <div class="css-rule-header">
            <div style="display: flex; align-items: center; gap: 4px;">
                <input type="text" class="editable-selector-input" value="${selector}">
                <span style="color: #94a3b8">{</span>
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn-hunt-elements" title="Blink matching elements on canvas">🎯 Detect</button>
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

    let currentSelector = selector; // 追蹤當前盒子的選擇器名稱

    // 💡【功能 1：選擇器建立後允許繼續編輯】
    selectorInput.addEventListener('change', () => {
        const newSelector = selectorInput.value.trim();
        if (!newSelector || newSelector === currentSelector) {
            selectorInput.value = currentSelector;
            return;
        }
        if (activeCssData[newSelector]) {
            alert('This selector name already exists!');
            selectorInput.value = currentSelector;
            return;
        }

        // 轉移記憶體中的資料到新選擇器名稱下
        activeCssData[newSelector] = activeCssData[currentSelector];
        delete activeCssData[currentSelector]; // 刪除舊的
        
        // 如果目前正在偵測閃爍，先關閉舊的閃爍
        if (huntBtn.classList.contains('active')) {
            toggleCanvasBlinking(currentSelector, false);
            toggleCanvasBlinking(newSelector, true);
        }

        currentSelector = newSelector; // 更新指引
        ruleBox.setAttribute('data-selector', newSelector);
        compileAndRenderCss(); // 重新編譯渲染
    });

    // 💡【功能 2：開關打開後，受影響元素會閃爍提示】
    huntBtn.addEventListener('click', () => {
        const isActive = huntBtn.classList.toggle('active');
        if (isActive) {
            huntBtn.textContent = '🎯 Blinking';
            toggleCanvasBlinking(currentSelector, true); // 開啟閃爍
        } else {
            huntBtn.textContent = '🎯 Detect';
            toggleCanvasBlinking(currentSelector, false); // 關閉閃爍
        }
    });

    // 刪除按鈕邏輯
    deleteBtn.addEventListener('click', () => {
        toggleCanvasBlinking(currentSelector, false); // 刪除前先確保清除畫布閃爍
        delete activeCssData[currentSelector];
        ruleBox.remove();
        compileAndRenderCss();
    });

    // 處理屬性積木丟入大盒子的事件 (維持原邏輯)
    dropzone.addEventListener('dragover', (e) => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedCssBlockData) return;

        const { property, defaultValue, label } = draggedCssBlockData;
        
        if (!activeCssData[currentSelector][property]) {
            activeCssData[currentSelector][property] = defaultValue;
            addAppliedBlockUI(dropzone, currentSelector, property, label, defaultValue);
            compileAndRenderCss();
        }
        draggedCssBlockData = null;
    });

    visualCssContainer.appendChild(ruleBox);
}

// 💡 輔助函數：控制畫布中符合選擇器的元素閃爍
function toggleCanvasBlinking(selector, shouldBlink) {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    try {
        // 只針對畫布容器內部的子元件進行搜尋，不污染外圍編輯器
        const matchingElements = canvas.querySelectorAll(selector);
        
        matchingElements.forEach(el => {
            if (shouldBlink) {
                el.classList.add('css-hunting-active');
            } else {
                el.classList.remove('css-hunting-active');
            }
        });
    } catch (error) {
        // 防呆：如果使用者輸入了不合法的 CSS 選擇器語法（例如點打到一半），捕獲錯誤不崩潰
        console.warn("Invalid CSS Selector query: ", selector);
    }
}

// 修改 addAppliedBlockUI 以支援連動（因為選擇器有可能在半路改名，我們直接從 DOM 往上抓最新的 data-selector）
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
        // 💡 關鍵優化：隨時動態向上查找外殼大盒子目前的最新選擇器名稱
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        
        if (activeCssData[currentSelector]) {
            activeCssData[currentSelector][property] = valueInput.value;
            compileAndRenderCss();
        }
    });

    block.querySelector('.btn-remove-block').addEventListener('click', () => {
        const parentBox = dropzone.closest('.css-rule-box');
        const currentSelector = parentBox.getAttribute('data-selector');
        
        if (activeCssData[currentSelector]) {
            delete activeCssData[currentSelector][property];
        }
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