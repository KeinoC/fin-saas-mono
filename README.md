# K-Fin

A modern financial management platform built with Next.js, Better Auth, and Resend.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Resend account for email functionality

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000" # or your production URL

# Email (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="K-Fin <noreply@yourdomain.com>"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Email Setup (Resend)

1. **Sign up for Resend:**
   - Go to [resend.com](https://resend.com)
   - Create an account
   - Navigate to [API Keys](https://resend.com/api-keys)
   - Create a new API key (starts with `re_`)

2. **For Production:**
   - Add your domain to [Resend Domains](https://resend.com/domains)
   - Verify DNS records
   - Update `EMAIL_FROM` to use your verified domain

3. **Add to Vercel:**
   ```bash
   vercel env add RESEND_API_KEY production
   vercel env add EMAIL_FROM production
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
