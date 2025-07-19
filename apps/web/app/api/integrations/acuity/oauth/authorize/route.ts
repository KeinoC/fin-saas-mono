import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityOAuthService } from '@/lib/services/acuity-oauth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Generate authorization URL with orgId as state
    const authUrl = acuityOAuthService.getAuthorizationUrl(orgId);

    // Redirect to Acuity OAuth authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Acuity OAuth authorize error:', error);
    return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 });
  }
}