import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, token } = await request.json();

    // Validate input
    if (!email || !password || !token) {
      return NextResponse.json(
        { error: 'Email, password, and token are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Validate token first
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

    // Update the user's password
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password,
        user_metadata: {
          ...user.user_metadata,
          reset_token: null,
          reset_token_expires: null
        }
      }
    );

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to set password' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Password set successfully' },
      { status: 200 }
    );
  } catch (err) {
    console.error('Set password error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 