import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@lib/auth';
import { acuityAPIService } from '@lib/services/acuity-api';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, acuityUserId, apiKey } = body;

    if (!orgId || !acuityUserId || !apiKey) {
      return NextResponse.json({ 
        error: 'Missing required fields: orgId, acuityUserId, apiKey' 
      }, { status: 400 });
    }

    // Check admin access
    let isAdmin = false;
    try {
      isAdmin = await acuityIntegrationsService.checkAdminAccess(session.user.id, orgId);
    } catch (dbError: any) {
      console.warn('Database connection issue for admin check:', dbError.message);
      return NextResponse.json({ 
        error: 'Database connection issue. Please try again later.' 
      }, { status: 503 });
    }
    
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin permissions required to connect integrations' 
      }, { status: 403 });
    }

    // Test the connection first
    const testConnection = await acuityAPIService.testConnection({
      userId: acuityUserId,
      apiKey: apiKey,
    });

    if (!testConnection) {
      return NextResponse.json({ 
        error: 'Invalid Acuity credentials or connection failed' 
      }, { status: 400 });
    }

    // Get user info to store display name
    const userInfo = await acuityAPIService.getUserInfo({
      userId: acuityUserId,
      apiKey: apiKey,
    });

    // Store integration in database
    const integration = await acuityIntegrationsService.create({
      orgId,
      userId: session.user.id,
      acuityUserId,
      apiKey,
      name: userInfo.firstName && userInfo.lastName 
        ? `${userInfo.firstName} ${userInfo.lastName}` 
        : userInfo.email || `Acuity Account ${acuityUserId}`,
    });

    return NextResponse.json({ 
      success: true,
      integration: {
        id: integration.id,
        name: integration.displayName,
        connected: true,
      }
    });
  } catch (error) {
    console.error('Acuity connect error:', error);
    return NextResponse.json({ 
      error: 'Failed to connect Acuity integration' 
    }, { status: 500 });
  }
} 