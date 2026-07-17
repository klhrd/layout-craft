layoutcraft/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── src/
│   ├── css/
│   │   ├── editor.css          # Editor UI-specific styles
│   │   └── canvas-preview.css  # Styles applied to the canvas/compiled site
│   ├── js/
│   │   ├── config/
│   │   │   └── elements.js     # Unified elements configuration database
│   │   ├── modules/
│   │   │   ├── canvas.js       # Handles drag, drop, and nesting
│   │   │   ├── inspector.js    # Handles property editing & live updates
│   │   │   └── exporter.js     # Clean HTML/CSS extraction and download
│   │   └── app.js              # Entry point (initializes modules)
│   └── assets/                 # Icons, logos, and placeholders
├── index.html                  # Main application frame
└── README.md