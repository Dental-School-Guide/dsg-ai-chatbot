# Final Iframe Authentication Fix

## The Root Problem

When you embed the app in an iframe and use localStorage for authentication:
1. ✅ Client-side login works (saves to localStorage)
2. ❌ Server-side middleware can't see localStorage
3. ❌ Middleware thinks you're not authenticated
4. ❌ Redirects you back to login (infinite loop)

## The Solution

### 1. Skip Server-Side Auth for Iframes (`lib/supabase/middleware.ts`)
- Detects iframe requests using `sec-fetch-dest` header
- Skips authentication checks for iframe requests
- Lets client-side handle authentication

### 2. Add Client-Side Auth Guard (`components/auth-guard.tsx`)
- New component that checks authentication on the client
- Only runs in iframe context
- Redirects to login if no session found
- Protects pages that need authentication

### 3. Use Auth Guard on Protected Pages (`app/page.tsx`)
- Wraps home page with `<AuthGuard>`
- Ensures user is authenticated before showing content
- Works seamlessly in both iframe and normal contexts

## How It Works Now

### In Iframe Context:
```
1. User visits iframe → Server middleware skips auth check
2. Page loads → AuthGuard checks localStorage
3. No session? → Redirect to /login
4. User logs in → Session saved to localStorage
5. Redirect to / → AuthGuard finds session
6. ✅ App loads successfully
```

### In Normal Context:
```
1. User visits site → Server middleware checks cookies
2. No session? → Redirect to /login
3. User logs in → Session saved to cookies
4. ✅ App loads successfully
```

## Files Changed

1. ✅ `lib/supabase/client.ts` - Uses localStorage in iframe
2. ✅ `lib/supabase/middleware.ts` - Skips auth for iframes
3. ✅ `components/auth-guard.tsx` - Client-side auth protection
4. ✅ `app/page.tsx` - Wrapped with AuthGuard
5. ✅ `app/login/page.tsx` - Uses window.location.href for redirect

## Deploy and Test

### 1. Commit Changes
```bash
git add .
git commit -m "Fix iframe auth with client-side guard"
git push
```

### 2. After Deployment
Open `test-iframe.html` and check console:
```
[Supabase] Running in iframe context - using localStorage
[Login] User authenticated: your@email.com
[Supabase] Auth state changed: SIGNED_IN your@email.com
[AuthGuard] Session found: your@email.com
```

### 3. Expected Behavior
- ✅ Login page loads in iframe
- ✅ Enter credentials and click "Sign in"
- ✅ Brief "Signing in..." state
- ✅ Redirects to home page
- ✅ Chat interface loads
- ✅ Can send messages
- ✅ Session persists on refresh

## Why This Works

### The Problem Before:
```
Client: "I'm logged in! (localStorage has token)"
Server: "I don't see any cookies, redirect to login"
Client: "But I just logged in!"
Server: "Still no cookies, redirect to login"
→ Infinite loop
```

### The Solution Now:
```
Client: "I'm in an iframe, using localStorage"
Server: "Iframe detected, skipping auth check, proceed"
Client: "Let me check localStorage... yes, logged in!"
→ Success!
```

## Testing Checklist

- [ ] Open test-iframe.html
- [ ] See localStorage detection message in console
- [ ] Click login
- [ ] Enter credentials
- [ ] See "User authenticated" message
- [ ] See "Auth state changed: SIGNED_IN" message
- [ ] See "Session found" message
- [ ] Page redirects to home
- [ ] Chat interface loads
- [ ] Can send messages
- [ ] Refresh page - still logged in

## Troubleshooting

### Still Stuck on "Signing in..."
- Check console for errors
- Look for "Session found" message
- If missing, localStorage might not be saving

### Redirects Back to Login
- Check for "AuthGuard" messages in console
- Verify localStorage has `supabase.auth.token`
- Try clearing localStorage and login again

### Console Errors
- Share the full error message
- Check Network tab for failed requests
- Verify Supabase URL/keys are correct
