import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper for type safety
type SafeAny = any;

// GET /api/users - Get a list of all users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get search query parameter
    const search = request.nextUrl.searchParams.get('search');
    
    let query = supabase
      .from('users')
      .select('id, full_name, phone, profile_image_url, email')
      .neq('id', session.user.id as any); // Exclude current user
    
    // Apply search filter if provided
    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }
    
    const { data: users, error } = await query.order('full_name', { ascending: true });
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 