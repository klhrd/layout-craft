import { selectElement } from './inspector.js';
import { t } from '../config/i18n.js';

let draggedType = null;
const canvas = document.getElementById('canvas'); // Grabs .canvas-container.

export function initCanvas() {
    makeElementSortable(canvas);
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
}

export function makeElementSortable(element) {
    new Sortable(element, {
        group: 'shared-nested',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
    });
}

export function setDraggedType(type) {
    draggedType = type;
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedType) return;

    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) placeholder.remove();

    const newElement = document.createElement(draggedType);

    // Only tags that allow text nodes get default text.
    const textAllowedTags = [
        'h1',
        'h2',
        'h3',
        'p',
        'a',
        'span',
        'button',
        'strong',
        'em',
        'label',
        'option',
        'th',
        'td',
        'li',
    ];
    if (textAllowedTags.includes(draggedType)) {
        newElement.textContent = t('ui.newElementText', draggedType.toUpperCase());
    }

    // Inputs and imgs have no intrinsic size; give them initial editable attributes so they're visible.
    if (draggedType === 'input') {
        newElement.setAttribute('type', 'text');
        newElement.setAttribute('placeholder', t('ui.storage.newInnerText'));
    } else if (draggedType === 'img') {
        newElement.setAttribute('src', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'); // A nice default abstract placeholder.
        newElement.setAttribute('alt', t('ui.storage.placeholderImageAlt'));
    } else if (draggedType === 'iframe') {
        newElement.setAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ'); // Classic easter egg preview.
        newElement.style.width = '100%';
        newElement.style.height = '200px';
    }

    const target = e.target;
    if (target === canvas) {
        canvas.appendChild(newElement);
    } else {
        target.appendChild(newElement);
    }

    // Tags that support nested layout (Sortable).
    const containerTags = [
        'div',
        'section',
        'header',
        'footer',
        'main',
        'aside',
        'nav',
        'form',
        'ul',
        'ol',
        'table',
        'tr',
    ];
    if (containerTags.includes(draggedType)) {
        makeElementSortable(newElement);
    }

    draggedType = null;
    selectElement(newElement);
}
