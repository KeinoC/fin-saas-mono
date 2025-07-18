import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, testApiKey } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!testApiKey) {
      return NextResponse.json(
        { error: "testApiKey is required for this endpoint" },
        { status: 400 }
      );
    }

    // Temporarily override environment for testing
    const originalApiKey = process.env.RESEND_API_KEY;
    process.env.RESEND_API_KEY = testApiKey;

    try {
      // Import and initialize Resend with the test key
      const { Resend } = await import('resend');
      const resend = new Resend(testApiKey);

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=test-token-123`;

      const { data, error } = await resend.emails.send({
        from: 'K-Fin <onboarding@resend.dev>',
        to: [email],
        subject: 'Test Password Reset - K-Fin',
        html: `
          <h2>Test Password Reset</h2>
          <p>This is a test email from K-Fin password reset functionality.</p>
          <p><a href="${resetUrl}">Reset Your Password</a></p>
          <p>Reset URL: ${resetUrl}</p>
        `,
        text: `Test Password Reset - K-Fin\n\nReset URL: ${resetUrl}`
      });

      if (error) {
        throw new Error(`Resend error: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        messageId: data?.id,
        timestamp: new Date().toISOString()
      });

    } finally {
      // Restore original API key
      if (originalApiKey) {
        process.env.RESEND_API_KEY = originalApiKey;
      } else {
        delete process.env.RESEND_API_KEY;
      }
    }

  } catch (error) {
    console.error("Force send email error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}