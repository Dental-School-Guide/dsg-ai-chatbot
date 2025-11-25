# Critical Iframe Fixes

## Issues Fixed

### 1. ✅ Middleware Blocking API Routes
**Problem:** Middleware was checking auth for API routes, causing redirects to /login
**Fix:** Skip auth checks for `/api/*` routes - they handle their own authentication

### 2. ✅ Multiple Supabase Client Instances
**Problem:** Every `createClient()` call created a new instance with new auth listeners
**Result:** Multiple "Auth state changed" logs, potential memory leaks
**Fix:** Singleton pattern - reuse the same client instance

### 3. ✅ Better Error Logging
**Problem:** Hard to debug what's failing
**Fix:** Added detailed logging in API client and sidebar

## Files Changed

1. **`lib/supabase/middleware.ts`**
   - Skip auth checks for API routes
   - API routes handle their own auth with Bearer tokens

2. **`lib/supabase/client.ts`**
   - Singleton pattern for Supabase clients
   - Prevents duplicate instances and listeners
   - Only logs auth changes once

3. **`lib/api-client.ts`**
   - Better error logging
   - Shows when session is missing
   - Logs failed requests with details

4. **`components/sidebar.tsx`**
   - 500ms delay for iframe to establish session
   - Better error logging for failed requests

## Expected Behavior After Deploy

### Console Output (Success):
```
[Supabase] Running in iframe context - using localStorage
[Login] User authenticated: your@email.com
[Supabase] Auth state changed: SIGNED_IN your@email.com
[AuthGuard] Session found: your@email.com
[API Client] Adding auth token to request: /api/conversations
[API Client] Adding auth token to request: /api/chat
```

### What Should Work:
- ✅ Login in iframe
- ✅ Fetch conversations list
- ✅ Send messages
- ✅ Load chat history
- ✅ Create/delete/rename conversations
- ✅ Auto-generate titles
- ✅ All features functional

## Deploy Commands

```bash
git add .
git commit -m "Fix middleware blocking API routes and prevent duplicate Supabase clients"
git push
```

## If Still Broken

Check console for these specific errors:

1. **"No session found for iframe request"**
   - Session not persisting to localStorage
   - Try clearing localStorage and login again

2. **"Request failed: 401"**
   - Auth token not being sent
   - Check if `[API Client] Adding auth token` appears

3. **"Request failed: 404/405"**
   - API route doesn't exist or wrong method
   - Check the exact URL being called

4. **Still getting HTML instead of JSON**
   - Middleware still redirecting
   - Check if API route path is correct
