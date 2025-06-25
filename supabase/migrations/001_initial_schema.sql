-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_plan TEXT DEFAULT 'free',
  currency TEXT DEFAULT 'USD',
  api_key TEXT UNIQUE DEFAULT uuid_generate_v4()::text,
  rate_limit INTEGER DEFAULT 1000
);

-- Create org_users table for multi-tenancy
CREATE TABLE org_users (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- Create profiles table for additional user data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_superadmin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create accounts table for integrations
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('plaid', 'quickbooks', 'rippling', 'adp', 'acuity', 'mindbody')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, source)
);

-- Create data_imports table
CREATE TABLE data_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'excel')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create scenario_versions table
CREATE TABLE scenario_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, version)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboards table
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create notification_preferences table
CREATE TABLE notification_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'in-app', 'sms')),
  enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, event_type, method)
);

-- Create report_subscriptions table
CREATE TABLE report_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('email', 'sms')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  features JSONB DEFAULT '{}',
  price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materialized view for budget summary (optimization)
CREATE MATERIALIZED VIEW budget_summary AS
SELECT 
  b.org_id,
  b.id as budget_id,
  b.name as budget_name,
  COALESCE(SUM((b.data->>'amount')::numeric), 0) as total_budget,
  COUNT(*) as item_count
FROM budgets b
GROUP BY b.org_id, b.id, b.name;

-- Create indexes for performance
CREATE INDEX idx_org_users_user_id ON org_users(user_id);
CREATE INDEX idx_org_users_org_id ON org_users(org_id);
CREATE INDEX idx_scenarios_org_id ON scenarios(org_id);
CREATE INDEX idx_budgets_org_id ON budgets(org_id);
CREATE INDEX idx_accounts_org_id ON accounts(org_id);
CREATE INDEX idx_notifications_user_org ON notifications(user_id, org_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_budget_summary_org_id ON budget_summary(org_id);

-- Enable Row Level Security (RLS)
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Organizations: Users can only access orgs they belong to
CREATE POLICY "Users can view their organizations" ON orgs
  FOR SELECT USING (id IN (
    SELECT org_id FROM org_users WHERE user_id = auth.uid()
  ));

-- Org users: Users can view org memberships for their orgs
CREATE POLICY "Users can view org memberships" ON org_users
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid())
  );

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- Scenarios: Users can access scenarios for their orgs
CREATE POLICY "Users can access org scenarios" ON scenarios
  FOR ALL USING (org_id IN (
    SELECT org_id FROM org_users WHERE user_id = auth.uid()
  ));

-- Budgets: Users can access budgets for their orgs
CREATE POLICY "Users can access org budgets" ON budgets
  FOR ALL USING (org_id IN (
    SELECT org_id FROM org_users WHERE user_id = auth.uid()
  ));

-- Accounts: Users can access accounts for their orgs
CREATE POLICY "Users can access org accounts" ON accounts
  FOR ALL USING (org_id IN (
    SELECT org_id FROM org_users WHERE user_id = auth.uid()
  ));

-- Notifications: Users can access their own notifications
CREATE POLICY "Users can access own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Insert default plans
INSERT INTO plans (name, features, price) VALUES 
  ('free', '{"integrations": 1, "users": 3, "reports": "basic"}', 0),
  ('pro', '{"integrations": 5, "users": 10, "reports": "advanced"}', 29.99),
  ('enterprise', '{"integrations": "unlimited", "users": "unlimited", "reports": "premium"}', 99.99);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user(); 