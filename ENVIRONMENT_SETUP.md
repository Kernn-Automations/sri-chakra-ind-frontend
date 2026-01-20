# Environment Setup Guide

## Issue: No Data Fetching in CurrentStock

The CurrentStock component is not fetching data because the API URL is not configured.

## Solution: Set Environment Variables

### Option 1: Create a .env file (Recommended)

Create a `.env` file in the root directory of your project with the following content:

```bash
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Replace with your actual API URL if different
# Examples:
# VITE_API_URL=https://your-api-domain.com/api
# VITE_API_URL=http://192.168.1.100:3000/api
```

### Option 2: Set Environment Variable in System

#### Windows (PowerShell):
```powershell
$env:VITE_API_URL="http://localhost:3000/api"
```

#### Windows (Command Prompt):
```cmd
set VITE_API_URL=http://localhost:3000/api
```

#### Linux/Mac:
```bash
export VITE_API_URL=http://localhost:3000/api
```

### Option 3: Set in Package.json Scripts

Modify your `package.json` scripts to include the environment variable:

```json
{
  "scripts": {
    "dev": "VITE_API_URL=http://localhost:3000/api vite",
    "build": "VITE_API_URL=http://localhost:3000/api vite build"
  }
}
```

## Verification

After setting the environment variable:

1. Restart your development server
2. Check the browser console for logs
3. Look at the Debug Information section in CurrentStock
4. The API URL should show your configured URL instead of "Not configured"

## Common API URLs

- **Local Development**: `http://localhost:3000/api`
- **Local Network**: `http://192.168.1.100:3000/api`
- **Production**: `https://your-domain.com/api`

## Troubleshooting

1. **Environment variable not working**: Restart the dev server after changes
2. **API still not working**: Check if your backend server is running
3. **CORS issues**: Ensure your backend allows requests from your frontend domain
4. **Network errors**: Check if the API URL is accessible from your browser

## Next Steps

Once the API URL is configured:
1. The CurrentStock component should start fetching data
2. Check the browser console for detailed logs
3. If still no data, check the backend API endpoints
4. Verify that your backend has inventory data for the selected division
