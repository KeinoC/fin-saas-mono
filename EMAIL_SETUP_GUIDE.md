# Quick Email Setup Guide

## 🚀 Getting Real Emails Working

Your password reset is currently only logging to console. Here's how to get actual emails delivered:

### Option 1: Free Resend Account (Recommended)

1. **Sign up for Resend (Free):**
   - Go to https://resend.com
   - Sign up with your email
   - Verify your account (check your email)

2. **Get API Key:**
   - Go to https://resend.com/api-keys
   - Click "Create API Key"
   - Name it "K-Fin Development"
   - Copy the key (starts with `re_`)

3. **Update your .env file:**
   ```bash
   # Replace this line in your .env file:
   RESEND_API_KEY=re_paste_your_actual_api_key_here
   ```

4. **Restart your dev server:**
   ```bash
   npm run dev
   ```

5. **Test password reset:**
   - Go to login page
   - Click "Forgot password"
   - Enter your real email
   - Check your inbox!

### Option 2: Quick Test with Temporary API Key

If you want to test immediately without signing up:

1. **Get a temporary API key from a friend or create a quick Resend account**

2. **Use the force-send endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/force-send-email \
     -H "Content-Type: application/json" \
     -d '{
       "email": "your-email@example.com",
       "testApiKey": "re_your_temporary_key"
     }'
   ```

## 🔧 What Was Wrong

- **Development Mode Override:** The system was configured to only log emails to console in development
- **No API Key:** Without a Resend API key, emails can't be sent
- **Environment Check:** The code was checking `NODE_ENV === 'development'` and skipping email sending

## ✅ What's Fixed

- **Smart Detection:** Now only logs to console if no API key is provided
- **Real Email Sending:** With API key, emails are sent even in development
- **Better Logging:** Clear distinction between console-only vs real email modes

## 🎯 Free Tier Limits

Resend free tier includes:
- **3,000 emails per month**
- **100 emails per day**
- **No credit card required**
- **Perfect for development and testing**

## 🔍 Testing Commands

```bash
# Check current configuration
curl http://localhost:3000/api/debug-password-reset

# Test password reset email
curl -X POST http://localhost:3000/api/debug-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

## 📧 Expected Behavior

**With API Key:**
- ✅ Real emails sent to your inbox
- ✅ Professional HTML templates
- ✅ Console logs confirm sending

**Without API Key:**
- ℹ️ URLs logged to console only
- ℹ️ No real emails sent
- ℹ️ Good for development without email setup

## 🚨 Production Note

For production deployment, make sure to:
1. Set up your own domain in Resend
2. Update `EMAIL_FROM` to use your domain
3. Add the API key to Vercel environment variables