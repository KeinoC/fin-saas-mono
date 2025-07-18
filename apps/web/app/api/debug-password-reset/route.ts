import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Check environment configuration
    const config = {
      nodeEnv: process.env.NODE_ENV,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 5) + '...',
      emailFrom: process.env.EMAIL_FROM || 'Not set',
      betterAuthUrl: process.env.BETTER_AUTH_URL || 'Not set',
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Password reset debug information",
      config,
      recommendations: getRecommendations(config)
    });

  } catch (error) {
    console.error("Debug password reset error:", error);
    return NextResponse.json(
      { 
        error: "Failed to get debug information",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required for testing" },
        { status: 400 }
      );
    }

    // Import email service dynamically to test
    const { EmailService } = await import("@/lib/email");
    
    // Test email sending with mock URL
    const testResetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=test-token-123`;
    
    const result = await EmailService.sendPasswordResetEmail(
      email,
      testResetUrl,
      "Test User"
    );

    return NextResponse.json({
      success: true,
      message: `Test password reset email sent to ${email}`,
      result,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Test password reset error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send test password reset email",
        details: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV
      },
      { status: 500 }
    );
  }
}

function getRecommendations(config: any): string[] {
  const recommendations: string[] = [];

  if (!config.hasResendKey) {
    recommendations.push("Set RESEND_API_KEY environment variable for email functionality");
  }

  if (config.emailFrom === 'Not set') {
    recommendations.push("Set EMAIL_FROM environment variable for proper sender identification");
  }

  if (config.nodeEnv === 'production' && config.betterAuthUrl === 'Not set') {
    recommendations.push("Set BETTER_AUTH_URL for production environment");
  }

  if (config.emailFrom.includes('k-fin.com') && config.nodeEnv === 'production') {
    recommendations.push("Verify domain 'k-fin.com' is configured and verified in Resend");
  }

  if (recommendations.length === 0) {
    recommendations.push("Configuration looks good! Test email sending with POST request");
  }

  return recommendations;
}