import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from 'integrations/plaid';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await request.json();

    if (!userId || !orgId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or orgId' },
        { status: 400 }
      );
    }

    const plaidClient = createPlaidClient();
    const result = await plaidClient.createLinkToken(userId, orgId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Plaid link token error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 