/**
 * Central list of the Gemini models this app uses.
 *
 * Each can be overridden in Vercel (Project → Settings → Environment Variables)
 * without touching code. When Google retires a model, set the variable to the
 * replacement and redeploy.
 *
 * Retirement schedule: https://ai.google.dev/gemini-api/docs/deprecations
 */
export const MODELS = {
  // Main chat + interview drill, school info, volunteer agents
  chat: process.env.GEMINI_CHAT_MODEL || 'gemini-3.5-flash',
  // Essay feedback agent
  essay: process.env.GEMINI_ESSAY_MODEL || 'gemini-2.5-flash',
  // Short auto-generated conversation titles
  title: process.env.GEMINI_TITLE_MODEL || 'gemini-3.5-flash',
  // Knowledge-base search. Changing this requires re-embedding stored documents,
  // because vectors from different embedding models are not comparable.
  embedding: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
} as const;
