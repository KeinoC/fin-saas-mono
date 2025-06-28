import { NextRequest, NextResponse } from 'next/server';

async function getAcuityIntegrationsService() {
  try {
    const { acuityIntegrationsService } = await import('database/lib/acuity-integrations-service');
    return acuityIntegrationsService;
  } catch (error) {
    console.warn('Acuity service not available:', error);
    return null;
  }
}

async function getGoogleIntegrationsService() {
  try {
    const { googleIntegrationsService } = await import('database/lib/google-integrations-service');
    return googleIntegrationsService;
  } catch (error) {
    console.warn('Google service not available:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    console.log(`Loading integrations for org: ${orgId}`);

    const integrations = [];

    // Load Acuity integrations
    try {
      const acuityService = await getAcuityIntegrationsService();
      if (acuityService) {
        const acuityIntegration = await acuityService.findByOrg(orgId);
        console.log(`Found Acuity integration: ${acuityIntegration ? 'Yes' : 'No'}`);
        
        if (acuityIntegration) {
          integrations.push({
            id: acuityIntegration.id,
            name: acuityIntegration.displayName || 'Acuity Scheduling',
            type: 'acuity',
            source: 'acuity',
            status: 'connected',
            lastSync: acuityIntegration.lastSyncedAt,
            recordCount: null, // Will be populated separately if needed
            description: 'Appointment and booking data',
            externalAccountId: acuityIntegration.externalAccountId
          });
        }
      }
    } catch (error) {
      console.error('Error loading Acuity integrations:', error);
    }

    // Load Google integrations
    try {
      const googleService = await getGoogleIntegrationsService();
      if (googleService) {
        const googleIntegrations = await googleService.findByOrg(orgId);
        console.log(`Found ${googleIntegrations.length} Google integrations`);
        
        for (const google of googleIntegrations) {
          if (google.isActive) {
            integrations.push({
              id: google.id,
              name: google.name || google.email || 'Google Integration',
              type: 'google',
              source: 'google',
              status: 'connected',
              lastSync: google.lastUsedAt,
              recordCount: null,
              description: 'Google Sheets and Drive',
              externalAccountId: google.email
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading Google integrations:', error);
    }

    console.log(`Total integrations found: ${integrations.length}`);

    return NextResponse.json({
      success: true,
      integrations,
      total: integrations.length
    });

  } catch (error: any) {
    console.error('List integrations error:', error);
    return NextResponse.json({
      error: 'Failed to list integrations',
      details: error.message
    }, { status: 500 });
  }
} 