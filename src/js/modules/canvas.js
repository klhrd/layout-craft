import { selectElement } from './inspector.js';
import { t } from '../config/i18n.js';
import { push as pushHistory } from './history.js';

let draggedType = null;
const canvas = document.getElementById('canvas'); // Grabs .canvas-container.

export function initCanvas() {
    makeElementSortable(canvas);
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    initCanvasHover();
}

/* ── Subtle hover highlight on canvas children ── */
let hoverTimer = null;

function initCanvasHover() {
    canvas.addEventListener('mouseover', (e) => {
        const el = e.target;
        if (el === canvas || el.classList.contains('canvas-placeholder')) return;
        clearTimeout(hoverTimer);
        el.classList.add('el-hover');
    });
    canvas.addEventListener('mouseout', (e) => {
        const el = e.target;
        if (el === canvas || el.classList.contains('canvas-placeholder')) return;
        // Small delay so moving between nested children doesn't flicker.
        hoverTimer = setTimeout(() => {
            el.classList.remove('el-hover');
        }, 80);
    });
}

export function makeElementSortable(element) {
    new Sortable(element, {
        group: 'shared-nested',
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        // Record the pre-sort parent + nextSibling so a move can be undone.
        onChoose(evt) {
            const el = evt.item;
            el.__preSortParent = el.parentNode;
            el.__preSortNext = el.nextSibling;
        },
        onEnd(evt) {
            const el = evt.item;
            const oldParent = el.__preSortParent;
            const oldNext = el.__preSortNext;
            const newParent = el.parentNode;
            const newNext = el.nextSibling;
            delete el.__preSortParent;
            delete el.__preSortNext;
            if (!oldParent || (oldParent === newParent && oldNext === newNext)) return;
            pushHistory({
                label: 'Move element',
                perform: () => {
                    if (newNext && newNext.parentNode === newParent) {
                        newParent.insertBefore(el, newNext);
                    } else {
                        newParent.appendChild(el);
                    }
                },
                rollback: () => {
                    if (oldNext && oldNext.parentNode === oldParent) {
                        oldParent.insertBefore(el, oldNext);
                    } else {
                        oldParent.appendChild(el);
                    }
                },
            });
        },
    });
}

export function setDraggedType(type) {
    draggedType = type;
}

// Container tags that get Sortable wired when dropped; reused so the
// redo path can re-attach the same behaviour.
const CONTAINER_TAGS = [
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
const TEXT_ALLOWED_TAGS = [
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

// Build a fresh element from a tag using the same defaults as the original
// drop path. Used by both the initial drop and the redo replay so the two
// stay byte-identical.
function buildNewElement(tag) {
    const el = document.createElement(tag);
    if (TEXT_ALLOWED_TAGS.includes(tag)) {
        el.textContent = t('ui.newElementText', tag.toUpperCase());
    }
    if (tag === 'input') {
        el.setAttribute('type', 'text');
        el.setAttribute('placeholder', t('ui.storage.newInnerText'));
    } else if (tag === 'img') {
        el.setAttribute('src', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150');
        el.setAttribute('alt', t('ui.storage.placeholderImageAlt'));
    } else if (tag === 'iframe') {
        el.setAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
        el.style.width = '100%';
        el.style.height = '200px';
    }
    if (CONTAINER_TAGS.includes(tag)) {
        makeElementSortable(el);
    }
    return el;
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedType) return;

    const placeholder = canvas.querySelector('.canvas-placeholder');
    if (placeholder) placeholder.remove();

    const tag = draggedType;
    const newElement = buildNewElement(tag);

    const target = e.target;
    const parent = target === canvas ? canvas : target;
    parent.appendChild(newElement);

    const nextSibling = newElement.nextSibling; // null at this point (last child)

    pushHistory({
        label: `Drop ${tag}`,
        perform: () => {
            // Re-create + re-insert on the same parent (original element
            // may have been moved or removed already).
            const replacement = buildNewElement(tag);
            if (nextSibling && nextSibling.parentNode === parent) {
                parent.insertBefore(replacement, nextSibling);
            } else {
                parent.appendChild(replacement);
            }
            selectElement(replacement);
        },
        rollback: () => {
            newElement.remove();
        },
    });

    draggedType = null;
    selectElement(newElement);
}
