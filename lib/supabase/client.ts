import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function createClient() {
  if (!supabaseClient) {
    try {
      // Default to using auth-helpers-nextjs with default configuration
      supabaseClient = createClientComponentClient<Database>({
        options: {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        }
      });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      // Create a fallback client that won't throw additional errors
      supabaseClient = createClientComponentClient<Database>();
    }
  }
  return supabaseClient;
} 