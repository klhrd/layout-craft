let canvas = null;
let gridOn = false;
let guides = [];
let dragGuide = null;
let dragStartX = 0,
    dragStartY = 0,
    dragStartLeft = 0,
    dragStartTop = 0;

// Resize handles
let resizeHandles = [];
let handleDrag = null;
let resizeObserver = null;

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

/* ── Resize handles ── */

export function showResizeHandles(el) {
    hideResizeHandles();
    if (!el || !canvas || !canvas.contains(el)) return;

    if (!resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            const sel = canvas.querySelector('.selected-element');
            if (sel) positionHandles(sel);
        });
        resizeObserver.observe(canvas);
    }

    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    positions.forEach((pos) => {
        const dot = document.createElement('div');
        dot.className = `resize-handle handle-${pos}`;
        dot.dataset.handle = pos;
        canvas.appendChild(dot);
        resizeHandles.push(dot);
    });

    positionHandles(el);

    // Start drag
    resizeHandles.forEach((h) => {
        h.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sel = canvas.querySelector('.selected-element');
            if (!sel) return;
            handleDrag = {
                el: sel,
                handle: h.dataset.handle,
                startX: e.clientX,
                startY: e.clientY,
                startW: sel.offsetWidth,
                startH: sel.offsetHeight,
            };
            document.body.style.cursor = getComputedStyle(h).cursor;
        });
    });
}

function positionHandles(el) {
    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const offsetX = rect.left - canvasRect.left;
    const offsetY = rect.top - canvasRect.top;
    const w = rect.width;
    const h = rect.height;

    const map = {
        nw: { left: offsetX - 4, top: offsetY - 4 },
        n: { left: offsetX + w / 2 - 4, top: offsetY - 4 },
        ne: { left: offsetX + w - 4, top: offsetY - 4 },
        e: { left: offsetX + w - 4, top: offsetY + h / 2 - 4 },
        se: { left: offsetX + w - 4, top: offsetY + h - 4 },
        s: { left: offsetX + w / 2 - 4, top: offsetY + h - 4 },
        sw: { left: offsetX - 4, top: offsetY + h - 4 },
        w: { left: offsetX - 4, top: offsetY + h / 2 - 4 },
    };

    resizeHandles.forEach((dot) => {
        const pos = map[dot.dataset.handle];
        if (pos) {
            dot.style.left = `${pos.left}px`;
            dot.style.top = `${pos.top}px`;
        }
    });
}

export function hideResizeHandles() {
    resizeHandles.forEach((h) => h.remove());
    resizeHandles = [];
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }
}

document.addEventListener('mousemove', (e) => {
    if (!handleDrag) return;
    const dx = e.clientX - handleDrag.startX;
    const dy = e.clientY - handleDrag.startY;
    const h = handleDrag.handle;

    let newW = handleDrag.startW;
    let newH = handleDrag.startH;

    if (h.includes('e')) newW = Math.max(10, handleDrag.startW + dx);
    if (h.includes('w')) newW = Math.max(10, handleDrag.startW - dx);
    if (h.includes('s')) newH = Math.max(10, handleDrag.startH + dy);
    if (h.includes('n')) newH = Math.max(10, handleDrag.startH - dy);

    handleDrag.el.style.width = `${newW}px`;
    handleDrag.el.style.height = `${newH}px`;
});

document.addEventListener('mouseup', () => {
    if (!handleDrag) return;
    const el = handleDrag.el;
    const w = el.style.width;
    const h = el.style.height;
    el.style.removeProperty('width');
    el.style.removeProperty('height');
    // Notify app to commit the size via cssState
    el.dispatchEvent(new CustomEvent('resize-commit', { detail: { width: w, height: h } }));
    handleDrag = null;
    document.body.style.cursor = '';
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
