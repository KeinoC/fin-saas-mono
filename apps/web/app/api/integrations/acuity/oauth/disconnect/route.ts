import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityOAuthService } from '@/lib/services/acuity-oauth';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';

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
    const isMember = await acuityIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the user's Acuity OAuth integration for this org
    const integration = await acuityIntegrationsService.findByUserAndOrgOAuth(
      session.user.id,
      orgId
    );

    if (!integration) {
      return NextResponse.json({ error: 'Acuity OAuth integration not found' }, { status: 404 });
    }

    // Get decrypted access token for disconnect call
    const decryptedIntegration = await acuityIntegrationsService.getDecryptedIntegration(integration.id);
    
    if (decryptedIntegration?.decryptedAccessToken) {
      // Try to revoke the token with Acuity (optional - may fail if already revoked)
      try {
        await acuityOAuthService.disconnect(decryptedIntegration.decryptedAccessToken);
      } catch (revokeError) {
        console.warn('Failed to revoke Acuity OAuth token (may already be revoked):', revokeError);
        // Continue with local disconnect even if remote revocation fails
      }
    }

    // Remove the integration from our database
    await acuityIntegrationsService.deleteById(integration.id);

    console.log(`Acuity OAuth integration disconnected: ${integration.id} for user ${session.user.id} in org ${orgId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Acuity OAuth integration disconnected successfully'
    });
  } catch (error) {
    console.error('Acuity OAuth disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}