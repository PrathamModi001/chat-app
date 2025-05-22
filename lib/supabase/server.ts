import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './database.types';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
} 