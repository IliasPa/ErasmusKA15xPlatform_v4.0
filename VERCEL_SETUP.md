# Erasmus+ Platform - Vercel API Deployment

This document provides instructions for deploying **only the API** to Vercel while keeping your static site on GitHub Pages.

## Prerequisites

1. A Vercel account
2. A GitHub Personal Access Token with `repo` scope
3. Your static site remains hosted on GitHub Pages

## GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the `repo` scope (full control of private repositories)
4. Copy the generated token: `YOUR_GITHUB_TOKEN_HERE`

## Vercel API-Only Deployment

### Option 1: Deploy API from GitHub (Recommended)

1. Create a **separate Vercel project** for just the API:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository: `IliasPa/ErasmusKA15xPlatform_v4.0`
   - **Important:** Configure the project settings:
     - **Framework Preset**: Other
     - **Root Directory**: `erasmus-projects-platform/api` (point to API directory only)
     - **Build Command**: Leave empty
     - **Output Directory**: Leave empty

2. Add Environment Variable:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add: `GITHUB_TOKEN` = `YOUR_GITHUB_TOKEN_HERE`

3. Deploy:
   - Click "Deploy"
   - Vercel will deploy only the API function
   - Note your deployment URL (e.g., `https://your-api-project.vercel.app`)

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy only the API:
   ```bash
   cd erasmus-projects-platform/api
   vercel --prod
   ```

4. Set environment variable:
   ```bash
   vercel env add GITHUB_TOKEN
   # Enter: YOUR_GITHUB_TOKEN_HERE
   ```

5. Redeploy:
   ```bash
   vercel --prod
   ```

## Update Frontend Configuration

After deploying the API, update your frontend to use the Vercel API URL:

1. Open `js/submit.js`
2. Find the `API_ENDPOINT` configuration variable
3. Replace `'https://your-vercel-app.vercel.app/api/submit-project'` with your actual Vercel API URL

Example:
```javascript
const API_ENDPOINT = 'https://erasmus-api-xyz.vercel.app/api/submit-project';
```

## Testing the API

After deployment and configuration, test the API endpoint:

```javascript
fetch('https://your-api-url.vercel.app/api/submit-project', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    project_title: 'Test Project',
    project_type: 'KA151 – Accredited Projects',
    hosting_ngo: 'Test NGO',
    destination_country: 'Greece',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    contact_email: 'test@example.com'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## Architecture Overview

- **GitHub Pages**: Hosts your static HTML, CSS, JS files
- **Vercel**: Hosts only the `/api/submit-project` serverless function
- **GitHub Repository**: Stores submitted project JSON files in `/data/`

## Troubleshooting

- **403 Forbidden**: Check that your GitHub token has `repo` scope
- **404 Not Found**: Ensure the API URL in `submit.js` is correct
- **500 Internal Server Error**: Check Vercel function logs for detailed error messages

## Security Notes

- The GitHub token is stored as an environment variable on Vercel
- API requests include proper CORS handling
- All input validation happens server-side