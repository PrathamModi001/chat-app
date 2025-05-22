import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// DELETE /api/chats/[chatId]/labels/[labelId] - Remove a label from a chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string; labelId: string } }
) {
  try {
    const supabase = await createClient();
    const { chatId, labelId } = params;
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has access to this chat
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    if (participantError) {
      console.error('Error checking chat access:', participantError);
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
    
    // Remove the label from the chat
    const { error } = await supabase
      .from('chat_label_assignments')
      .delete()
      .eq('chat_id', chatId)
      .eq('label_id', labelId)
      .select();
    
    if (error) {
      console.error('Error removing label from chat:', error);
      return NextResponse.json(
        { error: 'Failed to remove label from chat' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in chat labels endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 