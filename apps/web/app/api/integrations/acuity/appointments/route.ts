import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityOAuthService } from '@/lib/services/acuity-oauth';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const minDate = searchParams.get('minDate');
    const maxDate = searchParams.get('maxDate');
    const calendarID = searchParams.get('calendarID');
    const appointmentTypeID = searchParams.get('appointmentTypeID');
    const limit = searchParams.get('limit');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Check if user is member of the organization
    const isMember = await acuityIntegrationsService.checkOrgMembership(session.user.id, orgId);
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find active Acuity integrations for the organization (both API key and OAuth)
    const integrations = await acuityIntegrationsService.findByOrg(orgId);
    
    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ 
        error: 'No Acuity integration found for this organization' 
      }, { status: 404 });
    }

    // Try to find an OAuth integration first, fallback to API key integration
    let activeIntegration = integrations.find((int: any) => int.authType === 'oauth' && int.isActive);
    if (!activeIntegration) {
      activeIntegration = integrations.find((int: any) => int.authType === 'api_key' && int.isActive);
    }

    if (!activeIntegration) {
      return NextResponse.json({ 
        error: 'No active Acuity integration found for this organization' 
      }, { status: 404 });
    }

    // Get decrypted credentials
    const decryptedIntegration = await acuityIntegrationsService.getDecryptedIntegration(activeIntegration.id);
    
    if (!decryptedIntegration) {
      return NextResponse.json({ 
        error: 'Failed to decrypt integration credentials' 
      }, { status: 500 });
    }

    let appointments;

    // Use appropriate API based on auth type
    if (activeIntegration.authType === 'oauth' && decryptedIntegration.decryptedAccessToken) {
      // Use OAuth API
      const options = {
        minDate: minDate || undefined,
        maxDate: maxDate || undefined,
        calendarID: calendarID ? parseInt(calendarID) : undefined,
        appointmentTypeID: appointmentTypeID ? parseInt(appointmentTypeID) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      };

      appointments = await acuityOAuthService.getAppointments(
        decryptedIntegration.decryptedAccessToken, 
        options
      );

      // Update last used timestamp
      await acuityIntegrationsService.updateLastSynced(activeIntegration.orgId);
    } else if (activeIntegration.authType === 'api_key') {
      // Use API key method - import the existing service
      const { acuityAPIService } = await import('@/lib/services/acuity-api');
      
      if (!decryptedIntegration.decryptedAccessToken || !activeIntegration.externalAccountId) {
        return NextResponse.json({ 
          error: 'Missing API key credentials' 
        }, { status: 500 });
      }

      // For API key method, construct the credentials object
      const credentials = {
        userId: activeIntegration.externalAccountId,
        apiKey: decryptedIntegration.decryptedAccessToken
      };

      // Use existing API key service (would need to add appointments method)
      appointments = await acuityAPIService.getAppointments(credentials, {
        minDate,
        maxDate,
        calendarID: calendarID ? parseInt(calendarID) : undefined,
        appointmentTypeID: appointmentTypeID ? parseInt(appointmentTypeID) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      });

      // Update last used timestamp
      await acuityIntegrationsService.updateLastSynced(activeIntegration.orgId);
    } else {
      return NextResponse.json({ 
        error: 'Invalid integration configuration' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      appointments,
      total: appointments.length,
      integration: {
        id: activeIntegration.id,
        authType: activeIntegration.authType,
        name: activeIntegration.displayName
      }
    });

  } catch (error) {
    console.error('Acuity appointments fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch appointments' 
    }, { status: 500 });
  }
}