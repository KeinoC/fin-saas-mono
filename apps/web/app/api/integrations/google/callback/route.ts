import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from 'database/lib/google-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      console.error('No user session found in Google OAuth callback');
      return NextResponse.redirect(new URL('/auth/login?error=session_required', request.url));
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      const redirectUrl = orgId 
        ? `/org/${orgId}/integrations?error=google_oauth_${error}`
        : '/integrations?error=google_oauth';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (!orgId) {
      console.error('No orgId provided in Google OAuth callback');
      return NextResponse.redirect(new URL('/integrations?error=missing_org', request.url));
    }

    // Check if user is member of the organization
    const isMember = await GoogleIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      console.error('User not member of organization:', { userId: session.user.id, orgId });
      return NextResponse.redirect(new URL('/integrations?error=access_denied', request.url));
    }

    // Get Google account info from Better Auth database
    // Better Auth stores OAuth accounts in the account table
    const accounts = await auth.api.listUserAccounts({
      headers: request.headers,
      query: {
        userId: session.user.id
      }
    });

    const googleOAuthAccount = accounts?.find((account: any) => account.providerId === 'google');

    if (!googleOAuthAccount) {
      console.error('No Google OAuth account found for user');
      return NextResponse.redirect(new URL(`/org/${orgId}/integrations?error=google_account_missing`, request.url));
    }

    // Save or update the Google integration
    const integration = await GoogleIntegrationsService.saveOAuthIntegration({
      userId: session.user.id,
      orgId,
      googleAccount: googleOAuthAccount
    });

    console.log('Google integration saved successfully:', {
      integrationId: integration.id,
      userId: session.user.id,
      orgId,
      email: integration.email
    });

    return NextResponse.redirect(new URL(`/org/${orgId}/integrations?success=google_connected`, request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    
    const redirectUrl = orgId 
      ? `/org/${orgId}/integrations?error=google_oauth_failed`
      : '/integrations?error=google_oauth_failed';
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}