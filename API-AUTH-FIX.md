# API Authentication Fix for Iframe

## The Problem
After fixing client-side authentication with localStorage, API calls were failing with 401 Unauthorized because:
- API routes checked for cookies (server-side)
- Iframe uses localStorage (client-side)
- Server can't see localStorage → API thinks user is not authenticated

## The Solution

### 1. API Routes Accept Authorization Header
Updated all API routes to accept both:
- **Cookies** (normal context)
- **Bearer token** (iframe context with localStorage)

Files updated:
- `app/api/chat/route.ts`
- `app/api/conversations/route.ts`

### 2. Created API Client Helper
New file: `lib/api-client.ts`
- Automatically detects iframe context
- Gets access token from Supabase session
- Adds `Authorization: Bearer {token}` header to requests

### 3. Updated All fetch() Calls
Replaced `fetch()` with `apiFetch()` in:
- `components/chat/chat-interface.tsx`
- `components/sidebar.tsx`

## How It Works

### Normal Context (Cookies):
```
Client → API Route → Checks cookies → User authenticated ✅
```

### Iframe Context (localStorage):
```
Client → apiFetch() → Gets token from localStorage
       → Adds Authorization header
       → API Route → Checks Bearer token → User authenticated ✅
```

## Files Changed

1. ✅ `lib/api-client.ts` - New helper for authenticated API calls
2. ✅ `app/api/chat/route.ts` - Accept Authorization header
3. ✅ `app/api/conversations/route.ts` - Accept Authorization header
4. ✅ `components/chat/chat-interface.tsx` - Use apiFetch
5. ✅ `components/sidebar.tsx` - Use apiFetch

## Deploy and Test

```bash
git add .
git commit -m "Fix API authentication for iframe with Bearer tokens"
git push
```

After deployment:
1. Open iframe
2. Login
3. Send a message
4. Check console - should see: `[API Client] Adding auth token to request`
5. Message should send successfully
6. Chat history should load

## Expected Console Output

```
[Supabase] Running in iframe context - using localStorage
[Login] User authenticated: your@email.com
[AuthGuard] Session found: your@email.com
[API Client] Adding auth token to request: /api/chat
[API Client] Adding auth token to request: /api/conversations
```

## What Should Work Now

- ✅ Login in iframe
- ✅ Send messages
- ✅ Receive AI responses
- ✅ Load chat history
- ✅ Create new conversations
- ✅ Delete conversations
- ✅ Rename conversations
- ✅ Auto-generate titles
- ✅ All features work in iframe!
