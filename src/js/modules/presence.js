import { Awareness } from 'y-protocols/awareness.js';

let _awareness = null;
let _remoteCallbacks = [];
let _throttleTimer = null;
let _lastCursor = null;
let _colorIndex = 0;

const PEER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6', '#22d3ee'];

const OVERLAY_ID = 'collab-overlay';

function getOrCreateOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText =
            'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10000;overflow:hidden;';
        const wrapper = document.querySelector('.canvas-container') || document.getElementById('canvas-wrapper');
        if (wrapper) {
            wrapper.style.position = 'relative';
            wrapper.appendChild(overlay);
        }
    }
    return overlay;
}

function getClientId() {
    return _awareness ? _awareness.clientID : Math.random().toString(36).slice(2, 8);
}

let _clientInfo = null;

export function initPresence(yDoc, displayName) {
    _clientInfo = { id: getClientId(), displayName: displayName || 'Anonymous' };
    _awareness = new Awareness(yDoc);

    _awareness.setLocalStateField('user', {
        id: _clientInfo.id,
        displayName: _clientInfo.displayName,
        color: PEER_COLORS[_colorIndex % PEER_COLORS.length],
    });
    _awareness.setLocalStateField('cursor', null);
    _awareness.setLocalStateField('selection', null);
    _colorIndex++;

    getOrCreateOverlay();

    _awareness.on('change', (_changed) => {
        const states = _awareness.getStates();
        renderRemoteCursors(states);
        for (const cb of _remoteCallbacks) {
            cb(states);
        }
    });
}

export function updateCursor(x, y) {
    if (!_awareness) return;
    _lastCursor = { x, y };
    _awareness.setLocalStateField('cursor', _lastCursor);
}

export function updateSelection(selector) {
    if (!_awareness) return;
    _awareness.setLocalStateField('selection', selector);
}

export function onRemoteUpdate(callback) {
    _remoteCallbacks.push(callback);
}

function renderRemoteCursors(states) {
    const overlay = getOrCreateOverlay();
    const localId = _awareness ? _awareness.clientID : null;
    const existing = new Set();

    for (const [clientId, state] of states) {
        if (clientId === localId) continue;
        if (!state || !state.user) continue;

        const cursor = state.cursor;
        if (!cursor) continue;

        const labelId = `cursor-${clientId}`;
        existing.add(labelId);

        let label = document.getElementById(labelId);
        if (!label) {
            label = document.createElement('div');
            label.id = labelId;
            label.style.cssText =
                'position:absolute;padding:2px 6px;border-radius:4px;font-size:11px;color:#fff;white-space:nowrap;pointer-events:none;transform:translate(-4px,-20px);';
            overlay.appendChild(label);
        }

        const color = state.user.color || '#6366f1';
        label.style.left = cursor.x + 'px';
        label.style.top = cursor.y + 'px';
        label.style.backgroundColor = color;
        label.textContent = state.user.displayName || 'Unknown';
    }

    for (const child of overlay.children) {
        if (child.id && child.id.startsWith('cursor-') && !existing.has(child.id)) {
            child.remove();
        }
    }
}

export function setThrottledCursor(x, y) {
    if (_throttleTimer) return;
    _throttleTimer = setTimeout(() => {
        _throttleTimer = null;
        if (_lastCursor) {
            updateCursor(x, y);
        }
    }, 100);
}

export function destroyPresence() {
    if (_awareness) {
        _awareness.destroy();
        _awareness = null;
    }
    _remoteCallbacks = [];
    if (_throttleTimer) {
        clearTimeout(_throttleTimer);
        _throttleTimer = null;
    }
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) overlay.remove();
}
