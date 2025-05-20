import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test the connection to Supabase
    const { data, error } = await supabase.from('test').select('*').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ success: false, error }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error testing Supabase connection:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
} 