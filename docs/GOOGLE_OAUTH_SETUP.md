# Google Integration Setup Guide

This guide walks you through setting up Google OAuth and Service Account authentication for your K-Fin application.

## Overview

K-Fin supports two authentication methods for Google services:

1. **OAuth (User-based)**: Individual users connect their personal Google accounts
2. **Service Account**: Organization-wide integration using a service account

## 1. Google Cloud Console Setup

### Step 1: Create/Select Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID (you'll need this later)

### Step 2: Enable APIs

1. Navigate to **APIs & Services > Library**
2. Enable the following APIs:
   - **Google Sheets API**
   - **Google Drive API**
   - **Google OAuth2 API** (for user info)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace domain)
3. Fill in the required information:
   - **App name**: K-Fin
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: K-Fin Web App
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/integrations/google/callback` (development)
     - `https://your-domain.com/api/integrations/google/callback` (production)
5. Download the JSON file and note the Client ID and Client Secret

## 2. Environment Variables Setup

Add these environment variables to your `.env.local` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Your app URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://your-domain.com
```

### For Development:
```bash
# .env.local
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production:
```bash
# .env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 3. Service Account Setup (Optional)

If you want organization-wide integration capabilities:

### Step 1: Create Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: k-fin-service-account
   - **Description**: Service account for K-Fin Google integrations
4. Click **Create and Continue**
5. **Skip** role assignment (we'll handle permissions at the resource level)
6. Click **Done**

### Step 2: Create Service Account Key

1. Click on your newly created service account
2. Go to **Keys** tab
3. Click **Add Key > Create New Key**
4. Choose **JSON** format
5. Download the JSON file (keep it secure!)

### Step 3: Share Google Resources

For service accounts to access Google Sheets/Drive files:

1. **For Google Sheets**: Share the spreadsheet with the service account email
2. **For Google Drive**: Share folders with the service account email
3. The service account email is in the format: `name@project-id.iam.gserviceaccount.com`

## 4. Testing Your Setup

### Test OAuth Flow:
1. Start your development server: `npm run dev`
2. Navigate to your organization's integrations page
3. Click "Connect Your Google Account" in the OAuth tab
4. Complete the OAuth flow

### Test Service Account:
1. Go to the Service Account tab
2. Upload your service account JSON file
3. Give it a name and select permissions
4. Click "Set up Service Account"

## 5. Usage Examples

### OAuth Usage (User Context):
```typescript
// Users can export their data to their own Google Sheets
const integration = await getOAuthIntegration(orgId, userId);
const spreadsheet = await googleAPIService.createSpreadsheet(
  integration,
  "My Financial Data",
  exportData
);
```

### Service Account Usage (Organization Context):
```typescript
// Organization can create sheets in shared drive
const integration = await getServiceAccountIntegration(orgId);
const spreadsheet = await googleAPIService.createSpreadsheet(
  integration,
  "Organization Report",
  reportData
);
```

## 6. Permissions and Scopes

### OAuth Scopes:
- `userinfo.email` - Access user's email address
- `userinfo.profile` - Access user's basic profile info
- `spreadsheets` - Create and edit Google Sheets
- `drive.file` - Create and access files created by the app

### Service Account Permissions:
Service accounts can access resources that are explicitly shared with them. Share Google Sheets and Drive folders with the service account email to grant access.

## 7. Security Considerations

1. **Keep credentials secure**: Never commit OAuth secrets or service account keys to version control
2. **Use environment variables**: Store all credentials in environment variables
3. **Limit scopes**: Only request the minimum required permissions
4. **Regular rotation**: Rotate service account keys periodically
5. **Monitor usage**: Use Google Cloud Console to monitor API usage

## 8. Troubleshooting

### Common Issues:

**"invalid_client" error**:
- Check that your OAuth redirect URI exactly matches what's configured in Google Cloud Console
- Ensure you're using the correct Client ID and Secret

**"insufficient_scope" error**:
- The user hasn't granted all required permissions
- Re-run the OAuth flow with `prompt=consent`

**Service Account "permission denied"**:
- Make sure the Google Sheet/Drive resource is shared with the service account email
- Check that the service account has the correct API permissions

**"redirect_uri_mismatch"**:
- Your callback URL doesn't match what's configured in Google Cloud Console
- Update either your environment variables or Google Cloud Console settings

### Support:
If you encounter issues, check the application logs and refer to [Google's OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2). 