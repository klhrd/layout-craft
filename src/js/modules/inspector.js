import { ELEMENT_CATEGORIES } from '../config/elements.js';

// src/js/modules/inspector.js 頂部變數宣告區
let selectedElement = null;

const canvas = document.getElementById('canvas');
const editorForm = document.getElementById('editor-form');
const noSelectionMsg = document.getElementById('no-selection-msg');
const selectedTagName = document.getElementById('selected-tag-name');
const inputId = document.getElementById('input-id');
const inputClass = document.getElementById('input-class');
const inputText = document.getElementById('input-text');
const btnDelete = document.getElementById('btn-delete');
let dynamicPropsContainer = null; // 保持這個

export function initInspector() {
    // 修正點：直接抓取 HTML 裡預留的容器，不要再用 parentNode.insertBefore
    dynamicPropsContainer = document.getElementById('dynamic-properties');

    canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target === canvas) {
            deselectAll();
            return;
        }
        selectElement(e.target);
    });

    // 基礎屬性監聽 (移除了 inputCss 的監聽，因為全域 CSS 改在 app.js 處理)
    inputId.addEventListener('input', () => { if (selectedElement) selectedElement.id = inputId.value; });
    inputClass.addEventListener('input', () => { if (selectedElement) selectedElement.className = inputClass.value + ' selected-element'; });
    inputText.addEventListener('input', () => {
        if (selectedElement) {
            let textNode = Array.from(selectedElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = inputText.value;
            else selectedElement.prepend(document.createTextNode(inputText.value));
        }
    });

    btnDelete.addEventListener('click', () => {
        if (selectedElement) {
            selectedElement.remove();
            deselectAll();
        }
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
    
    // 修正點：移除 inputCss.value = el.style.cssText;
    
    inputText.value = Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join('');

    renderDynamicAttributes(tagName, el);
}

// 根據元件標籤，動態渲染 href, src 等欄位
function renderDynamicAttributes(tagName, el) {
    dynamicPropsContainer.innerHTML = ''; // 先清空舊的動態欄位

    // 從 elements.js 設定檔中尋找該標籤是否有定義額外屬性
    let foundItem = null;
    for (const category of Object.values(ELEMENT_CATEGORIES)) {
        foundItem = category.items.find(item => item.tag === tagName);
        if (foundItem) break;
    }

    // 如果有定義額外屬性（例如 a 有 href，img 有 src）
    if (foundItem && foundItem.attributes) {
        foundItem.attributes.forEach(attr => {
            // 1. 建立 Label
            const label = document.createElement('label');
            label.textContent = attr.toUpperCase(); // 例如 HREF, SRC
            
            // 2. 建立 Input
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Enter ${attr}...`;
            input.value = el.getAttribute(attr) || '';

            // 3. 綁定輸入事件，即時同步回畫布上的元件
            input.addEventListener('input', () => {
                if (input.value.trim() === '') {
                    el.removeAttribute(attr); // 如果被清空就移除屬性
                } else {
                    el.setAttribute(attr, input.value);
                }
            });

            dynamicPropsContainer.appendChild(label);
            dynamicPropsContainer.appendChild(input);
        });
    }
}

export function deselectAll() {
    selectedElement = null;
    document.querySelectorAll('.canvas *').forEach(el => el.classList.remove('selected-element'));
    editorForm.classList.add('hidden');
    noSelectionMsg.classList.remove('hidden');
    if (dynamicPropsContainer) dynamicPropsContainer.innerHTML = '';
}