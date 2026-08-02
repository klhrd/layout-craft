import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function installDom() {
    document.body.innerHTML = `
        <style id="live-styles"></style>
        <input type="text" id="input-new-selector" />
        <button id="btn-add-selector"></button>
        <div id="visual-css-container"></div>
    `;
}

describe('window hook installs (module side effects)', () => {
    beforeEach(() => {
        vi.resetModules();
        installDom();
    });

    afterEach(() => {
        delete window.rebuildCssRulesUI;
        delete window.rebuildTokenUI;
        vi.resetModules();
    });

    it('cssEditor installs window.rebuildCssRulesUI on import', async () => {
        await import('../src/js/modules/cssEditor.js');
        expect(typeof window.rebuildCssRulesUI).toBe('function');
    });

    it('tokenEditor installs window.rebuildTokenUI on import', async () => {
        await import('../src/js/modules/tokenEditor.js');
        expect(typeof window.rebuildTokenUI).toBe('function');
    });

    it('a stub set AFTER import is preserved (the supported test pattern)', async () => {
        await import('../src/js/modules/cssEditor.js');
        const stub = vi.fn();
        window.rebuildCssRulesUI = stub;
        expect(window.rebuildCssRulesUI).toBe(stub);
    });
});
