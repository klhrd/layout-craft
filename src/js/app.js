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

function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    
    for (const [key, category] of Object.entries(ELEMENT_CATEGORIES)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header'; // 預設收合狀態
        categoryHeader.textContent = category.title;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed'; // 預設隱藏

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

function renderCssDictionary() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    
    for (const [key, category] of Object.entries(CSS_DICTIONARY)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header'; // 預設收合狀態
        categoryHeader.textContent = category.title;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed'; // 預設隱藏

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('active');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach(item => {
            const cssValue = Object.values(item)[0];
            const dictBtn = document.createElement('button');
            dictBtn.className = 'dict-item';
            dictBtn.textContent = cssValue;
            
            dictBtn.addEventListener('click', () => {
                const startPos = globalCssTextarea.selectionStart;
                const endPos = globalCssTextarea.selectionEnd;
                const text = globalCssTextarea.value;
                globalCssTextarea.value = text.substring(0, startPos) + `\n    ${cssValue}` + text.substring(endPos);
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

function initLiveCssRenderer() {
    globalCssTextarea.addEventListener('input', () => {
        liveStyles.textContent = globalCssTextarea.value;
    });
}