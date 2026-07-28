import { attrMap, isVoidElement, formatJsxTagOpen, formatCloseTag } from './domWalker.js';

function walkJsx(node, depth) {
    const tag = node.tagName.toLowerCase();
    const attrs = attrMap(node, 'jsx');
    const children = Array.from(node.childNodes);
    const textChildren = children
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join('');
    const elementChildren = children.filter((n) => n.nodeType === 1);

    const selfClose = isVoidElement(tag) || (elementChildren.length === 0 && !textChildren.trim());

    if (selfClose) {
        return formatJsxTagOpen(tag, attrs, true, depth);
    }

    let out = formatJsxTagOpen(tag, attrs, false, depth) + '\n';

    if (textChildren.trim()) {
        out += '  '.repeat(depth + 1) + textChildren.trim() + '\n';
    }

    for (const child of elementChildren) {
        out += walkJsx(child, depth + 1) + '\n';
    }

    out += formatCloseTag(tag, depth);
    return out;
}

export function buildJsxExport(canvasClone) {
    const elements = Array.from(canvasClone.children).filter((el) => !el.classList.contains('canvas-placeholder'));

    const jsxElements = elements.map((el) => walkJsx(el, 1)).join('\n');

    const appJsx = `import './style.css';

export default function App() {
  return (
    <>\n${jsxElements}
    </>
  );
}
`;

    return appJsx;
}
