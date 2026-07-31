/*
Codegen constants: HTML/JSX facts used by the React JSX, Vue SFC, and Web
Component exporters. Centralised here so every exporter shares the same map
of `class` -> `className`, the same boolean attribute set, and the same list
of void elements (img, br, input, ...) that self-close in JSX.
*/

export const JSX_ATTR_MAP = {
    class: 'className',
    for: 'htmlFor',
    tabindex: 'tabIndex',
    readonly: 'readOnly',
    maxlength: 'maxLength',
    colspan: 'colSpan',
    rowspan: 'rowSpan',
};

export const BOOLEAN_ATTRS = new Set(['disabled', 'required', 'checked', 'selected', 'readonly', 'multiple']);

export const VOID_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
