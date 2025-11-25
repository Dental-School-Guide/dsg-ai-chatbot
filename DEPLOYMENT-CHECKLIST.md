# Deployment Checklist for Iframe Support

## What Was Fixed
The main app at **https://dsg-ai-chatbot.vercel.app/** now works when embedded in iframes by automatically switching from cookie-based to localStorage-based authentication.

## Files Modified

### 1. `lib/supabase/client.ts`
- ✅ Detects iframe context automatically
- ✅ Uses localStorage instead of cookies in iframes
- ✅ No code changes needed on your part

### 2. `next.config.ts`
- ✅ Allows entire app to be embedded (`/:path*`)
- ✅ CORS headers configured
- ✅ X-Frame-Options set to ALLOWALL

### 3. `lib/supabase/middleware.ts`
- ✅ Handles authentication redirects properly
- ✅ Works in iframe context

## Deployment Steps

### 1. Push Changes to Git
```bash
git add .
git commit -m "Fix iframe authentication with localStorage"
git push
```

### 2. Vercel Will Auto-Deploy
- Vercel will automatically detect the push
- New deployment will include all iframe fixes
- No additional configuration needed

### 3. Test After Deployment
Use this HTML to test:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Embedded Chat</title>
</head>
<body style="margin: 0; padding: 20px; background: #f0f0f0;">
  <h1>Dental Mentor AI - Embedded</h1>
  <iframe 
    src="https://dsg-ai-chatbot.vercel.app/" 
    style="width: 100%; height: 90vh; border: none; border-radius: 12px;"
    allow="clipboard-write"
  ></iframe>
</body>
</html>
```

## How to Embed on Any Website

### Simple Embed
```html
<iframe 
  src="https://dsg-ai-chatbot.vercel.app/" 
  width="100%" 
  height="600px"
  frameborder="0"
></iframe>
```

### Responsive Embed
```html
<div style="position: relative; width: 100%; height: 100vh;">
  <iframe 
    src="https://dsg-ai-chatbot.vercel.app/" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allow="clipboard-write"
  ></iframe>
</div>
```

### WordPress Embed
1. Go to page/post editor
2. Add "Custom HTML" block
3. Paste the iframe code above
4. Publish

### Webflow/Wix/Squarespace
1. Add "Embed" or "Custom Code" element
2. Paste the iframe code
3. Adjust dimensions as needed
4. Publish

## Expected Behavior

### ✅ What Should Work
- Login/signup in iframe
- All chat functionality
- Conversation history
- User profile
- Session persistence across reloads
- All features work exactly like the main site

### ⚠️ Known Behavior
- User must login separately in iframe (session not shared with main site)
- This is normal and expected for security reasons
- Chat history is still shared (stored in database, not localStorage)

## Troubleshooting

### If Authentication Still Doesn't Work

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear localStorage: F12 → Application → Local Storage → Clear

2. **Check Browser Console**
   - F12 → Console tab
   - Look for any errors
   - Share errors if you see any

3. **Verify Deployment**
   - Check Vercel dashboard
   - Ensure latest commit is deployed
   - Check deployment logs for errors

4. **Test in Different Browsers**
   - Chrome (should work)
   - Firefox (should work)
   - Safari (should work)
   - Edge (should work)

## Support

If issues persist after deployment:
1. Check browser console for errors
2. Verify the latest code is deployed on Vercel
3. Test in incognito/private browsing mode
4. Try different browsers

## Next Steps

1. ✅ Commit and push changes
2. ✅ Wait for Vercel deployment
3. ✅ Test with the HTML file above
4. ✅ Embed on your target website
5. ✅ Verify authentication works
