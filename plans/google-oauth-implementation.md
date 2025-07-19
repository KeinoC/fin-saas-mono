# Google OAuth Implementation Plan for K-Fin

## Project Overview
This plan outlines the implementation of Google OAuth integration using Better Auth for the K-Fin financial management application. The integration will enable users to authenticate with Google and connect their Google accounts for data export to Google Sheets and Drive access.

## Current Tech Stack Analysis
- **Authentication**: Better Auth with organization plugin
- **Database**: PostgreSQL (production) / SQLite (development)
- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **Testing**: Jest + Testing Library
- **State Management**: Zustand

## Implementation Strategy

### Phase 1: Core Google OAuth Setup

#### 1.1 Environment Configuration
Update environment variables to support Google OAuth:

**Required Environment Variables:**
```bash
# Google OAuth (already configured in Better Auth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Better Auth (already configured)
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000  # dev
DATABASE_URL=your_postgres_connection_string
```

#### 1.2 Google Cloud Console Setup
1. **Enable APIs**:
   - Google+ API (for user info)
   - Google Sheets API 
   - Google Drive API

2. **OAuth 2.0 Credentials**:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

#### 1.3 Better Auth Configuration Updates
The auth configuration (`apps/web/lib/auth.ts`) already includes Google OAuth with required scopes:
- ✅ `userinfo.email` and `userinfo.profile`
- ✅ `spreadsheets` access
- ✅ `drive.file` access

### Phase 2: Database Schema Updates

#### 2.1 Add Google Integration Tracking
Add table to track Google OAuth tokens and integration status:

```sql
CREATE TABLE IF NOT EXISTS google_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  scope TEXT[],
  connected_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, org_id, google_user_id)
);
```

#### 2.2 Update Prisma Schema
Add GoogleIntegration model to `packages/database/prisma/schema.prisma`:

```prisma
model GoogleIntegration {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  orgId           String    @map("org_id") 
  googleUserId    String    @map("google_user_id")
  accessToken     String?   @map("access_token")
  refreshToken    String?   @map("refresh_token")
  tokenExpiresAt  DateTime? @map("token_expires_at")
  scope           String[]
  connectedAt     DateTime  @default(now()) @map("connected_at")
  lastSyncAt      DateTime? @map("last_sync_at")
  isActive        Boolean   @default(true) @map("is_active")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId, googleUserId])
  @@map("google_integrations")
}
```

### Phase 3: API Route Implementation

#### 3.1 Google OAuth Callback Handler
Create `/apps/web/app/api/integrations/google/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from '@/lib/services/google-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.redirect('/auth/login');
    }

    // Extract OAuth data from Better Auth session
    const googleAccount = session.user.accounts?.find(
      account => account.providerId === 'google'
    );

    if (!googleAccount) {
      throw new Error('Google account not found in session');
    }

    // Store Google integration
    await GoogleIntegrationsService.saveGoogleIntegration({
      userId: session.user.id,
      orgId: session.activeOrganizationId,
      googleAccount
    });

    return NextResponse.redirect('/integrations?success=google');
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect('/integrations?error=google_oauth');
  }
}
```

#### 3.2 Google Integration Status API
Create `/apps/web/app/api/integrations/google/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from '@/lib/services/google-integrations-service';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    const integration = await GoogleIntegrationsService.getGoogleIntegration(
      session.user.id,
      orgId
    );

    return NextResponse.json({
      isConnected: !!integration?.isActive,
      integration: integration ? {
        id: integration.id,
        connectedAt: integration.connectedAt,
        lastSyncAt: integration.lastSyncAt,
        scope: integration.scope
      } : null
    });
  } catch (error) {
    console.error('Google status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Phase 4: Service Layer Implementation

#### 4.1 Google Integrations Service
Update `packages/database/lib/google-integrations-service.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GoogleIntegrationsService {
  static async saveGoogleIntegration({
    userId,
    orgId,
    googleAccount
  }: {
    userId: string;
    orgId: string;
    googleAccount: any;
  }) {
    return await prisma.googleIntegration.upsert({
      where: {
        userId_orgId_googleUserId: {
          userId,
          orgId,
          googleUserId: googleAccount.accountId
        }
      },
      update: {
        accessToken: googleAccount.accessToken,
        refreshToken: googleAccount.refreshToken,
        tokenExpiresAt: googleAccount.expiresAt ? new Date(googleAccount.expiresAt) : null,
        scope: googleAccount.scope || [],
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId,
        orgId,
        googleUserId: googleAccount.accountId,
        accessToken: googleAccount.accessToken,
        refreshToken: googleAccount.refreshToken,
        tokenExpiresAt: googleAccount.expiresAt ? new Date(googleAccount.expiresAt) : null,
        scope: googleAccount.scope || []
      }
    });
  }

  static async getGoogleIntegration(userId: string, orgId: string) {
    return await prisma.googleIntegration.findFirst({
      where: {
        userId,
        orgId,
        isActive: true
      }
    });
  }

  static async disconnectGoogleIntegration(userId: string, orgId: string) {
    return await prisma.googleIntegration.updateMany({
      where: {
        userId,
        orgId
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
  }
}
```

#### 4.2 Google API Service  
Update `apps/web/lib/services/google-api.ts`:

```typescript
import { google } from 'googleapis';
import { GoogleIntegrationsService } from '@/lib/services/google-integrations-service';

export class GoogleAPIService {
  private static async getAuthClient(userId: string, orgId: string) {
    const integration = await GoogleIntegrationsService.getGoogleIntegration(userId, orgId);
    
    if (!integration?.accessToken) {
      throw new Error('Google integration not found or access token missing');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.tokenExpiresAt?.getTime()
    });

    return oauth2Client;
  }

  static async createSpreadsheet(
    userId: string,
    orgId: string,
    title: string,
    data: any[][]
  ) {
    const auth = await this.getAuthClient(userId, orgId);
    const sheets = google.sheets({ version: 'v4', auth });

    // Create spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title
        },
        sheets: [{
          properties: {
            title: 'Data'
          }
        }]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId!;

    // Add data to spreadsheet
    if (data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Data!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: data
        }
      });
    }

    return {
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    };
  }

  static async getUserInfo(userId: string, orgId: string) {
    const auth = await this.getAuthClient(userId, orgId);
    const oauth2 = google.oauth2({ version: 'v2', auth });
    
    const response = await oauth2.userinfo.get();
    return response.data;
  }
}
```

### Phase 5: Frontend Component Updates

#### 5.1 Enhanced Google Integration Component
Update `apps/web/features/integrations/components/google-integration-betterauth.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chrome, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useSession } from '@/lib/auth-client';

interface GoogleIntegrationProps {
  orgId: string;
}

interface GoogleIntegrationStatus {
  isConnected: boolean;
  integration: {
    id: string;
    connectedAt: string;
    lastSyncAt: string | null;
    scope: string[];
  } | null;
}

export function GoogleIntegrationBetterAuth({ orgId }: GoogleIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  // Load integration status on mount
  useEffect(() => {
    if (session?.user && orgId) {
      loadIntegrationStatus();
    }
  }, [session, orgId]);

  const loadIntegrationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/integrations/google/status?orgId=${orgId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load integration status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load Google integration status:', err);
      setError('Failed to load integration status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Use Better Auth's built-in Google OAuth
      const response = await authClient.signIn.social({
        provider: "google",
        callbackURL: `/integrations?connected=google&orgId=${orgId}`
      });
      
      // Better Auth returns a redirect URL
      if (response && 'url' in response && response.url) {
        window.location.href = response.url as string;
      }
    } catch (err) {
      console.error('Google connection error:', err);
      setError('Failed to connect to Google. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setError(null);
      
      const response = await fetch('/api/integrations/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect Google account');
      }
      
      await loadIntegrationStatus();
    } catch (err) {
      console.error('Google disconnect error:', err);
      setError('Failed to disconnect Google account.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleExportToSheets = async () => {
    try {
      // TODO: Implement export functionality
      console.log('Export to Google Sheets');
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export to Google Sheets.');
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.isConnected ?? false;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Chrome className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg text-foreground">Google Integration</CardTitle>
            <CardDescription>
              Connect your Google account to export data to Google Sheets
            </CardDescription>
          </div>
        </div>
        <div className="ml-auto">
          {isConnected ? (
            <Badge variant="default" className="bg-green-600/10 text-green-500">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center space-x-2 rounded-md bg-destructive/10 p-3 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isConnected && status?.integration && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Connected on: {new Date(status.integration.connectedAt).toLocaleDateString()}</p>
            {status.integration.lastSyncAt && (
              <p>Last sync: {new Date(status.integration.lastSyncAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Connecting your Google account will allow you to:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Export financial data to Google Sheets</li>
            <li>• Create automated reports</li>
            <li>• Share data with team members</li>
            <li>• Access Google Drive for file storage</li>
          </ul>
        </div>

        <div className="flex justify-between items-center pt-4">
          {!isConnected ? (
            <Button
              onClick={handleGoogleConnect}
              disabled={isConnecting || !session}
              className="w-full sm:w-auto"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Connect Google Account
                </>
              )}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportToSheets}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Sheets
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleGoogleDisconnect}
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Disconnect
              </Button>
            </div>
          )}
        </div>

        {!session && (
          <p className="text-sm text-amber-500 bg-amber-500/10 p-2 rounded">
            Please sign in to connect your Google account.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 6: Testing Implementation

#### 6.1 Unit Tests
Create `tests/features/integrations/google-oauth.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GoogleIntegrationBetterAuth } from '@/features/integrations/components/google-integration-betterauth';
import { authClient, useSession } from '@/lib/auth-client';

// Mock the auth client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      social: jest.fn()
    }
  },
  useSession: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignInSocial = authClient.signIn.social as jest.MockedFunction<typeof authClient.signIn.social>;

describe('GoogleIntegrationBetterAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders not connected state', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
      isPending: false
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isConnected: false, integration: null })
    });

    render(<GoogleIntegrationBetterAuth orgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Google Integration')).toBeInTheDocument();
      expect(screen.getByText('Not Connected')).toBeInTheDocument();
      expect(screen.getByText('Connect Google Account')).toBeInTheDocument();
    });
  });

  it('renders connected state', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
      isPending: false
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isConnected: true,
        integration: {
          id: 'integration-1',
          connectedAt: '2024-01-01T00:00:00Z',
          lastSyncAt: null,
          scope: ['spreadsheets', 'drive.file']
        }
      })
    });

    render(<GoogleIntegrationBetterAuth orgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Export to Sheets')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });
  });

  it('handles Google OAuth connection', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
      isPending: false
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isConnected: false, integration: null })
    });

    mockSignInSocial.mockResolvedValueOnce({
      url: 'https://accounts.google.com/oauth/authorize?...'
    });

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });

    render(<GoogleIntegrationBetterAuth orgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Connect Google Account')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Connect Google Account'));

    await waitFor(() => {
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/integrations?connected=google&orgId=org-1'
      });
    });
  });

  it('handles disconnect', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
      isPending: false
    });

    // Mock initial connected state
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          isConnected: true,
          integration: {
            id: 'integration-1',
            connectedAt: '2024-01-01T00:00:00Z',
            lastSyncAt: null,
            scope: ['spreadsheets']
          }
        })
      })
      // Mock disconnect response
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      // Mock status check after disconnect
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isConnected: false, integration: null })
      });

    render(<GoogleIntegrationBetterAuth orgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Disconnect'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/integrations/google/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: 'org-1' })
      });
    });
  });

  it('shows error states', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
      isPending: false
    });

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<GoogleIntegrationBetterAuth orgId="org-1" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load integration status')).toBeInTheDocument();
    });
  });
});
```

#### 6.2 Integration Tests
Create `tests/api/integrations/google-oauth.integration.test.ts`:

```typescript
import { NextRequest } from 'next/server';
import { GET as statusHandler } from '@/app/api/integrations/google/status/route';
import { auth } from '@/lib/auth';
import { GoogleIntegrationsService } from '@/lib/services/google-integrations-service';

// Mock auth and service
jest.mock('@/lib/auth');
jest.mock('@/lib/services/google-integrations-service');

const mockAuth = auth as jest.Mocked<typeof auth>;
const mockService = GoogleIntegrationsService as jest.Mocked<typeof GoogleIntegrationsService>;

describe('/api/integrations/google/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns integration status for authenticated user', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' }
    };

    const mockIntegration = {
      id: 'integration-1',
      userId: 'user-1',
      orgId: 'org-1',
      connectedAt: new Date('2024-01-01'),
      lastSyncAt: null,
      scope: ['spreadsheets'],
      isActive: true
    };

    mockAuth.api.getSession.mockResolvedValueOnce(mockSession);
    mockService.getGoogleIntegration.mockResolvedValueOnce(mockIntegration);

    const request = new NextRequest('http://localhost:3000/api/integrations/google/status?orgId=org-1');
    
    const response = await statusHandler(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isConnected: true,
      integration: {
        id: 'integration-1',
        connectedAt: mockIntegration.connectedAt,
        lastSyncAt: null,
        scope: ['spreadsheets']
      }
    });
  });

  it('returns unauthorized for unauthenticated user', async () => {
    mockAuth.api.getSession.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/integrations/google/status?orgId=org-1');
    
    const response = await statusHandler(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('returns bad request when orgId is missing', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com' }
    };

    mockAuth.api.getSession.mockResolvedValueOnce(mockSession);

    const request = new NextRequest('http://localhost:3000/api/integrations/google/status');
    
    const response = await statusHandler(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Organization ID required' });
  });
});
```

### Phase 7: Documentation Updates

#### 7.1 Update Main OAuth Setup Guide
Update the existing `GOOGLE_OAUTH_SETUP.md` to reflect Better Auth integration:

```markdown
# Google OAuth Setup for K-Fin (Better Auth)

## Overview
K-Fin uses Better Auth for authentication, including Google OAuth integration. This setup enables users to connect their Google accounts for exporting financial data to Google Sheets and accessing Google Drive.

## Prerequisites
- Google Cloud Project with enabled APIs
- Better Auth configured (already done)
- Database with Google integrations table

## Quick Setup

### 1. Google Cloud Console Configuration

#### Enable Required APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Enable these APIs:
   - Google+ API
   - Google Sheets API  
   - Google Drive API

#### Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Set Application type to **Web application**
4. Configure redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

### 2. Environment Variables
Ensure these variables are set in your `.env.local` (development) or deployment environment:

```bash
# Google OAuth (required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Better Auth (already configured)
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=your_postgres_connection_string
```

### 3. Database Migration
Run the Prisma migration to add Google integrations table:

```bash
npx prisma migrate dev --name add-google-integrations
```

### 4. Test the Integration
1. Start the development server: `npm run dev`
2. Navigate to the integrations page
3. Click "Connect Google Account"
4. Complete the OAuth flow
5. Verify connection status shows "Connected"

## API Endpoints

### Authentication Flow
- **OAuth Initiation**: `POST /api/auth/signin` (handled by Better Auth)
- **OAuth Callback**: `GET /api/auth/callback/google` (handled by Better Auth)

### Integration Management
- **Status Check**: `GET /api/integrations/google/status?orgId={orgId}`
- **Disconnect**: `POST /api/integrations/google/disconnect`

### Google API Operations
- **Export to Sheets**: `POST /api/integrations/google/export`
- **User Info**: `GET /api/integrations/google/userinfo`

## Troubleshooting

### Common Issues

#### "Google integration is not configured"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Restart development server after setting variables

#### "redirect_uri_mismatch"  
- Ensure redirect URI in Google Console exactly matches:
  - Dev: `http://localhost:3000/api/auth/callback/google`
  - Prod: `https://yourdomain.com/api/auth/callback/google`

#### "Access denied" or "invalid_client"
- Check OAuth consent screen configuration
- Verify client ID/secret are correct
- Ensure APIs are enabled in Google Cloud Console

#### "Integration not found"
- User may need to reconnect their Google account
- Check database connection and table structure

### Development Tips
1. Use Google Cloud Console's "Testing" mode for OAuth consent
2. Add test email addresses to "Test users" section
3. Monitor browser network tab for API call debugging
4. Check server logs for detailed error messages

## Production Deployment

### Before Going Live
1. **Verify OAuth consent screen** with Google
2. **Update redirect URIs** to production domains
3. **Set environment variables** in production environment
4. **Test integration** in staging environment
5. **Monitor error rates** after deployment

### Environment Variables for Production
```bash
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
BETTER_AUTH_URL=https://yourdomain.com
DATABASE_URL=prod_postgres_connection
```

## Security Considerations
- Store refresh tokens securely in database
- Implement token refresh logic for expired access tokens
- Use HTTPS in production for all OAuth flows
- Regularly audit connected integrations
- Implement rate limiting for Google API calls

## Additional Resources
- [Better Auth Documentation](https://better-auth.com)
- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google Sheets API Reference](https://developers.google.com/sheets/api)
- [Google Drive API Reference](https://developers.google.com/drive/api)
```

## Implementation Checklist

### Phase 1: Core Setup ✅
- [x] Better Auth already configured with Google OAuth
- [x] Environment variables structure defined
- [ ] Update Google Cloud Console redirect URIs

### Phase 2: Database ✅
- [ ] Add GoogleIntegration model to Prisma schema
- [ ] Create and run database migration
- [ ] Update database service

### Phase 3: API Routes
- [ ] Create Google OAuth callback handler
- [ ] Create integration status API
- [ ] Create disconnect API
- [ ] Create export API

### Phase 4: Services
- [ ] Implement GoogleIntegrationsService
- [ ] Implement GoogleAPIService
- [ ] Add token refresh logic

### Phase 5: Frontend
- [ ] Update GoogleIntegrationBetterAuth component
- [ ] Add connection status checking
- [ ] Implement disconnect functionality
- [ ] Add export to Sheets feature

### Phase 6: Testing
- [ ] Unit tests for components
- [ ] Integration tests for API routes
- [ ] E2E tests for OAuth flow
- [ ] Manual testing checklist

### Phase 7: Documentation
- [ ] Update setup guide
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] Production deployment guide

## Success Criteria
1. ✅ Users can authenticate with Google OAuth through Better Auth
2. ✅ Google account connection persists across sessions
3. ✅ Users can export financial data to Google Sheets
4. ✅ Users can disconnect Google integration
5. ✅ Error handling and user feedback work correctly
6. ✅ All tests pass
7. ✅ Documentation is complete and accurate

## Timeline
- **Phase 1-2**: Database and core setup (1 day)
- **Phase 3-4**: API and services implementation (2 days) 
- **Phase 5**: Frontend implementation (2 days)
- **Phase 6**: Testing and QA (1 day)
- **Phase 7**: Documentation and deployment (1 day)

**Total Estimated Time: 7 days**