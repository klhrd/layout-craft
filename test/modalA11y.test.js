import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function flush() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function press(key, opts = {}) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));
    await flush();
}

describe('modalA11y', () => {
    let modalA11y;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = `
            <button id="trigger">Open</button>
            <div id="m1" class="modal-overlay" style="display: none">
                <div class="modal-dialog">
                    <h2 class="modal-title"><span>Import HTML / CSS</span></h2>
                    <input id="m1-input" type="text" />
                    <button id="m1-cancel" class="btn-secondary">Cancel</button>
                    <button id="m1-ok" class="primary-btn">Import</button>
                </div>
            </div>
            <div id="m2" class="modal-overlay" style="display: none">
                <div class="modal-dialog">
                    <h2 class="modal-title"><span>Open Project</span></h2>
                    <button id="m2-close" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        modalA11y = await import('../src/js/modules/modalA11y.js');
    });

    afterEach(() => {
        modalA11y.destroyModalA11y();
        vi.resetModules();
    });

    it('adds dialog semantics to every modal', () => {
        modalA11y.initModalA11y(document);
        const m1 = document.getElementById('m1');
        expect(m1.getAttribute('role')).toBe('dialog');
        expect(m1.getAttribute('aria-modal')).toBe('true');
        expect(m1.getAttribute('aria-label')).toContain('Import HTML / CSS');
        expect(document.getElementById('m2').getAttribute('role')).toBe('dialog');
    });

    it('moves focus to the first focusable when a modal opens', async () => {
        modalA11y.initModalA11y(document);
        document.getElementById('trigger').focus();
        document.getElementById('m1').style.display = 'flex';
        await flush();
        expect(document.activeElement).toBe(document.getElementById('m1-input'));
    });

    it('closes the active modal on Escape and restores focus', async () => {
        modalA11y.initModalA11y(document);
        const trigger = document.getElementById('trigger');
        trigger.focus();
        const m1 = document.getElementById('m1');
        m1.style.display = 'flex';
        await flush();
        expect(document.activeElement).not.toBe(trigger);
        await press('Escape');
        expect(m1.style.display).toBe('none');
        expect(document.activeElement).toBe(trigger);
    });

    it('traps Tab inside the active modal and wraps around', async () => {
        modalA11y.initModalA11y(document);
        document.getElementById('m1').style.display = 'flex';
        await flush();
        expect(document.activeElement).toBe(document.getElementById('m1-input'));
        await press('Tab', { shiftKey: true });
        expect(document.activeElement).toBe(document.getElementById('m1-ok'));
        await press('Tab');
        expect(document.activeElement).toBe(document.getElementById('m1-input'));
    });

    it('handles the innermost open overlay (preview-on-top semantics)', async () => {
        modalA11y.initModalA11y(document);
        document.getElementById('m1').style.display = 'flex';
        document.getElementById('m2').style.display = 'flex';
        await flush();
        expect(document.activeElement).toBe(document.getElementById('m2-close'));
        await press('Escape');
        expect(document.getElementById('m2').style.display).toBe('none');
        expect(document.getElementById('m1').style.display).toBe('flex');
    });
});
