/*
Inline-style editor configuration: the property grid rendered in the Inspector
when an element is selected. Each entry binds a CSS property key to a labelled
visual widget (color swatch, slider, alignment buttons, font picker, ...).

This is pure data — the Inspector module imports it and renders the widgets.
*/

export const STYLE_PROPS = [
    { key: 'color', labelKey: 'ui.inspector.color', widget: 'color' },
    { key: 'background-color', labelKey: 'ui.inspector.bgColor', widget: 'color' },
    { key: 'font-size', labelKey: 'ui.inspector.fontSize', widget: 'fontSize' },
    { key: 'font-weight', labelKey: 'ui.inspector.fontWeight', widget: 'select' },
    { key: 'text-align', labelKey: 'ui.inspector.textAlign', widget: 'align' },
    { key: 'font-family', labelKey: 'ui.inspector.fontFamily', widget: 'fontFamily' },
    { key: 'width', labelKey: 'ui.inspector.width', widget: 'unitSlider' },
    { key: 'height', labelKey: 'ui.inspector.height', widget: 'unitSlider' },
    { key: 'gap', labelKey: 'ui.inspector.gap', widget: 'unitSlider' },
    { key: 'border-radius', labelKey: 'ui.inspector.borderRadius', widget: 'unitSlider' },
    { key: 'opacity', labelKey: 'ui.inspector.opacity', widget: 'opacity' },
    { key: 'padding', labelKey: 'ui.inspector.padding', widget: 'spacing' },
    { key: 'margin', labelKey: 'ui.inspector.margin', widget: 'spacing' },
    { key: 'box-shadow', labelKey: 'ui.inspector.boxShadow', widget: 'boxShadow' },
];

export const FONT_WEIGHT_OPTIONS = [
    { value: '100', label: '100 Thin' },
    { value: '200', label: '200 Extra Light' },
    { value: '300', label: '300 Light' },
    { value: '400', label: '400 Normal' },
    { value: '500', label: '500 Medium' },
    { value: '600', label: '600 Semi Bold' },
    { value: '700', label: '700 Bold' },
    { value: '800', label: '800 Extra Bold' },
    { value: '900', label: '900 Black' },
];

export const FONT_SIZE_PRESETS = [
    { value: '0.75rem', label: 'XS' },
    { value: '0.875rem', label: 'SM' },
    { value: '1rem', label: 'Base' },
    { value: '1.25rem', label: 'LG' },
    { value: '1.5rem', label: 'XL' },
    { value: '2rem', label: '2XL' },
];

export const FONT_OPTIONS = [
    { value: '', label: 'Default' },
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial / Helvetica' },
    { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
    { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
    { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
    { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
    { value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', label: 'Segoe UI' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' },
    { value: 'system-ui, -apple-system, sans-serif', label: 'System UI' },
];
