import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper for type safety
type SafeAny = any;

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Properly handle params
    const params = context.params;
    const messageId = params.id;
    
    // Initialize Supabase client with authentication
    const supabase = await createClient();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
      .eq('id', messageId as any)
      .single();
    
    if (error) {
      console.error('Error fetching message:', error);
      return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
    }
    
    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    
    // Check message status
    const { data: messageStatus } = await supabase
      .from('message_status')
      .select('status, read_at')
      .eq('message_id', messageId as any)
      .eq('user_id', session.user.id as any)
      .maybeSingle();
    
    // Check if any recipients have read the message (for sent messages)
    const { data: readReceipts } = await supabase
      .from('message_status')
      .select('status')
      .eq('message_id', messageId as any)
      .eq('status', 'read' as any);
    
    // Use type assertion for safe access
    const typedMessage = message as SafeAny;
    const typedMessageStatus = messageStatus as SafeAny;
    
    // Check if this is a message sent by the current user
    const isSentByCurrentUser = typedMessage.sender_id === session.user.id;
    
    // Format the message for client consumption
    const formattedMessage = {
      id: typedMessage.id,
      text: typedMessage.content,
      time: new Date(typedMessage.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      date: new Date(typedMessage.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }),
      sender: typedMessage.user?.full_name || 'Unknown',
      sender_id: typedMessage.sender_id,
      phoneNumber: typedMessage.user?.phone,
      email: typedMessage.user?.email,
      isSent: isSentByCurrentUser,
      isDelivered: true, // Always true since we're displaying one tick for pending
      // If sent by current user, check if any recipients read it. Otherwise, check if we read it.
      isRead: isSentByCurrentUser ? (readReceipts && readReceipts.length > 0) : typedMessageStatus?.status === 'read',
      message_type: typedMessage.message_type,
      is_forwarded: typedMessage.is_forwarded
    };
    
    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    console.error('Unexpected error fetching message:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 