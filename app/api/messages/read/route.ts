import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageIds, chatId } = body;
    
    if (!messageIds || !messageIds.length || !chatId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageIds and chatId' },
        { status: 400 }
      );
    }

    // Initialize Supabase client with authentication
    const supabase = await createClient();
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Update message status for each message
    for (const messageId of messageIds) {
      // Check if a status record already exists
      const { data: existingStatus } = await supabase
        .from('message_status')
        .select('*')
        .eq('message_id', messageId as any)
        .eq('user_id', session.user.id as any)
        .single();
      
      if (existingStatus) {
        // Update existing status
        const { error } = await supabase
          .from('message_status')
          .update({ 
            status: 'read'
          } as any)
          .eq('message_id', messageId as any)
          .eq('user_id', session.user.id as any);
        
        if (error) {
          console.error('Error updating message status:', error);
        }
      } else {
        // Create new status record
        const { error } = await supabase
          .from('message_status')
          .insert({ 
            message_id: messageId, 
            user_id: session.user.id, 
            status: 'read'
          } as any);
        
        if (error) {
          console.error('Error creating message status:', error);
        }
      }
    }
    
    // Also update unread count in the chat
    await supabase
      .from('chats')
      .update({ unread: 0 } as any)
      .eq('id', chatId as any);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error marking messages as read:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 