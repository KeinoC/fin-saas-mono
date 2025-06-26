import { NextRequest, NextResponse } from 'next/server';
import { createPlaidClient } from 'integrations/plaid';
import { DatabaseService } from 'database';

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

    try {
      // Store the access token in the database
      const existingAccount = await DatabaseService.getAccount(orgId, 'plaid');
      
      if (existingAccount) {
        await DatabaseService.updateAccount(existingAccount.id, {
          accessToken: result.accessToken,
          lastSyncedAt: new Date(),
        });
      } else {
        await DatabaseService.createAccount({
          orgId,
          source: 'plaid',
          accessToken: result.accessToken,
          lastSyncedAt: new Date(),
        });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
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