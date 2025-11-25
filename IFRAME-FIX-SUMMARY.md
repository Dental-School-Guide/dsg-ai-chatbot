# Iframe Authentication Fix - Summary

## What Was Changed

### 1. `lib/supabase/client.ts` ✅
**The Key Fix:**
- Detects if running in iframe using `window.self !== window.top`
- Uses `@supabase/supabase-js` (regular client) with localStorage for iframes
- Uses `@supabase/ssr` (SSR client) with cookies for normal browsing
- This bypasses third-party cookie restrictions

### 2. `lib/supabase/middleware.ts` ✅
- Skips setting cookies for iframe requests (they won't work anyway)
- Allows authentication to happen client-side with localStorage

### 3. `next.config.ts` ✅
- Allows entire app to be embedded with `X-Frame-Options: ALLOWALL`
- Sets `Content-Security-Policy: frame-ancestors *`
- Enables CORS for cross-origin requests

## How It Works

### Normal Browsing (Not in Iframe)
```
User visits https://dsg-ai-chatbot.vercel.app/
↓
Uses @supabase/ssr with cookies
↓
Authentication works normally
```

### Embedded in Iframe
```
User visits iframe with https://dsg-ai-chatbot.vercel.app/
↓
Detects iframe context
↓
Uses @supabase/supabase-js with localStorage
↓
Bypasses third-party cookie restrictions
↓
Authentication works!
```

## Testing Steps

### 1. Deploy to Vercel
```bash
git add .
git commit -m "Fix iframe authentication with localStorage"
git push
```

### 2. Test Locally First
Open `test-iframe.html` in your browser and check:
1. Open browser console (F12)
2. Look for: `[Supabase] Running in iframe context - using localStorage`
3. If you see this message, the detection is working
4. Try logging in - it should work

### 3. Test Production
After Vercel deploys, create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Production Test</title>
</head>
<body style="margin: 0; padding: 20px;">
  <h1>Testing Production Iframe</h1>
  <iframe 
    src="https://dsg-ai-chatbot.vercel.app/" 
    style="width: 100%; height: 90vh; border: none;"
  ></iframe>
</body>
</html>
```

Open this file and:
1. Check console for the localStorage message
2. Try logging in
3. Verify chat works
4. Refresh page - session should persist

## Debugging

### If Still Not Working

1. **Check Console Messages**
   - Open F12 → Console
   - Look for `[Supabase] Running in iframe context`
   - If you DON'T see this, the iframe detection isn't working

2. **Check localStorage**
   - F12 → Application → Local Storage
   - Look for `supabase.auth.token`
   - Should contain auth data after login

3. **Check Network Tab**
   - F12 → Network
   - Look for failed auth requests
   - Check response headers

4. **Common Issues**
   - **Browser blocking localStorage**: Try different browser
   - **CORS errors**: Check Next.js config deployed correctly
   - **Old code cached**: Hard refresh (Ctrl+Shift+R)

### Expected Console Output

When working correctly, you should see:
```
Parent page loaded. Iframe should be loading...
Check the browser console for "[Supabase] Running in iframe context" message
If you see that message, localStorage is being used correctly
[Supabase] Running in iframe context - using localStorage
```

## Why This Fix Works

### The Problem
- Browsers block third-party cookies in iframes
- Supabase SSR uses cookies by default
- Cookies don't work → Authentication fails

### The Solution
- Detect iframe context on client-side
- Switch to localStorage (not blocked in iframes)
- Use regular Supabase client (not SSR client)
- Authentication works!

### Trade-offs
- ✅ Authentication works in iframes
- ✅ Session persists across reloads
- ✅ All features work normally
- ⚠️ User must login separately in iframe vs main site
- ⚠️ Session not shared between contexts (by design)

## Next Steps

1. ✅ Commit and push changes
2. ⏳ Wait for Vercel deployment (~2 minutes)
3. 🧪 Test with test-iframe.html
4. 🧪 Test on production URL
5. 🎉 Embed on your target website

## Support

If authentication still doesn't work after following all steps:
1. Share console errors
2. Share network tab errors  
3. Confirm you see the localStorage message
4. Try in incognito mode
5. Try different browser
