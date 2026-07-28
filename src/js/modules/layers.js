import { selectElement } from './inspector.js';

let treeContainer = null;
let refreshTimer = null;
const observer = new MutationObserver(() => scheduleRefresh());

function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(buildLayerTree, 200);
}

export function initLayers() {
    treeContainer = document.getElementById('layers-tree');
    if (!treeContainer) return;

    const canvas = document.getElementById('canvas');
    if (canvas) {
        observer.observe(canvas, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
    }

    buildLayerTree();

    document.addEventListener('element-selected', () => {
        const sel = document.querySelector('.canvas-container .selected-element');
        if (sel) highlightLayerEntry(sel);
    });
}

function buildLayerTree() {
    const canvas = document.getElementById('canvas');
    if (!canvas || !treeContainer) return;

    treeContainer.innerHTML = '';

    const children = canvas.children;
    if (children.length === 0) {
        treeContainer.innerHTML = '<div class="layers-empty">No elements on canvas</div>';
        return;
    }

    for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (el.classList.contains('canvas-placeholder')) continue;
        buildLayerEntry(el, treeContainer, 0);
    }
}

const TAG_LABELS = {
    div: 'Div',
    p: 'Paragraph',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    span: 'Span',
    a: 'Link',
    button: 'Button',
    img: 'Image',
    ul: 'Unordered List',
    ol: 'Ordered List',
    li: 'List Item',
    input: 'Input',
    textarea: 'Textarea',
    label: 'Label',
    form: 'Form',
    section: 'Section',
    header: 'Header',
    footer: 'Footer',
    nav: 'Nav',
    main: 'Main',
    aside: 'Aside',
    blockquote: 'Blockquote',
    pre: 'Pre',
    code: 'Code',
    hr: 'HR',
    br: 'BR',
    strong: 'Strong',
    em: 'Emphasis',
    table: 'Table',
    thead: 'Table Head',
    tbody: 'Table Body',
    tr: 'Table Row',
    th: 'Table Header',
    td: 'Table Cell',
};

function getElementLabel(el) {
    const tag = el.tagName.toLowerCase();
    const label = TAG_LABELS[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
    if (el.id) return `${label}#${el.id}`;
    return label;
}

let _nextNodeId = 1;

function getNodeId(el) {
    if (!el.dataset.nodeId) el.dataset.nodeId = _nextNodeId++;
    return el.dataset.nodeId;
}

function buildLayerEntry(el, parentContainer, depth) {
    const entry = document.createElement('div');
    entry.className = 'layer-entry';
    entry.dataset.depth = depth;
    entry.dataset.nodeId = getNodeId(el);
    entry.style.paddingLeft = `${12 + depth * 16}px`;

    if (el.classList.contains('selected-element')) {
        entry.classList.add('layer-selected');
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'layer-label';
    labelSpan.textContent = `${getElementLabel(el)} <${el.tagName.toLowerCase()}>`;

    const actions = document.createElement('span');
    actions.className = 'layer-actions';

    // Visibility toggle
    const visBtn = document.createElement('button');
    visBtn.type = 'button';
    visBtn.className = 'layer-vis-btn';
    const isHidden = el.style.display === 'none';
    visBtn.textContent = isHidden ? '👁️‍🗨️' : '👁️';
    visBtn.title = isHidden ? 'Show' : 'Hide';
    visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.style.display === 'none') {
            el.style.display = '';
            visBtn.textContent = '👁️';
            visBtn.title = 'Hide';
        } else {
            el.style.display = 'none';
            visBtn.textContent = '👁️‍🗨️';
            visBtn.title = 'Show';
        }
    });

    // Lock toggle
    const lockBtn = document.createElement('button');
    lockBtn.type = 'button';
    lockBtn.className = 'layer-lock-btn';
    const isLocked = el.style.pointerEvents === 'none' || el.dataset.locked === 'true';
    lockBtn.textContent = isLocked ? '🔒' : '🔓';
    lockBtn.title = isLocked ? 'Unlock' : 'Lock';
    if (isLocked) {
        entry.classList.add('layer-locked');
        el.dataset.locked = 'true';
    }
    lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.dataset.locked === 'true') {
            delete el.dataset.locked;
            el.style.pointerEvents = '';
            lockBtn.textContent = '🔓';
            lockBtn.title = 'Lock';
            entry.classList.remove('layer-locked');
        } else {
            el.dataset.locked = 'true';
            el.style.pointerEvents = 'none';
            lockBtn.textContent = '🔒';
            lockBtn.title = 'Unlock';
            entry.classList.add('layer-locked');
        }
    });

    actions.appendChild(visBtn);
    actions.appendChild(lockBtn);
    entry.appendChild(labelSpan);
    entry.appendChild(actions);

    entry.addEventListener('click', () => {
        selectElement(el);
        highlightLayerEntry(el);
    });

    parentContainer.appendChild(entry);

    // Recurse into children
    for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i];
        if (child.classList.contains('canvas-placeholder')) continue;
        buildLayerEntry(child, parentContainer, depth + 1);
    }
}

function highlightLayerEntry(el) {
    if (!treeContainer) return;
    treeContainer.querySelectorAll('.layer-selected').forEach((e) => e.classList.remove('layer-selected'));
    const nodeId = getNodeId(el);
    const target = treeContainer.querySelector(`.layer-entry[data-node-id="${nodeId}"]`);
    if (target) target.classList.add('layer-selected');
}

export function refreshLayers() {
    buildLayerTree();
}
