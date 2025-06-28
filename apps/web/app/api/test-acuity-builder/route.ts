import { NextRequest, NextResponse } from 'next/server';
import { ACUITY_API_ENDPOINTS, getEndpointDisplayName, getEndpointParams } from '@/lib/services/acuity-api-config';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('test') || 'endpoints';

  switch (testType) {
    case 'endpoints':
      return NextResponse.json({
        message: 'Available Acuity API endpoints configured in the builder',
        endpoints: Object.keys(ACUITY_API_ENDPOINTS).map(key => ({
          key,
          name: getEndpointDisplayName(key),
          endpoint: ACUITY_API_ENDPOINTS[key],
          hasSubEndpoints: (ACUITY_API_ENDPOINTS[key].subEndpoints?.length || 0) > 0
        }))
      });

    case 'appointments':
      const { queryParams, bodyParams } = getEndpointParams('appointments');
      return NextResponse.json({
        endpoint: 'appointments',
        displayName: getEndpointDisplayName('appointments'),
        description: ACUITY_API_ENDPOINTS.appointments.description,
        method: ACUITY_API_ENDPOINTS.appointments.method,
        queryParams,
        bodyParams,
        subEndpoints: ACUITY_API_ENDPOINTS.appointments.subEndpoints,
        exampleUrls: [
          'https://acuityscheduling.com/api/v1/appointments',
          'https://acuityscheduling.com/api/v1/appointments?max=10',
          'https://acuityscheduling.com/api/v1/appointments?minDate=2024-01-01&maxDate=2024-12-31',
          'https://acuityscheduling.com/api/v1/appointments/12345',
          'https://acuityscheduling.com/api/v1/appointments/12345/cancel'
        ]
      });

    case 'availability':
      const availabilityParams = getEndpointParams('availability');
      return NextResponse.json({
        endpoint: 'availability',
        displayName: getEndpointDisplayName('availability'),
        description: ACUITY_API_ENDPOINTS.availability.description,
        subEndpoints: ACUITY_API_ENDPOINTS.availability.subEndpoints?.map(sub => ({
          ...sub,
          params: getEndpointParams('availability', sub.path)
        })),
        exampleUrls: [
          'https://acuityscheduling.com/api/v1/availability/dates?appointmentTypeID=123',
          'https://acuityscheduling.com/api/v1/availability/times?appointmentTypeID=123&date=2024-01-15',
          'https://acuityscheduling.com/api/v1/availability/classes?month=2024-01'
        ]
      });

    case 'mock-call':
      const endpoint = searchParams.get('endpoint') || 'appointments';
      const subEndpoint = searchParams.get('subEndpoint');
      const idValue = searchParams.get('id');
      
      let mockUrl = `https://acuityscheduling.com/api/v1${ACUITY_API_ENDPOINTS[endpoint]?.path || '/appointments'}`;
      
      if (subEndpoint && idValue) {
        mockUrl += subEndpoint.replace('{id}', idValue);
      } else if (subEndpoint) {
        mockUrl += subEndpoint;
      }

      const mockData = generateMockAcuityData(endpoint, subEndpoint || undefined);

      return NextResponse.json({
        success: true,
        mockCall: true,
        config: {
          endpoint,
          subEndpoint,
          idValue,
          builtUrl: mockUrl,
          method: ACUITY_API_ENDPOINTS[endpoint]?.method || 'GET'
        },
        data: mockData,
        metadata: {
          totalRecords: Array.isArray(mockData) ? mockData.length : 1,
          retrievedAt: new Date(),
          note: 'This is mock data - replace with real Acuity credentials to get actual data'
        }
      });

    default:
      return NextResponse.json({
        error: 'Invalid test type',
        availableTests: ['endpoints', 'appointments', 'availability', 'mock-call'],
        examples: [
          '/api/test-acuity-builder?test=endpoints',
          '/api/test-acuity-builder?test=appointments',
          '/api/test-acuity-builder?test=availability',
          '/api/test-acuity-builder?test=mock-call&endpoint=appointments&subEndpoint=/12345'
        ]
      });
  }
}

function generateMockAcuityData(endpoint: string, subEndpoint?: string) {
  switch (endpoint) {
    case 'appointments':
      if (subEndpoint?.includes('{id}') || subEndpoint?.includes('/12345')) {
        return {
          id: 12345,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '(555) 123-4567',
          datetime: '2024-01-15T14:30:00',
          appointmentTypeID: 123,
          calendarID: 1,
          price: '$150.00',
          status: 'confirmed',
          notes: 'First consultation appointment'
        };
      }
      return [
        {
          id: 12345,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          datetime: '2024-01-15T14:30:00',
          appointmentTypeID: 123,
          price: '$150.00',
          status: 'confirmed'
        },
        {
          id: 12346,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          datetime: '2024-01-16T10:00:00',
          appointmentTypeID: 124,
          price: '$200.00',
          status: 'scheduled'
        },
        {
          id: 12347,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          datetime: '2024-01-17T16:00:00',
          appointmentTypeID: 123,
          price: '$150.00',
          status: 'confirmed'
        }
      ];

    case 'clients':
      return [
        {
          id: 1001,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '(555) 123-4567',
          created: '2024-01-01T00:00:00'
        },
        {
          id: 1002,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '(555) 987-6543',
          created: '2024-01-02T00:00:00'
        }
      ];

    case 'availability':
      if (subEndpoint?.includes('dates')) {
        return [
          { date: '2024-01-15', slots: 5 },
          { date: '2024-01-16', slots: 3 },
          { date: '2024-01-17', slots: 8 }
        ];
      }
      if (subEndpoint?.includes('times')) {
        return [
          { time: '09:00:00', available: true },
          { time: '10:00:00', available: true },
          { time: '11:00:00', available: false },
          { time: '14:00:00', available: true },
          { time: '15:00:00', available: true }
        ];
      }
      return { message: 'Availability endpoint - specify dates or times' };

    case 'appointment-types':
      return [
        {
          id: 123,
          name: 'Initial Consultation',
          duration: 60,
          price: '$150.00',
          active: true
        },
        {
          id: 124,
          name: 'Follow-up Session',
          duration: 45,
          price: '$200.00',
          active: true
        }
      ];

    default:
      return { message: `Mock data for ${endpoint}`, endpoint, subEndpoint };
  }
} 