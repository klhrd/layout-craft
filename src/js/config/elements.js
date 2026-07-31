export const CONTAINER_TAGS = [
    'div',
    'section',
    'header',
    'footer',
    'main',
    'aside',
    'nav',
    'form',
    'ul',
    'ol',
    'table',
    'tr',
    'tbody',
    'thead',
    'dl',
];

/*
Human-readable labels for every HTML tag the editor can render in the Layers
panel. Keys are lowercased tag names; missing tags fall back to the raw tag
upcased by the caller. Extend this map when new draggable elements are added
to ELEMENT_CATEGORIES.
*/
export const TAG_LABELS = {
    div: 'Div',
    p: 'Paragraph',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    h4: 'Heading 4',
    h5: 'Heading 5',
    h6: 'Heading 6',
    span: 'Span',
    a: 'Link',
    button: 'Button',
    img: 'Image',
    ul: 'Unordered List',
    ol: 'Ordered List',
    li: 'List Item',
    input: 'Input',
    textarea: 'Textarea',
    label: 'Label',
    form: 'Form',
    section: 'Section',
    header: 'Header',
    footer: 'Footer',
    nav: 'Nav',
    main: 'Main',
    aside: 'Aside',
    blockquote: 'Blockquote',
    pre: 'Pre',
    code: 'Code',
    hr: 'HR',
    br: 'BR',
    strong: 'Strong',
    em: 'Emphasis',
    table: 'Table',
    thead: 'Table Head',
    tbody: 'Table Body',
    tr: 'Table Row',
    th: 'Table Header',
    td: 'Table Cell',
};

export const ELEMENT_CATEGORIES = {
    layout: {
        title: 'Layout Blocks',
        items: [
            { tag: 'div', label: '📦 Div Block', defaultText: '' },
            { tag: 'section', label: '🧩 Section Block', defaultText: '' },
            { tag: 'header', label: '🏷️ Header', defaultText: '' },
            { tag: 'footer', label: '🏷️ Footer', defaultText: '' },
            { tag: 'main', label: '🏷️ Main Container', defaultText: '' },
            { tag: 'aside', label: '🏷️ Sidebar (Aside)', defaultText: '' },
            { tag: 'nav', label: '🏷️ Navigation', defaultText: '' },
        ],
    },
    typography: {
        title: 'Typography',
        items: [
            { tag: 'h1', label: '🔤 Heading 1', defaultText: 'Main Title' },
            { tag: 'h2', label: '🔤 Heading 2', defaultText: 'Section Title' },
            { tag: 'h3', label: '🔤 Heading 3', defaultText: 'Sub-section Title' },
            { tag: 'p', label: '📄 Paragraph', defaultText: 'Start writing your content here...' },
            { tag: 'span', label: '✏️ Span', defaultText: 'Inline text' },
            { tag: 'strong', label: '🅱️ Bold Text', defaultText: 'Important Text' },
            { tag: 'em', label: '✏️ Italic Text', defaultText: 'Emphasized Text' },
        ],
    },
    interactive: {
        title: 'Interactive & Media',
        items: [
            { tag: 'a', label: '🔗 Link Block', defaultText: 'Click Here', attributes: ['href', 'target'] },
            { tag: 'button', label: '🔘 Button', defaultText: 'Submit' },
            { tag: 'img', label: '🖼️ Image', defaultText: '', attributes: ['src', 'alt', 'title'] },
            {
                tag: 'video',
                label: '🎥 Video Player',
                defaultText: '',
                attributes: ['src', 'controls', 'autoplay', 'loop'],
            },
            {
                tag: 'iframe',
                label: '📺 Embedded Iframe',
                defaultText: '',
                attributes: ['src', 'width', 'height', 'frameborder'],
            },
        ],
    },
    forms: {
        title: 'Form Elements',
        items: [
            { tag: 'form', label: '📝 Form Container', defaultText: '', attributes: ['action', 'method'] },
            { tag: 'label', label: '🏷️ Form Label', defaultText: 'Field Name', attributes: ['for'] },
            {
                tag: 'input',
                label: '📥 Text Input',
                defaultText: '',
                attributes: ['type', 'name', 'placeholder', 'value', 'required'],
            },
            {
                tag: 'textarea',
                label: '✍️ Textarea',
                defaultText: '',
                attributes: ['name', 'placeholder', 'rows', 'required'],
            },
            { tag: 'select', label: '🔽 Select Dropdown', defaultText: '', attributes: ['name', 'required'] },
            { tag: 'option', label: '🔹 Select Option', defaultText: 'Option Text', attributes: ['value'] },
        ],
    },
    lists: {
        title: 'Lists & Tables',
        items: [
            { tag: 'ul', label: '⚫ Unordered List (UL)', defaultText: '' },
            { tag: 'ol', label: '🔢 Ordered List (OL)', defaultText: '' },
            { tag: 'li', label: '🔸 List Item (LI)', defaultText: 'List item content' },
            { tag: 'table', label: '📊 Table Container', defaultText: '' },
            { tag: 'tr', label: '➖ Table Row (TR)', defaultText: '' },
            { tag: 'th', label: '🔺 Table Header (TH)', defaultText: 'Header' },
            { tag: 'td', label: '▫️ Table Data (TD)', defaultText: 'Data' },
        ],
    },
};
