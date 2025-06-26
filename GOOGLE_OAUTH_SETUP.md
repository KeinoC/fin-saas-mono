# Google OAuth Setup for Development

To enable Google integration in your k-fin application, you need to configure Google OAuth credentials.

## Quick Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API
   - Google+ API (for user info)

### 2. Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Configure the consent screen first if prompted
4. Set Application type to **Web application**
5. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/integrations/google/callback`
   - For production: `https://your-domain.com/api/integrations/google/callback`

### 3. Add Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Other required variables (if not already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Restart the Development Server

```bash
npm run dev
```

## Testing the Integration

1. Navigate to the integrations page
2. Click "Connect with Google"
3. You should be redirected to Google's OAuth consent screen
4. Grant permissions and complete the flow

## Troubleshooting

### "Google integration is not configured" Error

This means the environment variables are not set. Make sure:
- `.env.local` file exists in `apps/web` directory
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Development server was restarted after adding the variables

### "redirect_uri_mismatch" Error

This means the redirect URI in your Google Cloud Console doesn't match. Make sure:
- The redirect URI is exactly: `http://localhost:3000/api/integrations/google/callback`
- No trailing slashes or extra characters

### OAuth Consent Screen Issues

For development, you can use the app in "Testing" mode:
1. In Google Cloud Console, go to **APIs & Services > OAuth consent screen**
2. Add your test email addresses to the "Test users" section
3. This allows you to test without going through the verification process

## Production Setup

For production, you'll need to:
1. Verify your OAuth consent screen with Google
2. Add your production domain to authorized origins
3. Update the `NEXT_PUBLIC_APP_URL` environment variable
4. Set up proper environment variable management (Vercel, Railway, etc.)

## Need Help?

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)

## URGENT: Fix OAuth Redirect URIs in Google Cloud Console

**The screenshots show your OAuth client has incorrect redirect URIs. Here's how to fix it:**

### 1. Update Google Cloud Console OAuth Client

1. Go to [Google Cloud Console - OAuth Clients](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client "Fin_Saas_web"
3. **Update the Authorized redirect URIs to exactly:**

**For Development:**
```
http://localhost:3000/api/integrations/google/callback
```

**For Production (replace with your domain):**
```
https://your-production-domain.com/api/integrations/google/callback
```

**❌ Remove these incorrect URIs:**
- `http://localhost:3000` (missing callback path)
- `http://localhost:3001` (wrong port)
- `https://wvfsubcfybdgylqbnjzq.supabase.co/auth/v1/callback` (this is for Supabase auth, not Google integration)

### 2. Authorized JavaScript Origins

Keep these as they are:
```
http://localhost:3000
http://localhost:3001
```

### 3. Save and Wait

- Click **Save**
- **Wait 5-10 minutes** for Google's changes to propagate
- The error "invalid_client" should resolve 