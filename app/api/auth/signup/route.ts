import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendPasswordSetupEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone } = await request.json();

    // Validate input
    if (!email || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, name, and phone are required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // ONLY check if user exists in our custom users table by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a temporary random password
    const tempPassword = randomBytes(16).toString('hex');
    
    // Generate a secure token for password setup
    const token = randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Mark email as confirmed
      user_metadata: {
        full_name: name,
        phone,
        reset_token: token,
        reset_token_expires: tokenExpiry.toISOString()
      }
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    const userId = data.user.id;

    // Insert user record in our custom table
    const { error: insertError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name: name,
      phone,
    } as any);

    if (insertError) {
      console.error('User insert error:', insertError);
      
      // Clean up the auth user if we failed to create the profile
      await supabase.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: insertError.message || 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // Send password setup email
    try {
      await sendPasswordSetupEmail(email, token);
    } catch (emailError) {
      console.error('Failed to send password setup email:', emailError);
      // Continue even if email fails - we'll still return success
    }

    return NextResponse.json(
      { 
        message: 'User created successfully. Check your email for password setup instructions.',
        userId: userId
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 