import * as cssState from './cssState.js';
import { t } from '../config/i18n.js';

let activePopup = null;

function closePopup() {
    if (activePopup) {
        activePopup.remove();
        activePopup = null;
    }
}

function buildPopup(currentValue, onPick) {
    const popup = document.createElement('div');
    popup.className = 'token-picker-popup';

    const tokens = cssState.getTokens();
    const entries = Object.entries(tokens);
    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'token-picker-empty';
        empty.textContent = t('ui.tokens.pickerEmpty');
        popup.appendChild(empty);
    } else {
        for (const [name, value] of entries) {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'token-picker-item';
            item.innerHTML = `<span class="token-picker-name">${name}</span><span class="token-picker-value">${value}</span>`;
            item.addEventListener('click', () => {
                closePopup();
                onPick(`var(${name})`);
            });
            popup.appendChild(item);
        }
    }

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.className = 'token-picker-save';
    saveBtn.textContent = t('ui.tokens.saveAsToken');
    saveBtn.addEventListener('click', () => {
        const name = prompt(t('ui.tokens.namePrompt'));
        if (!name || !name.trim().startsWith('--')) {
            alert(t('ui.tokens.invalidName'));
            return;
        }
        if (cssState.getTokens()[name.trim()] !== undefined) {
            alert(t('ui.tokens.exists'));
            return;
        }
        cssState.setToken(name.trim(), currentValue);
        if (window.rebuildTokenUI) window.rebuildTokenUI();
        closePopup();
        onPick(`var(${name.trim()})`);
    });
    popup.appendChild(saveBtn);

    return popup;
}

export function createTokenPickerButton({ currentValue, onPick }) {
    const wrap = document.createElement('span');
    wrap.className = 'token-picker-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-token-picker';
    btn.title = t('ui.tokens.pickerTitle');
    btn.innerHTML = '<span class="mat-icon">palette</span>';
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closePopup();
        const popup = buildPopup(currentValue, onPick);
        wrap.appendChild(popup);
        activePopup = popup;
    });

    wrap.appendChild(btn);
    return wrap;
}

document.addEventListener('click', (e) => {
    if (activePopup && !activePopup.contains(e.target)) {
        closePopup();
    }
});
