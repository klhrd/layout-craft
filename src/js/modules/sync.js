import { createClient } from '@supabase/supabase-js';
import { t } from '../config/i18n.js';

const SESSION_KEY = 'lc_supabase_session';

let supabase = null;
let currentUser = null;
const authListeners = [];

function getEnv(name) {
    return typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]
        ? import.meta.env[name]
        : '';
}

export function initSupabase() {
    const url = getEnv('VITE_SUPABASE_URL');
    const key = getEnv('VITE_SUPABASE_ANON_KEY');
    if (!url || !key) {
        return false;
    }
    supabase = createClient(url, key);
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
        try {
            const session = JSON.parse(saved);
            supabase.auth.setSession(session);
        } catch {
            localStorage.removeItem(SESSION_KEY);
        }
    }
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            currentUser = session.user;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            currentUser = null;
            localStorage.removeItem(SESSION_KEY);
        }
        authListeners.forEach((fn) => fn(currentUser));
    });
    currentUser = supabase.auth.user() || null;
    return true;
}

export function signInWithEmail(email) {
    if (!supabase) return Promise.reject(new Error(t('ui.cloud.notInitialized')));
    return supabase.auth.signInWithOtp({ email });
}

export function signInWithGitHub() {
    if (!supabase) return Promise.reject(new Error(t('ui.cloud.notInitialized')));
    return supabase.auth.signInWithOAuth({ provider: 'github' });
}

export function signOut() {
    if (!supabase) return Promise.resolve();
    return supabase.auth.signOut().then(() => {
        currentUser = null;
        localStorage.removeItem(SESSION_KEY);
    });
}

export function getUser() {
    return currentUser;
}

export function isAuthenticated() {
    return !!currentUser;
}

export function onAuthChange(listener) {
    authListeners.push(listener);
    return () => {
        const idx = authListeners.indexOf(listener);
        if (idx !== -1) authListeners.splice(idx, 1);
    };
}

export async function pullProjects() {
    if (!supabase || !currentUser) return [];
    const { data, error } = await supabase
        .from('projects')
        .select('name, updated_at, html, css_data')
        .eq('user_id', currentUser.id)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    const byName = new Map();
    for (const row of data) {
        const existing = byName.get(row.name);
        if (!existing || new Date(row.updated_at) > new Date(existing.updated_at)) {
            byName.set(row.name, row);
        }
    }
    return Array.from(byName.values());
}

export async function pushProject(projectName) {
    if (!supabase || !currentUser) return;
    const canvasHtml = document.getElementById('canvas').innerHTML;
    const { serialize } = await import('./cssState.js');
    const cssData = serialize();
    const now = new Date().toISOString();
    const { error } = await supabase.from('projects').upsert(
        {
            user_id: currentUser.id,
            name: projectName,
            html: canvasHtml,
            css_data: cssData,
            updated_at: now,
        },
        { onConflict: 'user_id, name' },
    );
    if (error) throw error;
}

export async function pullProject(projectName) {
    if (!supabase || !currentUser) return null;
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('name', projectName)
        .single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
}
