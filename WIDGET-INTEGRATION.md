# Dental Mentor AI - Embeddable Widget Integration Guide

This guide explains how to integrate the Dental Mentor AI chatbot as an embedded widget on your Squarespace website.

## Overview

The widget loads directly on your page (perfect for tabs or dedicated sections) where visitors can interact with the Dental Mentor AI immediately.

## Features

- 🎨 Customizable width and height
- 📱 Fully responsive (mobile-friendly)
- 🔒 Secure iframe-based integration
- ⚡ Lightweight and fast loading
- 🎯 Easy to install with just a few lines of code
- 📍 Loads directly in page (no popup button)

## Installation Steps

### Step 1: Deploy Your Application

First, deploy your Next.js application to a hosting platform (Vercel, Netlify, etc.). You'll need the production URL.

Example: `https://your-dental-mentor-app.vercel.app`

### Step 2: Add Container to Your Page

In Squarespace, add a **Code Block** to the page where you want the chatbot to appear:

1. **Edit the page** where you want the widget
2. **Add a Code Block** (click + → More → Code)
3. **Add this HTML:**

```html
<div id="dental-mentor-widget" style="width: 100%; height: 800px;"></div>
```

### Step 3: Add Script to Footer

1. **Go to Settings → Advanced → Code Injection**
2. **Add the following code to the FOOTER section:**

```html
<!-- Dental Mentor AI Widget Configuration -->
<script>
  window.DentalMentorConfig = {
    baseUrl: 'https://your-dental-mentor-app.vercel.app', // Replace with your deployed URL
    containerId: 'dental-mentor-widget', // Must match the div id above
    width: '100%',
    height: '800px'
  };
</script>
<script src="https://your-dental-mentor-app.vercel.app/embed.js"></script>
```

3. **Click Save**

### Step 4: Test the Widget

Visit your Squarespace page and the chatbot should load directly in the container you created.

## Configuration Options

### `baseUrl` (Required)
The URL where your Dental Mentor AI app is deployed.

**Example:** `'https://your-app.vercel.app'`

### `containerId` (Required)
The ID of the HTML element where the widget will be embedded.

**Default:** `'dental-mentor-widget'`

**Example:** `'my-chatbot-container'`

### `width` (Optional)
Width of the widget container.

**Default:** `'100%'`

**Example:** `'800px'` or `'90vw'`

### `height` (Optional)
Height of the widget container.

**Default:** `'800px'`

**Example:** `'600px'` or `'100vh'`

## Advanced Customization

### Custom Container Styles

You can add custom CSS to style the widget container:

```html
<style>
  #dental-mentor-widget {
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
</style>
```

### Multiple Widgets on Same Page

You can embed multiple instances with different container IDs:

```html
<!-- First widget -->
<div id="dental-mentor-widget-1" style="width: 100%; height: 600px;"></div>

<!-- Second widget -->
<div id="dental-mentor-widget-2" style="width: 100%; height: 600px;"></div>

<script>
  // Initialize first widget
  window.DentalMentorConfig = {
    baseUrl: 'https://your-app.vercel.app',
    containerId: 'dental-mentor-widget-1'
  };
</script>
<script src="https://your-app.vercel.app/embed.js"></script>
```

### Full-Height Widget

For a full-height widget that fills the viewport:

```html
<div id="dental-mentor-widget" style="width: 100%; height: 100vh;"></div>
```

## Mobile Responsiveness

The widget is fully responsive and adapts to all screen sizes automatically.

## Troubleshooting

### Widget Not Appearing

1. **Check the container ID** - Make sure the `containerId` in config matches your div's `id` exactly
2. **Check the baseUrl** - Make sure it matches your deployed application URL exactly
3. **Clear browser cache** - Hard refresh with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
4. **Check browser console** - Press F12 and look for any error messages (should show if container not found)
5. **Verify deployment** - Visit `/widget` on your deployed URL to ensure it loads

### Chat Not Working

1. **Check authentication** - Ensure your Supabase credentials are properly configured in production
2. **Check API endpoints** - Verify all API routes are accessible in production
3. **Check CORS settings** - The widget page should allow iframe embedding

### Styling Issues

1. **CSS conflicts** - Your Squarespace theme might have conflicting styles
2. **Container size** - Make sure the container div has explicit width and height set
3. **Add custom CSS** - Use the Code Injection to add custom styles if needed

## Security Considerations

- The widget uses iframe isolation for security
- All communication happens through secure HTTPS
- User authentication is handled by your existing Supabase setup
- No sensitive data is exposed to the parent page

## Testing Locally

Before deploying, you can test the widget locally:

1. Start your development server: `npm run dev`
2. Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Test Page</h1>
  
  <div id="dental-mentor-widget" style="width: 100%; height: 800px;"></div>
  
  <script>
    window.DentalMentorConfig = {
      baseUrl: 'http://localhost:3000',
      containerId: 'dental-mentor-widget'
    };
  </script>
  <script src="http://localhost:3000/embed.js"></script>
</body>
</html>
```

3. Open this HTML file in your browser

## Support

If you encounter any issues:

1. Check the browser console for errors (F12)
2. Verify your configuration settings
3. Test the `/widget` URL directly in your browser
4. Ensure your deployment is successful and accessible

## Example: Complete Integration

Here's a complete example for a Squarespace page:

**Step 1: Add Code Block to your page:**
```html
<div id="dental-mentor-widget" style="width: 100%; height: 800px; border-radius: 12px; overflow: hidden;"></div>
```

**Step 2: Add to Footer Code Injection:**
```html
<script>
  window.DentalMentorConfig = {
    baseUrl: 'https://dental-mentor-ai.vercel.app',
    containerId: 'dental-mentor-widget',
    width: '100%',
    height: '800px'
  };
</script>
<script src="https://dental-mentor-ai.vercel.app/embed.js"></script>
```

**Optional: Add custom styling:**
```html
<style>
  #dental-mentor-widget {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }
</style>
```

## Next Steps

1. ✅ Deploy your application to production (Vercel recommended)
2. ✅ Get your production URL
3. ✅ Add the container div to your Squarespace page
4. ✅ Add the embed script to Footer Code Injection
5. ✅ Customize the size and styling to match your brand
6. ✅ Test on both desktop and mobile devices
7. ✅ Monitor usage and gather feedback

---

**Note:** Remember to replace `https://your-dental-mentor-app.vercel.app` with your actual deployed application URL in all examples above.
