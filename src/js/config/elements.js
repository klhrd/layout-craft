export const ELEMENT_CATEGORIES = {
    layout: {
        title: "Layout Blocks",
        items: [
            { tag: "div", label: "📦 Div Block", defaultText: "" },
            { tag: "section", label: "🧩 Section Block", defaultText: "" },
            { tag: "header", label: "🏷️ Header", defaultText: "" },
            { tag: "footer", label: "🏷️ Footer", defaultText: "" },
            { tag: "main", label: "🏷️ Main Container", defaultText: "" },
            { tag: "aside", label: "🏷️ Sidebar (Aside)", defaultText: "" },
            { tag: "nav", label: "🏷️ Navigation", defaultText: "" }
        ]
    },
    typography: {
        title: "Typography",
        items: [
            { tag: "h1", label: "🔤 Heading 1", defaultText: "Main Title" },
            { tag: "h2", label: "🔤 Heading 2", defaultText: "Section Title" },
            { tag: "h3", label: "🔤 Heading 3", defaultText: "Sub-section Title" },
            { tag: "p", label: "📄 Paragraph", defaultText: "Start writing your content here..." },
            { tag: "span", label: "✏️ Span", defaultText: "Inline text" },
            { tag: "strong", label: "🅱️ Bold Text", defaultText: "Important Text" },
            { tag: "em", label: "斜 Italic Text", defaultText: "Emphasized Text" }
        ]
    },
    interactive: {
        title: "Interactive & Media",
        items: [
            { tag: "a", label: "🔗 Link Block", defaultText: "Click Here", attributes: ["href", "target"] },
            { tag: "button", label: "🔘 Button", defaultText: "Submit" },
            { tag: "img", label: "🖼️ Image", defaultText: "", attributes: ["src", "alt", "title"] },
            { tag: "video", label: "🎥 Video Player", defaultText: "", attributes: ["src", "controls", "autoplay", "loop"] },
            { tag: "iframe", label: "📺 Embedded Iframe", defaultText: "", attributes: ["src", "width", "height", "frameborder"] }
        ]
    },
    forms: {
        title: "Form Elements",
        items: [
            { tag: "form", label: "📝 Form Container", defaultText: "", attributes: ["action", "method"] },
            { tag: "label", label: "🏷️ Form Label", defaultText: "Field Name", attributes: ["for"] },
            { tag: "input", label: "📥 Text Input", defaultText: "", attributes: ["type", "name", "placeholder", "value", "required"] },
            { tag: "textarea", label: "✍️ Textarea", defaultText: "", attributes: ["name", "placeholder", "rows", "required"] },
            { tag: "select", label: "🔽 Select Dropdown", defaultText: "", attributes: ["name", "required"] },
            { tag: "option", label: "🔹 Select Option", defaultText: "Option Text", attributes: ["value"] }
        ]
    },
    lists: {
        title: "Lists & Tables",
        items: [
            { tag: "ul", label: "⚫ Unordered List (UL)", defaultText: "" },
            { tag: "ol", label: "🔢 Ordered List (OL)", defaultText: "" },
            { tag: "li", label: "🔸 List Item (LI)", defaultText: "List item content" },
            { tag: "table", label: "📊 Table Container", defaultText: "" },
            { tag: "tr", label: "➖ Table Row (TR)", defaultText: "" },
            { tag: "th", label: "🔺 Table Header (TH)", defaultText: "Header" },
            { tag: "td", label: "▫️ Table Data (TD)", defaultText: "Data" }
        ]
    }
};