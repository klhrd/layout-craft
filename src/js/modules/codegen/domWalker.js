import { JSX_ATTR_MAP, BOOLEAN_ATTRS, VOID_ELEMENTS } from '../../config/codegen.js';

export function attrMap(node, format) {
    const attrs = {};
    for (const attr of node.attributes) {
        let name = attr.name;
        const value = attr.value;
        if (format === 'jsx') {
            if (BOOLEAN_ATTRS.has(name)) {
                attrs[JSX_ATTR_MAP[name] || name] = value === '' || value === name;
                continue;
            }
            name = JSX_ATTR_MAP[name] || name;
        }
        attrs[name] = value;
    }
    return attrs;
}

export function isVoidElement(tag) {
    return VOID_ELEMENTS.has(tag);
}

export function serializeAttrs(attrs, format) {
    const parts = [];
    for (const [key, val] of Object.entries(attrs)) {
        if (format === 'jsx' && typeof val === 'boolean') {
            parts.push(val ? `${key}` : '');
            continue;
        }
        parts.push(`${key}="${val}"`);
    }
    return parts.filter(Boolean).join(' ');
}

export function formatJsxTagOpen(tag, attrs, selfClose, depth) {
    const indent = '  '.repeat(depth);
    const attrStr = serializeAttrs(attrs, 'jsx');
    const close = selfClose ? ' />' : '>';
    if (attrStr) return `${indent}<${tag} ${attrStr}${close}`;
    return `${indent}<${tag}${close}`;
}

export function formatHtmlTagOpen(tag, attrs, depth) {
    const indent = '  '.repeat(depth);
    const attrStr = serializeAttrs(attrs, 'html');
    return `${indent}<${tag}${attrStr ? ' ' + attrStr : ''}>`;
}

export function formatCloseTag(tag, depth) {
    return `${'  '.repeat(depth)}</${tag}>`;
}
