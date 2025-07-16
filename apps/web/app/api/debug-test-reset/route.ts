import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();
    
    console.log(`[DEBUG] Testing reset password with token: ${token}`);
    console.log(`[DEBUG] New password: ${newPassword}`);
    
    // Try to reset password directly through the API
    const response = await fetch(`${request.nextUrl.origin}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    });

    const data = await response.text();
    console.log(`[DEBUG] Reset password response status: ${response.status}`);
    console.log(`[DEBUG] Reset password response: ${data}`);

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: data,
      debug: {
        token,
        newPassword: newPassword.substring(0, 3) + '***',
        endpoint: `${request.nextUrl.origin}/api/auth/reset-password`
      }
    });

  } catch (error: any) {
    console.error('[DEBUG] Reset password test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send POST request with { token: 'reset-token', newPassword: 'newpass123' } to test password reset"
  });
}