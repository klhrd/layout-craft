import { attrMap, isVoidElement, formatHtmlTagOpen, formatCloseTag } from './domWalker.js';

function walkVue(node, depth) {
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
        out += walkVue(child, depth + 1) + '\n';
    }

    out += formatCloseTag(tag, depth);
    return out;
}

export function buildVueExport(canvasClone, cssCode) {
    const elements = Array.from(canvasClone.children).filter((el) => !el.classList.contains('canvas-placeholder'));

    const templateBody = elements.map((el) => walkVue(el, 1)).join('\n');

    const appVue = `<template>
  <div id="app">\n${templateBody}
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style scoped>
${cssCode}
</style>
`;

    return appVue;
}
