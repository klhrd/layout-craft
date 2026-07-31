import { describe, it, expect } from 'vitest';
import { generateSwCode, hashFiles } from '../scripts/pwa.js';

describe('hashFiles', () => {
    it('is stable for the same file list', () => {
        const files = ['index.html', 'assets/index-abc.js', 'assets/style.css'];
        expect(hashFiles(files)).toBe(hashFiles([...files]));
    });

    it('changes when the file list changes', () => {
        const a = hashFiles(['index.html', 'assets/index-abc.js']);
        const b = hashFiles(['index.html', 'assets/index-def.js']);
        expect(a).not.toBe(b);
    });
});

describe('generateSwCode', () => {
    const code = generateSwCode({ files: ['index.html', 'assets/app-123.js'], version: 'x1y2z' });

    it('inlines the precache list and version into the cache name', () => {
        expect(code).toContain("'lc-x1y2z'");
        expect(code).toContain('"assets/app-123.js"');
        expect(code).toContain('"index.html"');
    });

    it('precaches on install and skips waiting', () => {
        expect(code).toContain("cache.addAll(PRECACHE)");
        expect(code).toContain('self.skipWaiting()');
    });

    it('clears stale caches on activate and claims clients', () => {
        expect(code).toContain("key.startsWith('lc-')");
        expect(code).toContain('caches.delete(key)');
        expect(code).toContain('self.clients.claim()');
    });

    it('serves cache-first with network fallback for GET requests', () => {
        expect(code).toContain("if (request.method !== 'GET') return;");
        expect(code).toContain('caches.match(request)');
        expect(code).toContain('cache.put(request, copy)');
        expect(code).toContain('.catch(() => caches.match(request))');
    });
});
