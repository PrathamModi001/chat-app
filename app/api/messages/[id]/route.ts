import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Properly await and destructure params
    const { id: messageId } = context.params;
    
    // Fetch the message by ID
    const { data: message, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        message_type,
        is_forwarded,
        user:sender_id (full_name, phone, email, profile_image_url)
      `)
      .eq('id', messageId)
      .single();
    
    if (error) {
      console.error('Error fetching message:', error);
      return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Format the message for client consumption
    const formattedMessage = {
      id: message.id,
      text: message.content,
      time: new Date(message.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(message.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
      sender: message.user?.full_name || 'Unknown',
      sender_id: message.sender_id,
      phoneNumber: message.user?.phone,
      email: message.user?.email,
      isSent: false, // This will be updated based on session user ID on the client
      isDelivered: true,
      isRead: false,
      message_type: message.message_type,
      is_forwarded: message.is_forwarded
    };
    
    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    console.error('Unexpected error fetching message:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 