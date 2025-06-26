import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuth, JWT } from 'google-auth-library';

export type GoogleAuthMethod = 'oauth' | 'service_account';

export interface GoogleOAuthCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
}

export interface GoogleServiceAccountCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export interface GoogleIntegration {
  id: string;
  orgId: string;
  userId?: string; // Optional for service accounts
  authMethod: GoogleAuthMethod;
  name: string; // Friendly name for the integration
  email: string;
  credentials: GoogleOAuthCredentials | GoogleServiceAccountCredentials;
  scopes: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export class GoogleAPIService {
  private oauth2Client: OAuth2Client;
  
  constructor() {
    // Check for required environment variables
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('Google OAuth credentials not configured. Using dummy client for development.');
      // Create a dummy client for development - will fail gracefully
      this.oauth2Client = new google.auth.OAuth2(
        'dummy-client-id',
        'dummy-client-secret',
        this.getRedirectUri()
      );
    } else {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        this.getRedirectUri()
      );
    }
  }

  private getRedirectUri(): string {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL 
      : 'http://localhost:3000';
    return `${baseUrl}/api/integrations/google/callback`;
  }

  // OAuth Methods
  generateOAuthUrl(orgId: string, userId: string, scopes: string[] = []): string {
    // Check if Google OAuth is properly configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    const defaultScopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    const allScopes = [...new Set([...defaultScopes, ...scopes])];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: allScopes,
      prompt: 'consent',
      state: JSON.stringify({ orgId, userId, authMethod: 'oauth' }),
    });
  }

  async getTokensFromCode(code: string): Promise<GoogleOAuthCredentials> {
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
      expiry_date: tokens.expiry_date,
    };
  }

  // Service Account Methods
  createServiceAccountAuth(credentials: GoogleServiceAccountCredentials, scopes: string[]): JWT {
    return new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes,
    });
  }

  validateServiceAccountCredentials(credentials: GoogleServiceAccountCredentials): boolean {
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 'private_key',
      'client_email', 'client_id', 'auth_uri', 'token_uri'
    ];

    return requiredFields.every(field => 
      credentials[field as keyof GoogleServiceAccountCredentials]
    ) && credentials.type === 'service_account';
  }

  // Universal Auth Client Creation
  createAuthenticatedClient(integration: GoogleIntegration): OAuth2Client | JWT {
    if (integration.authMethod === 'oauth') {
      const credentials = integration.credentials as GoogleOAuthCredentials;
      const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        this.getRedirectUri()
      );

      client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        scope: credentials.scope,
        token_type: credentials.token_type,
        expiry_date: credentials.expiry_date,
      });

      return client;
    } else {
      const credentials = integration.credentials as GoogleServiceAccountCredentials;
      return this.createServiceAccountAuth(credentials, integration.scopes);
    }
  }

  // Google Sheets Operations (Universal)
  async createSpreadsheet(
    integration: GoogleIntegration, 
    title: string, 
    data?: any[][]
  ): Promise<any> {
    const auth = this.createAuthenticatedClient(integration);
    const sheets = google.sheets({ version: 'v4', auth });

    const resource = {
      properties: {
        title,
      },
    };

    const spreadsheet = await sheets.spreadsheets.create({
      resource,
      fields: 'spreadsheetId,spreadsheetUrl',
    });

    // Add data if provided
    if (data && data.length > 0) {
      await this.updateSpreadsheetData(
        integration,
        spreadsheet.data.spreadsheetId!,
        'Sheet1!A1',
        data
      );
    }

    return spreadsheet.data;
  }

  async updateSpreadsheetData(
    integration: GoogleIntegration,
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<any> {
    const auth = this.createAuthenticatedClient(integration);
    const sheets = google.sheets({ version: 'v4', auth });

    return await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });
  }

  async getSpreadsheetData(
    integration: GoogleIntegration,
    spreadsheetId: string,
    range: string
  ): Promise<any[][]> {
    const auth = this.createAuthenticatedClient(integration);
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values || [];
  }

  async listSpreadsheets(integration: GoogleIntegration): Promise<any[]> {
    const auth = this.createAuthenticatedClient(integration);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    return response.data.files || [];
  }

  // OAuth-specific methods
  async refreshOAuthToken(credentials: GoogleOAuthCredentials): Promise<GoogleOAuthCredentials> {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      this.getRedirectUri()
    );
    
    client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    try {
      const { credentials: newCredentials } = await client.refreshAccessToken();
      
      return {
        ...credentials,
        access_token: newCredentials.access_token!,
        expiry_date: newCredentials.expiry_date,
      };
    } catch (error) {
      console.error('Failed to refresh OAuth token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  async getOAuthUserInfo(credentials: GoogleOAuthCredentials): Promise<any> {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      this.getRedirectUri()
    );
    
    client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const response = await oauth2.userinfo.get();
    return response.data;
  }

  // Service Account-specific methods
  async getServiceAccountInfo(credentials: GoogleServiceAccountCredentials): Promise<any> {
    return {
      email: credentials.client_email,
      projectId: credentials.project_id,
      type: 'service_account',
    };
  }

  // Test connection method
  async testConnection(integration: GoogleIntegration): Promise<boolean> {
    try {
      const auth = this.createAuthenticatedClient(integration);
      
      if (integration.authMethod === 'oauth') {
        const oauth2 = google.oauth2({ version: 'v2', auth });
        await oauth2.userinfo.get();
      } else {
        // For service accounts, test by listing a few files
        const drive = google.drive({ version: 'v3', auth });
        await drive.files.list({ pageSize: 1 });
      }
      
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Share spreadsheet with specific users
  async shareSpreadsheet(
    integration: GoogleIntegration,
    spreadsheetId: string,
    emails: string[],
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    const auth = this.createAuthenticatedClient(integration);
    const drive = google.drive({ version: 'v3', auth });

    for (const email of emails) {
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role,
            type: 'user',
            emailAddress: email,
          },
          sendNotificationEmail: true,
        });
      } catch (error) {
        console.warn(`Failed to share spreadsheet with ${email}:`, error);
        // Continue with other emails even if one fails
      }
    }
  }

  // Share with organization domain (for Google Workspace organizations)
  async shareSpreadsheetWithDomain(
    integration: GoogleIntegration,
    spreadsheetId: string,
    domain: string,
    role: 'reader' | 'writer' | 'commenter' = 'reader'
  ): Promise<void> {
    const auth = this.createAuthenticatedClient(integration);
    const drive = google.drive({ version: 'v3', auth });

    try {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role,
          type: 'domain',
          domain,
        },
      });
    } catch (error) {
      console.error(`Failed to share spreadsheet with domain ${domain}:`, error);
      throw error;
    }
  }

  // Create a shared folder for organization
  async createSharedFolder(
    integration: GoogleIntegration,
    folderName: string,
    parentFolderId?: string
  ): Promise<any> {
    const auth = this.createAuthenticatedClient(integration);
    const drive = google.drive({ version: 'v3', auth });

    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name, webViewLink',
    });

    return folder.data;
  }

  // Move file to folder
  async moveToFolder(
    integration: GoogleIntegration,
    fileId: string,
    folderId: string
  ): Promise<void> {
    const auth = this.createAuthenticatedClient(integration);
    const drive = google.drive({ version: 'v3', auth });

    // Get current parents
    const file = await drive.files.get({
      fileId,
      fields: 'parents',
    });

    const previousParents = file.data.parents?.join(',') || '';

    // Move file to new folder
    await drive.files.update({
      fileId,
      addParents: folderId,
      removeParents: previousParents,
    });
  }

  // Utility method to get required scopes for different operations
  static getRequiredScopes(operations: string[]): string[] {
    const scopeMap: Record<string, string[]> = {
      'sheets_read': ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      'sheets_write': ['https://www.googleapis.com/auth/spreadsheets'],
      'drive_read': ['https://www.googleapis.com/auth/drive.readonly'],
      'drive_write': ['https://www.googleapis.com/auth/drive.file'],
      'profile': ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    };

    const allScopes = new Set<string>();
    operations.forEach(op => {
      const scopes = scopeMap[op] || [];
      scopes.forEach(scope => allScopes.add(scope));
    });

    return Array.from(allScopes);
  }
}

export const googleAPIService = new GoogleAPIService(); 