import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export async function createClient() {
  try {
    const cookieStore = await cookies();
    return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  } catch (error) {
    console.error('Error creating Supabase server client:', error);
    // Try again with a basic configuration
    const cookieStore = await cookies();
    return createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore,
    });
  }
} 