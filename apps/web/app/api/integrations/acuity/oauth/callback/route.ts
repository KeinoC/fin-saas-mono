import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityOAuthService } from '@/lib/services/acuity-oauth';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      console.error('No user session found in Acuity OAuth callback');
      return NextResponse.redirect(new URL('/auth/login?error=session_required', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This should be the orgId
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Acuity OAuth error:', error);
      const redirectUrl = state 
        ? `/org/${state}/integrations?error=acuity_oauth_${error}`
        : '/integrations?error=acuity_oauth';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (!code || !state) {
      console.error('Missing code or state in Acuity OAuth callback');
      const redirectUrl = state 
        ? `/org/${state}/integrations?error=acuity_oauth_missing_params`
        : '/integrations?error=acuity_oauth_missing_params';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    const orgId = state;

    // Check if user is member of the organization
    try {
      const isMember = await acuityIntegrationsService.checkOrgMembership(session.user.id, orgId);
      if (!isMember) {
        console.error('User not member of organization:', { userId: session.user.id, orgId });
        return NextResponse.redirect(new URL('/integrations?error=access_denied', request.url));
      }
    } catch (dbError) {
      console.error('Database error checking org membership:', dbError);
      return NextResponse.redirect(new URL(`/org/${orgId}/integrations?error=database_error`, request.url));
    }

    // Exchange code for access token
    const tokenResponse = await acuityOAuthService.exchangeCodeForToken(code);
    
    // Get user info from Acuity
    const userInfo = await acuityOAuthService.getUserInfo(tokenResponse.access_token);

    // Store the OAuth integration in database
    const integration = await acuityIntegrationsService.createOAuth({
      orgId,
      userId: session.user.id,
      acuityUserId: userInfo.id.toString(),
      accessToken: tokenResponse.access_token,
      scope: tokenResponse.scope,
      tokenType: tokenResponse.token_type,
      name: `${userInfo.firstName} ${userInfo.lastName}`,
      email: userInfo.email
    });

    console.log('Acuity OAuth integration saved successfully:', {
      integrationId: integration.id,
      userId: session.user.id,
      orgId,
      acuityUserId: userInfo.id
    });

    return NextResponse.redirect(new URL(`/org/${orgId}/integrations?success=acuity_oauth_connected`, request.url));
  } catch (error) {
    console.error('Acuity OAuth callback error:', error);
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');
    
    const redirectUrl = state 
      ? `/org/${state}/integrations?error=acuity_oauth_failed`
      : '/integrations?error=acuity_oauth_failed';
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
}