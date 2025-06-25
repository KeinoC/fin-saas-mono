import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from 'integrations/plaid';
import { supabase } from 'config';

export async function POST(request: NextRequest) {
  try {
    const { publicToken, orgId } = await request.json();

    if (!publicToken || !orgId) {
      return NextResponse.json(
        { success: false, error: 'Missing publicToken or orgId' },
        { status: 400 }
      );
    }

    const plaidClient = createPlaidClient();
    const result = await plaidClient.exchangePublicToken(publicToken);

    if (!result.success) {
      return NextResponse.json(result);
    }

    // Store the access token in the database
    const { error } = await supabase
      .from('accounts')
      .upsert({
        org_id: orgId,
        source: 'plaid',
        access_token: result.accessToken,
        last_synced_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to store account data' },
        { status: 500 }
      );
    }

    // Sync initial data
    const syncResult = await plaidClient.syncData(result.accessToken!);

    return NextResponse.json({
      success: true,
      accessToken: result.accessToken,
      itemId: result.itemId,
      syncData: syncResult.success ? syncResult.data : null,
    });
  } catch (error) {
    console.error('Plaid token exchange error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 