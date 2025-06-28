export interface AcuityCredentials {
  userId: string;
  apiKey: string;
}

export interface AcuityIntegration {
  id: string;
  orgId: string;
  userId: string;
  name: string;
  email?: string;
  credentials: AcuityCredentials;
  createdAt: Date;
  lastUsed?: Date;
}

export class AcuityAPIService {
  
  constructor() {
    // No system-level credentials needed for API key auth
  }

  async getUserInfo(credentials: AcuityCredentials): Promise<any> {
    const response = await fetch('https://acuityscheduling.com/api/v1/me', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.userId}:${credentials.apiKey}`).toString('base64'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from Acuity');
    }

    return response.json();
  }

  async testConnection(credentials: AcuityCredentials): Promise<boolean> {
    try {
      await this.getUserInfo(credentials);
      return true;
    } catch (error) {
      console.error('Acuity connection test failed:', error);
      return false;
    }
  }

  async getAppointments(credentials: AcuityCredentials, params?: {
    minDate?: string;
    maxDate?: string;
    appointmentTypeID?: number;
    calendarID?: number;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.minDate) searchParams.set('minDate', params.minDate);
    if (params?.maxDate) searchParams.set('maxDate', params.maxDate);
    if (params?.appointmentTypeID) searchParams.set('appointmentTypeID', params.appointmentTypeID.toString());
    if (params?.calendarID) searchParams.set('calendarID', params.calendarID.toString());

    const url = `https://acuityscheduling.com/api/v1/appointments${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.userId}:${credentials.apiKey}`).toString('base64'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointments from Acuity');
    }

    return response.json();
  }

  async getAppointmentTypes(credentials: AcuityCredentials): Promise<any[]> {
    const response = await fetch('https://acuityscheduling.com/api/v1/appointment-types', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.userId}:${credentials.apiKey}`).toString('base64'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment types from Acuity');
    }

    return response.json();
  }

  async getCalendars(credentials: AcuityCredentials): Promise<any[]> {
    const response = await fetch('https://acuityscheduling.com/api/v1/calendars', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.userId}:${credentials.apiKey}`).toString('base64'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch calendars from Acuity');
    }

    return response.json();
  }

  async getClients(credentials: AcuityCredentials): Promise<any[]> {
    const response = await fetch('https://acuityscheduling.com/api/v1/clients', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${credentials.userId}:${credentials.apiKey}`).toString('base64'),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch clients from Acuity');
    }

    return response.json();
  }
}

export const acuityAPIService = new AcuityAPIService(); 