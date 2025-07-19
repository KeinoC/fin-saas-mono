import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';

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

    // Check if user is member of the organization
    const isMember = await acuityIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find OAuth integration for this user and org
    const integration = await acuityIntegrationsService.findByUserAndOrgOAuth(
      session.user.id,
      orgId
    );

    if (!integration) {
      return NextResponse.json({
        isConnected: false,
        integration: null
      });
    }

    return NextResponse.json({
      isConnected: !!integration,
      integration: integration ? {
        id: integration.id,
        authType: 'oauth',
        displayName: integration.displayName,
        createdAt: integration.createdAt,
        lastSyncedAt: integration.lastSyncedAt,
        scope: integration.scope
      } : null
    });
  } catch (error) {
    console.error('Acuity OAuth status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}