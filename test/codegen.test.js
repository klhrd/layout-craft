import { describe, it, expect } from 'vitest';
import {
    attrMap,
    serializeAttrs,
    formatJsxTagOpen,
    formatHtmlTagOpen,
    formatCloseTag,
} from '../src/js/modules/codegen/domWalker.js';
import { buildJsxExport } from '../src/js/modules/codegen/jsxExport.js';
import { buildVueExport } from '../src/js/modules/codegen/vueExport.js';

describe('domWalker', () => {
    it('attrMap rewrites class to className in JSX', () => {
        const el = document.createElement('div');
        el.setAttribute('class', 'foo bar');
        el.setAttribute('id', 'main');
        const jsx = attrMap(el, 'jsx');
        expect(jsx.className).toBe('foo bar');
        expect(jsx.id).toBe('main');
        expect(jsx.class).toBeUndefined();
    });

    it('attrMap passes attrs through for HTML format', () => {
        const el = document.createElement('div');
        el.setAttribute('class', 'foo');
        const html = attrMap(el, 'html');
        expect(html.class).toBe('foo');
    });

    it('serializeAttrs builds key="val" pairs', () => {
        const result = serializeAttrs({ className: 'foo', id: 'bar' }, 'html');
        expect(result).toContain('className="foo"');
        expect(result).toContain('id="bar"');
    });

    it('formatJsxTagOpen self-closes void elements', () => {
        const result = formatJsxTagOpen('img', { src: 'a.png' }, true, 0);
        expect(result).toContain('<img');
        expect(result).toContain('/>');
    });

    it('formatHtmlTagOpen renders open tag', () => {
        const result = formatHtmlTagOpen('div', { class: 'box' }, 0);
        expect(result).toBe('<div class="box">');
    });

    it('formatCloseTag renders closing tag', () => {
        expect(formatCloseTag('div', 0)).toBe('</div>');
    });
});

describe('buildJsxExport', () => {
    function createCanvas(html) {
        const c = document.createElement('div');
        c.innerHTML = html;
        return c;
    }

    it('produces a valid JSX component with className mapping', () => {
        const canvas = createCanvas('<div class="container"><p id="intro">Hello</p></div>');
        const result = buildJsxExport(canvas);
        expect(result).toContain("import './style.css'");
        expect(result).toContain('export default function App()');
        expect(result).toContain('className="container"');
        expect(result).toContain('id="intro"');
        expect(result).toContain('Hello');
    });

    it('does not include canvas-placeholder elements', () => {
        const canvas = createCanvas('<div class="canvas-placeholder">placeholder</div><section>real</section>');
        const result = buildJsxExport(canvas);
        expect(result).not.toContain('placeholder');
        expect(result).toContain('real');
    });
});

describe('buildVueExport', () => {
    function createCanvas(html) {
        const c = document.createElement('div');
        c.innerHTML = html;
        return c;
    }

    it('produces a Vue SFB with template, script, scoped style', () => {
        const canvas = createCanvas('<div class="hero"><h1>Title</h1></div>');
        const css = '.hero { color: red; }';
        const result = buildVueExport(canvas, css);
        expect(result).toContain('<template>');
        expect(result).toContain('<script>');
        expect(result).toContain('<style scoped>');
        expect(result).toContain('.hero { color: red; }');
        expect(result).toContain('Title');
    });
});
