/*
CSS Dictionary: the draggable property blocks available in the visual CSS editor.

Custom Properties (the `--*` entries in the "Custom Properties" section) define
CSS variables. To use them in other property values, reference them with the
`var()` function, e.g. `var(--color-primary)` for the primary color value.
*/
export const CSS_DICTIONARY = {
    layout: {
        title: 'Flexbox & Grid Layout',
        items: [
            { property: 'display', label: '🧱 Display', defaultValue: 'flex' },
            { property: 'flex-direction', label: '↕️ Flex Direction', defaultValue: 'column' },
            { property: 'justify-content', label: '↔️ Justify Content', defaultValue: 'center' },
            { property: 'align-items', label: '↕️ Align Items', defaultValue: 'center' },
            { property: 'gap', label: '🔲 Gap Spacing', defaultValue: '15px' },
        ],
    },
    spacing: {
        title: 'Spacing & Sizing',
        items: [
            { property: 'padding', label: '⬜ Padding', defaultValue: '20px' },
            { property: 'margin', label: '↔️ Margin', defaultValue: '0 auto' },
            { property: 'width', label: '↔️ Width', defaultValue: '100%' },
            { property: 'max-width', label: '↔️ Max Width', defaultValue: '1200px' },
            { property: 'height', label: '↕️ Height', defaultValue: '400px' },
        ],
    },
    style: {
        title: 'Colors & Typography',
        items: [
            { property: 'color', label: '🎨 Text Color', defaultValue: '#2563eb' },
            { property: 'background-color', label: '🖼️ Background', defaultValue: '#ffffff' },
            { property: 'font-size', label: '🔤 Font Size', defaultValue: '1.5rem' },
            { property: 'font-weight', label: '💪 Font Weight', defaultValue: 'bold' },
            { property: 'text-align', label: '📝 Text Align', defaultValue: 'center' },
        ],
    },
    borders: {
        title: 'Borders & Effects',
        items: [
            { property: 'border-radius', label: '⭕ Border Radius', defaultValue: '8px' },
            { property: 'border', label: '➖ Border Line', defaultValue: '1px solid #cbd5e1' },
            { property: 'box-shadow', label: '🌫️ Box Shadow', defaultValue: '0 4px 6px rgba(0,0,0,0.1)' },
        ],
    },
    animation: {
        title: 'Animation & Transforms',
        items: [
            { property: 'animation', label: '▶️ Animation', defaultValue: 'slide-in 0.3s ease' },
            { property: 'animation-name', label: '🏷️ Animation Name', defaultValue: 'slide-in' },
            { property: 'animation-duration', label: '⏱️ Duration', defaultValue: '0.3s' },
            { property: 'animation-timing-function', label: '📈 Timing', defaultValue: 'ease' },
            { property: 'animation-delay', label: '⏰ Delay', defaultValue: '0s' },
            { property: 'animation-iteration-count', label: '🔁 Iterations', defaultValue: '1' },
            { property: 'transform', label: '🔄 Transform', defaultValue: 'rotate(0deg)' },
            { property: 'transition', label: '✨ Transition', defaultValue: 'all 0.2s ease' },
        ],
    },
    customProps: {
        title: 'Custom Properties',
        items: [
            { property: '--color-primary', label: '🎨 Primary Color', defaultValue: '#2563eb' },
            { property: '--color-secondary', label: '🎨 Secondary Color', defaultValue: '#64748b' },
            { property: '--color-accent', label: '🎨 Accent Color', defaultValue: '#f59e0b' },
            { property: '--font-heading', label: '🔤 Heading Font', defaultValue: 'sans-serif' },
            { property: '--font-body', label: '🔤 Body Font', defaultValue: 'sans-serif' },
            { property: '--spacing-unit', label: '📏 Spacing Unit', defaultValue: '8px' },
            { property: '--radius', label: '⭕ Border Radius', defaultValue: '8px' },
        ],
    },
};
