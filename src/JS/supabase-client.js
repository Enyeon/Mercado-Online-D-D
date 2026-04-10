








import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8?bundle';

function sanitizeConfigValue(value) {
    const normalized = String(value ?? '').trim();
    if (!normalized) return '';
    if (normalized.startsWith('__SUPABASE_') && normalized.endsWith('__')) return '';
    if (normalized === 'TU_ANON_KEY' || normalized === 'https://TU_URL.supabase.co') return '';
    return normalized;
}

function readConfig() {
    const urlFromMeta = document.querySelector('meta[name="supabase-url"]')?.content?.trim();
    const keyFromMeta = document.querySelector('meta[name="supabase-anon-key"]')?.content?.trim();

    const urlFromGlobal = globalThis.__SUPABASE_URL__ ?? globalThis.SUPABASE_URL;
    const keyFromGlobal = globalThis.__SUPABASE_ANON_KEY__ ?? globalThis.SUPABASE_ANON_KEY;

    return {
        url: sanitizeConfigValue(urlFromGlobal ?? urlFromMeta),
        anonKey: sanitizeConfigValue(keyFromGlobal ?? keyFromMeta),
    };
}

export function createSupabaseClient() {
    const { url, anonKey } = readConfig();

    if (!url || !anonKey) {
        console.warn('[SUPABASE] Missing configuration. Define __SUPABASE_URL__/__SUPABASE_ANON_KEY__ (or SUPABASE_URL/SUPABASE_ANON_KEY) or <meta> tags.');
        return null;
    }

    return createClient(url, anonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    });
}
