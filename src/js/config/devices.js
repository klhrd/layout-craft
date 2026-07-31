/*
Responsive preview device presets. Shared between:
  - `modules/exporter.js` (preview-mode device frame selector)
  - `app.js` initBreakpoints() (toolbar bp-toggle buttons)

Each preset defines a label, the canvas width to apply (null = full width),
and an emoji icon for the toolbar button.
*/

export const DEVICES = [
    { id: 'none', label: 'Desktop', width: null, icon: 'desktop_windows' },
    { id: '768', label: 'Tablet', width: 768, icon: 'tablet' },
    { id: '375', label: 'Mobile', width: 375, icon: 'phone_iphone' },
];
