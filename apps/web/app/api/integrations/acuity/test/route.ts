import { NextRequest, NextResponse } from 'next/server';
import { acuityAPIService } from '@lib/services/acuity-api';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';
import { auth } from '@lib/auth';

export async function GET(request: NextRequest) {
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

    // Get the integration
    let integration;
    try {
      integration = await acuityIntegrationsService.getDecryptedIntegration(orgId);
    } catch (dbError: any) {
      console.warn('Database connection issue, Acuity integration not available:', dbError.message);
      return NextResponse.json({ 
        error: 'Acuity integration temporarily unavailable',
        details: 'Database connection issue. Please try again later.'
      }, { status: 503 });
    }
    
    if (!integration) {
      return NextResponse.json({ 
        error: 'No Acuity integration found for this organization',
        details: 'Please connect Acuity first'
      }, { status: 404 });
    }

    // Test the connection
    const credentials = {
      userId: integration.userId,
      apiKey: integration.apiKey
    };

    try {
      // Test by getting user info
      const userInfo = await acuityAPIService.getUserInfo(credentials);
      
      // Get some sample data
      const [appointmentTypes, calendars] = await Promise.all([
        acuityAPIService.getAppointmentTypes(credentials).catch(() => []),
        acuityAPIService.getCalendars(credentials).catch(() => [])
      ]);

      // Update last synced
      await acuityIntegrationsService.updateLastSynced(orgId);

      return NextResponse.json({
        success: true,
        integration: {
          id: integration.id,
          lastSyncedAt: integration.lastSyncedAt,
          createdAt: integration.createdAt
        },
        userInfo,
        data: {
          appointmentTypes: appointmentTypes.slice(0, 5), // First 5 for testing
          calendars: calendars.slice(0, 5), // First 5 for testing
        }
      });

    } catch (error: any) {
      console.error('Acuity API test failed:', error);
      return NextResponse.json({
        error: 'Failed to connect to Acuity',
        details: error.message
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Acuity integration test error:', error);
    return NextResponse.json(
      { error: 'Failed to test Acuity integration' },
      { status: 500 }
    );
  }
} 