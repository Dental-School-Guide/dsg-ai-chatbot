'use client'

import { useEffect, useRef, useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type Rating = 'up' | 'down' | null;

const BAD_REASONS = [
  'Not factually correct',
  "Didn't answer my question",
  'Missing information',
  'Outdated information',
  'Too long or confusing',
  'Other',
];

const iconButton =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[--text-dim] transition-colors hover:bg-white/10 hover:text-[--text] disabled:opacity-50';

/**
 * Action bar under one of Eden's answers, modelled on ChatGPT:
 * a feedback button that opens "Good response / Bad response".
 * "Bad response" asks what went wrong (quick reasons + optional note).
 * Ratings are saved to the message's metadata and shown in the admin panel.
 */
export function MessageFeedback({
  messageId,
  initialRating = null,
}: {
  messageId: string;
  initialRating?: Rating;
}) {
  const [rating, setRating] = useState<Rating>(initialRating);
  const [menuOpen, setMenuOpen] = useState(false);
  const [badOpen, setBadOpen] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicking anywhere else
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const save = async (next: Rating, extra?: { reasons?: string[]; comment?: string }) => {
    const previous = rating;
    setRating(next);
    setSaving(true);
    try {
      const res = await apiFetch(`/api/messages/${encodeURIComponent(messageId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: next, ...extra }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch (err) {
      console.error('[Feedback] Could not save:', err);
      setRating(previous);
      toast.error("Couldn't save your feedback. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const chooseGood = async () => {
    setMenuOpen(false);
    setBadOpen(false);
    if (await save('up')) toast.success('Thanks for your feedback!');
  };

  const chooseBad = () => {
    setMenuOpen(false);
    setBadOpen(true);
  };

  const removeFeedback = async () => {
    setMenuOpen(false);
    setBadOpen(false);
    await save(null);
  };

  const submitBad = async () => {
    const ok = await save('down', { reasons, comment: comment.trim() });
    if (ok) {
      setBadOpen(false);
      toast.success('Thanks, this helps us improve Eden.');
    }
  };

  const toggleReason = (reason: string) =>
    setReasons((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));

  return (
    <div className="mt-1">
      <div className="flex items-center gap-0.5">
        {/* Feedback button + menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={cn(iconButton, menuOpen && 'bg-white/10 text-[--text]')}
            aria-label="Give feedback"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Give feedback"
            disabled={saving}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {rating === 'up' ? (
              <ThumbsUp className="h-4 w-4" fill="currentColor" />
            ) : rating === 'down' ? (
              <ThumbsDown className="h-4 w-4" fill="currentColor" />
            ) : (
              // Combined up/down glyph, like ChatGPT's feedback button
              <span className="relative block h-4 w-4">
                <ThumbsUp className="absolute -left-0.5 -top-0.5 h-3 w-3" />
                <ThumbsDown className="absolute -bottom-0.5 -right-0.5 h-3 w-3" />
              </span>
            )}
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-9 z-20 min-w-[190px] rounded-xl border border-[--dsg-edge] bg-[--dsg-panel] p-1.5 shadow-xl"
            >
              <button
                role="menuitem"
                type="button"
                onClick={chooseGood}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[--text] hover:bg-white/10',
                  rating === 'up' && 'bg-white/5'
                )}
              >
                <ThumbsUp className="h-4 w-4" fill={rating === 'up' ? 'currentColor' : 'none'} />
                Good response
              </button>
              <button
                role="menuitem"
                type="button"
                onClick={chooseBad}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[--text] hover:bg-white/10',
                  rating === 'down' && 'bg-white/5'
                )}
              >
                <ThumbsDown className="h-4 w-4" fill={rating === 'down' ? 'currentColor' : 'none'} />
                Bad response
              </button>
              {rating && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={removeFeedback}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-[--text-dim] hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                  Remove feedback
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* "Bad response" details */}
      {badOpen && (
        <div className="mt-2 max-w-xl rounded-xl border border-[--dsg-edge] bg-[--dsg-panel] p-4 text-left">
          <div className="mb-3 flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-[--text]">What went wrong?</p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setBadOpen(false)}
              className="text-[--text-dim] hover:text-[--text]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {BAD_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => toggleReason(reason)}
                aria-pressed={reasons.includes(reason)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  reasons.includes(reason)
                    ? 'border-[--dsg-gold] bg-white/10 text-[--text]'
                    : 'border-[--dsg-edge] text-[--text-dim] hover:text-[--text]'
                )}
              >
                {reason}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more (optional)"
            maxLength={1000}
            rows={2}
            className="mb-3 w-full resize-none rounded-lg border border-[--dsg-edge] bg-transparent px-3 py-2 text-sm text-[--text] placeholder:text-[--text-dim]"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submitBad}
              disabled={saving}
              className="rounded-lg bg-[--dsg-gold] px-4 py-1.5 text-sm font-medium text-black disabled:opacity-50"
            >
              {saving ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
