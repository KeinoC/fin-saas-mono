import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@lib/auth';

// Try to use the real data service, fall back to mock if there are issues
async function getDataRetrievalService() {
  try {
    const { dataRetrievalService } = await import('database/lib/data-retrieval-service');
    return dataRetrievalService;
  } catch (error) {
    console.warn('Real data service not available, using mock:', error);
    return mockDataRetrievalService();
  }
}

// Mock service for fallback
function mockDataRetrievalService() {
  return {
    getAvailableDataTypes: (source: string) => {
      const capabilities = {
        'acuity': ['appointments', 'clients', 'appointment_types', 'calendars'],
        'plaid': ['transactions', 'accounts', 'balances']
      };
      return capabilities[source as keyof typeof capabilities] || ['data'];
    },
    retrieveFromIntegration: async (integrationId: string, dataType: string, options: any) => {
      return generateMockDataForSource(integrationId.includes('acuity') ? 'acuity' : 'plaid', options);
    },
    retrieveFromAllIntegrations: async (orgId: string, options: any) => {
      const sources = ['acuity', 'plaid'];
      return sources.map(source => generateMockDataForSource(source, options));
    }
  };
}

function generateMockDataForSource(source: string, options: any) {
  const records = [];
  const count = Math.min(options.limit || 20, 20);
  
  for (let i = 0; i < count; i++) {
    switch (source) {
      case 'acuity':
        records.push({
          id: `acuity_${i + 1}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'appointment',
          client: `Client ${i + 1}`,
          service: 'Consultation',
          amount: Math.round(Math.random() * 500) + 50,
          status: ['completed', 'scheduled', 'cancelled'][Math.floor(Math.random() * 3)],
          source: 'Acuity Scheduling'
        });
        break;
      case 'plaid':
        records.push({
          id: `plaid_${i + 1}`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'transaction',
          description: ['Coffee Shop', 'Grocery Store', 'Gas Station', 'Restaurant', 'Online Purchase'][Math.floor(Math.random() * 5)],
          amount: Math.round((Math.random() * 200 + 10) * 100) / 100,
          category: ['Food', 'Transportation', 'Shopping', 'Entertainment'][Math.floor(Math.random() * 4)],
          account: 'Bank of America Checking',
          source: 'Plaid'
        });
        break;
    }
  }
  
  return {
    source,
    dataType: options.dataTypes?.[0] || 'data',
    records,
    metadata: {
      totalCount: records.length,
      retrievedAt: new Date(),
      integrationId: `mock_${source}_integration`,
      credentials: { type: 'mock' },
      dateRange: options.dateRange,
      integrationInfo: {
        id: source,
        name: `${source.charAt(0).toUpperCase() + source.slice(1)} Integration`,
        type: 'mock'
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      orgId,
      integrationId,
      integrationSource,
      dataTypes,
      dateRange,
      limit,
      filters,
      retrieveFromAll = false
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Build retrieval options
    const options = {
      startDate: dateRange?.start ? new Date(dateRange.start) : undefined,
      endDate: dateRange?.end ? new Date(dateRange.end) : undefined,
      limit,
      filters
    };

    const dataService = await getDataRetrievalService();
    let results;

    if (retrieveFromAll) {
      // Retrieve from all connected integrations
      results = await dataService.retrieveFromAllIntegrations(orgId, options);
    } else {
      // Retrieve from specific integration
      if (!integrationId) {
        return NextResponse.json({ 
          error: 'Integration ID required when not retrieving from all' 
        }, { status: 400 });
      }

      // For specific integration, we need the dataType (first one or default)
      const dataType = dataTypes?.[0] || 'appointments';

      const singleResult = await dataService.retrieveFromIntegration(
        integrationId,
        dataType,
        options
      );
      results = [singleResult];
    }

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        totalSources: results.length,
        totalRecords: results.reduce((sum, result) => sum + (result.metadata?.totalCount || 0), 0),
        retrievedAt: new Date()
      }
    });

  } catch (error: any) {
    console.error('Data retrieval error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve data',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to get available data types for integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const integrationSource = searchParams.get('source');
    const dataService = await getDataRetrievalService();

    if (integrationSource) {
      const dataTypes = dataService.getAvailableDataTypes(integrationSource as any);
      return NextResponse.json({ dataTypes });
    }

    // Return all capabilities
    const capabilities = {
      acuity: dataService.getAvailableDataTypes('acuity'),
      plaid: dataService.getAvailableDataTypes('plaid')
    };

    return NextResponse.json({ capabilities });

  } catch (error) {
    console.error('Error getting data capabilities:', error);
    return NextResponse.json({ error: 'Failed to get capabilities' }, { status: 500 });
  }
} 