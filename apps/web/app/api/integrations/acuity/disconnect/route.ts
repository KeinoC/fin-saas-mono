import { NextRequest, NextResponse } from 'next/server';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';
import { auth } from '@lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check admin access
    const isAdmin = await acuityIntegrationsService.checkAdminAccess(session.user.id, orgId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete the integration
    await acuityIntegrationsService.delete(orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Acuity disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Acuity integration' },
      { status: 500 }
    );
  }
} 