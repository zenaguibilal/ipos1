
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client instance using provided credentials.
 * Since this is a client-side only app, credentials can be provided 
 * via the settings UI and stored in the local database.
 */
export const getSupabaseClient = (url: string, key: string) => {
    if (!url || !key) return null;
    // Safety trim to prevent common copy-paste errors
    return createClient(url.trim(), key.trim());
};
