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

    // ONLY check if user exists in our custom users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', email as any)
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

    let userId = null;

    // Try to create user with admin API - might fail if user exists in Auth but not in our table
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
      // Check if error is because user already exists in Auth
      if (error.message?.includes('already exists')) {
        // Try to find the user in Supabase Auth by email - without filter
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
        
        // Find the user by email manually
        const authUser = existingAuthUser?.users?.find(u => u.email === email);

        // If we found the user in Auth but not in our users table
        if (authUser) {
          userId = authUser.id;
          
          // Update the existing auth user with new metadata and token
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                full_name: name,
                phone,
                reset_token: token,
                reset_token_expires: tokenExpiry.toISOString()
              }
            }
          );

          if (updateError) {
            console.error('Failed to update existing auth user:', updateError);
            return NextResponse.json(
              { error: 'Failed to update user' },
              { status: 500 }
            );
          }
        } else {
          console.error('Supabase signup error:', error);
          return NextResponse.json(
            { error: 'Failed to create user account' },
            { status: 500 }
          );
        }
      } else {
        console.error('Supabase signup error:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to create user' },
          { status: 500 }
        );
      }
    } else {
      // New user was created successfully
      userId = data.user.id;
    }

    // If we have a userId, create or update the user in our custom table
    if (userId) {
      // First check if a record with this ID already exists
      const { data: existingUserRecord } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId as any)
        .maybeSingle();

      if (existingUserRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email,
            full_name: name,
            phone
          } as any)
          .eq('id', userId as any);

        if (updateError) {
          console.error('User update error:', updateError);
          return NextResponse.json(
            { error: updateError.message || 'Failed to update user profile' },
            { status: 500 }
          );
        }
      } else {
        // Insert new record
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
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to create or identify user' },
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