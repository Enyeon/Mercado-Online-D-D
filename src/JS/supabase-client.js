








import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8?bundle';

function readConfig() {
    const urlFromMeta = document.querySelector('meta[name="supabase-url"]')?.content?.trim();
    const keyFromMeta = document.querySelector('meta[name="supabase-anon-key"]')?.content?.trim();

    return {
        url: (globalThis.__SUPABASE_URL__ ?? urlFromMeta ?? '').trim(),
        anonKey: (globalThis.__SUPABASE_ANON_KEY__ ?? keyFromMeta ?? '').trim(),
    };
}

export function createSupabaseClient() {
    const { url, anonKey } = readConfig();

    if (!url || !anonKey) {
        console.warn('[SUPABASE] Missing configuration. Define __SUPABASE_URL__/__SUPABASE_ANON_KEY__ or <meta> tags.');
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
