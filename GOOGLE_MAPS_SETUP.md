# Google Maps API Setup Guide

## Issue: Google Maps JavaScript API Warning

You're seeing this warning in the console:
```
Google Maps JavaScript API warning: NoApiKeys https://developers.google.com/maps/documentation/javascript/error-messages#no-api-keys
```

## Issue: Google Maps JavaScript API Error

You're also seeing this error:
```
Google Maps JavaScript API error: ApiProjectMapError
```

This error occurs when:
- The API key is configured but the project doesn't have billing enabled
- The project doesn't have the required APIs enabled
- The API key has restrictions that prevent it from working

## Solution: Set Up Google Maps API Key

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Enable Billing** (Required for Google Maps API)
4. Enable the following APIs:
   - Maps JavaScript API
   - Places API
5. Go to "Credentials" and create an API key
6. Copy the API key

### Step 2: Configure API Key Restrictions (Recommended)

1. In the Google Cloud Console, go to "Credentials"
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers (web sites)"
4. Add your domain: `localhost:5173/*` for development
5. Under "API restrictions", select "Restrict key"
6. Select "Maps JavaScript API" and "Places API"

### Step 3: Create Environment File

Create a `.env` file in the root directory of your project:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Step 4: Restart Development Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

### Step 5: Verify Setup

1. Check the browser console - the warnings should be gone
2. The Locations page should load Google Maps properly
3. You should see "Google Maps loaded" in the console

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- For production, set the environment variable on your hosting platform

## Alternative: Disable Google Maps Temporarily

If you don't need Google Maps functionality right now, you can temporarily disable it by commenting out the LoadScript in `src/main.jsx`:

```jsx
// Comment out the LoadScript wrapper
{/* import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
  <LoadScript
    googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
    libraries={["places"]}
    onLoad={() => console.log("Google Maps loaded")}
    onError={(e) => console.error("Maps load error", e)}
  >
    <App />
  </LoadScript>
) : (
  <App />
) */}
<App />
```

## Troubleshooting

### ApiProjectMapError
1. **Enable Billing**: Google Maps API requires billing to be enabled
2. **Check API Status**: Go to Google Cloud Console > APIs & Services > Dashboard
3. **Verify API Key**: Make sure the key has access to Maps JavaScript API
4. **Check Restrictions**: Ensure your domain is allowed in API key restrictions

### NoApiKeys Warning
1. **API key not working**: Make sure you've enabled the correct APIs
2. **Still seeing warnings**: Restart the dev server after adding the .env file
3. **Maps not loading**: Check if the API key has billing enabled (required for Google Maps)

### Common Issues
1. **Billing not enabled**: Google Maps API requires billing to be set up
2. **Wrong project**: Make sure you're using the API key from the correct project
3. **API not enabled**: Ensure Maps JavaScript API and Places API are enabled
4. **Domain restrictions**: Add `localhost:5173/*` to allowed referrers for development
