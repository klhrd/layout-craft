/*
Component template definitions for the pre-built component library.

Each template is a tree:
  { tag, text?, attr?: {}, style?: {}, children?: [template] }
*/

const HERO = {
    tag: 'section',
    style: { padding: '60px 24px', background: '#f8fafc', textAlign: 'center' },
    attr: { id: 'hero' },
    children: [
        {
            tag: 'h1',
            style: { fontSize: '2.5rem', fontWeight: '700', margin: '0 0 16px', color: '#1e293b' },
            text: 'Build Something Amazing',
        },
        {
            tag: 'p',
            style: { fontSize: '1.125rem', color: '#64748b', maxWidth: '600px', margin: '0 auto 32px' },
            text: 'A powerful visual builder that lets you create stunning web layouts without writing code.',
        },
        {
            tag: 'div',
            style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
            children: [
                {
                    tag: 'button',
                    text: 'Get Started',
                    style: {
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                    },
                },
                {
                    tag: 'button',
                    text: 'Learn More',
                    style: {
                        background: '#fff',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                    },
                },
            ],
        },
    ],
};

const FEATURE_GRID = {
    tag: 'section',
    style: { padding: '60px 24px', background: '#fff' },
    attr: { id: 'features' },
    children: [
        {
            tag: 'h2',
            style: { fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '0 0 48px', color: '#1e293b' },
            text: 'Features',
        },
        {
            tag: 'div',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                maxWidth: '960px',
                margin: '0 auto',
            },
            children: [
                {
                    tag: 'div',
                    style: { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' },
                    children: [
                        {
                            tag: 'h3',
                            text: 'Drag & Drop',
                            style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' },
                        },
                        {
                            tag: 'p',
                            text: 'Simply drag elements from the toolbox onto the canvas.',
                            style: { fontSize: '0.9rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
                {
                    tag: 'div',
                    style: { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' },
                    children: [
                        {
                            tag: 'h3',
                            text: 'Live Styling',
                            style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' },
                        },
                        {
                            tag: 'p',
                            text: 'Edit colors, typography, and layout in real time.',
                            style: { fontSize: '0.9rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
                {
                    tag: 'div',
                    style: { padding: '24px', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' },
                    children: [
                        {
                            tag: 'h3',
                            text: 'Export Anywhere',
                            style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' },
                        },
                        {
                            tag: 'p',
                            text: 'Export to clean HTML/CSS, React, or Vue.',
                            style: { fontSize: '0.9rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
            ],
        },
    ],
};

const NAVBAR = {
    tag: 'nav',
    style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
    },
    children: [
        { tag: 'div', text: 'Logo', style: { fontWeight: '700', fontSize: '1.25rem', color: '#1e293b' } },
        {
            tag: 'div',
            style: { display: 'flex', gap: '16px' },
            children: [
                {
                    tag: 'a',
                    text: 'Home',
                    attr: { href: '#' },
                    style: { color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' },
                },
                {
                    tag: 'a',
                    text: 'Features',
                    attr: { href: '#' },
                    style: { color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' },
                },
                {
                    tag: 'a',
                    text: 'Pricing',
                    attr: { href: '#' },
                    style: { color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' },
                },
                {
                    tag: 'a',
                    text: 'Contact',
                    attr: { href: '#' },
                    style: { color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' },
                },
            ],
        },
    ],
};

const CARD = {
    tag: 'div',
    style: {
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#fff',
        maxWidth: '320px',
    },
    children: [
        {
            tag: 'div',
            style: {
                height: '180px',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: '0.85rem',
            },
            text: 'Image placeholder',
        },
        {
            tag: 'div',
            style: { padding: '20px' },
            children: [
                { tag: 'h3', text: 'Card Title', style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' } },
                {
                    tag: 'p',
                    text: 'This is a sample card component with some placeholder content.',
                    style: { fontSize: '0.85rem', color: '#64748b', margin: '0 0 16px' },
                },
                {
                    tag: 'button',
                    text: 'Learn More',
                    style: {
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                    },
                },
            ],
        },
    ],
};

const CONTACT_FORM = {
    tag: 'section',
    style: { padding: '60px 24px', background: '#f8fafc' },
    attr: { id: 'contact' },
    children: [
        {
            tag: 'h2',
            text: 'Contact Us',
            style: { fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '0 0 32px', color: '#1e293b' },
        },
        {
            tag: 'form',
            style: { maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
            attr: { action: '#', method: 'POST' },
            children: [
                {
                    tag: 'input',
                    attr: { type: 'text', name: 'name', placeholder: 'Your Name' },
                    style: {
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                    },
                },
                {
                    tag: 'input',
                    attr: { type: 'email', name: 'email', placeholder: 'your@email.com' },
                    style: {
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                    },
                },
                {
                    tag: 'textarea',
                    attr: { name: 'message', placeholder: 'Your message', rows: '4' },
                    style: {
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        resize: 'vertical',
                    },
                },
                {
                    tag: 'button',
                    text: 'Send Message',
                    attr: { type: 'submit' },
                    style: {
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                    },
                },
            ],
        },
    ],
};

const FOOTER = {
    tag: 'footer',
    style: { padding: '40px 24px', background: '#1e293b', color: '#f8fafc', textAlign: 'center' },
    children: [
        {
            tag: 'p',
            text: '© 2026 LayoutCraft Studio. All rights reserved.',
            style: { margin: '0 0 8px', fontSize: '0.85rem', color: '#94a3b8' },
        },
        {
            tag: 'div',
            style: { display: 'flex', gap: '16px', justifyContent: 'center' },
            children: [
                {
                    tag: 'a',
                    text: 'Privacy',
                    attr: { href: '#' },
                    style: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem' },
                },
                {
                    tag: 'a',
                    text: 'Terms',
                    attr: { href: '#' },
                    style: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem' },
                },
                {
                    tag: 'a',
                    text: 'Contact',
                    attr: { href: '#' },
                    style: { color: '#94a3b8', textDecoration: 'none', fontSize: '0.8rem' },
                },
            ],
        },
    ],
};

const TESTIMONIAL = {
    tag: 'div',
    style: {
        padding: '32px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        maxWidth: '400px',
        textAlign: 'center',
    },
    children: [
        {
            tag: 'div',
            style: {
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#cbd5e1',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.75rem',
            },
            text: 'Photo',
        },
        {
            tag: 'p',
            text: '"This tool completely changed how we build websites. Highly recommended!"',
            style: { fontSize: '0.95rem', fontStyle: 'italic', color: '#475569', margin: '0 0 16px' },
        },
        {
            tag: 'p',
            text: '— Jane Doe, CEO at Acme Inc',
            style: { fontSize: '0.85rem', color: '#64748b', margin: '0', fontWeight: '600' },
        },
    ],
};

const PRICING_TABLE = {
    tag: 'section',
    style: { padding: '60px 24px', background: '#fff' },
    attr: { id: 'pricing' },
    children: [
        {
            tag: 'h2',
            text: 'Pricing Plans',
            style: { fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '0 0 48px', color: '#1e293b' },
        },
        {
            tag: 'div',
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                maxWidth: '800px',
                margin: '0 auto',
            },
            children: [
                {
                    tag: 'div',
                    style: {
                        padding: '32px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        textAlign: 'center',
                        background: '#fff',
                    },
                    children: [
                        {
                            tag: 'h3',
                            text: 'Starter',
                            style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' },
                        },
                        {
                            tag: 'p',
                            text: '$9/mo',
                            style: { fontSize: '2rem', fontWeight: '700', color: '#2563eb', margin: '0 0 16px' },
                        },
                        {
                            tag: 'p',
                            text: 'Basic features for individuals',
                            style: { fontSize: '0.85rem', color: '#64748b', margin: '0 0 24px' },
                        },
                        {
                            tag: 'button',
                            text: 'Choose Plan',
                            style: {
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                            },
                        },
                    ],
                },
                {
                    tag: 'div',
                    style: {
                        padding: '32px',
                        border: '2px solid #2563eb',
                        borderRadius: '8px',
                        textAlign: 'center',
                        background: '#eff6ff',
                    },
                    children: [
                        { tag: 'h3', text: 'Pro', style: { fontSize: '1.25rem', margin: '0 0 8px', color: '#1e293b' } },
                        {
                            tag: 'p',
                            text: '$29/mo',
                            style: { fontSize: '2rem', fontWeight: '700', color: '#2563eb', margin: '0 0 16px' },
                        },
                        {
                            tag: 'p',
                            text: 'Advanced features for teams',
                            style: { fontSize: '0.85rem', color: '#64748b', margin: '0 0 24px' },
                        },
                        {
                            tag: 'button',
                            text: 'Choose Plan',
                            style: {
                                background: '#2563eb',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                            },
                        },
                    ],
                },
            ],
        },
    ],
};

const FAQ = {
    tag: 'section',
    style: { padding: '60px 24px', background: '#f8fafc' },
    attr: { id: 'faq' },
    children: [
        {
            tag: 'h2',
            text: 'Frequently Asked Questions',
            style: { fontSize: '2rem', fontWeight: '700', textAlign: 'center', margin: '0 0 48px', color: '#1e293b' },
        },
        {
            tag: 'div',
            style: { maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' },
            children: [
                {
                    tag: 'div',
                    style: { padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' },
                    children: [
                        {
                            tag: 'p',
                            text: '❓ What is LayoutCraft?',
                            style: { fontWeight: '600', margin: '0 0 4px', color: '#1e293b', fontSize: '0.9rem' },
                        },
                        {
                            tag: 'p',
                            text: 'LayoutCraft is a visual web builder that lets you create layouts by dragging and dropping elements.',
                            style: { fontSize: '0.85rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
                {
                    tag: 'div',
                    style: { padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' },
                    children: [
                        {
                            tag: 'p',
                            text: '❓ Is it free to use?',
                            style: { fontWeight: '600', margin: '0 0 4px', color: '#1e293b', fontSize: '0.9rem' },
                        },
                        {
                            tag: 'p',
                            text: 'Yes! LayoutCraft is completely free and open source.',
                            style: { fontSize: '0.85rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
                {
                    tag: 'div',
                    style: { padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' },
                    children: [
                        {
                            tag: 'p',
                            text: '❓ Can I export my designs?',
                            style: { fontWeight: '600', margin: '0 0 4px', color: '#1e293b', fontSize: '0.9rem' },
                        },
                        {
                            tag: 'p',
                            text: 'Absolutely. Export to clean HTML/CSS, React, or Vue components.',
                            style: { fontSize: '0.85rem', color: '#64748b', margin: '0' },
                        },
                    ],
                },
            ],
        },
    ],
};

export const COMPONENTS = {
    hero: { label: '🏠 Hero Section', template: HERO },
    features: { label: '📊 Feature Grid', template: FEATURE_GRID },
    navbar: { label: '🧭 Navbar', template: NAVBAR },
    card: { label: '🃏 Card', template: CARD },
    contact: { label: '📋 Contact Form', template: CONTACT_FORM },
    footer: { label: '🔽 Footer', template: FOOTER },
    testimonial: { label: '💬 Testimonial', template: TESTIMONIAL },
    pricing: { label: '💰 Pricing Table', template: PRICING_TABLE },
    faq: { label: '❓ FAQ Accordion', template: FAQ },
};

export function buildComponentTemplate(template) {
    const el = document.createElement(template.tag);
    if (template.text) el.textContent = template.text;
    if (template.attr) {
        for (const [k, v] of Object.entries(template.attr)) {
            el.setAttribute(k, v);
        }
    }
    if (template.style) {
        for (const [k, v] of Object.entries(template.style)) {
            el.style[k] = v;
        }
    }
    if (template.children) {
        for (const child of template.children) {
            el.appendChild(buildComponentTemplate(child));
        }
    }
    // Make container elements sortable
    const CONTAINER_TAGS = [
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
    ];
    if (CONTAINER_TAGS.includes(template.tag) && typeof Sortable !== 'undefined') {
        // Delay to let DOM attach
        setTimeout(() => {
            if (el.parentNode) Sortable.create(el, { group: 'canvas', animation: 150 });
        }, 0);
    }
    return el;
}
