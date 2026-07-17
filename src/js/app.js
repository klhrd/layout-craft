import { ELEMENT_CATEGORIES } from './config/elements.js';
import { initCanvas, setDraggedType, makeElementSortable } from './modules/canvas.js';
import { initInspector } from './modules/inspector.js';
import { initExporter } from './modules/exporter.js';

document.addEventListener('DOMContentLoaded', () => {
    renderToolbox();
    initCanvas();
    initInspector();
    initExporter();
});

function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    
    for (const [key, category] of Object.entries(ELEMENT_CATEGORIES)) {
        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category.title;
        toolboxContainer.appendChild(categoryHeader);

        category.items.forEach(item => {
            const elBtn = document.createElement('div');
            elBtn.className = 'draggable-item';
            elBtn.setAttribute('draggable', 'true');
            elBtn.textContent = item.label;
            
            elBtn.addEventListener('dragstart', () => {
                setDraggedType(item.tag);
            });

            toolboxContainer.appendChild(elBtn);
        });
    }
}