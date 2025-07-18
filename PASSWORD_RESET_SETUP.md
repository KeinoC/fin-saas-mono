# Password Reset Email Setup Guide

This guide explains how to set up and test the password reset email functionality for K-Fin.

## 📧 Email Service Configuration

### 1. Sign up for Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Navigate to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Email Configuration (Required for password reset)
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=K-Fin <noreply@your-domain.com>

# For production, also set:
BETTER_AUTH_URL=https://k-fin-ten.vercel.app
```

### 3. Domain Setup (Production)

For production deployment:

1. **Add your domain to Resend:**
   - Go to [Resend Domains](https://resend.com/domains)
   - Add your domain (e.g., `k-fin.com`)
   - Verify DNS records

2. **Update EMAIL_FROM:**
   ```bash
   EMAIL_FROM=K-Fin <noreply@k-fin.com>
   ```

## 🧪 Testing Password Reset

### Development Testing

1. **Console Logging (Default):**
   - In development, reset URLs are logged to console
   - No actual emails are sent
   - Check server console for reset links

2. **Test API Endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/test-password-reset \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

### Production Testing

1. **Set up Resend API key** in Vercel environment variables
2. **Test the flow:**
   - Go to login page
   - Click "Forgot your password?"
   - Enter your email
   - Check your email for reset link

## 🔧 How It Works

### User Flow

1. **User requests password reset:**
   - Clicks "Forgot your password?" on login page
   - Enters email address
   - System calls `authClient.requestPasswordReset()`

2. **Better-auth processes request:**
   - Generates secure reset token
   - Calls configured `sendResetPassword` function
   - Token expires in 1 hour

3. **Email sent:**
   - Production: Real email via Resend
   - Development: URL logged to console

4. **User resets password:**
   - Clicks link in email
   - Navigates to `/auth/reset-password?token=...`
   - Enters new password
   - System calls `authClient.resetPassword()`

### Email Templates

The system sends beautifully designed HTML emails with:
- Professional styling
- Clear call-to-action button
- Fallback text version
- Security notice (1-hour expiration)
- Backup link for broken buttons

## 🔒 Security Features

- **Token expiration:** 1 hour (configurable)
- **Secure token generation:** Handled by better-auth
- **Minimum password requirements:** 6 characters
- **Rate limiting:** Built into better-auth
- **Error handling:** Graceful failure without exposing user data

## 🐛 Troubleshooting

### Common Issues

1. **"RESEND_API_KEY is not configured" error:**
   - Verify environment variable is set
   - Check for typos in variable name
   - Ensure API key starts with `re_`

2. **Emails not being sent:**
   - Check Resend dashboard for logs
   - Verify domain is configured and verified
   - Check EMAIL_FROM matches verified domain

3. **Reset links not working:**
   - Verify BETTER_AUTH_URL is correct
   - Check token hasn't expired (1 hour limit)
   - Ensure baseURL matches in both server and client config

### Debug Commands

```bash
# Test email service
curl -X POST https://k-fin-ten.vercel.app/api/test-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Check environment variables
curl https://k-fin-ten.vercel.app/api/debug-env

# Check better-auth configuration
curl https://k-fin-ten.vercel.app/api/debug-reset-password
```

## 📁 Code Structure

```
apps/web/
├── lib/
│   ├── auth.ts                    # Better-auth configuration
│   ├── auth-client.ts            # Client-side auth methods  
│   └── email.ts                  # Email service (Resend)
├── features/auth/components/
│   ├── forgot-password-form.tsx  # Request reset form
│   └── reset-password-form.tsx   # New password form
├── app/auth/
│   └── reset-password/page.tsx   # Reset password page
└── app/api/
    └── test-password-reset/      # Test endpoint
```

## 🚀 Deployment Checklist

- [ ] Resend account created and API key obtained
- [ ] Domain added and verified in Resend (production)
- [ ] Environment variables set in Vercel
- [ ] Test password reset flow in staging
- [ ] Monitor email delivery in Resend dashboard

## 💡 Tips

- **Development:** Check server console for reset URLs
- **Production:** Monitor Resend dashboard for delivery status
- **Testing:** Use your own email address for testing
- **Security:** Reset tokens expire in 1 hour for security
- **Styling:** Email templates are responsive and professional