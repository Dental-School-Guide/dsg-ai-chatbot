import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * POST /api/messages/:id/feedback  { rating: 'up' | 'down' | null, comment?: string }
 * Saves a student's 👍/👎 on one of Eden's answers into that message's metadata.
 * Students can only rate messages in their own conversations.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Same auth as the other routes: bearer token inside the iframe, cookies otherwise
    const authHeader = req.headers.get('authorization');
    let supabase;
    let userId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
      userId = data.user.id;
    } else {
      supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
      userId = data.user.id;
    }

    const { id: messageId } = await params;
    const body = await req.json().catch(() => ({}));
    const rating = body?.rating;
    if (rating !== 'up' && rating !== 'down' && rating !== null) {
      return json({ error: "rating must be 'up', 'down' or null" }, 400);
    }
    const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 1000) : undefined;

    const { data: message, error: fetchError } = await supabase
      .from('voltagent_memory_messages')
      .select('metadata')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .maybeSingle();

    if (fetchError) return json({ error: 'Could not load message' }, 500);
    if (!message) return json({ error: 'Message not found' }, 404);

    const metadata = { ...(message.metadata || {}) } as Record<string, unknown>;
    if (rating === null) {
      delete metadata.feedback;
      delete metadata.feedback_comment;
      delete metadata.feedback_at;
    } else {
      metadata.feedback = rating;
      metadata.feedback_at = new Date().toISOString();
      if (comment !== undefined) metadata.feedback_comment = comment;
      else if (rating === 'up') delete metadata.feedback_comment;
    }

    const { error: updateError } = await supabase
      .from('voltagent_memory_messages')
      .update({ metadata })
      .eq('message_id', messageId)
      .eq('user_id', userId);

    if (updateError) return json({ error: 'Could not save feedback' }, 500);
    return json({ ok: true, rating });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return json({ error: 'An error occurred' }, 500);
  }
}
