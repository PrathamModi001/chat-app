import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper for type safety
type SafeAny = any;

// POST /api/chats/new - Create a new chat with another user
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
    
    const { userId, name, isGroup = false, chatType = 'Demo' } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if recipient user exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', userId as any)
      .maybeSingle();
    
    if (recipientError || !recipient) {
      console.error('Error checking recipient:', recipientError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if a chat already exists between these users
    const { data: currentUserChats, error: userChatsError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', session.user.id as any);
    
    if (userChatsError) {
      console.error('Error checking user chats:', userChatsError);
      return NextResponse.json(
        { error: 'Failed to check existing chats' },
        { status: 500 }
      );
    }
    
    const typedCurrentUserChats = currentUserChats as SafeAny[] || [];
    const userChatIds = typedCurrentUserChats.map(c => c.chat_id);
    
    const { data: recipientChats, error: recipientChatsError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId as any)
      .in('chat_id', userChatIds);
    
    if (recipientChatsError) {
      console.error('Error checking recipient chats:', recipientChatsError);
      return NextResponse.json(
        { error: 'Failed to check existing chats' },
        { status: 500 }
      );
    }
    
    const typedRecipientChats = recipientChats as SafeAny[] || [];
    
    // If it's a direct chat (not a group) and chat already exists, return it
    if (!isGroup && typedRecipientChats.length > 0) {
      const existingChatId = typedRecipientChats[0].chat_id;
      
      // Get the existing chat details
      const { data: existingChat, error: existingChatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', existingChatId as any)
        .single();
      
      if (existingChatError || !existingChat) {
        console.error('Error fetching existing chat:', existingChatError);
        return NextResponse.json(
          { error: 'Failed to fetch existing chat' },
          { status: 500 }
        );
      }
      
      // Get participants
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
        .eq('chat_id', existingChatId as any);
      
      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }
      
      const typedParticipants = participants as SafeAny[] || [];
      const participantsList = typedParticipants
        .filter(p => p && p.users)
        .map(p => p.users);
      
      return NextResponse.json({
        chat: {
          ...existingChat,
          participants: participantsList,
          unread: 0
        },
        isExisting: true
      });
    }
    
    // Create a new chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        name: name || `Chat with ${recipient.full_name}`,
        is_group: isGroup,
        chat_type: chatType,
      } as any)
      .select()
      .single();
    
    if (chatError || !chat) {
      console.error('Error creating chat:', chatError);
      return NextResponse.json(
        { error: 'Failed to create chat' },
        { status: 500 }
      );
    }
    
    // Add current user as a participant
    const { error: currentUserError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: (chat as SafeAny).id,
        user_id: session.user.id,
        is_admin: true
      } as any);
    
    if (currentUserError) {
      console.error('Error adding current user to chat:', currentUserError);
      // Clean up the chat if participant creation failed
      await supabase.from('chats').delete().eq('id', (chat as SafeAny).id as any);
      return NextResponse.json(
        { error: 'Failed to add you to the chat' },
        { status: 500 }
      );
    }
    
    // Add recipient user as a participant
    const { error: recipientParticipantError } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: (chat as SafeAny).id,
        user_id: userId,
        is_admin: false
      } as any);
    
    if (recipientParticipantError) {
      console.error('Error adding recipient to chat:', recipientParticipantError);
      // Clean up the chat and participants if failed
      await supabase.from('chat_participants').delete().eq('chat_id', (chat as SafeAny).id as any);
      await supabase.from('chats').delete().eq('id', (chat as SafeAny).id as any);
      return NextResponse.json(
        { error: 'Failed to add recipient to the chat' },
        { status: 500 }
      );
    }
    
    // Get current user details
    const { data: currentUser, error: currentUserDetailsError } = await supabase
      .from('users')
      .select('id, full_name, phone, profile_image_url')
      .eq('id', session.user.id as any)
      .single();
    
    if (currentUserDetailsError) {
      console.error('Error fetching current user details:', currentUserDetailsError);
    }
    
    // Prepare the response
    const typedChat = chat as SafeAny;
    const participants = [
      currentUser || { id: session.user.id },
      recipient
    ].filter(Boolean);
    
    return NextResponse.json({
      chat: {
        ...typedChat,
        participants,
        unread: 0
      },
      isExisting: false
    });
    
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 