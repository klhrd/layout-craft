import { defineConfig } from 'vite';

// LayoutCraft Studio is a single-page vanilla-ESM editor. We keep the
// SortableJS dependency on the jsdelivr CDN via a <script> tag in
// index.html (no bundler rewrite of import paths), so the config remains
// minimal: relative base (for portable dist/ deployment) and the repo
// root as the project root.
export default defineConfig({
    base: './',
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
