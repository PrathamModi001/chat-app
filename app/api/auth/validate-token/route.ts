import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    // Validate input
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      filter: {
        email: email
      }
    });

    if (userError || !userData.users.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userData.users[0];
    const storedToken = user.user_metadata?.reset_token;
    const tokenExpiry = user.user_metadata?.reset_token_expires;

    // Validate token
    if (!storedToken || storedToken !== token) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check token expiry
    if (!tokenExpiry || new Date(tokenExpiry) < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );
  } catch (err) {
    console.error('Token validation error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 