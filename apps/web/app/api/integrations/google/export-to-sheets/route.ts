import { NextRequest, NextResponse } from 'next/server';
import { googleAPIService } from '@lib/services/google-api';
import { authLocal as auth } from '@lib/auth-local';
import { googleIntegrationsStore } from '@lib/stores/google-integrations-store';

export async function POST(request: NextRequest) {
  try {
    // For development, skip auth check if database is not available
    let session = null;
    try {
      session = await auth.api.getSession({
        headers: request.headers,
      });
    } catch (authError) {
      console.warn('Auth check failed, using mock session for development:', authError);
      // Mock session for development
      session = {
        user: {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User'
        }
      };
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { integrationId, fileName, data, shareWithOrg = true } = body;

    if (!integrationId || !fileName || !data?.length) {
      return NextResponse.json({ 
        error: 'Integration ID, file name, and data are required' 
      }, { status: 400 });
    }

    // Get the integration from temporary store
    const integration = googleIntegrationsStore.findById(integrationId);

    if (!integration || !integration.isActive) {
      return NextResponse.json(
        { error: 'Integration not found or inactive' },
        { status: 404 }
      );
    }

    // TODO: Add org membership check when user management is implemented
    // For now, allowing any authenticated user to use any integration

    // Add metadata to the sheet
    const sheetData = [
      // Header with metadata
      [`Exported by: ${session.user.name || session.user.email}`],
      [`Export Date: ${new Date().toLocaleString()}`],
      [`Organization: ${integration.name}`],
      [''], // Empty row separator
      ...data
    ];

    // Create the spreadsheet
    const spreadsheet = await googleAPIService.createSpreadsheet(
      integration,
      fileName,
      sheetData
    );

    if (!spreadsheet) {
      throw new Error('Failed to create spreadsheet');
    }

    // If it's a service account and shareWithOrg is true, 
    // we can set up sharing permissions here
    if (integration.authMethod === 'service_account' && shareWithOrg) {
      try {
        await shareSpreadsheetWithOrg(integration, spreadsheet.spreadsheetId);
      } catch (error) {
        console.warn('Failed to share spreadsheet with organization:', error);
        // Don't fail the entire export if sharing fails
      }
    }

    // Update integration last used timestamp
    googleIntegrationsStore.update(integrationId, { lastUsedAt: new Date() });

    // Log the export activity (console for now)
    console.log('Export activity:', {
      userId: session.user.id,
      orgId: integration.orgId,
      action: 'GOOGLE_SHEETS_EXPORT',
      fileName,
      spreadsheetId: spreadsheet.spreadsheetId,
      rowCount: data.length,
      integrationMethod: integration.authMethod,
    });

    return NextResponse.json({
      success: true,
      spreadsheetId: spreadsheet.spreadsheetId,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      rowsExported: data.length,
    });

  } catch (error: any) {
    console.error('Google Sheets export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export to Google Sheets' },
      { status: 500 }
    );
  }
}

// Helper function to share spreadsheet with organization members
async function shareSpreadsheetWithOrg(integration: any, spreadsheetId: string) {
  // You'll implement this based on your organization structure
  // This is a simplified example
  
  /*
  // Get all organization members
  const orgMembers = await db.organizationUser.findMany({
    where: { orgId: integration.orgId },
    include: { user: true },
  });

  const auth = googleAPIService.createAuthenticatedClient(integration);
  const drive = google.drive({ version: 'v3', auth });

  // Share with each org member
  for (const member of orgMembers) {
    if (member.user.email) {
      try {
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: 'writer', // or 'reader' if you prefer
            type: 'user',
            emailAddress: member.user.email,
          },
        });
      } catch (error) {
        console.warn(`Failed to share with ${member.user.email}:`, error);
      }
    }
  }
  */
  
  console.log('Would share spreadsheet with organization members');
}

// GET endpoint to retrieve available integrations for the user's organizations
export async function GET(request: NextRequest) {
  try {
    // For development, skip auth check if database is not available
    let session = null;
    try {
      session = await auth.api.getSession({
        headers: request.headers,
      });
    } catch (authError) {
      console.warn('Auth check failed, using mock session for development:', authError);
      // Mock session for development
      session = {
        user: {
          id: 'dev-user-123',
          email: 'dev@example.com',
          name: 'Development User'
        }
      };
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Get integrations for the organization from temporary store
    // TODO: Add org membership check when user management is implemented
    
    const integrations = googleIntegrationsStore.findByOrg(orgId)
      .map(integration => ({
        id: integration.id,
        authMethod: integration.authMethod,
        name: integration.name,
        email: integration.email,
        scopes: integration.scopes,
        lastUsedAt: integration.lastUsedAt,
        createdAt: integration.createdAt,
      }));

    return NextResponse.json({ integrations });

  } catch (error) {
    console.error('Failed to fetch Google integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
} 