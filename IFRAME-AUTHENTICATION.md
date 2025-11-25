# Iframe Authentication Fix

## Problem
When embedding the app in an iframe, Supabase authentication fails because modern browsers block third-party cookies by default. This prevents the authentication session from being maintained.

## Solution
The app now automatically detects when it's running inside an iframe and switches from cookie-based authentication to localStorage-based authentication.

## Changes Made

### 1. Updated Supabase Client (`lib/supabase/client.ts`)
- Detects iframe context using `window.self !== window.top`
- Automatically uses localStorage instead of cookies when embedded
- Maintains PKCE flow for security

### 2. Updated Middleware (`lib/supabase/middleware.ts`)
- Excludes `/widget` route from authentication redirects
- Allows the widget to handle authentication independently

### 3. Updated Next.js Config (`next.config.ts`)
- Added comprehensive CORS headers for `/widget` routes
- Allows iframe embedding from any origin
- Enables cross-origin API requests

## How to Embed

### Basic Iframe Embedding
```html
<iframe 
  src="https://your-domain.com/widget" 
  width="100%" 
  height="600px"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

### With Custom Styling
```html
<iframe 
  src="https://your-domain.com/widget" 
  style="width: 100%; height: 100vh; border: none; border-radius: 12px;"
  allow="clipboard-write"
></iframe>
```

## Authentication Flow in Iframe

1. User opens the embedded widget
2. Widget detects it's in an iframe
3. Supabase client automatically uses localStorage
4. User can authenticate normally
5. Session is stored in localStorage (not cookies)
6. Authentication persists across page reloads

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
- Sessions in the iframe are separate from sessions on the main site
- Users need to authenticate separately when using the widget
- localStorage has a 5-10MB limit (more than sufficient for auth tokens)

## Testing

1. Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Testing Embedded Widget</h1>
  <iframe 
    src="http://localhost:3000/widget" 
    width="100%" 
    height="600px"
    frameborder="0"
  ></iframe>
</body>
</html>
```

2. Open the HTML file in a browser
3. Test authentication in the embedded widget
4. Verify session persists after page reload

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
