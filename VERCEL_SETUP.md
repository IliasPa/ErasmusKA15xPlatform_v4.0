# Erasmus+ Platform - Vercel Backend Setup

This document provides instructions for setting up the Vercel backend to handle project submissions.

## Prerequisites

1. A Vercel account
2. A GitHub repository with the project code
3. A GitHub Personal Access Token with `repo` scope

## GitHub Token Setup

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the `repo` scope (full control of private repositories)
4. Copy the generated token: `YOUR_GITHUB_TOKEN_HERE`

## Vercel Deployment

### Option 1: Deploy from GitHub (Recommended)

1. Connect your GitHub repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository: `IliasPa/ErasmusKA15xPlatform_v4.0`
   - Configure the project:
     - **Framework Preset**: Other
     - **Root Directory**: `erasmus-projects-platform` (if your project is in a subdirectory)
     - **Build Command**: Leave empty (static site)
     - **Output Directory**: Leave empty

2. Add Environment Variable:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add: `GITHUB_TOKEN` = `YOUR_GITHUB_TOKEN_HERE`

3. Deploy:
   - Click "Deploy"
   - Vercel will build and deploy your site

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   cd erasmus-projects-platform
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

## Testing the API

After deployment, test the API endpoint:

```javascript
fetch('https://your-vercel-domain.vercel.app/api/submit-project', {
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

## File Structure

Submitted projects will be saved as JSON files in your GitHub repository under the `data/` directory with filenames like `1703123456789.json`.

## Troubleshooting

- **403 Forbidden**: Check that your GitHub token has `repo` scope
- **404 Not Found**: Ensure the API route is correctly configured in `vercel.json`
- **500 Internal Server Error**: Check Vercel function logs for detailed error messages

## Security Notes

- The GitHub token is stored as an environment variable and is not exposed in client-side code
- All API requests are validated server-side
- CORS is handled automatically by Vercel