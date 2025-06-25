import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { z } from 'zod';

const PlaidConfigSchema = z.object({
  clientId: z.string(),
  secret: z.string(),
  environment: z.enum(['sandbox', 'development', 'production']),
});

type PlaidConfig = z.infer<typeof PlaidConfigSchema>;

export class PlaidIntegration {
  private client: PlaidApi;
  private config: PlaidConfig;

  constructor(config: PlaidConfig) {
    this.config = PlaidConfigSchema.parse(config);
    
    const configuration = new Configuration({
      basePath: PlaidEnvironments[this.config.environment],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': this.config.clientId,
          'PLAID-SECRET': this.config.secret,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string, orgId: string) {
    try {
      const response = await this.client.linkTokenCreate({
        user: {
          client_user_id: `${orgId}_${userId}`,
        },
        client_name: 'K-Fin',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
        redirect_uri: process.env.PLAID_REDIRECT_URI,
      });

      return {
        success: true,
        linkToken: response.data.link_token,
      };
    } catch (error) {
      console.error('Plaid link token creation error:', error);
      return {
        success: false,
        error: 'Failed to create link token',
      };
    }
  }

  async exchangePublicToken(publicToken: string) {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        itemId: response.data.item_id,
      };
    } catch (error) {
      console.error('Plaid token exchange error:', error);
      return {
        success: false,
        error: 'Failed to exchange public token',
      };
    }
  }

  async getAccounts(accessToken: string) {
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken,
      });

      return {
        success: true,
        accounts: response.data.accounts.map(account => ({
          id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          balance: account.balances.current,
          currency: account.balances.iso_currency_code,
        })),
      };
    } catch (error) {
      console.error('Plaid accounts fetch error:', error);
      return {
        success: false,
        error: 'Failed to fetch accounts',
      };
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    try {
      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      return {
        success: true,
        transactions: response.data.transactions.map(transaction => ({
          id: transaction.transaction_id,
          accountId: transaction.account_id,
          amount: transaction.amount,
          date: transaction.date,
          name: transaction.name,
          merchantName: transaction.merchant_name,
          category: transaction.category,
          subcategory: transaction.category?.[1],
        })),
        totalTransactions: response.data.total_transactions,
      };
    } catch (error) {
      console.error('Plaid transactions fetch error:', error);
      return {
        success: false,
        error: 'Failed to fetch transactions',
      };
    }
  }

  async syncData(accessToken: string, lastSyncDate?: string) {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = lastSyncDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const [accountsResult, transactionsResult] = await Promise.all([
        this.getAccounts(accessToken),
        this.getTransactions(accessToken, startDate, endDate),
      ]);

      if (!accountsResult.success || !transactionsResult.success) {
        return {
          success: false,
          error: 'Failed to sync data',
        };
      }

      return {
        success: true,
        data: {
          accounts: accountsResult.accounts,
          transactions: transactionsResult.transactions,
          syncedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Plaid sync error:', error);
      return {
        success: false,
        error: 'Failed to sync data',
      };
    }
  }
}

export const createPlaidClient = () => {
  const config = {
    clientId: process.env.PLAID_CLIENT_ID || 'dummy-client-id',
    secret: process.env.PLAID_SECRET || 'dummy-secret',
    environment: (process.env.PLAID_ENV as 'sandbox' | 'development' | 'production') || 'sandbox',
  };

  return new PlaidIntegration(config);
}; 