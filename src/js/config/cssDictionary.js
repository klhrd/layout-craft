export const CSS_DICTIONARY = {
    layout: {
        title: "Flexbox & Grid Layout",
        items: [
            { property: "display", label: "🧱 Display", defaultValue: "flex" },
            { property: "flex-direction", label: "↕️ Flex Direction", defaultValue: "column" },
            { property: "justify-content", label: "↔️ Justify Content", defaultValue: "center" },
            { property: "align-items", label: "↕️ Align Items", defaultValue: "center" },
            { property: "gap", label: "🔲 Gap Spacing", defaultValue: "15px" }
        ]
    },
    spacing: {
        title: "Spacing & Sizing",
        items: [
            { property: "padding", label: "⬜ Padding", defaultValue: "20px" },
            { property: "margin", label: "↔️ Margin", defaultValue: "0 auto" },
            { property: "width", label: "↔️ Width", defaultValue: "100%" },
            { property: "max-width", label: "↔️ Max Width", defaultValue: "1200px" },
            { property: "height", label: "↕️ Height", defaultValue: "400px" }
        ]
    },
    style: {
        title: "Colors & Typography",
        items: [
            { property: "color", label: "🎨 Text Color", defaultValue: "#2563eb" },
            { property: "background-color", label: "🖼️ Background", defaultValue: "#ffffff" },
            { property: "font-size", label: "🔤 Font Size", defaultValue: "1.5rem" },
            { property: "font-weight", label: "💪 Font Weight", defaultValue: "bold" },
            { property: "text-align", label: "📝 Text Align", defaultValue: "center" }
        ]
    },
    borders: {
        title: "Borders & Effects",
        items: [
            { property: "border-radius", label: "⭕ Border Radius", defaultValue: "8px" },
            { property: "border", label: "➖ Border Line", defaultValue: "1px solid #cbd5e1" },
            { property: "box-shadow", label: "🌫️ Box Shadow", defaultValue: "0 4px 6px rgba(0,0,0,0.1)" }
        ]
    }
};