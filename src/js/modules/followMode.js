import { onRemoteUpdate } from './presence.js';
import { selectElement } from './inspector.js';

let _active = false;
let _followedPeerId = null;
let _pauseFollow = false;

export function isFollowing() {
    return _active;
}

export function initFollowMode() {
    const btn = document.getElementById('btn-follow');
    if (!btn) return;

    btn.addEventListener('click', () => {
        _active = !_active;
        btn.classList.toggle('active', _active);
        if (!_active) {
            _followedPeerId = null;
            clearHighlight();
        }
    });

    const chkAnon = document.getElementById('chk-anonymous');
    if (chkAnon) {
        chkAnon.addEventListener('change', () => {
            document.body.classList.toggle('collab-anonymous', chkAnon.checked);
        });
    }

    onRemoteUpdate((states) => {
        if (!_active) return;
        if (_pauseFollow) return;

        for (const [clientId, state] of states) {
            if (!state || !state.selection) continue;
            _followedPeerId = clientId;
            followPeer(state);
            break;
        }
    });
}

function followPeer(state) {
    const selector = state.selection;
    if (!selector) return;
    const el = document.querySelector(selector);
    if (!el) return;

    _pauseFollow = true;
    selectElement(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    highlightElement(el);
    setTimeout(() => {
        _pauseFollow = false;
    }, 300);
}

function highlightElement(el) {
    clearHighlight();
    el.classList.add('follow-highlight');
}

function clearHighlight() {
    document.querySelectorAll('.follow-highlight').forEach((el) => el.classList.remove('follow-highlight'));
}
