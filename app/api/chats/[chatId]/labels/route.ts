import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace any with proper types from generated Supabase types
type ChatLabel = {
  label_id: string;
  assigned_at: string;
  assigned_by: string;
  labels: {
    id: string;
    name: string;
    color: string;
  };
};

// GET /api/chats/[chatId]/labels - Get labels for a specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = (await createClient()) as any;
    const chatId = params.chatId;
    
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
    
    if (participantError || !participant) {
      console.error('Error checking chat access:', participantError);
      return NextResponse.json(
        { error: participantError ? 'Failed to verify chat access' : 'You do not have access to this chat' },
        { status: participantError ? 500 : 403 }
      );
    }
    
    // Fetch labels for this chat
    const { data: chatLabels, error: chatLabelsError } = await supabase
      .from('chat_label_assignments')
      .select(`
        label_id,
        assigned_at,
        assigned_by,
        labels!inner (
          id,
          name,
          color
        )
      `)
      .eq('chat_id', chatId) as { data: ChatLabel[] | null; error: any };

    if (chatLabelsError || !chatLabels) {
      console.error('Error fetching chat labels:', chatLabelsError);
      return NextResponse.json(
        { error: 'Failed to fetch chat labels' },
        { status: 500 }
      );
    }

    // Format the response
    const labels = chatLabels.map(cl => ({
      id: cl.labels.id,
      name: cl.labels.name,
      color: cl.labels.color,
      assignedAt: cl.assigned_at,
      assignedBy: cl.assigned_by
    }));

    return NextResponse.json({ labels });
  } catch (error) {
    console.error('Error in chat labels endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/chats/[chatId]/labels - Apply a label to a chat
export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = (await createClient()) as any;
    const chatId = params.chatId;
    
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
      .select('id') // @ts-ignore
      .eq('chat_id', chatId) // @ts-ignore
      .eq('user_id', session.user.id) // @ts-ignore
      .maybeSingle() as any;
    
    if (participantError || !participant) {
      console.error('Error checking chat access:', participantError);
      return NextResponse.json(
        { error: participantError ? 'Failed to verify chat access' : 'You do not have access to this chat' },
        { status: participantError ? 500 : 403 }
      );
    }
    
    const { labelId } = await request.json();
    
    if (!labelId) {
      return NextResponse.json(
        { error: 'Label ID is required' },
        { status: 400 }
      );
    }
    
    // Apply the label to the chat
    const { data: chatLabel, error: chatLabelError } = await (supabase
      .from('chat_label_assignments')
      .insert({
        chat_id: chatId,
        label_id: labelId,
        assigned_by: session.user.id,
        assigned_at: new Date().toISOString()
      } as any)
      .select(`
        label_id,
        assigned_at,
        assigned_by,
        labels!inner (
          id,
          name,
          color
        )
      `)
      .single() as any);
    
    if (chatLabelError) {
      console.error('Error applying label to chat:', chatLabelError);
      return NextResponse.json(
        { error: 'Failed to apply label to chat' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ chatLabel });
  } catch (error) {
    console.error('Error in chat labels endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 