let canvas = null;
let gridOn = false;
let guides = [];
let dragGuide = null;
let dragStartX = 0,
    dragStartY = 0,
    dragStartLeft = 0,
    dragStartTop = 0;

export function initCanvasHelpers() {
    canvas = document.getElementById('canvas');
    if (!canvas) return;

    // Grid toggle
    const btnGrid = document.getElementById('btn-grid');
    if (btnGrid) {
        btnGrid.addEventListener('click', () => {
            gridOn = !gridOn;
            document.body.classList.toggle('show-grid', gridOn);
            btnGrid.textContent = gridOn ? '🔳 Grid On' : '🔲 Grid';
        });
    }

    // Draggable guides — double-click canvas to add a guide
    canvas.addEventListener('dblclick', (e) => {
        if (!gridOn) return;
        // Only add guides when grid is on, within the canvas area
        if (e.target !== canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Decide horizontal vs vertical based on position
        addGuide(x, y);
    });

    // Remove guide on right-click
    canvas.addEventListener('contextmenu', (e) => {
        const guide = e.target.closest('.canvas-guide');
        if (guide) {
            e.preventDefault();
            guide.remove();
            guides = guides.filter((g) => g.el !== guide);
        }
    });
}

function addGuide(x, y) {
    const guide = document.createElement('div');
    guide.className = 'canvas-guide';
    document.body.appendChild(guide);

    const canvasRect = canvas.getBoundingClientRect();

    // If x is near edges, make it vertical; if y is near edges, make horizontal
    let isVertical = false;
    if (x < 20 || x > canvasRect.width - 20) isVertical = true;
    else if (y < 20 || y > canvasRect.height - 20) isVertical = true;
    else isVertical = x < y; // arbitrary

    if (isVertical) {
        guide.style.left = `${canvasRect.left + x}px`;
        guide.style.top = `${canvasRect.top}px`;
        guide.style.width = '1px';
        guide.style.height = `${canvasRect.height}px`;
        guide.dataset.orient = 'v';
    } else {
        guide.style.left = `${canvasRect.left}px`;
        guide.style.top = `${canvasRect.top + y}px`;
        guide.style.width = `${canvasRect.width}px`;
        guide.style.height = '1px';
        guide.dataset.orient = 'h';
    }

    makeGuideDraggable(guide);
    guides.push({ el: guide, x, y, vertical: isVertical });
}

function makeGuideDraggable(guide) {
    guide.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragGuide = guide;
        guide.classList.add('dragging');
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartLeft = guide.offsetLeft;
        dragStartTop = guide.offsetTop;
    });
}

document.addEventListener('mousemove', (e) => {
    if (!dragGuide) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (dragGuide.dataset.orient === 'v') {
        dragGuide.style.left = `${dragStartLeft + dx}px`;
    } else {
        dragGuide.style.top = `${dragStartTop + dy}px`;
    }
});

document.addEventListener('mouseup', () => {
    if (dragGuide) {
        dragGuide.classList.remove('dragging');
        dragGuide = null;
    }
});

export function removeAllGuides() {
    guides.forEach((g) => g.el.remove());
    guides = [];
}

export function refreshGuides() {
    if (!canvas || guides.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    guides.forEach((g) => {
        if (g.vertical) {
            g.el.style.top = `${rect.top}px`;
            g.el.style.height = `${rect.height}px`;
        } else {
            g.el.style.left = `${rect.left}px`;
            g.el.style.width = `${rect.width}px`;
        }
    });
}
