import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper for type safety
type SafeAny = any;

// GET /api/chats - Get all chats for the current user
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
    
    const userId = session.user.id;
    
    // Get all chats the user is part of
    const { data: participations, error: participationsError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId as any);
    
    if (participationsError) {
      console.error('Error fetching chat participations:', participationsError);
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      );
    }
    
    if (!participations || participations.length === 0) {
      return NextResponse.json({ chats: [] });
    }
    
    // Use type assertion for safety
    const typedParticipations = participations as SafeAny[];
    const chatIds = typedParticipations.map(p => p.chat_id);
    
    // Get chat details
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds);
    
    if (chatsError || !chats) {
      console.error('Error fetching chats:', chatsError);
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      );
    }
    
    // Use type assertion for chats
    const typedChats = chats as SafeAny[];
    
    // Get the last message for each chat
    const chatsWithLastMessage = await Promise.all(
      typedChats.map(async (chat) => {
        // Get last message from this chat
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender_id,
            message_type,
            is_forwarded,
            users!sender_id (
              full_name,
              phone
            )
          `)
          .eq('chat_id', chat.id as any)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (messagesError || !messages || messages.length === 0) {
          console.error(`Error fetching messages for chat ${chat.id}:`, messagesError);
          return {
            ...chat,
            lastMessage: null,
            unread: 0,
            participants: []
          };
        }
        
        // Get unread message count
        const { count: unreadCount, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('chat_id', chat.id as any)
          .is('read_at', null)
          .neq('sender_id', userId as any);
        
        // Get chat participants
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select(`
            users (
              id,
              full_name,
              phone,
              profile_image_url
            )
          `)
          .eq('chat_id', chat.id as any);
        
        // Format the last message - use type assertion
        const typedMessages = messages as SafeAny[];
        const lastMessage = typedMessages[0];
        const typedParticipants = participants as SafeAny[] || [];
        const participantsList = typedParticipants
          .filter(p => p && p.users)
          .map(p => p.users);
        
        return {
          ...chat,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            sender_name: lastMessage.users?.full_name || 'Unknown',
            message_type: lastMessage.message_type,
            is_forwarded: lastMessage.is_forwarded,
          } : null,
          unread: unreadCount || 0,
          participants: participantsList
        };
      })
    );
    
    // Sort chats by last message date (most recent first)
    const sortedChats = chatsWithLastMessage.sort((a, b) => {
      const dateA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at) : new Date(a.created_at);
      const dateB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    return NextResponse.json({ chats: sortedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 