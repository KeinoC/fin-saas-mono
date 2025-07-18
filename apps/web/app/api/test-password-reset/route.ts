import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, testUrl } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Test the email service with a mock reset URL
    const resetUrl = testUrl || "https://k-fin-ten.vercel.app/auth/reset-password?token=test-token";
    
    await EmailService.sendPasswordResetEmail(
      email,
      resetUrl,
      "Test User"
    );

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${email}`,
      mode: process.env.NODE_ENV === 'development' ? 'Development (console only)' : 'Production (email sent)'
    });

  } catch (error) {
    console.error("Test password reset error:", error);
    return NextResponse.json(
      { 
        error: "Failed to send password reset email",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}