import { Resend } from 'resend';

// Initialize Resend with API key (only if provided)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Email service for sending various types of emails
 */
export class EmailService {
  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(to: string, resetUrl: string, userName?: string) {
    try {
      // In development without API key, log to console only
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        console.log('\n=== PASSWORD RESET EMAIL (DEV MODE - CONSOLE ONLY) ===');
        console.log(`To: ${to}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log(`User: ${userName || 'Unknown'}`);
        console.log('=== END EMAIL ===\n');
        return { success: true, messageId: 'dev-mode' };
      }

      if (!process.env.RESEND_API_KEY || !resend) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'K-Fin <noreply@k-fin.com>',
        to: [to],
        subject: 'Reset Your Password - K-Fin',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 20px; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>K-Fin</h1>
              </div>
              <div class="content">
                <h2>Reset Your Password</h2>
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                <p>We received a request to reset your password for your K-Fin account. Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                <p>This link will expire in 1 hour for security reasons.</p>
                <div class="footer">
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Reset Your Password - K-Fin
          
          Hello${userName ? ` ${userName}` : ''},
          
          We received a request to reset your password for your K-Fin account.
          
          Click this link to reset your password: ${resetUrl}
          
          If you didn't request this password reset, you can safely ignore this email.
          
          This link will expire in 1 hour for security reasons.
        `
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Password reset email sent successfully:', data?.id);
      return { success: true, messageId: data?.id };

    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  static async sendVerificationEmail(to: string, verificationUrl: string, userName?: string) {
    try {
      // In development without API key, log to console only
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        console.log('\n=== EMAIL VERIFICATION (DEV MODE - CONSOLE ONLY) ===');
        console.log(`To: ${to}`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log(`User: ${userName || 'Unknown'}`);
        console.log('=== END EMAIL ===\n');
        return { success: true, messageId: 'dev-mode' };
      }

      if (!process.env.RESEND_API_KEY || !resend) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'K-Fin <noreply@k-fin.com>',
        to: [to],
        subject: 'Verify Your Email - K-Fin',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { margin-top: 20px; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>K-Fin</h1>
              </div>
              <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Hello${userName ? ` ${userName}` : ''},</p>
                <p>Thank you for signing up for K-Fin! Please click the button below to verify your email address:</p>
                <p style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email</a>
                </p>
                <p>Once verified, you'll be able to access all features of your K-Fin account.</p>
                <div class="footer">
                  <p>If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #10b981;">${verificationUrl}</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Verify Your Email - K-Fin
          
          Hello${userName ? ` ${userName}` : ''},
          
          Thank you for signing up for K-Fin! Please click this link to verify your email address:
          
          ${verificationUrl}
          
          Once verified, you'll be able to access all features of your K-Fin account.
        `
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      console.log('Verification email sent successfully:', data?.id);
      return { success: true, messageId: data?.id };

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }
}