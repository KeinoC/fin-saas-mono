import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from 'database/lib/google-integrations-service';

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
    const isMember = await GoogleIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const integration = await GoogleIntegrationsService.findByUserAndOrg(
      session.user.id,
      orgId
    );

    return NextResponse.json({
      isConnected: !!integration?.isActive,
      integration: integration ? {
        id: integration.id,
        name: integration.name,
        email: integration.email,
        connectedAt: integration.createdAt,
        lastUsedAt: integration.lastUsedAt,
        scopes: integration.scopes
      } : null
    });
  } catch (error) {
    console.error('Google status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}