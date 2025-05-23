import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Define a utility type for any
type SafeAny = any;

export async function POST(request: Request) {
  try {
    // Create Supabase client - note that createClient is async and needs no parameters
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
    
    // Parse request body
    const { name, participants } = await request.json();
    
    // Validate request
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      );
    }
    
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 participants are required' },
        { status: 400 }
      );
    }
    
    // Make sure current user is included in participants
    const allParticipants = participants.includes(currentUserId)
      ? participants
      : [currentUserId, ...participants];
    
    // Create group chat in transaction
    // 1. Create chat
    const { data: groupData, error: groupError } = await supabase
      .from('chats')
      .insert({
        name: name.trim(),
        is_group: true,
        chat_type: 'Demo',
        updated_at: new Date().toISOString(),
      } as any)
      .select()
      .single();
    
    if (groupError) {
      console.error('Error creating group:', groupError);
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      );
    }
    
    // 2. Add participants
    const typedGroupData = groupData as SafeAny;
    const participantsToInsert = allParticipants.map(userId => ({
      chat_id: typedGroupData.id,
      user_id: userId,
      is_admin: userId === currentUserId, // Current user is admin
    }));
    
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participantsToInsert as any);
    
    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      return NextResponse.json(
        { error: 'Failed to add participants to group' },
        { status: 500 }
      );
    }
    
    // Return the created group
    return NextResponse.json({
      success: true,
      group: groupData
    });
    
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
} 