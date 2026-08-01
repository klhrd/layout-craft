import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshRegistry() {
    vi.resetModules();
    return await import('../src/js/modules/exportRegistry.js');
}

describe('export registry (P5f)', () => {
    it('registers the 6 built-in targets', async () => {
        const { getExportTargets } = await freshRegistry();
        const targets = getExportTargets();
        expect(targets.map((t) => t.id)).toEqual(['html-single', 'zip', 'html', 'react', 'vue', 'wc']);
        targets.forEach((t) => {
            expect(typeof t.label).toBe('string');
            expect(typeof t.generate).toBe('function');
        });
    });

    it('getExportTargets returns a copy (mutations do not leak)', async () => {
        const { getExportTargets } = await freshRegistry();
        const first = getExportTargets();
        first.length = 0;
        expect(getExportTargets().length).toBe(6);
    });

    it('accepts a third-party target and exposes it in the list', async () => {
        const { getExportTargets, registerExportTarget } = await freshRegistry();
        const custom = {
            id: 'my-format',
            label: '🚀 My Format',
            generate: () => ({ files: [{ name: 'out.txt', data: 'hello' }] }),
        };
        registerExportTarget(custom);
        expect(getExportTargets().map((t) => t.id)).toContain('my-format');
    });

    it('rejects duplicate ids', async () => {
        const { registerExportTarget } = await freshRegistry();
        expect(() => registerExportTarget({ id: 'html', label: 'dup', generate: () => ({ files: [] }) })).toThrow(
            /already registered/,
        );
    });

    it('rejects targets missing id, label, or generate', async () => {
        const { registerExportTarget } = await freshRegistry();
        expect(() => registerExportTarget({ label: 'x', generate: () => ({}) })).toThrow(/id/);
        expect(() => registerExportTarget({ id: 'x', generate: () => ({ files: [] }) })).toThrow(/label/);
        expect(() => registerExportTarget({ id: 'x', label: 'x' })).toThrow(/generate/);
    });

    it('built-in zip target produces a valid zip via the codegen contract', async () => {
        const { getExportTargets } = await freshRegistry();
        const zip = getExportTargets().find((t) => t.id === 'zip');
        const result = await zip.generate({ innerHtml: '<h1>Hi</h1>', cssCode: '.h1{}' });
        expect(result.files).toHaveLength(1);
        expect(result.files[0].name).toBe('site.zip');
        expect(result.files[0].data).toBeInstanceOf(Uint8Array);
    });

    it('built-in react target uses canvasClone and cssCode', async () => {
        const { getExportTargets } = await freshRegistry();
        const react = getExportTargets().find((t) => t.id === 'react');
        const canvasClone = document.createElement('div');
        canvasClone.innerHTML = '<p>Hi</p>';
        const result = react.generate({ cssCode: '.p{}', canvasClone });
        expect(result.files.map((f) => f.name)).toEqual(['App.jsx', 'style.css']);
        expect(result.files[0].data).toContain('export default function App()');
    });
});
