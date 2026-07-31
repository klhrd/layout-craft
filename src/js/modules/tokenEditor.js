import * as cssState from './cssState.js';
import { compileAndRenderCss } from './cssEditor.js';
import { t } from '../config/i18n.js';

let tokensList = null;

window.rebuildTokenUI = function () {
    rebuildTokenUI();
};

export function initTokenEditor() {
    const panel = document.querySelector('.css-editor-panel');
    const container = document.getElementById('visual-css-container');
    if (!panel || !container) return;

    const section = document.createElement('div');
    section.className = 'css-tokens-section';
    section.innerHTML = `
        <div class="css-tokens-header">
            <span class="css-tokens-title">${t('ui.tokens.title')}</span>
            <button type="button" class="btn-add-token" title="${t('ui.tokens.add')}"><span class="mat-icon">add</span></button>
        </div>
        <div class="css-tokens-list"></div>
    `;
    panel.insertBefore(section, container);

    tokensList = section.querySelector('.css-tokens-list');

    const addBtn = section.querySelector('.btn-add-token');
    addBtn.addEventListener('click', () => {
        const name = prompt(t('ui.tokens.namePrompt'));
        if (!name || !name.trim().startsWith('--')) {
            alert(t('ui.tokens.invalidName'));
            return;
        }
        const existing = Object.keys(cssState.getTokens()).find((k) => k === name.trim());
        if (existing) {
            alert(t('ui.tokens.exists'));
            return;
        }
        cssState.setToken(name.trim(), '');
        renderTokenUI();
        compileAndRenderCss();
        saveCurrentProject();
    });

    renderTokenUI();
}

export function rebuildTokenUI() {
    if (!tokensList) return;
    renderTokenUI();
}

function renderTokenUI() {
    if (!tokensList) return;
    tokensList.innerHTML = '';

    const tokens = cssState.getTokens();
    const entries = Object.entries(tokens);
    if (entries.length === 0) {
        tokensList.innerHTML = `<div class="css-tokens-empty">${t('ui.tokens.empty')}</div>`;
        return;
    }

    for (const [name, value] of entries) {
        const row = document.createElement('div');
        row.className = 'css-token-row';
        row.innerHTML = `
            <input type="text" class="token-name-input" value="${name}" spellcheck="false" />
            <input type="text" class="token-value-input" value="${escapeAttr(value)}" spellcheck="false" />
            <button type="button" class="btn-delete-token" title="${t('ui.tokens.delete')}"><span class="mat-icon">close</span></button>
        `;

        const nameInput = row.querySelector('.token-name-input');
        const valueInput = row.querySelector('.token-value-input');

        let oldName = name;
        let oldValue = value;

        nameInput.addEventListener('change', () => {
            const newName = nameInput.value.trim();
            if (!newName.startsWith('--')) {
                nameInput.value = oldName;
                return;
            }
            const tokensNow = cssState.getTokens();
            if (tokensNow[newName] !== undefined && newName !== oldName) {
                alert(t('ui.tokens.exists'));
                nameInput.value = oldName;
                return;
            }
            cssState.deleteToken(oldName);
            cssState.setToken(newName, valueInput.value);
            oldName = newName;
            compileAndRenderCss();
            saveCurrentProject();
        });

        valueInput.addEventListener('input', () => {
            cssState.setToken(oldName, valueInput.value);
            compileAndRenderCss();
        });
        valueInput.addEventListener('change', () => {
            saveCurrentProject();
        });
        valueInput.addEventListener('blur', () => {
            if (valueInput.value !== oldValue) {
                oldValue = valueInput.value;
                saveCurrentProject();
            }
        });

        row.querySelector('.btn-delete-token').addEventListener('click', () => {
            cssState.deleteToken(oldName);
            renderTokenUI();
            compileAndRenderCss();
            saveCurrentProject();
        });

        tokensList.appendChild(row);
    }
}

function escapeAttr(value) {
    return String(value).replace(/"/g, '&quot;');
}

function saveCurrentProject() {
    const select = document.getElementById('select-project');
    if (select && select.value && window.saveProject) {
        window.saveProject(select.value, false);
    }
}
