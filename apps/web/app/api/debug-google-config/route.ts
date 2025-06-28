import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const config = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientId: process.env.GOOGLE_CLIENT_ID ? 
        `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 
        'NOT_SET',
      redirectUri: process.env.NODE_ENV === 'production' 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
        : 'http://localhost:3000/api/auth/callback/google',
      environment: process.env.NODE_ENV,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };

    return NextResponse.json({
      message: 'Better Auth Google OAuth Configuration Status',
      config,
      instructions: {
        step1: 'Go to Google Cloud Console > APIs & Services > Credentials',
        step2: `Find OAuth 2.0 Client ID: ${config.clientId}`,
        step3: `Add this CORRECT redirect URI: ${config.redirectUri}`,
        step4: 'Configure OAuth consent screen with your app details',
        step5: 'Add your Google account as a test user',
        step6: 'Enable Google Sheets API and Google Drive API',
        note: 'IMPORTANT: Use Better Auth standard callback URL, not custom integrations URL'
      },
      betterAuthInfo: {
        loginEndpoint: `${config.appUrl}/api/auth/sign-in/social`,
        callbackEndpoint: `${config.appUrl}/api/auth/callback/google`,
        clientUsage: 'await authClient.signIn.social({ provider: "google" })'
      }
    });
  } catch (error) {
    console.error('Debug config error:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
} 