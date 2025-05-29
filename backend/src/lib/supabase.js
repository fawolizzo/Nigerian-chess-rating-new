/**
 * Supabase Client for Backend (Admin Access)
 *
 * This client is configured with the Supabase service_role key, granting
 * full admin privileges to the database. It should only be used on the backend
 * and its key must be kept secure.
 */

const { createClient } = require('@supabase/supabase-js');

// Ensure these environment variables are set in your .env file
// They should be loaded via a package like 'dotenv' in your main application entry file (e.g., index.js)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Basic validation to ensure environment variables are present
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables for backend. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  // In a real application, you might want to throw an error or exit the process
}

// Create a Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabaseAdmin };
