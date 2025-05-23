import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    // Create Supabase client - fixed to use async pattern
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
    // Use the groupId from params object (already typed as string above)
    const { groupId } = params;
    
    // Check if user is a participant in this chat
    const { data: participantData, error: participantError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('chat_id', groupId)
      .eq('user_id', currentUserId)
      .single();
    
    if (participantError || !participantData) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get chat details
    const { data: groupData, error: groupError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', groupId)
      .eq('is_group', true)
      .single();
    
    if (groupError || !groupData) {
      return NextResponse.json(
        { error: 'Group not found' },
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
      .eq('chat_id', groupId);
    
    if (participantsError) {
      console.error('Error fetching group participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to load group participants' },
        { status: 500 }
      );
    }
    
    // Format participants data
    const participants = participantsData.map(item => ({
      ...item.users,
      is_admin: item.is_admin
    }));
    
    // Return formatted group info
    return NextResponse.json({
      chat: groupData,
      participants
    });
    
  } catch (error) {
    console.error('Error fetching group info:', error);
    return NextResponse.json(
      { error: 'Failed to load group information' },
      { status: 500 }
    );
  }
} 