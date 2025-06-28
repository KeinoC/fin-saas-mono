# Acuity Scheduling Integration

This document outlines the Acuity Scheduling integration implementation for the K-Fin application.

## Overview

The Acuity integration allows organizations to connect their Acuity Scheduling account to sync appointment data, client information, and scheduling metrics with their financial data.

## Implementation

### Architecture

The Acuity integration follows a simplified API key authentication pattern:

1. **API Service** (`apps/web/lib/services/acuity-api.ts`)
   - Handles API Key authentication (HTTP Basic Auth)
   - Provides methods for API interactions
   - No system-level credentials required

2. **Database Service** (`packages/database/lib/acuity-integrations-service.ts`)
   - Uses existing `Account` model with `source: 'acuity'`
   - Encrypts and stores API keys
   - Manages permissions and organization access

3. **API Routes** (`apps/web/app/api/integrations/acuity/`)
   - `/connect` - Accepts and validates API credentials
   - `/test` - Tests connection and fetches sample data
   - `/disconnect` - Removes integration

4. **React Component** (`apps/web/features/integrations/components/acuity-integration.tsx`)
   - UI form for entering API credentials
   - Test connection functionality
   - Integration status display

### Authentication Flow

1. Admin clicks "Connect Acuity Scheduling" in integrations page
2. Form appears requesting Acuity User ID and API Key
3. App validates credentials by testing connection to Acuity API
4. If valid, credentials are encrypted and stored in database
5. Organization can now access Acuity data

### Database Schema

Uses the existing `Account` model:
```sql
- orgId: Organization ID
- source: 'acuity' (from IntegrationSource enum)
- accessToken: Encrypted Acuity API Key
- externalAccountId: Acuity User ID
- displayName: Account name from Acuity
- lastSyncedAt: Last time data was synced
```

## Environment Variables

**No system-level environment variables required!** Each organization provides their own credentials.

## Setup Instructions

### 1. Organization Gets Their Credentials

Each organization needs to get their credentials from Acuity:

1. Log in to their Acuity Scheduling account
2. Go to **Business Settings** → **Integrations**
3. Find their **User ID** and **API Key** in the API section
4. Copy these credentials

### 2. Connect Integration

1. Admin goes to organization integrations page
2. Clicks "Connect Acuity Scheduling"
3. Enters their Acuity User ID and API Key
4. System validates credentials and stores them securely

### 3. Test Connection

Use the "Test Connection" button to verify the integration is working properly.

## API Capabilities

The integration provides access to:

- **User Info** (`/api/v1/me`) - Account details
- **Appointments** (`/api/v1/appointments`) - Appointment data with filtering
- **Appointment Types** (`/api/v1/appointment-types`) - Service offerings
- **Calendars** (`/api/v1/calendars`) - Available calendars
- **Clients** (`/api/v1/clients`) - Customer data

## Authentication Details

Uses HTTP Basic Authentication:
- Username: Acuity User ID (numeric)
- Password: Acuity API Key
- Header: `Authorization: Basic <base64(userId:apiKey)>`

## Security Features

- API keys are encrypted using the application's encryption service
- Admin-only access control for connecting/disconnecting integrations
- Credentials are validated before storage
- Error handling for invalid credentials
- Per-organization credential isolation

## Testing

Use the "Test Connection" button in the integration UI to:
- Verify the stored credentials work
- Fetch sample data from Acuity
- Check API connectivity
- View account information

## Future Enhancements

Potential improvements:

1. **Data Sync Endpoints** - Regular sync of appointment data
2. **Webhook Support** - Real-time updates from Acuity
3. **Advanced Filtering** - Date ranges, appointment types, etc.
4. **Reporting Integration** - Include scheduling metrics in financial reports
5. **Bulk Operations** - Import historical data

## Error Handling

The integration handles common scenarios:

- Invalid credentials (connection test failure)
- API connectivity issues (graceful degradation)
- Permission errors (admin access required)
- Missing required fields (form validation)

## Files Created/Modified

### New Files
- `apps/web/lib/services/acuity-api.ts`
- `packages/database/lib/acuity-integrations-service.ts`
- `apps/web/app/api/integrations/acuity/connect/route.ts`
- `apps/web/app/api/integrations/acuity/test/route.ts`
- `apps/web/app/api/integrations/acuity/disconnect/route.ts`
- `apps/web/features/integrations/components/acuity-integration.tsx`

### Modified Files
- `apps/web/features/integrations/components/integration-connector.tsx` - Added Acuity support
- Existing schema already included `acuity` in `IntegrationSource` enum

## Benefits of API Key Approach

1. **Simpler Setup** - No OAuth app registration required
2. **Organization Control** - Each org uses their own credentials
3. **No System Dependencies** - No environment variables needed
4. **Direct Authentication** - Straightforward API key approach
5. **Better for Multi-tenant** - Each org manages their own integration

The integration is now ready for use. Organizations can connect their Acuity accounts using their own API credentials. 