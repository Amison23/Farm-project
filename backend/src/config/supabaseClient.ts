import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in backend/.env'
  );
}

/**
 * Supabase admin client — uses the service_role key.
 *
 * Rules:
 * - This client BYPASSES Row Level Security.
 * - It must NEVER be exposed to the frontend or used in any client-side context.
 * - It is the ONLY place in the backend that calls createClient.
 * - Application-layer guards (auth middleware, farmMembership middleware) must be
 *   applied at the route level before any repository touches this client.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
