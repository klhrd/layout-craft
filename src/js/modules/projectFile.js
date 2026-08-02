import { t } from '../config/i18n.js';
import * as cssState from './cssState.js';
import { compileAndRenderCss } from './cssEditor.js';
import { makeElementSortable } from './canvas.js';
import { CONTAINER_TAGS } from '../config/elements.js';
import { deselectAll } from './inspector.js';
import { reset as resetHistory } from './history.js';
import { updateStorageMeter } from './storage.js';

const STORAGE_KEY_PREFIX = 'layoutcraft_proj_';
const LIST_KEY = 'layoutcraft_project_list';
const PROJECT_FILE_VERSION = 2;

export function buildProjectFile(projName, html, cssData, tokens) {
    return {
        app: 'layoutcraft',
        version: PROJECT_FILE_VERSION,
        name: projName,
        html,
        cssData: cssData || {},
        tokens: tokens || cssState.getTokens(),
        updated_at: new Date().toISOString(),
    };
}

export function validateProjectFile(data) {
    if (!data || typeof data !== 'object') return false;
    if (data.app !== 'layoutcraft') return false;
    const version = data.version === undefined ? 1 : data.version;
    if (typeof version !== 'number' || version < 1 || version > PROJECT_FILE_VERSION) return false;
    if (typeof data.html !== 'string') return false;
    if (data.cssData !== undefined && (typeof data.cssData !== 'object' || data.cssData === null)) return false;
    if (data.tokens !== undefined && (typeof data.tokens !== 'object' || data.tokens === null)) return false;
    return true;
}

/**
 * Upgrade an older .lcproj payload to the current schema. v1 files (no
 * version field) predate design tokens; seed an empty token map. Unknown
 * future versions are rejected by validateProjectFile() before this runs.
 */
export function migrateProjectFile(data) {
    if (!data || typeof data !== 'object') return data;
    const version = data.version === undefined ? 1 : data.version;
    const migrated = { ...data };
    if (version < 2 && (migrated.tokens === undefined || migrated.tokens === null)) {
        migrated.tokens = {};
    }
    migrated.version = PROJECT_FILE_VERSION;
    return migrated;
}

export function serializeProjectFile(projName) {
    const rawData = localStorage.getItem(STORAGE_KEY_PREFIX + projName);
    const stored = rawData ? JSON.parse(rawData) : null;
    return buildProjectFile(
        projName,
        stored && stored.html ? stored.html : document.getElementById('canvas').innerHTML,
        stored && stored.cssData ? stored.cssData : cssState.serialize(),
        stored && stored.tokens ? stored.tokens : undefined,
    );
}

function downloadFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function exportProjectFile(projName) {
    const data = serializeProjectFile(projName);
    const safeName = projName.replace(/[\\/:*?"<>|]/g, '_') || 'project';
    downloadFile(`${safeName}.lcproj`, JSON.stringify(data, null, 2));
}

function loadProjectFromData(projectData) {
    const canvas = document.getElementById('canvas');
    const visualCssContainer = document.getElementById('visual-css-container');

    visualCssContainer.innerHTML = '';
    resetHistory();

    canvas.innerHTML = projectData.html;
    cssState.deserialize(projectData.cssData || {});
    cssState.setTokens(projectData.tokens);

    CONTAINER_TAGS.forEach((tag) => {
        canvas.querySelectorAll(tag).forEach((el) => makeElementSortable(el));
    });
    makeElementSortable(canvas);

    if (window.rebuildCssRulesUI) window.rebuildCssRulesUI();
    if (window.rebuildTokenUI) window.rebuildTokenUI();
    if (window.refreshLayers) window.refreshLayers();
    compileAndRenderCss();
}

export function importProjectFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const raw = JSON.parse(reader.result);
                if (!validateProjectFile(raw)) {
                    reject(new Error(t('ui.project.importInvalid')));
                    return;
                }
                const data = migrateProjectFile(raw);

                const list = JSON.parse(localStorage.getItem(LIST_KEY)) || [];
                let name = (data.name || file.name.replace(/\.lcproj$/i, '')).replace(/\s+/g, '_');
                while (list.includes(name)) {
                    name = name + '_imported';
                }
                list.push(name);
                localStorage.setItem(LIST_KEY, JSON.stringify(list));

                localStorage.setItem(
                    STORAGE_KEY_PREFIX + name,
                    JSON.stringify({
                        html: data.html,
                        cssData: data.cssData || {},
                        tokens: data.tokens || {},
                        updated_at: data.updated_at,
                    }),
                );

                deselectAll();
                loadProjectFromData(data);

                const select = document.getElementById('select-project');
                const lastActiveKey = 'layoutcraft_last_active_proj';
                select.innerHTML = '';
                list.forEach((proj) => {
                    const opt = document.createElement('option');
                    opt.value = proj;
                    opt.textContent = proj.replace(/_/g, ' ');
                    select.appendChild(opt);
                });
                select.value = name;
                localStorage.setItem(lastActiveKey, name);
                updateStorageMeter();
                resolve(name);
            } catch (e) {
                reject(new Error(t('ui.project.importInvalid')));
            }
        };
        reader.onerror = () => reject(new Error(t('ui.project.importInvalid')));
        reader.readAsText(file);
    });
}

export function initProjectFileDrop() {
    let dragDepth = 0;
    window.addEventListener('dragenter', (e) => {
        if (Array.from(e.dataTransfer?.types || []).includes('Files')) dragDepth++;
    });
    window.addEventListener('dragleave', () => {
        dragDepth = Math.max(0, dragDepth - 1);
    });
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    window.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDepth = 0;
        const files = Array.from(e.dataTransfer?.files || []);
        const lcFile = files.find((f) => f.name.toLowerCase().endsWith('.lcproj'));
        if (!lcFile) return;
        importProjectFile(lcFile)
            .then((name) => alert(t('ui.project.importSuccess', name)))
            .catch((err) => alert(err.message));
    });
}
