import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    console.log(`[DEBUG] Attempting password reset for email: ${email}`);
    
    // Try to trigger password reset directly through the auth object
    const response = await fetch(`${request.nextUrl.origin}/api/auth/forget-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
      }),
    });

    const data = await response.text();
    console.log(`[DEBUG] Password reset response status: ${response.status}`);
    console.log(`[DEBUG] Password reset response: ${data}`);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: data,
      debug: {
        email,
        redirectTo: `${request.nextUrl.origin}/auth/reset-password`,
        endpoint: `${request.nextUrl.origin}/api/auth/forget-password`
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] Password reset error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send POST request with { email: 'user@example.com' } to test password reset",
    authEndpoints: [
      "/api/auth/forget-password",
      "/api/auth/reset-password"
    ]
  });
}