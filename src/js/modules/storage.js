import { compileAndRenderCss } from '../app.js';
import { makeElementSortable } from './canvas.js';
import { CONTAINER_TAGS } from '../config/elements.js';
import { deselectAll } from './inspector.js';
import { reset as resetHistory } from './history.js';
import * as cssState from './cssState.js';
import { t } from '../config/i18n.js';

const STORAGE_KEY_PREFIX = 'layoutcraft_proj_';
const LIST_KEY = 'layoutcraft_project_list';

let currentProjectName = t('ui.storage.defaultProject');

export function initStorage() {
    setupProjectList();
    bindStorageEvents();
    loadProject(currentProjectName); // Load the currently selected project by default.
}

// 1. Initialize the project list and the dropdown.
function setupProjectList() {
    const list = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
    if (list.length === 0) {
        list.push('Default_Project');
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
    }

    const select = document.getElementById('select-project');
    select.innerHTML = '';
    list.forEach((proj) => {
        const opt = document.createElement('option');
        opt.value = proj;
        opt.textContent = proj.replace(/_/g, ' ');
        select.appendChild(opt);
    });

    // Restore the project the user had open before closing the page.
    const lastActive = localStorage.getItem('layoutcraft_last_active_proj');
    if (lastActive && list.includes(lastActive)) {
        currentProjectName = lastActive;
        select.value = lastActive;
    }
}

function bindStorageEvents() {
    const select = document.getElementById('select-project');
    const btnNew = document.getElementById('btn-new-project');
    const btnSave = document.getElementById('btn-save-project');

    // Project dropdown switch.
    select.addEventListener('change', () => {
        // Auto-save the previous project first as a safety net.
        saveProject(currentProjectName, false);
        currentProjectName = select.value;
        localStorage.setItem('layoutcraft_last_active_proj', currentProjectName);
        loadProject(currentProjectName);
    });

    // Create a new project.
    btnNew.addEventListener('click', () => {
        const name = prompt(t('ui.project.newPrompt'));
        if (!name) return;
        const formattedName = name.trim().replace(/\s+/g, '_');

        const list = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
        if (list.includes(formattedName)) {
            alert(t('ui.project.existsAlert'));
            return;
        }

        list.push(formattedName);
        localStorage.setItem(LIST_KEY, JSON.stringify(list));

        // Switch to the new project and clear the canvas.
        saveProject(currentProjectName, false);
        currentProjectName = formattedName;
        localStorage.setItem('layoutcraft_last_active_proj', currentProjectName);

        // Initialize the new project's data.
        cssState.initCssState();
        document.getElementById('canvas').innerHTML =
            `<div class="canvas-placeholder">${t('ui.panels.canvasPlaceholder')}</div>`;

        setupProjectList();
        select.value = currentProjectName;
        saveProject(currentProjectName, true);
    });

    // Manual save button click.
    btnSave.addEventListener('click', () => {
        saveProject(currentProjectName, true);
    });
}

// 2. Project save implementation.
export function saveProject(projName, showAlert = false) {
    deselectAll(); // Clear selection state before saving to avoid persisting the selection outline class.

    const canvasHtml = document.getElementById('canvas').innerHTML;
    const projectData = {
        html: canvasHtml,
        cssData: cssState.serialize(),
    };

    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + projName, JSON.stringify(projectData));
        updateStorageMeter(); // Update the storage usage meter.
        if (showAlert) {
            const btn = document.getElementById('btn-save-project');
            btn.textContent = t('ui.project.saved');
            setTimeout(() => {
                btn.textContent = t('ui.project.save');
            }, 1200);
        }
    } catch (e) {
        alert(t('ui.storage.capacityFull'));
    }
}

// 3. Project load and HTML structure rehydration.
export function loadProject(projName) {
    const rawData = localStorage.getItem(STORAGE_KEY_PREFIX + projName);
    const canvas = document.getElementById('canvas');
    const visualCssContainer = document.getElementById('visual-css-container');

    visualCssContainer.innerHTML = ''; // Clear the right-side visual CSS UI.
    resetHistory(); // Switching projects means a new undo/redo context.

    if (!rawData) {
        cssState.initCssState();
        canvas.innerHTML = `<div class="canvas-placeholder">${t('ui.panels.canvasPlaceholder')}</div>`;
        compileAndRenderCss();
        updateStorageMeter();
        return;
    }

    const projectData = JSON.parse(rawData);
    canvas.innerHTML = projectData.html;
    cssState.deserialize(projectData.cssData || {});

    // Key rehydration: restore the drag/sort behaviors (Sortable) for the loaded HTML.
    CONTAINER_TAGS.forEach((tag) => {
        canvas.querySelectorAll(tag).forEach((el) => makeElementSortable(el));
    });
    makeElementSortable(canvas); // The canvas body itself needs re-binding too.

    // Key rehydration: pull CSS from the data store and re-render the visual blocks on the right.
    // This uses the global rehydration interface provided by app.js.
    if (window.rebuildCssRulesUI) {
        window.rebuildCssRulesUI();
    }
    if (window.refreshLayers) {
        window.refreshLayers();
    }

    compileAndRenderCss();
    updateStorageMeter();
}

// 4. Core storage meter (accurately measures total LocalStorage volume to prevent overflow).
export function updateStorageMeter() {
    let totalBytes = 0;
    // Iterate over all LocalStorage keys to compute the total volume.
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        totalBytes += (key.length + val.length) * 2; // Browsers use UTF-16 encoding, 2 bytes per character.
    }

    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    const percentage = Math.min((totalBytes / (5 * 1024 * 1024)) * 100, 100).toFixed(1); // Assume a 5MB upper bound.

    const textEl = document.getElementById('storage-text');
    const barEl = document.getElementById('storage-bar');

    if (textEl && barEl) {
        textEl.textContent = t('ui.storage.meterLabel', totalMB, '5.00', percentage);
        barEl.style.width = `${percentage}%`;

        // Warning color thresholds.
        if (percentage > 85) {
            barEl.style.backgroundColor = '#ef4444'; // Over 85% -> red, near capacity.
        } else if (percentage > 60) {
            barEl.style.backgroundColor = '#f59e0b'; // Over 60% -> orange.
        } else {
            barEl.style.backgroundColor = '#2563eb'; // Safe range -> blue.
        }
    }
}
