import { NextRequest, NextResponse } from 'next/server';
import { googleAPIService } from '@lib/services/google-api';
import { authLocal as auth } from '@lib/auth-local';
import { googleIntegrationsService } from 'database/lib/google-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/org/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/org/integrations?error=missing_parameters', request.url)
      );
    }

    const { orgId, userId, authMethod } = JSON.parse(state);

    // Get tokens from Google
    const credentials = await googleAPIService.getTokensFromCode(code);

    // Get user info from Google
    const userInfo = await googleAPIService.getOAuthUserInfo(credentials);

    // Check admin access
    const isAdmin = await googleIntegrationsService.checkAdminAccess(userId, orgId);
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL(`/org/${orgId}/integrations?error=insufficient_permissions`, request.url)
      );
    }

    // Store integration in database with encryption
    const integration = await googleIntegrationsService.create({
      orgId,
      userId,
      authMethod: 'oauth',
      name: `${userInfo.name} (OAuth)`,
      email: userInfo.email,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
      scope: credentials.scope,
      tokenType: credentials.token_type,
      expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      scopes: credentials.scope?.split(' ') || [],
    });

    return NextResponse.redirect(
      new URL(`/org/${orgId}/integrations?success=google_oauth_connected`, request.url)
    );
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/org/integrations?error=oauth_callback_failed', request.url)
    );
  }
} 