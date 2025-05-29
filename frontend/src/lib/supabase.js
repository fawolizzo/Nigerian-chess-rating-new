/**
 * Supabase Client for Frontend (Public Access)
 *
 * This client is configured with the Supabase anon (public) key.
 * It is used for client-side operations where Row Level Security (RLS)
 * policies on the database will enforce access control.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a Supabase client for the frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
