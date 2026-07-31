import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../src/js/app.js', () => ({
    compileAndRenderCss: vi.fn(),
    getActiveCssCode: vi.fn(() => ''),
}));

vi.mock('../src/js/modules/canvasHelpers.js', () => ({
    showResizeHandles: vi.fn(),
    hideResizeHandles: vi.fn(),
}));

function baseDom() {
    return `
        <div id="canvas" class="canvas"><div id="test-el">Hello</div></div>
        <div id="editor-form" class="hidden"></div>
        <div id="no-selection-msg"></div>
        <span id="selected-tag-name"></span>
        <input id="input-id" />
        <input id="input-class" />
        <input id="input-text" />
        <button id="btn-delete"></button>
        <button id="btn-lift-out"></button>
        <div id="dynamic-properties"></div>
        <div id="style-editor"></div>
        <div id="hierarchy-controls"></div>
        <span id="hierarchy-parent-name"></span>
        <button id="btn-move-up"></button>
        <button id="btn-move-down"></button>
        <button id="btn-wrap-div"></button>
        <button id="btn-wrap-section"></button>
        <button id="btn-unwrap"></button>
        <div id="live-styles"></div>
    `;
}

describe('selectElement', () => {
    let inspector;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        inspector = await import('../src/js/modules/inspector.js');
        inspector.initInspector();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('adds selected-element class to the target element', () => {
        const el = document.getElementById('test-el');
        inspector.selectElement(el);
        expect(el.classList.contains('selected-element')).toBe(true);
    });

    it('shows the editor form and hides the no-selection message', () => {
        const el = document.getElementById('test-el');
        inspector.selectElement(el);
        expect(document.getElementById('editor-form').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('no-selection-msg').classList.contains('hidden')).toBe(true);
    });

    it('updates the selected-tag-name with the element tag', () => {
        const el = document.getElementById('test-el');
        inspector.selectElement(el);
        expect(document.getElementById('selected-tag-name').textContent).toBe('div');
    });

    it('renders a token picker button in every style row', () => {
        const el = document.getElementById('test-el');
        inspector.selectElement(el);
        const rows = document.querySelectorAll('.style-row');
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
            expect(row.querySelector('.btn-token-picker')).not.toBeNull();
        });
    });

    it('clears previous selection before selecting a new element', () => {
        const canvas = document.getElementById('canvas');
        const el1 = document.getElementById('test-el');
        const el2 = document.createElement('p');
        el2.textContent = 'Second';
        canvas.appendChild(el2);

        inspector.selectElement(el1);
        inspector.selectElement(el2);

        expect(el1.classList.contains('selected-element')).toBe(false);
        expect(el2.classList.contains('selected-element')).toBe(true);
    });

    it('fills input-text with text content of the element', () => {
        const el = document.getElementById('test-el');
        inspector.selectElement(el);
        expect(document.getElementById('input-text').value).toBe('Hello');
    });

    it('fills input-id with the element id', () => {
        const el = document.getElementById('test-el');
        el.id = 'my-id';
        inspector.selectElement(el);
        expect(document.getElementById('input-id').value).toBe('my-id');
    });
});

describe('deselectAll', () => {
    let inspector;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = baseDom();
        vi.clearAllMocks();
        inspector = await import('../src/js/modules/inspector.js');
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('removes selected-element class from all elements', () => {
        const el = document.getElementById('test-el');
        el.classList.add('selected-element');
        inspector.deselectAll();
        expect(document.querySelectorAll('.canvas .selected-element').length).toBe(0);
    });

    it('hides the editor form and shows the no-selection message', () => {
        inspector.deselectAll();
        expect(document.getElementById('editor-form').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('no-selection-msg').classList.contains('hidden')).toBe(false);
    });
});

describe('hierarchy controls', () => {
    let inspector;

    beforeEach(async () => {
        vi.resetModules();
        document.body.innerHTML = `
            <div id="canvas" class="canvas">
                <div id="parent">
                    <div id="child">Child</div>
                    <div id="sibling">Sibling</div>
                </div>
            </div>
            <div id="editor-form"></div>
            <div id="no-selection-msg" class="hidden"></div>
            <span id="selected-tag-name"></span>
            <input id="input-id" />
            <input id="input-class" />
            <input id="input-text" />
            <button id="btn-delete"></button>
            <button id="btn-lift-out"></button>
            <div id="dynamic-properties"></div>
            <div id="style-editor"></div>
            <div id="hierarchy-controls"></div>
            <span id="hierarchy-parent-name"></span>
            <button id="btn-move-up"></button>
            <button id="btn-move-down"></button>
            <button id="btn-wrap-div"></button>
            <button id="btn-wrap-section"></button>
            <button id="btn-unwrap"></button>
            <div id="live-styles"></div>
        `;
        vi.clearAllMocks();
        inspector = await import('../src/js/modules/inspector.js');
        inspector.initInspector();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('wrapSelected wraps the element in a new container', () => {
        const child = document.getElementById('child');
        const parent = document.getElementById('parent');
        inspector.selectElement(child);
        document.getElementById('btn-wrap-div').click();
        expect(child.parentNode.tagName).toBe('DIV');
        expect(child.parentNode.parentNode).toBe(parent);
    });

    it('move up reorders elements', () => {
        const child = document.getElementById('child');
        const sibling = document.getElementById('sibling');
        inspector.selectElement(sibling);
        document.getElementById('btn-move-up').click();

        const children = Array.from(document.getElementById('parent').children);
        expect(children.indexOf(sibling)).toBeLessThan(children.indexOf(child));
    });

    it('btn-unwrap removes the wrapper element and moves children up', () => {
        const canvas = document.getElementById('canvas');
        const parent = document.getElementById('parent');
        const wrapper = document.createElement('div');
        wrapper.id = 'wrapper';
        const innerSpan = document.createElement('span');
        innerSpan.textContent = 'inner text';
        wrapper.appendChild(innerSpan);
        parent.appendChild(wrapper);

        inspector.selectElement(wrapper);
        document.getElementById('btn-unwrap').click();

        expect(canvas.contains(innerSpan)).toBe(true);
        expect(document.getElementById('wrapper')).toBeNull();
    });
});
