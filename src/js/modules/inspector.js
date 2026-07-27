import { ELEMENT_CATEGORIES } from '../config/elements.js';
import { t } from '../config/i18n.js';

// src/js/modules/inspector.js top-level variable declarations.
let selectedElement = null;

const canvas = document.getElementById('canvas');
const editorForm = document.getElementById('editor-form');
const noSelectionMsg = document.getElementById('no-selection-msg');
const selectedTagName = document.getElementById('selected-tag-name');
const inputId = document.getElementById('input-id');
const inputClass = document.getElementById('input-class');
const inputText = document.getElementById('input-text');
const btnDelete = document.getElementById('btn-delete');
let dynamicPropsContainer = null; // Keep this one.

export function initInspector() {
    // Fix: directly grab the reserved container from HTML instead of using parentNode.insertBefore.
    dynamicPropsContainer = document.getElementById('dynamic-properties');

    canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target === canvas) {
            deselectAll();
            return;
        }
        selectElement(e.target);
    });

    // Base attribute listeners (removed inputCss listener since global CSS is handled in app.js).
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
    
    // Fix: removed inputCss.value = el.style.cssText;
    
    inputText.value = Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .join('');

    renderDynamicAttributes(tagName, el);
}

// Dynamically render href, src, etc. fields based on the component's tag.
function renderDynamicAttributes(tagName, el) {
    dynamicPropsContainer.innerHTML = ''; // Clear previous dynamic fields first.

    // Look up the tag in elements.js config to see if extra attributes are defined for it.
    let foundItem = null;
    for (const category of Object.values(ELEMENT_CATEGORIES)) {
        foundItem = category.items.find(item => item.tag === tagName);
        if (foundItem) break;
    }

    // If extra attributes are defined (e.g., href for <a>, src for <img>).
    if (foundItem && foundItem.attributes) {
        foundItem.attributes.forEach(attr => {
            // 1. Create a label.
            const label = document.createElement('label');
            label.textContent = attr.toUpperCase(); // e.g., HREF, SRC
            
            // 2. Create an input.
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = t('ui.inspector.enterAttrPlaceholder', attr);
            input.value = el.getAttribute(attr) || '';

            // 3. Bind input event for live sync back to the canvas element.
            input.addEventListener('input', () => {
                if (input.value.trim() === '') {
                    el.removeAttribute(attr); // Remove the attribute if cleared.
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
