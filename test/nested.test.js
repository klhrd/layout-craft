import { describe, it, expect } from 'vitest';
import { isContainer } from '../src/js/modules/canvas.js';

describe('isContainer', () => {
    it('returns true for div, section, nav, ul, ol, table, etc.', () => {
        const tags = [
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
        for (const tag of tags) {
            const el = document.createElement(tag);
            expect(isContainer(el), `${tag} should be a container`).toBe(true);
        }
    });

    it('returns false for leaf elements like p, h1, span, a, img', () => {
        const tags = ['p', 'h1', 'span', 'a', 'img', 'button', 'label', 'li', 'input', 'textarea'];
        for (const tag of tags) {
            const el = document.createElement(tag);
            expect(isContainer(el), `${tag} should not be a container`).toBe(false);
        }
    });

    it('returns false for null/undefined', () => {
        expect(isContainer(null)).toBe(false);
        expect(isContainer(undefined)).toBe(false);
    });
});
