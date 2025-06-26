import { NextRequest, NextResponse } from 'next/server';
import { googleIntegrationsStore } from '@lib/stores/google-integrations-store';
import { authLocal as auth } from '@lib/auth-local';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Clear existing test integrations
    googleIntegrationsStore.clear();

    // Create sample OAuth integration
    const oauthIntegration = googleIntegrationsStore.create({
      orgId,
      userId: session.user.id,
      authMethod: 'oauth',
      name: 'John Admin (OAuth)',
      email: 'john.admin@company.com',
      credentials: {
        accessToken: 'sample-access-token',
        refreshToken: 'sample-refresh-token',
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        tokenType: 'Bearer',
        expiryDate: Date.now() + 3600000, // 1 hour from now
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
    });

    // Update last used timestamp
    googleIntegrationsStore.update(oauthIntegration.id, { 
      lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    });

    // Create sample Service Account integration
    const serviceAccountIntegration = googleIntegrationsStore.create({
      orgId,
      userId: session.user.id,
      authMethod: 'service_account',
      name: 'K-Fin Production Service Account',
      email: 'k-fin-prod@company-project.iam.gserviceaccount.com',
      credentials: {
        type: 'service_account',
        project_id: 'company-project',
        private_key_id: 'sample-key-id',
        private_key: 'sample-private-key',
        client_email: 'k-fin-prod@company-project.iam.gserviceaccount.com',
        client_id: 'sample-client-id',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/k-fin-prod%40company-project.iam.gserviceaccount.com'
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    // Update last used timestamp
    googleIntegrationsStore.update(serviceAccountIntegration.id, { 
      lastUsedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Week ago
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test Google integrations created',
      integrations: [
        {
          id: oauthIntegration.id,
          authMethod: oauthIntegration.authMethod,
          name: oauthIntegration.name,
          email: oauthIntegration.email,
        },
        {
          id: serviceAccountIntegration.id,
          authMethod: serviceAccountIntegration.authMethod,
          name: serviceAccountIntegration.name,
          email: serviceAccountIntegration.email,
        }
      ]
    });

  } catch (error) {
    console.error('Test integration creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create test integrations' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    googleIntegrationsStore.clear();
    return NextResponse.json({ 
      success: true, 
      message: 'Test integrations cleared' 
    });
  } catch (error) {
    console.error('Clear integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to clear integrations' },
      { status: 500 }
    );
  }
} 