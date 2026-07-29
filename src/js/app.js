import { ELEMENT_CATEGORIES } from './config/elements.js';
import { CSS_DICTIONARY } from './config/cssDictionary.js';
import { COMPONENTS } from './config/components.js';
import { t, setLocale } from './config/i18n.js';
import * as cssState from './modules/cssState.js';
import { initCanvas, setDraggedType } from './modules/canvas.js';
import { initInspector, selectElement, deselectAll } from './modules/inspector.js';
import { initLayers, refreshLayers } from './modules/layers.js';
import { initCanvasHelpers } from './modules/canvasHelpers.js';
import { initContextMenu } from './modules/contextMenu.js';
import { initExporter } from './modules/exporter.js';
import { importFromPaste } from './modules/importer.js';
import { initStorage, saveProject, loadProject, populateProjectList } from './modules/storage.js';
import * as history from './modules/history.js';
import { push as pushHistory } from './modules/history.js';
import {
    initVisualCssActions,
    initCssEditorCollapse,
    compileAndRenderCss,
    setDraggedCssBlockData,
} from './modules/cssEditor.js';
import { initIcons } from './modules/icons.js';
import {
    initSupabase,
    signInWithEmail,
    signInWithGitHub,
    signOut,
    isAuthenticated,
    getUser,
    onAuthChange,
    pullProjects,
    pullProject,
} from './modules/sync.js';

window.activeCssData = cssState.getRawData();
window.refreshLayers = refreshLayers;
let clipboardElement = null;

document.addEventListener('DOMContentLoaded', () => {
    cssState.initCssState();
    applySavedLocale();
    renderToolbox();
    renderCssDictionaryBlocks();
    initCanvas();
    initInspector();
    initLayers();
    initContextMenu();
    initCanvasHelpers();
    // Listen for resize-handle commits from canvasHelpers
    document.getElementById('canvas').addEventListener('resize-commit', (e) => {
        const el = e.target;
        const { width, height } = e.detail;
        const classList = Array.from(el.classList).filter((c) => c !== 'selected-element' && c !== 'el-hover');
        const cls = classList.find((c) => cssState.hasRule(`.${CSS.escape(c)}`));
        if (cls) {
            const sel = `.${CSS.escape(cls)}`;
            if (width) cssState.setProperty(sel, 'width', width);
            if (height) cssState.setProperty(sel, 'height', height);
            compileAndRenderCss();
        }
    });
    initExporter();
    initModeSwitcher();
    initVisualCssActions();
    initCssEditorCollapse();
    initHistoryUI();
    initOutlinesToggle();
    initImporter();

    initMenus();
    applySavedTheme();
    initZoom();
    initBreakpoints();

    initSupabase();
    initStorage(); // Boot the storage manager.
    initAuthUI();
    initIcons();

    // Auto-silently save every 30 seconds as a safety net.
    setInterval(() => {
        const currentProj = document.getElementById('select-project').value;
        if (currentProj) saveProject(currentProj, false);
    }, 30000);
});

// 1. Render the element toolbox (collapsed by default).
function renderToolbox() {
    const toolboxContainer = document.querySelector('.toolbox');
    if (!toolboxContainer) return;
    toolboxContainer.innerHTML = `<div class="brand-title">${t('ui.panels.layoutCraft')}</div>`; // clear & re-add brand title

    for (const category of Object.values(ELEMENT_CATEGORIES)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';
        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category.title;
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed';

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('active');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach((item) => {
            const elBtn = document.createElement('div');
            elBtn.className = 'draggable-item';
            elBtn.setAttribute('draggable', 'true');
            elBtn.textContent = item.label;
            elBtn.addEventListener('dragstart', () => setDraggedType(item.tag));
            itemsContainer.appendChild(elBtn);
        });
        wrapper.appendChild(categoryHeader);
        wrapper.appendChild(itemsContainer);
        toolboxContainer.appendChild(wrapper);
    }

    // Pre-built components category.
    const compWrapper = document.createElement('div');
    compWrapper.className = 'category-wrapper';
    const compHeader = document.createElement('h3');
    compHeader.className = 'category-header';
    compHeader.textContent = t('ui.panels.components');
    const compContainer = document.createElement('div');
    compContainer.className = 'category-items collapsed';
    compContainer.id = 'component-items';

    compHeader.addEventListener('click', () => {
        compHeader.classList.toggle('active');
        compContainer.classList.toggle('collapsed');
    });

    for (const [, component] of Object.entries(COMPONENTS)) {
        const elBtn = document.createElement('div');
        elBtn.className = 'draggable-item';
        elBtn.setAttribute('draggable', 'true');
        elBtn.textContent = component.label;
        elBtn.addEventListener('dragstart', () => {
            setDraggedType('div');
            window.draggedComponent = { label: component.label, template: component.template };
        });
        compContainer.appendChild(elBtn);
    }
    compWrapper.appendChild(compHeader);
    compWrapper.appendChild(compContainer);
    toolboxContainer.appendChild(compWrapper);
}

// 2. Render the CSS dictionary into draggable "property blocks".
function renderCssDictionaryBlocks() {
    const dictContainer = document.querySelector('.css-dictionary-panel');
    if (!dictContainer) return;
    dictContainer.innerHTML = `<div class="brand-title">${t('ui.panels.cssBlocks')}</div>`; // clear & re-add brand title

    for (const category of Object.values(CSS_DICTIONARY)) {
        const wrapper = document.createElement('div');
        wrapper.className = 'category-wrapper';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = category.title;

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'category-items collapsed';

        categoryHeader.addEventListener('click', () => {
            categoryHeader.classList.toggle('active');
            itemsContainer.classList.toggle('collapsed');
        });

        category.items.forEach((item) => {
            const blockEl = document.createElement('div');
            blockEl.className = 'css-dict-block';
            blockEl.setAttribute('draggable', 'true');
            blockEl.innerHTML = `<span>${item.label}</span> <small style="color:#94a3b8">${item.property}</small>`;

            blockEl.addEventListener('dragstart', () => {
                setDraggedCssBlockData(item);
            });

            itemsContainer.appendChild(blockEl);
        });

        wrapper.appendChild(categoryHeader);
        wrapper.appendChild(itemsContainer);
        dictContainer.appendChild(wrapper);
    }
}

function initModeSwitcher() {
    const switchVisualBtn = document.getElementById('switch-visual');
    const switchCssBtn = document.getElementById('switch-css');
    if (!switchVisualBtn || !switchCssBtn) return;

    switchVisualBtn.addEventListener('click', () => {
        document.body.classList.add('mode-visual');
        document.body.classList.remove('mode-css');
        switchVisualBtn.classList.add('active');
        switchCssBtn.classList.remove('active');
    });
    switchCssBtn.addEventListener('click', () => {
        document.body.classList.add('mode-css');
        document.body.classList.remove('mode-visual');
        switchCssBtn.classList.add('active');
        switchVisualBtn.classList.remove('active');
    });
}

// Menu bar: open/close dropdowns and dispatch menu actions.
function initMenus() {
    const triggers = document.querySelectorAll('.menu-trigger');
    const panels = document.querySelectorAll('.menu-panel');

    triggers.forEach((tr) => {
        tr.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = tr.getAttribute('data-menu');
            const panel = document.getElementById(targetId);
            if (!panel) return;
            const isOpen = panel.classList.contains('open');
            panels.forEach((p) => p.classList.remove('open'));
            if (!isOpen) panel.classList.add('open');
        });
    });

    panels.forEach((p) => {
        p.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            panels.forEach((p2) => p2.classList.remove('open'));

            switch (action) {
                case 'import':
                    document.getElementById('import-modal').style.display = 'flex';
                    break;
                case 'preview':
                    document.getElementById('btn-preview').click();
                    break;
                case 'grid':
                    document.body.classList.toggle('show-grid');
                    break;
                case 'outlines':
                    document.body.classList.toggle('show-outlines');
                    break;
                case 'undo':
                    history.undo();
                    break;
                case 'redo':
                    history.redo();
                    break;
                case 'save':
                    document.getElementById('btn-save-project').click();
                    break;
                case 'pull-cloud':
                    syncOnStart();
                    break;
                case 'export':
                    document.getElementById('btn-export').click();
                    break;
                case 'open':
                    showOpenProjectModal();
                    break;
                case 'copy':
                    copySelectedToClipboard();
                    break;
                case 'paste':
                    pasteFromClipboard();
                    break;
                case 'cut':
                    cutSelectedElement();
                    break;
                case 'rulers':
                    document.body.classList.toggle('show-rulers');
                    break;
                case 'theme-light':
                    setTheme('light');
                    break;
                case 'theme-dark':
                    setTheme('dark');
                    break;
                case 'theme-system':
                    setTheme('system');
                    break;
                case 'locale-en':
                    localStorage.setItem('lc-locale', 'en');
                    location.reload();
                    break;
                case 'locale-zh-TW':
                    localStorage.setItem('lc-locale', 'zh-TW');
                    location.reload();
                    break;
            }
        });
    });

    document.addEventListener('click', () => {
        panels.forEach((p) => p.classList.remove('open'));
    });
}

/* ── Theme toggling ── */
function setTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('theme-dark', prefersDark);
        document.body.classList.remove('theme-light');
    } else if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
    }
    localStorage.setItem('lc-theme', theme);
}

function applySavedTheme() {
    const saved = localStorage.getItem('lc-theme');
    if (saved) {
        setTheme(saved);
    } else {
        // Default to system
        setTheme('system');
    }
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = localStorage.getItem('lc-theme') || 'system';
        if (current === 'system') setTheme('system');
    });
}

function applySavedLocale() {
    const saved = localStorage.getItem('lc-locale');
    if (saved) {
        setLocale(saved);
    }
}

function initZoom() {
    const zoomIn = document.getElementById('btn-zoom-in');
    const zoomOut = document.getElementById('btn-zoom-out');
    const zoomLabel = document.getElementById('zoom-level');
    const canvas = document.getElementById('canvas');
    if (!zoomIn || !zoomOut || !zoomLabel || !canvas) return;

    let zoom = 1;
    const MIN = 0.25;
    const MAX = 2;

    function applyZoom() {
        canvas.style.transform = `scale(${zoom})`;
        canvas.style.width = `${100 / zoom}%`;
        zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
        canvas.classList.toggle('zoomed', zoom !== 1);
    }

    zoomIn.addEventListener('click', () => {
        zoom = Math.min(MAX, Math.round((zoom + 0.1) * 100) / 100);
        applyZoom();
    });

    zoomOut.addEventListener('click', () => {
        zoom = Math.max(MIN, Math.round((zoom - 0.1) * 100) / 100);
        applyZoom();
    });
}

function initBreakpoints() {
    const buttons = document.querySelectorAll('.bp-toggle .btn-secondary[data-bp]');
    buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const bp = btn.dataset.bp;
            buttons.forEach((b) => b.classList.remove('active'));
            if (bp === 'none') {
                document.body.removeAttribute('data-bp');
            } else {
                document.body.setAttribute('data-bp', bp);
                btn.classList.add('active');
            }
        });
    });
}

function initOutlinesToggle() {
    document.getElementById('btn-outlines')?.addEventListener('click', () => {
        document.body.classList.toggle('show-outlines');
    });
}

function showOpenProjectModal() {
    const modal = document.getElementById('open-modal');
    const list = document.getElementById('open-project-list');
    const btnCancel = document.getElementById('btn-open-cancel');
    if (!modal || !list) return;

    // Populate project list
    const raw = localStorage.getItem('layoutcraft_project_list');
    const projects = raw ? JSON.parse(raw) : ['Default_Project'];
    list.innerHTML = '';
    projects.forEach((proj) => {
        const item = document.createElement('div');
        item.className = 'open-project-item';

        const name = document.createElement('span');
        name.className = 'open-project-name';
        name.textContent = proj.replace(/_/g, ' ');

        const actions = document.createElement('span');
        actions.className = 'open-project-actions';

        const loadBtn = document.createElement('button');
        loadBtn.className = 'btn-secondary';
        loadBtn.innerHTML = '<span class="mat-icon">folder_open</span> Load';
        loadBtn.addEventListener('click', () => {
            document.getElementById('select-project').value = proj;
            document.getElementById('select-project').dispatchEvent(new Event('change'));
            modal.style.display = 'none';
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'btn-secondary';
        delBtn.style.color = '#ef4444';
        delBtn.innerHTML = '<span class="mat-icon">delete</span> Delete';
        delBtn.addEventListener('click', () => {
            if (!confirm(`Delete "${proj.replace(/_/g, ' ')}"?`)) return;
            localStorage.removeItem(`layoutcraft_proj_${proj}`);
            const updated = JSON.parse(localStorage.getItem('layoutcraft_project_list')) || [];
            const idx = updated.indexOf(proj);
            if (idx !== -1) updated.splice(idx, 1);
            if (updated.length === 0) updated.push('Default_Project');
            localStorage.setItem('layoutcraft_project_list', JSON.stringify(updated));
            showOpenProjectModal();
        });

        actions.appendChild(loadBtn);
        actions.appendChild(delBtn);
        item.appendChild(name);
        item.appendChild(actions);
        list.appendChild(item);
    });

    modal.style.display = 'flex';

    btnCancel.onclick = () => {
        modal.style.display = 'none';
    };
    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

function copySelectedToClipboard() {
    const sel = document.querySelector('.canvas-container .selected-element');
    if (sel) clipboardElement = sel.cloneNode(true);
}

function pasteFromClipboard() {
    if (!clipboardElement) return;
    const canvas = document.getElementById('canvas');
    const clone = clipboardElement.cloneNode(true);
    canvas.appendChild(clone);
    selectElement(clone);
    pushHistory({
        label: 'Paste element',
        perform: () => {
            canvas.appendChild(clone);
            selectElement(clone);
        },
        rollback: () => {
            clone.remove();
        },
    });
}

function cutSelectedElement() {
    const sel = document.querySelector('.canvas-container .selected-element');
    if (!sel) return;
    clipboardElement = sel.cloneNode(true);
    const parent = sel.parentNode;
    const next = sel.nextSibling;
    sel.remove();
    deselectAll();
    pushHistory({
        label: 'Cut element',
        perform: () => {
            if (next && next.parentNode === parent) parent.insertBefore(sel, next);
            else parent.appendChild(sel);
            selectElement(sel);
        },
        rollback: () => {
            if (next && next.parentNode === parent) parent.insertBefore(sel, next);
            else parent.appendChild(sel);
            selectElement(sel);
        },
    });
}

// Undo/Redo toolbar buttons + global keyboard shortcuts.
// Buttons reflect canUndo/canRedo via the history subscribe channel.
function initImporter() {
    const modal = document.getElementById('import-modal');
    const btnCancel = document.getElementById('btn-import-cancel');
    const btnSubmit = document.getElementById('btn-import-submit');
    const htmlInput = document.getElementById('import-html-input');
    const cssInput = document.getElementById('import-css-input');

    if (!modal) return;

    btnCancel.addEventListener('click', () => {
        modal.style.display = 'none';
        htmlInput.value = '';
        cssInput.value = '';
    });

    btnSubmit.addEventListener('click', () => {
        const html = htmlInput.value.trim();
        if (!html) return;
        importFromPaste(html, cssInput.value.trim());
        modal.style.display = 'none';
        htmlInput.value = '';
        cssInput.value = '';

        const proj = document.getElementById('select-project').value;
        if (proj) saveProject(proj, false);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            htmlInput.value = '';
            cssInput.value = '';
        }
    });
}

function initHistoryUI() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (!btnUndo || !btnRedo) return;

    btnUndo.title = t('ui.history.undo');
    btnRedo.title = t('ui.history.redo');

    const applyState = ({ canUndo, canRedo }) => {
        btnUndo.disabled = !canUndo;
        btnUndo.style.opacity = canUndo ? '1' : '0.45';
        btnRedo.disabled = !canRedo;
        btnRedo.style.opacity = canRedo ? '1' : '0.45';
    };
    history.subscribe(applyState);

    btnUndo.addEventListener('click', () => history.undo());
    btnRedo.addEventListener('click', () => history.redo());

    // Global keyboard shortcuts.
    document.addEventListener('keydown', (e) => {
        const target = e.target;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        if (target && target.isContentEditable) return;

        const ctrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        // Undo / Redo
        if (ctrl && key === 'z') {
            e.preventDefault();
            if (e.shiftKey) history.redo();
            else history.undo();
            return;
        }

        // Copy
        if (ctrl && key === 'c') {
            copySelectedToClipboard();
            return;
        }

        // Paste
        if (ctrl && key === 'v') {
            if (!clipboardElement) return;
            e.preventDefault();
            pasteFromClipboard();
            return;
        }

        // Select all
        if (ctrl && key === 'a') {
            e.preventDefault();
            const canvas = document.getElementById('canvas');
            const first = canvas.firstElementChild;
            if (first && !first.classList.contains('canvas-placeholder')) selectElement(first);
            return;
        }

        // Delete / Backspace
        if (key === 'delete' || key === 'backspace') {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            e.preventDefault();
            const parent = sel.parentNode;
            const next = sel.nextSibling;
            sel.remove();
            deselectAll();
            pushHistory({
                label: 'Delete element',
                perform: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(sel, next);
                    else parent.appendChild(sel);
                    selectElement(sel);
                },
                rollback: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(sel, next);
                    else parent.appendChild(sel);
                    selectElement(sel);
                },
            });
            return;
        }

        // Escape
        if (key === 'escape') {
            deselectAll();
            return;
        }

        // Ctrl+D — Duplicate selected element
        if (ctrl && key === 'd') {
            e.preventDefault();
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            const parent = sel.parentNode;
            if (!parent) return;
            const clone = sel.cloneNode(true);
            const next = sel.nextSibling;
            if (next) parent.insertBefore(clone, next);
            else parent.appendChild(clone);
            selectElement(clone);
            pushHistory({
                label: 'Duplicate element',
                perform: () => {
                    if (next && next.parentNode === parent) parent.insertBefore(clone, next);
                    else parent.appendChild(clone);
                    selectElement(clone);
                },
                rollback: () => {
                    clone.remove();
                    selectElement(sel);
                },
            });
            return;
        }

        // Ctrl+/ — Toggle mode
        if (ctrl && key === '/') {
            e.preventDefault();
            const isVisual = document.body.classList.contains('mode-visual');
            const visualBtn = document.getElementById('switch-visual');
            const cssBtn = document.getElementById('switch-css');
            if (isVisual) {
                document.body.classList.add('mode-css');
                document.body.classList.remove('mode-visual');
                if (cssBtn) cssBtn.classList.add('active');
                if (visualBtn) visualBtn.classList.remove('active');
            } else {
                document.body.classList.add('mode-visual');
                document.body.classList.remove('mode-css');
                if (visualBtn) visualBtn.classList.add('active');
                if (cssBtn) cssBtn.classList.remove('active');
            }
            return;
        }

        // Arrow keys — nudge selected element by 1px (or 10px with Shift)
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
            const sel = document.querySelector('.canvas-container .selected-element');
            if (!sel) return;
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const delta = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
            const deltaX = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
            const oldTop = parseInt(sel.style.top) || 0;
            const oldLeft = parseInt(sel.style.left) || 0;
            const newTop = oldTop + delta;
            const newLeft = oldLeft + deltaX;
            sel.style.top = `${newTop}px`;
            sel.style.left = `${newLeft}px`;
            pushHistory({
                label: 'Nudge element',
                perform: () => {
                    sel.style.top = `${newTop}px`;
                    sel.style.left = `${newLeft}px`;
                },
                rollback: () => {
                    sel.style.top = `${oldTop}px`;
                    sel.style.left = `${oldLeft}px`;
                },
            });
            return;
        }
    });
}

function initAuthUI() {
    const btn = document.getElementById('btn-auth');
    if (!btn) return;
    updateAuthButton();
    onAuthChange(() => updateAuthButton());
    btn.addEventListener('click', () => {
        if (isAuthenticated()) {
            signOut().then(() => updateAuthButton());
        } else {
            showAuthModal();
        }
    });
    if (isAuthenticated()) {
        syncOnStart();
    }
}

function updateAuthButton() {
    const btn = document.getElementById('btn-auth');
    if (!btn) return;
    const user = getUser();
    if (user) {
        const label = user.email || user.user_metadata?.user_name || t('ui.cloud.signOut');
        btn.textContent = label;
        btn.title = t('ui.cloud.signOut');
    } else {
        btn.textContent = t('ui.cloud.signIn');
        btn.title = t('ui.cloud.signIn');
    }
}

function showAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    const emailInput = document.getElementById('auth-email-input');
    const btnEmail = document.getElementById('btn-auth-email');
    const btnGitHub = document.getElementById('btn-auth-github');
    const btnCancel = document.getElementById('btn-auth-cancel');
    modal.style.display = 'flex';
    emailInput.value = '';
    btnEmail.onclick = () => {
        const email = emailInput.value.trim();
        if (!email) return;
        signInWithEmail(email).then(() => {
            modal.style.display = 'none';
        }).catch((err) => {
            alert(err.message);
        });
    };
    btnGitHub.onclick = () => {
        signInWithGitHub().catch((err) => {
            alert(err.message);
        });
    };
    btnCancel.onclick = () => { modal.style.display = 'none'; };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function syncOnStart() {
    pullProjects().then((remoteProjects) => {
        if (!remoteProjects || remoteProjects.length === 0) return;
        populateProjectList(remoteProjects);
        const select = document.getElementById('select-project');
        const current = select.value;
        const remote = remoteProjects.find((p) => p.name === current);
        if (!remote) return;
        const localRaw = localStorage.getItem('layoutcraft_proj_' + current);
        if (!localRaw) return;
        try {
            const localData = JSON.parse(localRaw);
            const localTime = new Date(localData.updated_at || 0).getTime();
            const remoteTime = new Date(remote.updated_at).getTime();
            if (remoteTime > localTime) {
                showConflictModal(current, remote);
            }
        } catch {
        }
    }).catch(() => {});
}

function showConflictModal(projectName, remoteData) {
    const modal = document.getElementById('conflict-modal');
    if (!modal) return;
    const details = document.getElementById('conflict-details');
    const btnKeep = document.getElementById('btn-conflict-keep');
    const btnPull = document.getElementById('btn-conflict-pull');
    if (details) {
        details.textContent = projectName.replace(/_/g, ' ') + ' — ' + new Date(remoteData.updated_at).toLocaleString();
    }
    modal.style.display = 'flex';
    btnKeep.onclick = () => { modal.style.display = 'none'; };
    btnPull.onclick = () => {
        pullProject(projectName).then((data) => {
            if (!data) return;
            const raw = JSON.stringify({ html: data.html, cssData: data.css_data, updated_at: data.updated_at });
            localStorage.setItem('layoutcraft_proj_' + projectName, raw);
            loadProject(projectName);
            modal.style.display = 'none';
        }).catch(() => {
            modal.style.display = 'none';
        });
    };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}
