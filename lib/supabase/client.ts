import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    // Default to using auth-helpers-nextjs with default configuration
    // which will use the environment variables automatically
    supabaseClient = createClientComponentClient<Database>({
      options: {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    });
  }
  return supabaseClient;
} 