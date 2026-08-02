const MODALS_SELECTOR = '.modal-overlay, #template-preview-overlay';
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

let activeModal = null;
let lastFocused = null;
let observer = null;

function isVisible(el) {
    return el.style.display !== 'none' && !el.classList.contains('hidden');
}

function getFocusables(modal) {
    return Array.from(modal.querySelectorAll(FOCUSABLE)).filter((el) => !el.disabled);
}

function setActive(modal) {
    if (activeModal === modal) return;
    if (modal) {
        lastFocused = document.activeElement;
        activeModal = modal;
        const first = getFocusables(modal)[0];
        if (first) first.focus();
    } else {
        activeModal = null;
        if (lastFocused && lastFocused.isConnected) lastFocused.focus();
        lastFocused = null;
    }
}

function updateActive() {
    const open = Array.from(document.querySelectorAll(MODALS_SELECTOR)).filter(isVisible);
    setActive(open.length ? open[open.length - 1] : null);
}

function onKeyDown(e) {
    if (!activeModal) return;
    if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        activeModal.style.display = 'none';
        updateActive();
        return;
    }
    if (e.key === 'Tab') {
        const focusables = getFocusables(activeModal);
        if (!focusables.length) {
            e.preventDefault();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

/**
 * Adds dialog semantics + focus trap + Escape-to-close to every modal
 * (.modal-overlay). Open/close is detected via MutationObserver on the
 * style attribute, so existing display-toggle code needs no changes.
 */
export function initModalA11y(root = document) {
    root.querySelectorAll(MODALS_SELECTOR).forEach((modal) => {
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        if (!modal.getAttribute('aria-label') && !modal.getAttribute('aria-labelledby')) {
            const title = modal.querySelector('.modal-title');
            modal.setAttribute('aria-label', title ? title.textContent.trim() : 'Dialog');
        }
    });
    document.addEventListener('keydown', onKeyDown, true);
    observer = new MutationObserver(updateActive);
    observer.observe(root, { attributes: true, attributeFilter: ['style'], subtree: true });
    updateActive();
}

export function destroyModalA11y() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    document.removeEventListener('keydown', onKeyDown, true);
    activeModal = null;
    lastFocused = null;
}
