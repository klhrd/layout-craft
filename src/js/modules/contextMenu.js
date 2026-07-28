import { selectElement } from './inspector.js';
import { startInlineEdit, TEXT_EDITABLE_TAGS } from './canvas.js';
import { push as pushHistory } from '../modules/history.js';

let menuEl = null;
let targetEl = null;
let copiedStyles = null;

const MENU_ITEMS = [
    {
        id: 'edit-text',
        label: 'Edit Text',
        fn: () => {
            if (targetEl) startInlineEdit(targetEl);
        },
    },
    { id: 'sep1', separator: true },
    { id: 'duplicate', label: 'Duplicate', fn: duplicateElement },
    { id: 'delete', label: 'Delete', fn: deleteElement },
    { id: 'sep2', separator: true },
    { id: 'move-up', label: 'Move Up', fn: () => moveElement(-1) },
    { id: 'move-down', label: 'Move Down', fn: () => moveElement(1) },
    { id: 'sep3', separator: true },
    { id: 'copy-styles', label: 'Copy Styles', fn: copyStyles },
    { id: 'paste-styles', label: 'Paste Styles', fn: pasteStyles },
    { id: 'sep4', separator: true },
    { id: 'wrap-div', label: 'Wrap in <div>', fn: wrapInDiv },
];

export function initContextMenu() {
    menuEl = document.createElement('div');
    menuEl.className = 'context-menu';
    menuEl.style.display = 'none';
    document.body.appendChild(menuEl);

    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    canvas.addEventListener('contextmenu', (e) => {
        const el = e.target;
        if (el === canvas || el.classList.contains('canvas-placeholder')) return;
        e.preventDefault();
        e.stopPropagation();
        targetEl = el;
        selectElement(el);
        showMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', (e) => {
        if (menuEl.style.display === 'none') return;
        if (!menuEl.contains(e.target)) hideMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideMenu();
    });
}

function showMenu(x, y) {
    if (!menuEl) return;
    menuEl.innerHTML = '';

    const isText = targetEl && TEXT_EDITABLE_TAGS.includes(targetEl.tagName.toLowerCase());
    const canPaste = copiedStyles !== null;

    MENU_ITEMS.forEach((item) => {
        if (item.separator) {
            const sep = document.createElement('div');
            sep.className = 'context-separator';
            menuEl.appendChild(sep);
            return;
        }
        if (item.id === 'edit-text' && !isText) return;
        if (item.id === 'paste-styles' && !canPaste) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'context-item';
        btn.textContent = item.label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            item.fn();
            hideMenu();
        });
        menuEl.appendChild(btn);
    });

    // No visible items — show nothing.
    if (menuEl.children.length === 0) {
        hideMenu();
        return;
    }

    menuEl.style.display = 'block';

    // Position, clamping to viewport.
    const rect = menuEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = x;
    let top = y;
    if (left + rect.width > vw) left = vw - rect.width - 8;
    if (top + rect.height > vh) top = vh - rect.height - 8;
    menuEl.style.left = `${left}px`;
    menuEl.style.top = `${top}px`;
}

function hideMenu() {
    if (menuEl) menuEl.style.display = 'none';
    targetEl = null;
}

function duplicateElement() {
    if (!targetEl) return;
    const el = targetEl;
    const parent = el.parentNode;
    if (!parent) return;
    const clone = el.cloneNode(true);
    const next = el.nextSibling;
    if (next) parent.insertBefore(clone, next);
    else parent.appendChild(clone);

    pushHistory({
        label: 'Duplicate element',
        perform: () => {
            if (next && next.parentNode === parent) parent.insertBefore(clone, next);
            else parent.appendChild(clone);
            selectElement(clone);
        },
        rollback: () => {
            clone.remove();
            selectElement(el);
        },
    });
    selectElement(clone);
}

function deleteElement() {
    if (!targetEl) return;
    const el = targetEl;
    const parent = el.parentNode;
    const next = el.nextSibling;
    if (!parent) return;
    el.remove();

    pushHistory({
        label: 'Delete element',
        perform: () => {
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
            selectElement(el);
        },
        rollback: () => {
            if (next && next.parentNode === parent) parent.insertBefore(el, next);
            else parent.appendChild(el);
            selectElement(el);
        },
    });
}

function moveElement(direction) {
    if (!targetEl) return;
    const el = targetEl;
    const parent = el.parentNode;
    if (!parent) return;

    const sibling = direction === -1 ? el.previousElementSibling : el.nextElementSibling;
    if (!sibling) return;

    const oldNext = el.nextSibling;
    if (direction === -1) {
        parent.insertBefore(el, sibling);
    } else {
        if (sibling.nextSibling) parent.insertBefore(el, sibling.nextSibling);
        else parent.appendChild(el);
    }

    pushHistory({
        label: direction === -1 ? 'Move up' : 'Move down',
        perform: () => {
            if (oldNext && oldNext.parentNode === parent) parent.insertBefore(el, oldNext);
            else parent.appendChild(el);
        },
        rollback: () => {
            if (sibling) parent.insertBefore(el, sibling);
            else parent.appendChild(el);
        },
    });
}

function copyStyles() {
    if (!targetEl) return;
    const cs = getComputedStyle(targetEl);
    const props = [
        'color',
        'background-color',
        'font-size',
        'font-weight',
        'font-family',
        'text-align',
        'padding',
        'margin',
        'border-radius',
        'border',
        'box-shadow',
        'opacity',
        'display',
    ];
    copiedStyles = {};
    props.forEach((p) => {
        copiedStyles[p] = cs.getPropertyValue(p);
    });
}

function pasteStyles() {
    if (!targetEl || !copiedStyles) return;
    const el = targetEl;
    const oldStyles = {};
    Object.keys(copiedStyles).forEach((p) => {
        oldStyles[p] = el.style[p] || '';
        el.style[p] = copiedStyles[p];
    });

    pushHistory({
        label: 'Paste styles',
        perform: () => {
            Object.keys(copiedStyles).forEach((p) => {
                el.style[p] = copiedStyles[p];
            });
        },
        rollback: () => {
            Object.keys(oldStyles).forEach((p) => {
                el.style[p] = oldStyles[p];
            });
        },
    });
}

function wrapInDiv() {
    if (!targetEl) return;
    const el = targetEl;
    const parent = el.parentNode;
    if (!parent) return;

    const wrapper = document.createElement('div');
    parent.insertBefore(wrapper, el);
    wrapper.appendChild(el);

    pushHistory({
        label: 'Wrap in div',
        perform: () => {
            parent.insertBefore(wrapper, el);
            wrapper.appendChild(el);
        },
        rollback: () => {
            parent.insertBefore(el, wrapper);
            wrapper.remove();
        },
    });
    selectElement(el);
}
