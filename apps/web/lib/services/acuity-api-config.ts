export interface AcuityEndpointParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  required?: boolean;
  description?: string;
  options?: { value: string | number; label: string }[];
}

export interface AcuityEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  description: string;
  hasIdParam?: boolean;
  idParamName?: string;
  queryParams?: AcuityEndpointParam[];
  bodyParams?: AcuityEndpointParam[];
  subEndpoints?: AcuitySubEndpoint[];
}

export interface AcuitySubEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  name: string;
  description: string;
  queryParams?: AcuityEndpointParam[];
  bodyParams?: AcuityEndpointParam[];
}

export const ACUITY_API_ENDPOINTS: Record<string, AcuityEndpoint> = {
  appointments: {
    path: '/appointments',
    method: 'GET',
    name: 'Appointments',
    description: 'Retrieve appointments',
    queryParams: [
      {
        name: 'minDate',
        type: 'date',
        description: 'Minimum date for appointments (YYYY-MM-DD)'
      },
      {
        name: 'maxDate',
        type: 'date',
        description: 'Maximum date for appointments (YYYY-MM-DD)'
      },
      {
        name: 'appointmentTypeID',
        type: 'number',
        description: 'Filter by appointment type ID'
      },
      {
        name: 'calendarID',
        type: 'number',
        description: 'Filter by calendar ID'
      },
      {
        name: 'max',
        type: 'number',
        description: 'Maximum number of results (default 20)'
      }
    ],
    subEndpoints: [
      {
        path: '/{id}',
        method: 'GET',
        name: 'Get Specific Appointment',
        description: 'Get details of a specific appointment'
      },
      {
        path: '/{id}/cancel',
        method: 'PUT',
        name: 'Cancel Appointment',
        description: 'Cancel a specific appointment'
      },
      {
        path: '/{id}/reschedule',
        method: 'PUT',
        name: 'Reschedule Appointment',
        description: 'Reschedule a specific appointment',
        bodyParams: [
          {
            name: 'datetime',
            type: 'string',
            required: true,
            description: 'New appointment datetime'
          }
        ]
      },
      {
        path: '/{id}/payments',
        method: 'GET',
        name: 'Appointment Payments',
        description: 'Get payments for a specific appointment'
      }
    ]
  },
  'appointment-types': {
    path: '/appointment-types',
    method: 'GET',
    name: 'Appointment Types',
    description: 'Get all appointment types'
  },
  'appointment-addons': {
    path: '/appointment-addons',
    method: 'GET',
    name: 'Appointment Add-ons',
    description: 'Get all appointment add-ons'
  },
  availability: {
    path: '/availability',
    method: 'GET',
    name: 'Availability',
    description: 'Check availability',
    subEndpoints: [
      {
        path: '/dates',
        method: 'GET',
        name: 'Available Dates',
        description: 'Get available dates',
        queryParams: [
          {
            name: 'appointmentTypeID',
            type: 'number',
            required: true,
            description: 'Appointment type ID'
          },
          {
            name: 'calendarID',
            type: 'number',
            description: 'Calendar ID'
          },
          {
            name: 'month',
            type: 'string',
            description: 'Month in YYYY-MM format'
          }
        ]
      },
      {
        path: '/times',
        method: 'GET',
        name: 'Available Times',
        description: 'Get available times for a date',
        queryParams: [
          {
            name: 'appointmentTypeID',
            type: 'number',
            required: true,
            description: 'Appointment type ID'
          },
          {
            name: 'date',
            type: 'date',
            required: true,
            description: 'Date in YYYY-MM-DD format'
          },
          {
            name: 'calendarID',
            type: 'number',
            description: 'Calendar ID'
          }
        ]
      },
      {
        path: '/classes',
        method: 'GET',
        name: 'Available Classes',
        description: 'Get available classes',
        queryParams: [
          {
            name: 'appointmentTypeID',
            type: 'number',
            description: 'Appointment type ID'
          },
          {
            name: 'month',
            type: 'string',
            description: 'Month in YYYY-MM format'
          }
        ]
      },
      {
        path: '/check-times',
        method: 'POST',
        name: 'Check Times',
        description: 'Check if specific times are available',
        bodyParams: [
          {
            name: 'appointmentTypeID',
            type: 'number',
            required: true,
            description: 'Appointment type ID'
          },
          {
            name: 'datetime',
            type: 'string',
            required: true,
            description: 'Datetime to check'
          }
        ]
      }
    ]
  },
  blocks: {
    path: '/blocks',
    method: 'GET',
    name: 'Blocks',
    description: 'Get calendar blocks',
    queryParams: [
      {
        name: 'minDate',
        type: 'date',
        description: 'Minimum date for blocks (YYYY-MM-DD)'
      },
      {
        name: 'maxDate',
        type: 'date',
        description: 'Maximum date for blocks (YYYY-MM-DD)'
      },
      {
        name: 'calendarID',
        type: 'number',
        description: 'Filter by calendar ID'
      }
    ],
    subEndpoints: [
      {
        path: '/{id}',
        method: 'GET',
        name: 'Get Specific Block',
        description: 'Get details of a specific block'
      },
      {
        path: '/{id}',
        method: 'DELETE',
        name: 'Delete Block',
        description: 'Delete a specific block'
      }
    ]
  },
  calendars: {
    path: '/calendars',
    method: 'GET',
    name: 'Calendars',
    description: 'Get all calendars'
  },
  certificates: {
    path: '/certificates',
    method: 'GET',
    name: 'Certificates',
    description: 'Get certificates',
    subEndpoints: [
      {
        path: '/check',
        method: 'GET',
        name: 'Check Certificate',
        description: 'Check certificate validity',
        queryParams: [
          {
            name: 'certificate',
            type: 'string',
            required: true,
            description: 'Certificate code'
          }
        ]
      },
      {
        path: '/{id}',
        method: 'DELETE',
        name: 'Delete Certificate',
        description: 'Delete a certificate'
      }
    ]
  },
  clients: {
    path: '/clients',
    method: 'GET',
    name: 'Clients',
    description: 'Get all clients',
    queryParams: [
      {
        name: 'max',
        type: 'number',
        description: 'Maximum number of results'
      }
    ]
  },
  forms: {
    path: '/forms',
    method: 'GET',
    name: 'Forms',
    description: 'Get all forms'
  },
  labels: {
    path: '/labels',
    method: 'GET',
    name: 'Labels',
    description: 'Get all labels'
  },
  me: {
    path: '/me',
    method: 'GET',
    name: 'Account Info',
    description: 'Get account information'
  },
  meta: {
    path: '/meta',
    method: 'GET',
    name: 'Meta Information',
    description: 'Get account meta information'
  },
  orders: {
    path: '/orders',
    method: 'GET',
    name: 'Orders',
    description: 'Get all orders',
    queryParams: [
      {
        name: 'minDate',
        type: 'date',
        description: 'Minimum date for orders (YYYY-MM-DD)'
      },
      {
        name: 'maxDate',
        type: 'date',
        description: 'Maximum date for orders (YYYY-MM-DD)'
      }
    ],
    subEndpoints: [
      {
        path: '/{id}',
        method: 'GET',
        name: 'Get Specific Order',
        description: 'Get details of a specific order'
      }
    ]
  },
  products: {
    path: '/products',
    method: 'GET',
    name: 'Products',
    description: 'Get all products'
  }
};

export function getEndpointDisplayName(endpoint: string, subEndpoint?: string): string {
  const baseEndpoint = ACUITY_API_ENDPOINTS[endpoint];
  if (!baseEndpoint) return endpoint;
  
  if (subEndpoint && baseEndpoint.subEndpoints) {
    const sub = baseEndpoint.subEndpoints.find(s => s.path === subEndpoint);
    return sub ? sub.name : `${baseEndpoint.name} ${subEndpoint}`;
  }
  
  return baseEndpoint.name;
}

export function getAvailableSubEndpoints(endpoint: string): AcuitySubEndpoint[] {
  return ACUITY_API_ENDPOINTS[endpoint]?.subEndpoints || [];
}

export function getEndpointParams(endpoint: string, subEndpoint?: string): {
  queryParams: AcuityEndpointParam[];
  bodyParams: AcuityEndpointParam[];
} {
  const baseEndpoint = ACUITY_API_ENDPOINTS[endpoint];
  if (!baseEndpoint) return { queryParams: [], bodyParams: [] };
  
  if (subEndpoint && baseEndpoint.subEndpoints) {
    const sub = baseEndpoint.subEndpoints.find(s => s.path === subEndpoint);
    return {
      queryParams: sub?.queryParams || [],
      bodyParams: sub?.bodyParams || []
    };
  }
  
  return {
    queryParams: baseEndpoint.queryParams || [],
    bodyParams: baseEndpoint.bodyParams || []
  };
} 