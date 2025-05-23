import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    // Create client with browser-compatible options
    const options: any = {};
    
    // Ensure we only run this in browser environments
    if (typeof window !== 'undefined') {
      options.global = {
        fetch: window.fetch.bind(window),
      };
      
      // Add browser-specific realtime config
      options.realtime = {
        params: {
          eventsPerSecond: 10,
        },
      };
    }
    
    supabaseClient = createClientComponentClient<Database>(options);
  }
  return supabaseClient;
} 