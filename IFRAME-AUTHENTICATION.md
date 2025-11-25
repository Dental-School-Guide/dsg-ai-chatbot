# Iframe Authentication Fix

## Problem
When embedding the app in an iframe, Supabase authentication fails because modern browsers block third-party cookies by default. This prevents the authentication session from being maintained.

## Solution
The **entire app** (https://dsg-ai-chatbot.vercel.app/) now automatically detects when it's running inside an iframe and switches from cookie-based authentication to localStorage-based authentication. This means you can embed the main app directly without needing a separate widget route.

## Changes Made

### 1. Updated Supabase Client (`lib/supabase/client.ts`)
- Detects iframe context using `window.self !== window.top`
- Automatically uses localStorage instead of cookies when embedded
- Maintains PKCE flow for security

### 2. Updated Middleware (`lib/supabase/middleware.ts`)
- Redirects unauthenticated widget users to `/widget/login` instead of `/login`
- Maintains separate authentication flows for widget and main app

### 3. Created Widget Login Page (`app/widget/login/page.tsx`)
- Dedicated login page for widget that redirects back to `/widget` after authentication
- Styled to match the widget theme
- Handles authentication within iframe context

### 4. Updated Next.js Config (`next.config.ts`)
- Added comprehensive CORS headers for **all routes** (`/:path*`)
- Allows iframe embedding from any origin for the entire app
- Enables cross-origin API requests

## How to Embed

### Basic Iframe Embedding
```html
<iframe 
  src="https://dsg-ai-chatbot.vercel.app/" 
  width="100%" 
  height="600px"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

### With Custom Styling
```html
<iframe 
  src="https://dsg-ai-chatbot.vercel.app/" 
  style="width: 100%; height: 100vh; border: none; border-radius: 12px;"
  allow="clipboard-write"
></iframe>
```

### Test File
A test HTML file (`test-iframe.html`) is included in the project root. Open it in your browser to test the iframe embedding locally.

## Authentication Flow in Iframe

1. User opens the embedded app (https://dsg-ai-chatbot.vercel.app/)
2. App detects it's in an iframe
3. Supabase client automatically uses localStorage instead of cookies
4. If not authenticated, user is redirected to `/login` (still in iframe)
5. User enters credentials and logs in
6. After successful login, redirects back to home page
7. Session is stored in localStorage (not cookies)
8. Authentication persists across page reloads
9. All chat history and user data works normally

## Important Notes

### Security Considerations
- localStorage is scoped to the origin, so sessions are isolated per domain
- PKCE flow is maintained for secure authentication
- The widget route is publicly accessible but still requires authentication to use features

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Safari's "Prevent cross-site tracking" setting doesn't affect localStorage
- No additional user configuration needed

### Limitations
- Sessions in the iframe are separate from sessions on the main site (if opened in both contexts)
- Users need to authenticate separately when using the embedded version
- localStorage has a 5-10MB limit (more than sufficient for auth tokens)

## Testing

### Local Testing
1. Open `test-iframe.html` in your browser
2. The app will load in an iframe
3. Test authentication in the embedded app
4. Verify session persists after page reload

### Production Testing
Embed the production URL in any website:
```html
<iframe 
  src="https://dsg-ai-chatbot.vercel.app/" 
  width="100%" 
  height="600px"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

## Troubleshooting

### Authentication Still Not Working
- Clear browser cache and localStorage
- Check browser console for errors
- Verify CORS headers are being sent
- Ensure Supabase URL and keys are correct

### Session Not Persisting
- Check if localStorage is enabled in the browser
- Verify the domain hasn't changed (localStorage is domain-specific)
- Check browser's privacy settings

### CORS Errors
- Verify Next.js config headers are applied
- Restart the development server after config changes
- Check network tab for actual headers being sent
