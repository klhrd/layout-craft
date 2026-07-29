import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { install, reset } from './_localStorageHarness.js';

vi.mock('@supabase/supabase-js', () => {
    const mockChannel = () => ({
        on: () => mockChannel(),
        subscribe: () => mockChannel(),
    });
    const mockAuth = {
        user: vi.fn(() => null),
        setSession: vi.fn(),
        signInWithOtp: vi.fn(),
        signInWithOAuth: vi.fn(),
        signOut: vi.fn(() => Promise.resolve()),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    };
    const mockFrom = vi.fn();
    const createClient = vi.fn(() => ({
        auth: mockAuth,
        from: mockFrom,
        channel: mockChannel,
    }));
    return { createClient };
});

describe('sync module', () => {
    beforeEach(() => {
        install();
        delete globalThis.__VITE_SUPABASE_URL;
        delete globalThis.__VITE_SUPABASE_ANON_KEY;
        document.body.innerHTML = `
            <div id="canvas"></div>
            <div id="visual-css-container"></div>
        `;
    });
    afterEach(() => {
        reset();
        vi.resetModules();
    });

    it('initSupabase returns false when env vars are missing', async () => {
        const sync = await import('../src/js/modules/sync.js');
        const result = sync.initSupabase();
        expect(result).toBe(false);
    });

    it('isAuthenticated returns false when not signed in', async () => {
        const sync = await import('../src/js/modules/sync.js');
        expect(sync.isAuthenticated()).toBe(false);
    });

    it('getUser returns null when not signed in', async () => {
        const sync = await import('../src/js/modules/sync.js');
        expect(sync.getUser()).toBe(null);
    });

    it('signOut resolves when supabase is not initialized', async () => {
        const sync = await import('../src/js/modules/sync.js');
        await expect(sync.signOut()).resolves.toBeUndefined();
    });

    it('pullProjects returns empty array when not authenticated', async () => {
        const sync = await import('../src/js/modules/sync.js');
        const result = await sync.pullProjects();
        expect(result).toEqual([]);
    });

    it('pushProject does nothing when not authenticated', async () => {
        const sync = await import('../src/js/modules/sync.js');
        await expect(sync.pushProject('test')).resolves.toBeUndefined();
    });

    it('pullProject returns null when not authenticated', async () => {
        const sync = await import('../src/js/modules/sync.js');
        const result = await sync.pullProject('test');
        expect(result).toBeNull();
    });

    it('onAuthChange registers and returns unsubscribe function', async () => {
        const sync = await import('../src/js/modules/sync.js');
        const fn = vi.fn();
        const unsub = sync.onAuthChange(fn);
        expect(typeof unsub).toBe('function');
    });
});
