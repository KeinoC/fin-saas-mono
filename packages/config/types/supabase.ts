export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          subscription_plan: string;
          currency: string;
          api_key: string;
          rate_limit: number;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          subscription_plan?: string;
          currency?: string;
          api_key?: string;
          rate_limit?: number;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          subscription_plan?: string;
          currency?: string;
          api_key?: string;
          rate_limit?: number;
        };
      };
      org_users: {
        Row: {
          user_id: string;
          org_id: string;
          role: 'admin' | 'editor' | 'viewer';
          created_at: string;
        };
        Insert: {
          user_id: string;
          org_id: string;
          role: 'admin' | 'editor' | 'viewer';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          org_id?: string;
          role?: 'admin' | 'editor' | 'viewer';
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          is_superadmin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          is_superadmin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_superadmin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      scenarios: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          data: Record<string, any>;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          data?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          data?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
      };
      budgets: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          data: Record<string, any>;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          data?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          data?: Record<string, any>;
          created_at?: string;
          created_by?: string | null;
        };
      };
      accounts: {
        Row: {
          id: string;
          org_id: string;
          source: 'plaid' | 'quickbooks' | 'rippling' | 'adp' | 'acuity' | 'mindbody';
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          last_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          source: 'plaid' | 'quickbooks' | 'rippling' | 'adp' | 'acuity' | 'mindbody';
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          source?: 'plaid' | 'quickbooks' | 'rippling' | 'adp' | 'acuity' | 'mindbody';
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          type: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          type: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          type?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: 'admin' | 'editor' | 'viewer';
          token: string;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role: 'admin' | 'editor' | 'viewer';
          token?: string;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: 'admin' | 'editor' | 'viewer';
          token?: string;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_by?: string | null;
        };
      };
      notification_preferences: {
        Row: {
          user_id: string;
          event_type: string;
          method: 'email' | 'in-app' | 'sms';
          enabled: boolean;
        };
        Insert: {
          user_id: string;
          event_type: string;
          method: 'email' | 'in-app' | 'sms';
          enabled?: boolean;
        };
        Update: {
          user_id?: string;
          event_type?: string;
          method?: 'email' | 'in-app' | 'sms';
          enabled?: boolean;
        };
      };
      report_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          report_type: string;
          method: 'email' | 'sms';
          frequency: 'daily' | 'weekly' | 'monthly';
          next_run_at: string;
          last_run_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_type: string;
          method: 'email' | 'sms';
          frequency: 'daily' | 'weekly' | 'monthly';
          next_run_at: string;
          last_run_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_type?: string;
          method?: 'email' | 'sms';
          frequency?: 'daily' | 'weekly' | 'monthly';
          next_run_at?: string;
          last_run_at?: string | null;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          features: Record<string, any>;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          features?: Record<string, any>;
          price?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          features?: Record<string, any>;
          price?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      budget_summary: {
        Row: {
          org_id: string;
          budget_id: string;
          budget_name: string;
          total_budget: number;
          item_count: number;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 