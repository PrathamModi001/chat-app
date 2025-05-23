import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createBrowserClient() {
  if (!supabaseClient) {
    // Create client with browser-compatible options
    const options = {
      // IMPORTANT: Disable realtime subscriptions entirely on the client
      realtime: {
        autoconnect: false,
      },
    };
    
    supabaseClient = createClientComponentClient<Database>(options as any);
  }
  return supabaseClient;
} 