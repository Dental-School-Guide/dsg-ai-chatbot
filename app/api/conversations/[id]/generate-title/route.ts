import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    let user;
    let supabase;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (tokenError || !tokenUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      user = tokenUser;
    } else {
      supabase = await createClient();
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !cookieUser) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      user = cookieUser;
    }

    const { id } = await params;
    const conversationId = id;

    // Fetch only user messages from conversation
    const { data: messages, error: msgError } = await supabase
      .from('voltagent_memory_messages')
      .select('role, parts')
      .eq('conversation_id', conversationId)
      .eq('role', 'user')
      .order('created_at', { ascending: true })
      .limit(3); // Get first 3 user messages

    if (msgError || !messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Not enough messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Extract user message content
    const userMessages = messages.map((msg: any) => {
      const content = msg.parts?.[0]?.text || msg.parts?.[0]?.content || '';
      return content;
    }).join('\n');

    // Generate title using Google AI
    const { text: generatedTitle } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: `Based on these user messages, generate a short chat title with NO MORE THAN 6 WORDS. Only return the title, nothing else.

User messages:
${userMessages}

Title (max 6 words):`,
    });

    const title = generatedTitle.trim().replace(/^["']|["']$/g, ''); // Remove quotes if any

    // Update conversation title
    const { data: conversation, error: updateError } = await supabase
      .from('voltagent_memory_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation title:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update title' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating title:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
