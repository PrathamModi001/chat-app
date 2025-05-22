import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createClient();

    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = sessionData.session.user.id;

    // Get user profile with types asserted
    const { data, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, phone')
      .eq('id', userId as any)
      .single();

    if (userError || !data) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    // Cast data to proper type to access properties safely
    const userData = data as { 
      id: string; 
      email: string; 
      full_name: string; 
      phone: string | null;
    };

    return NextResponse.json(
      { 
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name,
          phone: userData.phone
        }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Get current user error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 