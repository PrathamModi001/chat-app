import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

export function createClient() {
  return createClientComponentClient<Database>();
} 