import { selectElement } from './inspector.js';

let draggedType = null;
const canvas = document.getElementById('canvas');

export function initCanvas() {
    // 讓畫布本身可排序
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

    const placeholder = document.querySelector('.canvas-placeholder');
    if (placeholder) placeholder.remove();

    const newElement = document.createElement(draggedType);
    
    // 設定預設文字
    if (['h1', 'h2', 'p', 'a', 'span', 'button'].includes(draggedType)) {
        newElement.textContent = `New ${draggedType.toUpperCase()}`;
    }

    // 判斷疊套結構
    let target = e.target;
    if (target === canvas) {
        canvas.appendChild(newElement);
    } else {
        target.appendChild(newElement);
    }

    // 如果是容器元件，賦予它也可以被別人塞東西的能力
    if (['div', 'header', 'footer', 'main', 'aside', 'nav'].includes(draggedType)) {
        makeElementSortable(newElement);
    }

    draggedType = null;
    selectElement(newElement);
}