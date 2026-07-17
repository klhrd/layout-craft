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
            { property: "padding", label: "内 Padding", defaultValue: "20px" },
            { property: "margin", label: "外 Margin", defaultValue: "0 auto" },
            { property: "width", label: "寬 Width", defaultValue: "100%" },
            { property: "max-width", label: "大 Max Width", defaultValue: "1200px" },
            { property: "height", label: "高 Height", defaultValue: "400px" }
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
            { property: "border-radius", label: "圓 Border Radius", defaultValue: "8px" },
            { property: "border", label: "線 Border Line", defaultValue: "1px solid #cbd5e1" },
            { property: "box-shadow", label: "影 Box Shadow", defaultValue: "0 4px 6px rgba(0,0,0,0.1)" }
        ]
    }
};