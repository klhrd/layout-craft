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
    
    // 💡 修正點：只有這些允許有文字節點的標籤才給予預設文字
    const textAllowedTags = ['h1', 'h2', 'h3', 'p', 'a', 'span', 'button', 'strong', 'em', 'label', 'option', 'th', 'td', 'li'];
    if (textAllowedTags.includes(draggedType)) {
        newElement.textContent = `New ${draggedType.toUpperCase()}`;
    }

    // 💡 為了防範表單中的 input、img 預設沒有長寬會看不見，給予一些初始編輯屬性
    if (draggedType === 'input') {
        newElement.setAttribute('type', 'text');
        newElement.setAttribute('placeholder', 'Type something...');
    } else if (draggedType === 'img') {
        newElement.setAttribute('src', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'); // 給一張預設漂亮的抽象圖
        newElement.setAttribute('alt', 'Placeholder Image');
    } else if (draggedType === 'iframe') {
        newElement.setAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ'); // 經典彩蛋預覽
        newElement.style.width = '100%';
        newElement.style.height = '200px';
    }

    let target = e.target;
    if (target === canvas) {
        canvas.appendChild(newElement);
    } else {
        target.appendChild(newElement);
    }

    // 💡 允許排版疊套的容器元件種類
    const containerTags = ['div', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'form', 'ul', 'ol', 'table', 'tr'];
    if (containerTags.includes(draggedType)) {
        makeElementSortable(newElement);
    }

    draggedType = null;
    selectElement(newElement);
}