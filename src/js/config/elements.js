export const ELEMENT_CATEGORIES = {
    layout: {
        title: "Layout Blocks",
        items: [
            { tag: "div", label: "📦 Div Block", defaultText: "" },
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
            { tag: "p", label: "📄 Paragraph", defaultText: "Start writing your content here..." },
            { tag: "span", label: "✏️ Span", defaultText: "Inline text" }
        ]
    },
    interactive: {
        title: "Interactive & Media",
        items: [
            // 這裡新增了 attributes，代表它們有專屬屬性
            { tag: "a", label: "🔗 Link / Button", defaultText: "Click Here", attributes: ["href", "target"] },
            { tag: "img", label: "🖼️ Image", defaultText: "", attributes: ["src", "alt"] },
            { tag: "button", label: "🔘 Button", defaultText: "Submit" }
        ]
    }
};