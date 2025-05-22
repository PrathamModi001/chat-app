import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/labels - Get all labels
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

    // Get chatId from query parameters if it exists
    const chatId = request.nextUrl.searchParams.get('chatId');

    if (chatId) {
      // Fetch applied labels for the specific chat
      const { data: appliedLabels, error: appliedError } = await supabase
        .from('chat_label_assignments')
        .select(`
          label_id,
          assigned_at,
          assigned_by,
          labels (
            id,
            name,
            color,
            created_by,
            created_at
          )
        `)
        .eq('chat_id', chatId);

      if (appliedError) {
        console.error('Error fetching applied labels:', appliedError);
        return NextResponse.json(
          { error: 'Failed to fetch applied labels' },
          { status: 500 }
        );
      }

      // Format the response
      const formattedLabels = appliedLabels?.map(assignment => ({
        id: assignment.labels.id,
        name: assignment.labels.name,
        color: assignment.labels.color,
        assignedAt: assignment.assigned_at,
        assignedBy: assignment.assigned_by
      })) || [];

      return NextResponse.json({ labels: formattedLabels });
    } else {
      // Fetch all available labels
      const { data: labels, error: labelsError } = await supabase
        .from('labels')
        .select('*')
        .order('created_at', { ascending: true });

      if (labelsError) {
        console.error('Error fetching labels:', labelsError);
        return NextResponse.json(
          { error: 'Failed to fetch labels' },
          { status: 500 }
        );
      }

      return NextResponse.json({ labels: labels || [] });
    }
  } catch (error) {
    console.error('Error in labels endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/labels - Create a new label
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

    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Label name is required' },
        { status: 400 }
      );
    }

    // Insert new label
    const { data: label, error: labelError } = await supabase
      .from('labels')
      .insert({
        name,
        color,
        created_by: session.user.id
      })
      .select()
      .single();

    if (labelError) {
      console.error('Error creating label:', labelError);
      return NextResponse.json(
        { error: 'Failed to create label' },
        { status: 500 }
      );
    }

    return NextResponse.json({ label });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// PUT /api/labels/assign - Assign labels to a chat
export async function PUT(request: NextRequest) {
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

    const { chatId, labelIds } = await request.json();

    if (!chatId || !labelIds) {
      return NextResponse.json(
        { error: 'Chat ID and label IDs are required' },
        { status: 400 }
      );
    }

    // First, remove all existing label assignments for this chat
    const { error: deleteError } = await supabase
      .from('chat_label_assignments')
      .delete()
      .eq('chat_id', chatId);

    if (deleteError) {
      console.error('Error removing existing labels:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update labels' },
        { status: 500 }
      );
    }

    // Then, insert new label assignments
    if (labelIds.length > 0) {
      const assignments = labelIds.map((labelId: string) => ({
        chat_id: chatId,
        label_id: labelId,
        assigned_by: session.user.id,
        assigned_at: new Date().toISOString()
      }));

      const { error: assignError } = await supabase
        .from('chat_label_assignments')
        .insert(assignments);

      if (assignError) {
        console.error('Error assigning labels:', assignError);
        return NextResponse.json(
          { error: 'Failed to assign labels' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning labels:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 