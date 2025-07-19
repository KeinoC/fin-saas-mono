import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from 'database/lib/google-integrations-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check if user is member of the organization
    const isMember = await GoogleIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the user's Google integration for this org
    const integration = await GoogleIntegrationsService.findByUserAndOrg(
      session.user.id,
      orgId
    );

    if (!integration) {
      return NextResponse.json({ error: 'Google integration not found' }, { status: 404 });
    }

    // Deactivate the integration
    await GoogleIntegrationsService.deactivate(integration.id);

    console.log(`Google integration disconnected: ${integration.id} for user ${session.user.id} in org ${orgId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Google integration disconnected successfully'
    });
  } catch (error) {
    console.error('Google disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}