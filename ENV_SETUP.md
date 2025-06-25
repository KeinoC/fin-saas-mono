# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### 🔑 Better-Auth (Required)
```bash
BETTER_AUTH_SECRET=your-random-secret-string
DATABASE_URL=postgresql://postgres.[USER]:[PASSWORD]@[HOST]:6543/postgres
```

**How to get these:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > Database
3. Copy the Connection String (URI format)
4. Generate a random secret string for BETTER_AUTH_SECRET

### 🔑 Legacy Supabase (Optional - for existing features)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 🔐 OAuth Providers (Optional)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**How to set up OAuth:**

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URI: `https://your-supabase-url/auth/v1/callback`

**GitHub:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-supabase-url/auth/v1/callback`

### 🏦 Financial Integrations (Optional)
```bash
# Plaid (Banking)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
PLAID_REDIRECT_URI=http://localhost:3000/api/plaid/callback

# QuickBooks
QUICKBOOKS_CLIENT_ID=your-quickbooks-client-id
QUICKBOOKS_CLIENT_SECRET=your-quickbooks-client-secret

# Rippling (HR/Payroll)
RIPPLING_CLIENT_ID=your-rippling-client-id
RIPPLING_CLIENT_SECRET=your-rippling-client-secret

# ADP (Payroll)
ADP_CLIENT_ID=your-adp-client-id
ADP_CLIENT_SECRET=your-adp-client-secret

# Acuity Scheduling
ACUITY_CLIENT_ID=your-acuity-client-id
ACUITY_CLIENT_SECRET=your-acuity-client-secret

# Mindbody
MINDBODY_CLIENT_ID=your-mindbody-client-id
MINDBODY_CLIENT_SECRET=your-mindbody-client-secret
```

**How to get Plaid credentials:**
1. Go to [Plaid Dashboard](https://dashboard.plaid.com)
2. Create a new app
3. Get your Client ID and Secret from the Keys tab
4. Start with `sandbox` environment for testing

### 💳 Stripe (Optional)
```bash
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your publishable and secret keys from Developers > API keys
3. Create webhook endpoint for webhook secret

### 📧 Notifications (Optional)
```bash
# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

### 🔐 Security & App Configuration
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Quick Start (Minimum Required)

For development, you need Better-Auth with Supabase database:

1. **Create Supabase project:**
   ```bash
   # Visit https://supabase.com and create a new project
   # Get your DATABASE_URL from Settings > Database
   ```

2. **Set up your `.env.local`:**
   ```bash
   BETTER_AUTH_SECRET=any-random-string-for-development
   DATABASE_URL=postgresql://postgres.[USER]:[PASSWORD]@[HOST]:6543/postgres
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run the database migrations:**
   ```bash
   # First run the K-Fin schema migration in Supabase SQL editor
   # Copy SQL from: supabase/migrations/001_initial_schema.sql
   
   # Then run Better-Auth migration
   cd apps/web
   npx @better-auth/cli migrate
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## Setting up OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google and/or GitHub
4. Add your OAuth client credentials
5. Set redirect URLs in your OAuth provider settings

## Production Deployment

For production, ensure all environment variables are set in your deployment platform (Vercel, Netlify, etc.) and update URLs accordingly.

## Troubleshooting

- **Build errors:** Make sure all NEXT_PUBLIC_ variables are set
- **OAuth not working:** Check redirect URLs match exactly
- **Database errors:** Verify your Supabase connection and run migrations
- **Integration errors:** Ensure API keys are valid and have correct permissions 