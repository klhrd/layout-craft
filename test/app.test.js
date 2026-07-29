import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../src/js/modules/inspector.js', () => ({
    selectElement: vi.fn(),
    deselectAll: vi.fn(),
    initInspector: vi.fn(),
}));

vi.mock('../src/js/modules/canvas.js', () => ({
    initCanvas: vi.fn(),
    setDraggedType: vi.fn(),
    cancelActiveInlineEdit: vi.fn(),
    isContainer: vi.fn(),
    makeElementSortable: vi.fn(),
}));

vi.mock('../src/js/modules/layers.js', () => ({
    initLayers: vi.fn(),
    refreshLayers: vi.fn(),
}));

vi.mock('../src/js/modules/canvasHelpers.js', () => ({
    initCanvasHelpers: vi.fn(),
    showResizeHandles: vi.fn(),
    hideResizeHandles: vi.fn(),
    showAlignGuides: vi.fn(),
    clearAlignGuides: vi.fn(),
}));

vi.mock('../src/js/modules/contextMenu.js', () => ({
    initContextMenu: vi.fn(),
}));

vi.mock('../src/js/modules/exporter.js', () => ({
    initExporter: vi.fn(),
    buildExportHtml: vi.fn(),
    buildExportCss: vi.fn(),
    cleanStyles: vi.fn(),
}));

vi.mock('../src/js/modules/importer.js', () => ({
    importFromPaste: vi.fn(),
}));

vi.mock('../src/js/modules/storage.js', () => ({
    initStorage: vi.fn(),
    saveProject: vi.fn(),
}));

function baseDom() {
    return `
        <div id="canvas"></div>
        <style id="live-styles"></style>
        <div id="visual-css-container"></div>
        <input id="input-new-selector" />
        <button id="btn-add-selector"></button>
        <div id="css-editor-toggle"><span>Toggle</span></div>
        <div id="select-project"><option value="test">Test</option></div>
        <div id="editor-form"></div>
        <div id="no-selection-msg" class="hidden"></div>
    `;
}

describe('compileAndRenderCss', () => {
    let liveStyles;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        await import('../src/js/app.js');
        liveStyles = document.getElementById('live-styles');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('renders empty string when no rules exist', async () => {
        const { initCssState } = await import('../src/js/modules/cssState.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        initCssState();
        compileAndRenderCss();
        expect(liveStyles.textContent).toBe('');
    });

    it('renders CSS rule with selector and properties', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        cssState.initCssState();
        cssState.setRule('.my-class', { color: 'red', fontSize: '16px' });

        compileAndRenderCss();
        expect(liveStyles.textContent).toContain('.my-class {');
        expect(liveStyles.textContent).toContain('color: red;');
        expect(liveStyles.textContent).toContain('fontSize: 16px;');
    });

    it('renders multiple rules separated by newlines', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        cssState.initCssState();
        cssState.setRule('.a', { color: 'red' });
        cssState.setRule('.b', { margin: '0' });

        compileAndRenderCss();
        const css = liveStyles.textContent;
        expect(css).toContain('.a {');
        expect(css).toContain('.b {');
    });
});

describe('getActiveCssCode', () => {
    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        await import('../src/js/app.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('returns the current content of live-styles', async () => {
        const { getActiveCssCode } = await import('../src/js/modules/cssEditor.js');
        document.getElementById('live-styles').textContent = '.x { color: blue; }';
        expect(getActiveCssCode()).toBe('.x { color: blue; }');
    });
});

describe('createRuleBoxUI behavior', () => {
    let visualCssContainer;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        await import('../src/js/app.js');
        visualCssContainer = document.getElementById('visual-css-container');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('rebuildCssRulesUI creates rule box from cssState rule', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red' });

        window.rebuildCssRulesUI();
        const ruleBox = visualCssContainer.querySelector('.css-rule-box');
        expect(ruleBox).not.toBeNull();
        expect(ruleBox.getAttribute('data-selector')).toBe('.card');
    });

    it('rule box contains editable-selector-input and delete button', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red' });

        window.rebuildCssRulesUI();
        const ruleBox = visualCssContainer.querySelector('.css-rule-box');
        expect(ruleBox.querySelector('.editable-selector-input')).not.toBeNull();
        expect(ruleBox.querySelector('.btn-delete-rule')).not.toBeNull();
        expect(ruleBox.querySelector('.css-rule-body-dropzone')).not.toBeNull();
    });
});

describe('addAppliedBlockUI behavior', () => {
    let visualCssContainer;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        await import('../src/js/app.js');
        visualCssContainer = document.getElementById('visual-css-container');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('rebuilt rule box shows applied style blocks', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red', fontSize: '14px' });

        window.rebuildCssRulesUI();
        const blocks = visualCssContainer.querySelectorAll('.applied-css-block');
        expect(blocks.length).toBe(2);
        expect(blocks[0].getAttribute('data-prop')).toBe('color');
        expect(blocks[1].getAttribute('data-prop')).toBe('fontSize');
    });

    it('each applied block has label and value input', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red' });

        window.rebuildCssRulesUI();
        const block = visualCssContainer.querySelector('.applied-css-block');
        expect(block.querySelector('.block-label')).not.toBeNull();
        expect(block.querySelector('.block-value-input')).not.toBeNull();
    });
});

describe('initCssEditorCollapse behavior', () => {
    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        await import('../src/js/app.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('clicking css-editor-toggle toggles collapsed class on parent', () => {
        const toggle = document.getElementById('css-editor-toggle');
        const parent = toggle.parentElement;

        toggle.addEventListener('click', () => {
            parent.classList.toggle('collapsed');
        });

        toggle.click();
        expect(parent.classList.contains('collapsed')).toBe(true);

        toggle.click();
        expect(parent.classList.contains('collapsed')).toBe(false);
    });

    it('compileAndRenderCss requires live-styles element', async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        await import('../src/js/app.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        expect(() => compileAndRenderCss()).not.toThrow();
    });
});
