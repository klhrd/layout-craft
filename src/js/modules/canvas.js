import { selectElement } from './inspector.js';
import { t } from '../config/i18n.js';
import { push as pushHistory } from './history.js';
import { COMPONENTS } from '../config/components.js';

let draggedType = null;
const canvas = document.getElementById('canvas'); // Grabs .canvas-container.

export function initCanvas() {
    makeElementSortable(canvas);
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    initCanvasHover();
    initInlineEditing();
    initEmptyStateActions();
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

/* ── Inline text editing (double-click) ── */

export const TEXT_EDITABLE_TAGS = [
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
    'li',
    'th',
    'td',
];

let inlineEditEl = null;
let inlineEditOrig = '';

function initInlineEditing() {
    canvas.addEventListener('dblclick', (e) => {
        const el = e.target;
        if (el === canvas || el.classList.contains('canvas-placeholder')) return;
        const tag = el.tagName.toLowerCase();
        if (!TEXT_EDITABLE_TAGS.includes(tag)) return;
        e.stopPropagation();
        startInlineEdit(el);
    });
}

export function startInlineEdit(el) {
    if (inlineEditEl && inlineEditEl !== el) commitInlineEdit(inlineEditEl);
    inlineEditEl = el;
    inlineEditOrig = el.textContent;
    el.contentEditable = 'true';
    el.classList.add('editing');
    el.focus();

    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);

    // Commit on blur.
    el.addEventListener('blur', () => commitInlineEdit(el), { once: true });
}

function commitInlineEdit(el) {
    if (!el || el !== inlineEditEl) return;
    el.contentEditable = 'false';
    el.classList.remove('editing');
    const newText = el.textContent;
    const oldText = inlineEditOrig;
    inlineEditEl = null;
    inlineEditOrig = '';
    if (newText === oldText) return;

    pushHistory({
        label: 'Edit text',
        perform: () => {
            el.textContent = newText;
        },
        rollback: () => {
            el.textContent = oldText;
        },
    });
}

function cancelInlineEdit(el) {
    if (!el || el !== inlineEditEl) return;
    el.textContent = inlineEditOrig;
    el.contentEditable = 'false';
    el.classList.remove('editing');
    inlineEditEl = null;
    inlineEditOrig = '';
}

// Exposed so app.js can cancel inline editing before preview / project switch.
export function cancelActiveInlineEdit() {
    if (inlineEditEl) cancelInlineEdit(inlineEditEl);
}

// Global keydown for Enter → commit, Escape → cancel.
document.addEventListener('keydown', (e) => {
    if (!inlineEditEl) return;
    if (e.key === 'Escape') {
        e.preventDefault();
        cancelInlineEdit(inlineEditEl);
        return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitInlineEdit(inlineEditEl);
        // Move focus away so blur doesn't re-trigger.
        inlineEditEl?.blur();
    }
});

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
    const isComponent = window.draggedComponent && window.draggedComponent.template;
    const newElement = isComponent ? buildComponentTree(window.draggedComponent.template) : buildNewElement(tag);

    const target = e.target;
    const parent = target === canvas ? canvas : target;
    parent.appendChild(newElement);

    const nextSibling = newElement.nextSibling;

    pushHistory({
        label: isComponent ? `Drop component: ${window.draggedComponent.label}` : `Drop ${tag}`,
        perform: () => {
            const replacement = isComponent
                ? buildComponentTree(window.draggedComponent.template)
                : buildNewElement(tag);
            if (nextSibling && nextSibling.parentNode === parent) {
                parent.insertBefore(replacement, nextSibling);
            } else {
                parent.appendChild(replacement);
            }
        },
        rollback: () => {
            newElement.remove();
        },
    });

    draggedType = null;
    window.draggedComponent = null;
    selectElement(newElement);
}

function buildComponentTree(template) {
    const el = document.createElement(template.tag);
    if (template.text) el.textContent = template.text;
    if (template.attr) {
        for (const [k, v] of Object.entries(template.attr)) {
            el.setAttribute(k, v);
        }
    }
    if (template.style) {
        for (const [k, v] of Object.entries(template.style)) {
            el.style[k] = v;
        }
    }
    if (template.children) {
        for (const child of template.children) {
            el.appendChild(buildComponentTree(child));
        }
    }
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
    if (CONTAINER_TAGS.includes(template.tag) && typeof Sortable !== 'undefined') {
        setTimeout(() => {
            if (el.parentNode) Sortable.create(el, { group: 'canvas', animation: 150 });
        }, 0);
    }
    return el;
}

function initEmptyStateActions() {
    const btnQuickStart = document.getElementById('btn-quick-start');
    const btnLoadSample = document.getElementById('btn-load-sample');

    if (btnQuickStart) {
        btnQuickStart.addEventListener('click', () => {
            const placeholder = canvas.querySelector('.canvas-placeholder');
            if (placeholder) placeholder.remove();

            const navbar = buildComponentTree(COMPONENTS.navbar.template);
            canvas.appendChild(navbar);
            const hero = buildComponentTree(COMPONENTS.hero.template);
            canvas.appendChild(hero);

            pushHistory({
                label: 'Quick start template',
                perform: () => {
                    const pl = canvas.querySelector('.canvas-placeholder');
                    if (pl) pl.remove();
                    canvas.appendChild(navbar.cloneNode(true));
                    canvas.appendChild(hero.cloneNode(true));
                },
                rollback: () => {
                    navbar.remove();
                    hero.remove();
                },
            });
        });
    }

    if (btnLoadSample) {
        btnLoadSample.addEventListener('click', () => {
            const select = document.getElementById('select-project');
            const sampleName = '_Sample_Project';
            const existing = Array.from(select.options).find((o) => o.value === sampleName);
            if (existing) {
                select.value = sampleName;
                select.dispatchEvent(new Event('change'));
                return;
            }
            const placeholder = canvas.querySelector('.canvas-placeholder');
            if (placeholder) placeholder.remove();

            const templates = ['navbar', 'hero', 'features', 'footer'];
            templates.forEach((key) => {
                const comp = COMPONENTS[key];
                if (comp) {
                    const el = buildComponentTree(comp.template);
                    canvas.appendChild(el);
                }
            });

            if (select) {
                const opt = document.createElement('option');
                opt.value = sampleName;
                opt.textContent = '📂 Sample Project';
                select.appendChild(opt);
                select.value = sampleName;
            }
        });
    }
}
