import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acuityIntegrationsService } from 'database/lib/acuity-integrations-service';
import type { AcuityAPIConfig } from '@/features/data/components/acuity-api-builder';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, config }: { orgId: string; config: AcuityAPIConfig } = body;

    if (!orgId || !config) {
      return NextResponse.json({ 
        error: 'Organization ID and config are required' 
      }, { status: 400 });
    }

    // Get the Acuity integration credentials
    let integration;
    try {
      integration = await acuityIntegrationsService.getDecryptedIntegration(orgId);
    } catch (dbError: any) {
      console.warn('Database connection issue:', dbError.message);
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

    // Build the API call
    const { userId, apiKey } = integration;
    const authHeader = Buffer.from(`${userId}:${apiKey}`).toString('base64');

    // Prepare the URL - remove base URL since config.builtUrl already contains it
    let apiUrl = config.builtUrl;
    if (config.builtUrl.startsWith('https://acuityscheduling.com/api/v1')) {
      apiUrl = config.builtUrl;
    } else {
      // If for some reason it doesn't have the base URL, add it
      apiUrl = `https://acuityscheduling.com/api/v1${config.builtUrl}`;
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json'
      }
    };

    // Add body for POST/PUT requests
    if (config.method !== 'GET' && Object.keys(config.bodyParams).length > 0) {
      requestOptions.body = JSON.stringify(config.bodyParams);
    }

    // Make the API call
    const response = await fetch(apiUrl, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: `Acuity API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();

    // Update last synced time
    try {
      await acuityIntegrationsService.updateLastSynced(orgId);
    } catch (updateError) {
      console.warn('Failed to update last synced time:', updateError);
      // Don't fail the request for this
    }

    return NextResponse.json({
      success: true,
      data: Array.isArray(data) ? data : [data],
      metadata: {
        endpoint: config.builtUrl,
        method: config.method,
        queryParams: config.queryParams,
        bodyParams: config.bodyParams,
        totalRecords: Array.isArray(data) ? data.length : 1,
        retrievedAt: new Date()
      }
    });

  } catch (error: any) {
    console.error('Acuity custom API call error:', error);
    return NextResponse.json({
      error: 'Failed to make Acuity API call',
      details: error.message
    }, { status: 500 });
  }
} 