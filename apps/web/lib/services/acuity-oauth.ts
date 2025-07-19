/**
 * Acuity Scheduling OAuth 2.0 Service
 * 
 * Handles OAuth 2.0 flow for Acuity Scheduling integration
 * Docs: https://developers.acuityscheduling.com/docs/oauth2
 */

interface AcuityOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface AcuityTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  user_id: number;
}

interface AcuityUserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  timezone: string;
}

interface AcuityAppointment {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  datetime: string;
  price: string;
  type: string;
  appointmentTypeID: number;
  calendarID: number;
  certificate?: string;
  confirmationPage?: string;
  formsText?: string;
  notes?: string;
  timezone: string;
  calendarTimezone: string;
  canceled: boolean;
  canClientCancel: boolean;
  canClientReschedule: boolean;
}

export class AcuityOAuthService {
  private readonly config: AcuityOAuthConfig;
  private readonly baseUrl = 'https://acuityscheduling.com';
  private readonly apiUrl = 'https://acuityscheduling.com/api/v1';

  constructor() {
    this.config = {
      clientId: process.env.ACUITY_OAUTH_CLIENT_ID!,
      clientSecret: process.env.ACUITY_OAUTH_CLIENT_SECRET!,
      redirectUri: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/integrations/acuity/oauth/callback`
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Acuity OAuth credentials not configured. Please set ACUITY_OAUTH_CLIENT_ID and ACUITY_OAUTH_CLIENT_SECRET');
    }
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  getAuthorizationUrl(orgId: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'api-v1',
      state: orgId, // Use orgId as state parameter for security
    });

    return `${this.baseUrl}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<AcuityTokenResponse> {
    const response = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      }).toString()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<AcuityUserInfo> {
    const response = await fetch(`${this.apiUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get appointments from Acuity API
   */
  async getAppointments(
    accessToken: string, 
    options: {
      minDate?: string;
      maxDate?: string;
      calendarID?: number;
      appointmentTypeID?: number;
      limit?: number;
    } = {}
  ): Promise<AcuityAppointment[]> {
    const params = new URLSearchParams();
    
    if (options.minDate) params.append('minDate', options.minDate);
    if (options.maxDate) params.append('maxDate', options.maxDate);
    if (options.calendarID) params.append('calendarID', options.calendarID.toString());
    if (options.appointmentTypeID) params.append('appointmentTypeID', options.appointmentTypeID.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const url = `${this.apiUrl}/appointments${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get appointments: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Test connection with access token
   */
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch (error) {
      console.error('Acuity OAuth connection test failed:', error);
      return false;
    }
  }

  /**
   * Disconnect/revoke OAuth access
   */
  async disconnect(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/oauth2/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to disconnect Acuity OAuth:', error);
      return false;
    }
  }
}

export const acuityOAuthService = new AcuityOAuthService();