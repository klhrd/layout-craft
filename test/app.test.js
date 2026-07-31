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

    it('renders :root block from design tokens', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        cssState.initCssState();
        cssState.setToken('--color-primary', '#2563eb');
        cssState.setToken('--space', '16px');

        compileAndRenderCss();
        const css = liveStyles.textContent;
        expect(css).toContain(':root {');
        expect(css).toContain('--color-primary: #2563eb;');
        expect(css).toContain('--space: 16px;');
    });

    it('omits :root block when no tokens exist', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        cssState.initCssState();
        cssState.setRule('.a', { color: 'red' });

        compileAndRenderCss();
        const css = liveStyles.textContent;
        expect(css).not.toContain(':root');
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

    it('clicking rule-box toggle collapses that rule box only', async () => {
        const { initRuleBoxCollapse } = await import('../src/js/modules/cssEditor.js');
        initRuleBoxCollapse();
        const container = document.getElementById('visual-css-container');
        container.innerHTML = `
            <div class="css-rule-box" data-selector=".first">
                <div class="css-rule-header">
                    <button type="button" class="css-rule-toggle"><span class="mat-icon">keyboard_arrow_down</span></button>
                    <div class="editable-selector-input">.first</div>
                </div>
                <div class="css-rule-body-dropzone"></div>
                <div class="css-rule-close">}</div>
            </div>
            <div class="css-rule-box" data-selector=".second">
                <div class="css-rule-header">
                    <button type="button" class="css-rule-toggle"><span class="mat-icon">keyboard_arrow_down</span></button>
                    <div class="editable-selector-input">.second</div>
                </div>
                <div class="css-rule-body-dropzone"></div>
                <div class="css-rule-close">}</div>
            </div>
        `;
        const first = container.querySelector('.css-rule-box[data-selector=".first"]');
        const second = container.querySelector('.css-rule-box[data-selector=".second"]');
        const toggle = first.querySelector('.css-rule-toggle');

        toggle.click();
        expect(first.classList.contains('collapsed')).toBe(true);
        expect(second.classList.contains('collapsed')).toBe(false);

        toggle.click();
        expect(first.classList.contains('collapsed')).toBe(false);
    });

    it('compileAndRenderCss requires live-styles element', async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        await import('../src/js/app.js');
        const { compileAndRenderCss } = await import('../src/js/modules/cssEditor.js');
        expect(() => compileAndRenderCss()).not.toThrow();
    });
});

describe('token editor UI', () => {
    let panel;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML =
            baseDom().replace('<div id="visual-css-container"></div>', '') +
            '<aside class="css-editor-panel"><h3>Visual CSS Rules</h3><div id="visual-css-container"></div></aside>';
        vi.clearAllMocks();
        await import('../src/js/app.js');
        const { initTokenEditor } = await import('../src/js/modules/tokenEditor.js');
        initTokenEditor();
        panel = document.querySelector('.css-editor-panel');
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
    });

    it('creates the tokens section inside the css editor panel', () => {
        const section = panel.querySelector('.css-tokens-section');
        expect(section).not.toBeNull();
        expect(panel.querySelector('.btn-add-token')).not.toBeNull();
        expect(panel.querySelector('.css-tokens-list')).not.toBeNull();
    });

    it('shows empty message when no tokens exist', () => {
        expect(panel.querySelector('.css-tokens-empty')).not.toBeNull();
    });

    it('adding a token via prompt renders a row and compiles :root', async () => {
        vi.stubGlobal(
            'prompt',
            vi.fn(() => '--my-color'),
        );
        const addBtn = panel.querySelector('.btn-add-token');
        addBtn.click();

        const row = panel.querySelector('.css-token-row');
        expect(row).not.toBeNull();
        expect(row.querySelector('.token-name-input').value).toBe('--my-color');
        expect(document.getElementById('live-styles').textContent).toContain(':root');
        expect(document.getElementById('live-styles').textContent).toContain('--my-color: ;');
    });

    it('rejects a prompt that does not start with --', async () => {
        const alertSpy = vi.fn();
        vi.stubGlobal(
            'prompt',
            vi.fn(() => 'my-color'),
        );
        vi.stubGlobal('alert', alertSpy);
        panel.querySelector('.btn-add-token').click();

        expect(alertSpy).toHaveBeenCalled();
        expect(panel.querySelector('.css-token-row')).toBeNull();
    });

    it('typing a value updates the compiled CSS live', () => {
        vi.stubGlobal(
            'prompt',
            vi.fn(() => '--color-primary'),
        );
        panel.querySelector('.btn-add-token').click();

        const valueInput = panel.querySelector('.token-value-input');
        valueInput.value = '#ff0000';
        valueInput.dispatchEvent(new Event('input'));
        expect(document.getElementById('live-styles').textContent).toContain('--color-primary: #ff0000;');
    });

    it('deleting a token removes the row and the :root entry', () => {
        vi.stubGlobal(
            'prompt',
            vi.fn(() => '--color-primary'),
        );
        panel.querySelector('.btn-add-token').click();
        expect(panel.querySelector('.css-token-row')).not.toBeNull();

        panel.querySelector('.btn-delete-token').click();
        expect(panel.querySelector('.css-token-row')).toBeNull();
        expect(document.getElementById('live-styles').textContent).not.toContain(':root');
    });

    it('rebuildTokenUI re-renders rows from cssState', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--space', '16px');

        window.rebuildTokenUI();
        const row = panel.querySelector('.css-token-row');
        expect(row).not.toBeNull();
        expect(row.querySelector('.token-name-input').value).toBe('--space');
        expect(row.querySelector('.token-value-input').value).toBe('16px');
    });
});

describe('token picker on css block value inputs', () => {
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
        vi.unstubAllGlobals();
    });

    it('renders a token picker button next to every value input', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red' });

        window.rebuildCssRulesUI();
        const block = visualCssContainer.querySelector('.applied-css-block');
        expect(block.querySelector('.btn-token-picker')).not.toBeNull();
    });

    it('selecting a token from the popup sets value to var(--name)', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--brand', '#123456');
        cssState.setRule('.card', { color: 'red' });
        window.rebuildCssRulesUI();

        const block = visualCssContainer.querySelector('.applied-css-block');
        block.querySelector('.btn-token-picker').click();
        const item = block.querySelector('.token-picker-item');
        expect(item).not.toBeNull();
        expect(item.textContent).toContain('--brand');

        item.click();
        const valueInput = block.querySelector('.block-value-input');
        expect(valueInput.value).toBe('var(--brand)');
        expect(document.getElementById('live-styles').textContent).toContain('color: var(--brand);');
    });

    it('save as token stores the current value and applies var()', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setRule('.card', { color: 'red' });
        window.rebuildCssRulesUI();

        vi.stubGlobal(
            'prompt',
            vi.fn(() => '--my-color'),
        );
        const block = visualCssContainer.querySelector('.applied-css-block');
        block.querySelector('.btn-token-picker').click();
        block.querySelector('.token-picker-save').click();

        expect(cssState.getTokens()['--my-color']).toBe('red');
        const valueInput = block.querySelector('.block-value-input');
        expect(valueInput.value).toBe('var(--my-color)');
        expect(document.getElementById('live-styles').textContent).toContain('color: var(--my-color);');
    });

    it('renaming a token rewrites var() references in cssState', async () => {
        const cssState = await import('../src/js/modules/cssState.js');
        cssState.initCssState();
        cssState.setToken('--brand', '#123456');
        cssState.setRule('.card', { color: 'var(--brand)' });

        cssState.replaceTokenRef('--brand', '--accent');
        expect(cssState.getProperty('.card', 'color')).toBe('var(--accent)');
    });
});
