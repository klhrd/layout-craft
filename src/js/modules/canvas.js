import { selectElement } from './inspector.js';

let draggedType = null;
const canvas = document.getElementById('canvas'); // 這會抓到 .canvas-container

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
    
    if (['h1', 'h2', 'p', 'a', 'span', 'button'].includes(draggedType)) {
        newElement.textContent = `New ${draggedType.toUpperCase()}`;
    }

    let target = e.target;
    if (target === canvas) {
        canvas.appendChild(newElement);
    } else {
        // 如果丟在元件內部，塞進該元件
        target.appendChild(newElement);
    }

    if (['div', 'header', 'footer', 'main', 'aside', 'nav'].includes(draggedType)) {
        makeElementSortable(newElement);
    }

    draggedType = null;
    selectElement(newElement);
}