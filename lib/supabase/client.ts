import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    // Simple initialization - just like in ChatContext.tsx
    supabaseClient = createClientComponentClient<Database>();
  }
  return supabaseClient;
} 