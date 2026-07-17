let selectedElement = null;

const canvas = document.getElementById('canvas');
const editorForm = document.getElementById('editor-form');
const noSelectionMsg = document.getElementById('no-selection-msg');
const selectedTagName = document.getElementById('selected-tag-name');
const inputId = document.getElementById('input-id');
const inputClass = document.getElementById('input-class');
const inputText = document.getElementById('input-text');
const inputCss = document.getElementById('input-css');
const btnDelete = document.getElementById('btn-delete');

export function initInspector() {
    canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target === canvas) {
            deselectAll();
            return;
        }
        selectElement(e.target);
    });

    // 綁定輸入即時預覽
    inputId.addEventListener('input', () => { if (selectedElement) selectedElement.id = inputId.value; });
    inputClass.addEventListener('input', () => { if (selectedElement) selectedElement.className = inputClass.value + ' selected-element'; });
    inputCss.addEventListener('input', () => { 
        if (selectedElement) {
            selectedElement.style.cssText = inputCss.value;
            selectedElement.classList.add('selected-element');
        }
    });
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

    selectedTagName.textContent = el.tagName.toLowerCase();
    inputId.value = el.id || '';
    inputClass.value = el.className.replace('selected-element', '').trim();
    
    inputCss.value = el.style.cssText;
    inputText.value = Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join('');
}

export function deselectAll() {
    selectedElement = null;
    document.querySelectorAll('.canvas *').forEach(el => el.classList.remove('selected-element'));
    editorForm.classList.add('hidden');
    noSelectionMsg.classList.remove('hidden');
}