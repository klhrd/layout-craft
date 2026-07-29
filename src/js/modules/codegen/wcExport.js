import { attrMap, isVoidElement, formatHtmlTagOpen, formatCloseTag } from './domWalker.js';

function walkWc(node, depth) {
    const tag = node.tagName.toLowerCase();
    const attrs = attrMap(node, 'html');
    const children = Array.from(node.childNodes);
    const textChildren = children
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join('');
    const elementChildren = children.filter((n) => n.nodeType === 1);

    const selfClose = isVoidElement(tag) && elementChildren.length === 0;

    if (selfClose) {
        const indent = '  '.repeat(depth);
        const attrStr = Object.entries(attrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(' ');
        return `${indent}<${tag}${attrStr ? ' ' + attrStr : ''} />`;
    }

    let out = formatHtmlTagOpen(tag, attrs, depth) + '\n';

    if (textChildren.trim()) {
        out += '  '.repeat(depth + 1) + textChildren.trim() + '\n';
    }

    for (const child of elementChildren) {
        out += walkWc(child, depth + 1) + '\n';
    }

    out += formatCloseTag(tag, depth);
    return out;
}

export function exportAsWebComponent(container, cssCode) {
    const elements = Array.from(container.children).filter((el) => !el.classList.contains('canvas-placeholder'));

    const templateBody = elements.map((el) => walkWc(el, 0)).join('\n');

    const name = 'layout-craft-block';

    return `const TEMPLATE = \`${templateBody}
\`;

class LayoutCraftElement extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = \`<style>
${cssCode}
</style>
\${TEMPLATE}\`;
    }
}

if (!customElements.get('${name}')) {
    customElements.define('${name}', LayoutCraftElement);
}
`;
}
