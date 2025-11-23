import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// GET - Fetch all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all conversations for the user
    const { data: conversations, error } = await supabase
      .from('voltagent_memory_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch conversations' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ conversations }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Conversations API error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// POST - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { title } = await req.json();
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate default title with timestamp if no title provided
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const defaultTitle = `New Chat ${timeString}`;

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('voltagent_memory_conversations')
      .insert({
        id: conversationId,
        resource_id: 'dental-mentor-ai',
        user_id: user.id,
        title: title || defaultTitle,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ conversation }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
