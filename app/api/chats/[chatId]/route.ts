import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const currentUserId = session.user.id;
    const { chatId } = params;
    
    // Check if user is a participant in this chat
    const { data: participantData, error: participantError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('chat_id', chatId)
      .eq('user_id', currentUserId)
      .single();
    
    if (participantError || !participantData) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get chat details
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    
    if (chatError || !chatData) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Get participants
    const { data: participantsData, error: participantsError } = await supabase
      .from('chat_participants')
      .select(`
        is_admin,
        user_id,
        users:user_id (
          id,
          full_name,
          phone,
          email,
          profile_image_url,
          status
        )
      `)
      .eq('chat_id', chatId);
    
    if (participantsError) {
      console.error('Error fetching chat participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to load chat participants' },
        { status: 500 }
      );
    }
    
    // Format participants data
    const participants = participantsData.map(item => ({
      ...item.users,
      is_admin: item.is_admin
    }));
    
    // Return formatted chat info
    return NextResponse.json({
      chat: {
        ...chatData,
        participants
      }
    });
    
  } catch (error) {
    console.error('Error fetching chat info:', error);
    return NextResponse.json(
      { error: 'Failed to load chat information' },
      { status: 500 }
    );
  }
} 