import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function hashFiles(files) {
    let h = 5381;
    for (const file of files) {
        for (let i = 0; i < file.length; i++) {
            h = ((h * 33) ^ file.charCodeAt(i)) >>> 0;
        }
    }
    return h.toString(36);
}

export function generateSwCode({ files, version }) {
    const precache = JSON.stringify(files);
    return `const CACHE_NAME = 'lc-${version}';
const PRECACHE = ${precache};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key.startsWith('lc-') && key !== CACHE_NAME)
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    event.respondWith(
        caches.match(request).then((hit) => {
            if (hit) return hit;
            return fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(request));
        })
    );
});
`;
}

function listFiles(dir, base = '') {
    const out = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = base ? `${base}/${entry.name}` : entry.name;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...listFiles(full, rel));
        } else {
            out.push(rel);
        }
    }
    return out;
}

export function pwaPlugin() {
    let outDir = 'dist';
    return {
        name: 'layoutcraft-pwa',
        apply: 'build',
        configResolved(config) {
            outDir = config.build.outDir;
        },
        closeBundle() {
            const files = listFiles(outDir)
                .filter((file) => file !== 'sw.js')
                .sort();
            const swCode = generateSwCode({ files, version: hashFiles(files) });
            writeFileSync(join(outDir, 'sw.js'), swCode);
        },
    };
}
