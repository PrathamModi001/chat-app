import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    const searchQuery = request.nextUrl.searchParams.get('search');
    
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
    let messagesQuery = supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        is_forwarded,
        created_at,
        delivered_at,
        sender_id,
        reply_to_message_id,
        users!sender_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('chat_id', chatId as any);
      
    // Apply search filter if provided
    if (searchQuery) {
      messagesQuery = messagesQuery.ilike('content', `%${searchQuery}%`);
    }
    
    // Complete the query with ordering
    const { data: messages, error: messagesError } = await messagesQuery.order('created_at', { ascending: true });
    
    if (messagesError || !messages) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }
    
    // Parse messages to a typed format for easier usage
    const typedMessages = messages as SafeAny[];
    
    // Get user ID for easier reference
    const userId = session.user.id;
    
    // Fetch message status records for messages received by this user
    const { data: messageStatusRecords, error: statusError } = await supabase
      .from('message_status')
      .select('message_id, status, read_at')
      .eq('user_id', userId as any);

    if (statusError) {
      console.error('Error fetching message status:', statusError);
    }
    
    // Identify messages sent by the current user
    const sentMessageIds = typedMessages
      .filter(msg => msg.sender_id === userId)
      .map(msg => msg.id);
      
    // Fetch read receipts for messages sent by the current user (if any)
    let readReceipts: any[] = [];
    if (sentMessageIds.length > 0) {
      const { data, error } = await supabase
        .from('message_status')
        .select('message_id, status')
        .eq('status', 'read' as any)
        .in('message_id', sentMessageIds);
        
      if (error) {
        console.error('Error fetching read receipts:', error);
      } else if (data) {
        readReceipts = data;
      }
    }

    // Create a map of message IDs to their read status by recipients
    const readReceiptMap = new Map();
    readReceipts.forEach(receipt => {
      readReceiptMap.set(receipt.message_id, true);
    });

    // Create a map of message IDs to their status
    const messageStatusMap = new Map();
    if (messageStatusRecords) {
      // Use type assertion to ensure messageStatusRecords is treated as an array
      const typedStatusRecords = messageStatusRecords as any[];
      typedStatusRecords.forEach(status => {
        messageStatusMap.set(status.message_id, {
          status: status.status,
          read_at: status.read_at
        });
      });
    }
    
    // Mark messages as read
    const currentTime = new Date().toISOString();
    
    // Find messages sent by others that are not read yet
    const unreadMessages = typedMessages.filter(msg => 
      msg && 
      msg.sender_id !== userId && 
      (!messageStatusMap.has(msg.id) || 
       messageStatusMap.get(msg.id)?.status !== 'read')
    );
    
    if (unreadMessages.length > 0) {
      // Update message_status table
      const statusUpdates = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: userId,
        status: 'read' as const,
        delivered_at: currentTime,
        read_at: currentTime
      }));
      
      const { error: statusInsertError } = await supabase
        .from('message_status')
        .upsert(statusUpdates as any, { 
          onConflict: 'message_id,user_id',
          ignoreDuplicates: false
        });
      
      if (statusInsertError) {
        console.error('Error updating message status:', statusInsertError);
      }
    }
    
    // Format messages for the client
    const formattedMessages = typedMessages.map(msg => {
      // Check message status
      const status = messageStatusMap.get(msg.id);
      const isSent = msg.sender_id === userId;
      
      return {
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
        isSent: isSent,
      date: new Date(msg.created_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
        isDelivered: true, // Always true since we're displaying one tick for pending
        // For messages sent by current user, check if any recipient has read it
        // For messages received by current user, check our own read status
        isRead: isSent ? readReceiptMap.has(msg.id) : (status?.status === 'read'),
      message_type: msg.message_type,
      is_forwarded: msg.is_forwarded,
      reply_to_message_id: msg.reply_to_message_id
      };
    });
    
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
        isDelivered: true, // Always true for one tick
        isRead: false, // Not read yet
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