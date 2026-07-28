import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { install, reset } from './_localStorageHarness.js';

import { updateStorageMeter } from '../src/js/modules/storage.js';

describe('storage.updateStorageMeter', () => {
    beforeEach(() => {
        install();
        localStorage.clear();
        document.body.innerHTML = `
            <span id="storage-text"></span>
            <div id="storage-bar" style="width: 0%; background: #2563eb;"></div>
        `;
    });
    afterEach(() => reset());

    it('reads 0 MB on an empty localStorage', () => {
        updateStorageMeter();
        expect(document.getElementById('storage-text').textContent).toBe('0.00 MB / 5.00 MB (0.0%)');
        const bar = document.getElementById('storage-bar');
        expect(bar.style.width).toBe('0.0%');
        expect(bar.style.backgroundColor).toBe('#2563eb');
    });

    it('totals UTF-16 bytes across keys and reports a safe blue bar', () => {
        localStorage.setItem('a', 'x'.repeat(1000)); // (1 + 1000) * 2 = 2002 bytes
        localStorage.setItem('b', 'y'.repeat(2000)); // (1 + 2000) * 2 = 4002 bytes
        updateStorageMeter();
        const bytes = 6004;
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        const pct = Math.min((bytes / (5 * 1024 * 1024)) * 100, 100).toFixed(1);
        expect(document.getElementById('storage-text').textContent).toBe(`${mb} MB / 5.00 MB (${pct}%)`);
        expect(document.getElementById('storage-bar').style.backgroundColor).toBe('#2563eb');
    });

    it('turns the bar orange once usage exceeds 60%', () => {
        const targetBytes = 0.7 * 5 * 1024 * 1024; // ~70%
        const overage = Math.ceil(targetBytes / 2);
        localStorage.setItem('k', 'v'.repeat(Math.max(overage - 1, 0)));
        updateStorageMeter();
        const bar = document.getElementById('storage-bar');
        expect(parseFloat(bar.style.width)).toBeGreaterThan(60);
        expect(bar.style.backgroundColor).toBe('#f59e0b');
    });

    it('turns the bar red once usage exceeds 85%', () => {
        const targetBytes = 0.9 * 5 * 1024 * 1024; // ~90%
        const overage = Math.ceil(targetBytes / 2);
        localStorage.setItem('k', 'v'.repeat(Math.max(overage - 1, 0)));
        updateStorageMeter();
        const bar = document.getElementById('storage-bar');
        expect(parseFloat(bar.style.width)).toBeGreaterThan(85);
        expect(bar.style.backgroundColor).toBe('#ef4444');
    });
});
