import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper for type safety
type SafeAny = any;

// GET /api/messages?chatId=xxx - Get messages for a specific chat
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
    
    // Get chatId from query parameters
    const chatId = request.nextUrl.searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user is a participant in this chat
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chatId as any)
      .eq('user_id', session.user.id as any)
      .maybeSingle();
    
    if (participantError) {
      console.error('Error checking chat participation:', participantError);
      return NextResponse.json(
        { error: 'Failed to verify chat access' },
        { status: 500 }
      );
    }
    
    if (!participant) {
      return NextResponse.json(
        { error: 'You do not have access to this chat' },
        { status: 403 }
      );
    }
    
    // Fetch messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        is_forwarded,
        created_at,
        delivered_at,
        read_at,
        sender_id,
        reply_to_message_id,
        users!sender_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('chat_id', chatId as any)
      .order('created_at', { ascending: true });
    
    if (messagesError || !messages) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }
    
    // Mark messages as read
    const userId = session.user.id;
    const currentTime = new Date().toISOString();
    
    // Find messages sent by others that are not read yet - use type assertion
    const typedMessages = messages as SafeAny[];
    const unreadMessages = typedMessages.filter(msg => 
      msg && msg.sender_id !== userId && !msg.read_at
    );
    
    if (unreadMessages.length > 0) {
      // Update read_at for these messages
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: currentTime } as any)
        .in('id', unreadMessages.map(msg => msg.id));
      
      if (updateError) {
        console.error('Error marking messages as read:', updateError);
      }
      
      // Also update message_status table
      const statusUpdates = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: userId,
        status: 'read' as const,
        read_at: currentTime
      }));
      
      const { error: statusError } = await supabase
        .from('message_status')
        .upsert(statusUpdates as any, { 
          onConflict: 'message_id,user_id',
          ignoreDuplicates: false
        });
      
      if (statusError) {
        console.error('Error updating message status:', statusError);
      }
    }
    
    // Format messages for the client - use type assertion
    const formattedMessages = typedMessages.map(msg => ({
      id: msg.id,
      text: msg.content,
      time: new Date(msg.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
      sender: msg.users?.full_name || 'Unknown',
      sender_id: msg.sender_id,
      phoneNumber: msg.users?.phone,
      email: msg.users?.email,
      isSent: msg.sender_id === userId,
      date: new Date(msg.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      isDelivered: !!msg.delivered_at,
      isRead: !!msg.read_at,
      message_type: msg.message_type,
      is_forwarded: msg.is_forwarded,
      reply_to_message_id: msg.reply_to_message_id
    }));
    
    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
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
    
    const { chatId, content, messageType = 'text', replyToMessageId } = await request.json();
    
    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Chat ID and message content are required' },
        { status: 400 }
      );
    }
    
    // Check if user is a participant in this chat
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chatId as any)
      .eq('user_id', session.user.id as any)
      .maybeSingle();
    
    if (participantError) {
      console.error('Error checking chat participation:', participantError);
      return NextResponse.json(
        { error: 'Failed to verify chat access' },
        { status: 500 }
      );
    }
    
    if (!participant) {
      return NextResponse.json(
        { error: 'You do not have access to this chat' },
        { status: 403 }
      );
    }
    
    // Insert the new message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: session.user.id,
        content,
        message_type: messageType,
        reply_to_message_id: replyToMessageId || null,
        is_forwarded: false
      } as any)
      .select()
      .single();
    
    if (messageError || !message) {
      console.error('Error sending message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }
    
    // Get all participants of this chat (except sender)
    const { data: chatParticipants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId as any)
      .neq('user_id', session.user.id as any);
    
    if (participantsError) {
      console.error('Error fetching chat participants:', participantsError);
    } else if (chatParticipants && chatParticipants.length > 0) {
      // Insert message_status records for all participants - use type assertion
      const typedParticipants = chatParticipants as SafeAny[];
      const statusRecords = typedParticipants.map(p => ({
        message_id: (message as SafeAny).id,
        user_id: p.user_id,
        status: 'pending'
      }));
      
      if (statusRecords.length > 0) {
        const { error: statusError } = await supabase
          .from('message_status')
          .insert(statusRecords as any);
        
        if (statusError) {
          console.error('Error creating message status records:', statusError);
        }
      }
    }
    
    // Fetch sender details
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('full_name, email, phone')
      .eq('id', session.user.id as any)
      .single();
    
    if (senderError) {
      console.error('Error fetching sender details:', senderError);
    }
    
    // Use type assertion for safe access
    const typedMessage = message as SafeAny;
    const typedSender = sender as SafeAny || {};
    
    // Return the message with formatted data
    return NextResponse.json({
      message: {
        id: typedMessage.id,
        text: typedMessage.content,
        time: new Date(typedMessage.created_at || Date.now()).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        }),
        sender: typedSender.full_name || 'Unknown',
        sender_id: typedMessage.sender_id,
        phoneNumber: typedSender.phone,
        email: typedSender.email,
        isSent: true,
        date: new Date(typedMessage.created_at || Date.now()).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        isDelivered: false,
        isRead: false,
        message_type: typedMessage.message_type,
        is_forwarded: typedMessage.is_forwarded,
        reply_to_message_id: typedMessage.reply_to_message_id
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 