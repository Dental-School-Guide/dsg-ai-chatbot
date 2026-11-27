'use client'

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type Rating = 'up' | 'down' | null;

/**
 * 👍/👎 under one of Eden's answers. A 👎 opens an optional "what was wrong?" box.
 * Saved to the message's metadata so it shows up in the admin panel.
 */
export function MessageFeedback({
  messageId,
  initialRating = null,
}: {
  messageId: string;
  initialRating?: Rating;
}) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [askComment, setAskComment] = useState(false);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [thanks, setThanks] = useState(false);

  const save = async (next: Rating, note?: string) => {
    const previous = rating;
    setRating(next);
    setSaving(true);
    try {
      const res = await apiFetch(`/api/messages/${encodeURIComponent(messageId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: next, ...(note !== undefined ? { comment: note } : {}) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.error('[Feedback] Could not save:', err);
      setRating(previous);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const click = async (value: 'up' | 'down') => {
    if (saving) return;
    const next = rating === value ? null : value; // tap again to undo
    const ok = await save(next);
    if (!ok) return;
    setThanks(false);
    setAskComment(next === 'down');
    if (next === 'up') setThanks(true);
  };

  const sendComment = async () => {
    const ok = await save('down', comment);
    if (ok) {
      setAskComment(false);
      setThanks(true);
    }
  };

  const button = (value: 'up' | 'down', label: string, emoji: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={rating === value}
      title={label}
      disabled={saving}
      onClick={() => click(value)}
      className={cn(
        'rounded-md px-2 py-1 text-sm transition-opacity',
        rating === value ? 'opacity-100 bg-white/10' : 'opacity-50 hover:opacity-100'
      )}
    >
      {emoji}
    </button>
  );

  return (
    <div className="mt-1 flex flex-col gap-2 text-xs text-[--text-dim]">
      <div className="flex items-center gap-1">
        {button('up', 'Helpful', '👍')}
        {button('down', 'Not helpful', '👎')}
        {thanks && !askComment && <span className="ml-1">Thanks for the feedback!</span>}
      </div>
      {askComment && (
        <div className="flex max-w-md gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            placeholder="What was wrong or missing? (optional)"
            maxLength={1000}
            className="flex-1 rounded-md border border-[--dsg-edge] bg-transparent px-2 py-1 text-xs text-[--text] placeholder:text-[--text-dim]"
          />
          <button
            type="button"
            onClick={sendComment}
            disabled={saving}
            className="rounded-md border border-[--dsg-edge] px-2 py-1 hover:bg-white/10"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
