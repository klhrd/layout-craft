import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector } from './modules/inspector.js';
import { initExporter } from './modules/exporter.js';

const liveStyles = document.getElementById('live-styles');
const globalCssTextarea = document.getElementById('global-css-textarea');

document.addEventListener('DOMContentLoaded', () => {
    renderToolbox();
    renderCssDictionary();
    initCanvas();
    initInspector();
    initExporter();
    initModeSwitcher();
    initLiveCssRenderer();
});

// 1. 渲染元件庫（預設收合）
function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    
    for (const [key, category] of Object.entries(ELEMENT_CATEGORIES)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header collapsed'; // 💡 加了 collapsed，預設收合
        categoryHeader.textContent = category.title;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed'; // 💡 加了 collapsed，預設隱藏

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('collapsed');
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

// 2. 渲染 CSS 字典（預設收合）
function renderCssDictionary() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    
    for (const [key, category] of Object.entries(CSS_DICTIONARY)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header collapsed'; // 預設收合
        categoryHeader.textContent = category.title;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed';

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('collapsed');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach(item => {
            const cssValue = Object.values(item)[0];
            const dictBtn = document.createElement('button');
            dictBtn.className = 'dict-item';
            dictBtn.textContent = cssValue;
            
            // 點擊字典內的屬性，自動黏貼進全域 CSS 編輯器中
            dictBtn.addEventListener('click', () => {
                const startPos = globalCssTextarea.selectionStart;
                const endPos = globalCssTextarea.selectionEnd;
                const text = globalCssTextarea.value;
                
                // 插入屬性並自動換行縮排
                globalCssTextarea.value = text.substring(0, startPos) + `\n    ${cssValue}` + text.substring(endPos);
                // 觸發即時渲染
                liveStyles.textContent = globalCssTextarea.value;
                globalCssTextarea.focus();
            });

            itemsContainer.appendChild(dictBtn);
        });

        wrapper.appendChild(categoryHeader);
        wrapper.appendChild(itemsContainer);
        dictContainer.appendChild(wrapper);
    }
}

// 3. 工作模式切換（預設畫面 vs CSS編輯畫面）
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

// 4. 全域 CSS 即時監聽與渲染核心
function initLiveCssRenderer() {
    globalCssTextarea.addEventListener('input', () => {
        // 將使用者寫的標準 CSS 程式碼，即時灌入 <style id="live-styles"> 標籤中
        liveStyles.textContent = globalCssTextarea.value;
    });
}