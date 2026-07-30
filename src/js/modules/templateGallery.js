import { TEMPLATES } from '../config/templates.js';
import { t } from '../config/i18n.js';
import { instantiateTemplate } from './templateLoader.js';

let activeCategory = 'all';
let searchQuery = '';

const ICONS = {
    navbar: '🧭',
    'hero-centered': '🏠',
    'pricing-table': '💰',
    footer: '🔽',
    'login-form': '🔐',
};

function filterTemplates() {
    return TEMPLATES.filter((tmpl) => {
        if (activeCategory !== 'all' && tmpl.category !== activeCategory) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchTitle = tmpl.title.toLowerCase().includes(q);
            const matchTags = tmpl.tags.some((t) => t.toLowerCase().includes(q));
            if (!matchTitle && !matchTags) return false;
        }
        return true;
    });
}

function renderGrid() {
    const grid = document.getElementById('template-grid');
    const filtered = filterTemplates();
    grid.innerHTML = '';

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--text-muted);font-size:0.85rem;">${t('ui.templates.noTemplates')}</div>`;
        return;
    }

    filtered.forEach((tmpl) => {
        const item = document.createElement('div');
        item.className = 'template-grid-item';
        item.dataset.id = tmpl.id;

        const icon = document.createElement('div');
        icon.className = 'template-grid-item-icon';
        icon.textContent = ICONS[tmpl.id] || '📄';

        const title = document.createElement('div');
        title.className = 'template-grid-item-title';
        title.textContent = tmpl.title;

        const tags = document.createElement('div');
        tags.className = 'template-grid-item-tags';
        tmpl.tags.slice(0, 3).forEach((tag) => {
            const span = document.createElement('span');
            span.className = 'template-grid-item-tag';
            span.textContent = tag;
            tags.appendChild(span);
        });

        item.appendChild(icon);
        item.appendChild(title);
        item.appendChild(tags);

        item.addEventListener('click', () => showPreview(tmpl));
        grid.appendChild(item);
    });
}

function showPreview(tmpl) {
    const overlay = document.getElementById('template-preview-overlay');
    const htmlPreview = document.getElementById('template-preview-html');
    const replaceBtn = document.getElementById('btn-template-replace');
    const appendBtn = document.getElementById('btn-template-append');

    htmlPreview.innerHTML = tmpl.html;
    overlay.style.display = 'flex';

    replaceBtn.onclick = () => {
        overlay.style.display = 'none';
        closeModal();
        instantiateTemplate(tmpl, 'replace');
    };

    appendBtn.onclick = () => {
        overlay.style.display = 'none';
        closeModal();
        instantiateTemplate(tmpl, 'append');
    };

    document.getElementById('btn-template-preview-cancel').onclick = () => {
        overlay.style.display = 'none';
    };
}

function closeModal() {
    document.getElementById('template-modal').style.display = 'none';
}

export function initTemplateGallery() {
    const modal = document.getElementById('template-modal');
    const btnOpen = document.getElementById('btn-templates');
    const btnClose = document.getElementById('btn-template-close');
    const searchInput = document.getElementById('template-search');
    const catContainer = document.getElementById('template-categories');
    const titleEl = document.getElementById('template-modal-title');

    if (!modal || !btnOpen) return;

    titleEl.textContent = t('ui.templates.title');
    btnOpen.textContent = t('ui.templates.button');

    btnOpen.addEventListener('click', () => {
        const catBtns = catContainer.querySelectorAll('.template-cat-btn');
        catBtns[0].textContent = t('ui.templates.categoryAll');
        catBtns[1].textContent = t('ui.templates.categoryMarketing');
        catBtns[2].textContent = t('ui.templates.categoryAppShell');
        catBtns[3].textContent = t('ui.templates.categoryForms');
        catBtns[4].textContent = t('ui.templates.categoryEcommerce');

        searchInput.placeholder = t('ui.templates.searchPlaceholder');
        document.getElementById('btn-template-close').textContent = t('ui.templates.cancel');
        document.getElementById('btn-template-replace').textContent = t('ui.templates.replaceCanvas');
        document.getElementById('btn-template-append').textContent = t('ui.templates.appendToCanvas');

        activeCategory = 'all';
        searchQuery = '';
        searchInput.value = '';
        catContainer.querySelectorAll('.template-cat-btn').forEach((b) => b.classList.remove('active'));
        catContainer.querySelector('[data-cat="all"]').classList.add('active');
        renderGrid();
        modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    catContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.template-cat-btn');
        if (!btn) return;
        catContainer.querySelectorAll('.template-cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderGrid();
    });

    searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        renderGrid();
    });
}
