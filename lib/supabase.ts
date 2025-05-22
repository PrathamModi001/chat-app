import { createClient } from '@supabase/supabase-js';

// These environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure this code runs only in the browser environment for WebSocket
let options = {};
if (typeof window !== 'undefined') {
  options = {
    global: {
      fetch: window.fetch.bind(window), // Ensure fetch is bound to window
    },
    realtime: {
      // @ts-ignore
      params: {
        // @ts-ignore
        transport: window.WebSocket, // Explicitly pass the browser's WebSocket
      },
    },
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options); 