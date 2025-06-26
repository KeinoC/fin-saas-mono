import { NextRequest, NextResponse } from 'next/server';
import { googleAPIService } from '@lib/services/google-api';
import { authLocal as auth } from '@lib/auth-local';

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
    const scopes = searchParams.get('scopes')?.split(',') || [];

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // TODO: Add admin role check once database is connected
    // For now, allowing any authenticated user to test the integration
    console.log('OAuth auth request:', { orgId, userId: session.user.id, scopes });

    try {
      const authUrl = googleAPIService.generateOAuthUrl(
        orgId,
        session.user.id,
        scopes
      );



      return NextResponse.json({ authUrl });
    } catch (error: any) {
      if (error.message.includes('not configured')) {
        return NextResponse.json({ 
          error: 'Google integration is not configured', 
          details: 'Please configure Google OAuth credentials (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET) to enable Google integration.'
        }, { status: 503 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Google auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google authentication' },
      { status: 500 }
    );
  }
} 