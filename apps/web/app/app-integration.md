Cursor IDE Prompt for Multi-Tenant Next.js Monorepo SaaS Boilerplate
Create a Next.js 15 monorepo SaaS boilerplate with a feature-based structure, multi-tenancy supporting users in multiple orgs with switching, business data integrations (Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody) using OAuth, social login, admin invitations, app owner dashboard, notification service, report subscriptions, org dashboards, reusable components/services, and flexible subscription tiers. Prioritize integrations, multi-tenancy, actual vs. budget, scenario comparison, and white-labeling. Include secondary features: data import/export, notifications, dashboards, offline support, multi-currency, scenario versioning, audit logs, onboarding. Incorporate optimizations: database query performance (Must-Have), integration sync efficiency (Must-Have), API rate limiting granularity (Must-Have), client-side state management (Nice-to-Have), bundle size reduction (Nice-to-Have), developer experience (Nice-to-Have), onboarding streamlining (Lower Priority), real-time performance (Lower Priority). Add Jest for unit tests and Cypress for e2e tests. Ensure Cursor tracks feature implementations, updates tests, and fixes linting errors using Biome. Create/update .cursor/rules.md with coding conventions and Cursor best practices.
Tasks
1. Project Overview

Build a multi-tenant SaaS using Next.js 15, Supabase, Stripe, Shadcn UI, Tailwind CSS v4, TypeScript, Zustand, Zod, React Query, Ky, and Biome.
Features: multi-tenancy, OAuth integrations, social login, admin invitations, dashboards, notifications, reports, actual vs. budget, scenario comparison, white-labeling, secondary features.
Optimize for performance, security, and developer experience.

2. Monorepo Setup

Use Turborepo to manage monorepo.
Structure:
apps/web: Next.js app.
packages/ui: Shadcn UI components.
packages/stripe: Stripe logic.
packages/config: Supabase, OAuth configs.
packages/analytics: Forecasting logic.
packages/integrations: Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody.
packages/services: Business logic (notificationService, reportService, featureService).
tests/: Unit (tests/features/) and e2e (tests/cypress/).


Configure turbo.json for dev and build.
Root package.json scripts:{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "jest",
    "test:e2e": "cypress run",
    "lint": "biome check",
    "format": "biome format --write",
    "generate-types": "supabase gen types typescript --project-id your-project > types/supabase.ts"
  }
}



3. Next.js App Setup

Initialize apps/web with npx create-next-app@latest . --typescript --app --eslint --tailwind.
Use App Router, flat structure (no src/).
Folders:
app/: Routes, globals.css.
features/: Feature-specific code.
components/: Shared UI.
hooks/: Shared hooks.
lib/: API client, constants, services.
types/: Shared types.
utils/: Utilities.
public/: Static assets.


Configure next.config.js for Webpack, assets, path aliases.
Set up tsconfig.json with aliases: @features/*, @components/*, analytics, integrations, services.
Install dependencies: @supabase/supabase-js, zustand, zod, @tanstack/react-query, ky, biome, pdfkit, react-grid-layout, localforage, currency.js, statsforecast, papaparse, xlsx, next-rate-limit, uuid.

4. Supabase Integration

Install @supabase/supabase-js in packages/config.
Create packages/config/supabase.ts:import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);


Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OAuth client IDs/secrets, SENDGRID_API_KEY, TWILIO_*, STRIPE_*, DATABASE_URL.
Generate types: supabase gen types typescript --project-id your-project > types/supabase.ts.
Schema (supabase/migrations):
orgs: { id, name, created_at, subscription_plan, currency, api_key, rate_limit }.
org_users: { user_id, org_id, role (admin/editor/viewer) }.
scenarios: { id, org_id, name, data (jsonb), created_at, created_by }.
budgets: { id, org_id, name, data (jsonb), created_at }.
accounts: { id, org_id, source, access_token, refresh_token, expires_at, last_synced_at }.
data_imports: { id, org_id, file_type (csv/excel), data (jsonb), created_at }.
scenario_versions: { id, scenario_id, org_id, version, data (jsonb), created_at }.
notifications: { id, org_id, user_id, type, message, created_at }.
dashboards: { id, org_id, user_id, config (jsonb) }.
audit_logs: { id, org_id, user_id, action, details, created_at }.
invitations: { id, org_id, email, role, token, created_at, expires_at }.
notification_preferences: { user_id, event_type, method (email/in-app/sms), enabled }.
report_subscriptions: { id, user_id, report_type, method (email/sms), frequency, next_run_at, last_run_at }.
plans: { id, name, features (jsonb), price }.
profiles: { id, user_id, is_superadmin (boolean) }.
Materialized view (Must-Have Optimization):CREATE MATERIALIZED VIEW budget_summary AS
SELECT org_id, budget_id, SUM(actuals.amount) as total_actuals, SUM(budgets.data->>'amount') as total_budget
FROM budgets JOIN accounts ON budgets.org_id = accounts.org_id
GROUP BY org_id, budget_id;
CREATE INDEX ON budget_summary (org_id);




RLS: CREATE POLICY org_access ON orgs FOR ALL USING (id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));.
Configure social login (Google, GitHub) in Supabase Dashboard.

5. Features

Multi-Tenancy with Org Switching (Priority):
Route: app/org/select/page.tsx.
Component: features/org/components/org-selector.tsx.
Hook: lib/stores/app-store.ts (Zustand, Nice-to-Have Optimization).
API: features/org/api/org.ts.


OAuth Integrations (Priority):
Services: Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody.
Route: app/org/[orgId]/integrations/page.tsx.
Component: features/integrations/components/integration-connector.tsx.
API: features/integrations/api/[source].ts.
Callback: app/api/[source]/callback/route.ts.
Edge Function: supabase/functions/sync-[source].ts (Must-Have Optimization).


Social Login:
Route: app/auth/login/page.tsx.
Component: features/auth/pages/login.tsx.


Admin Invitations:
Route: app/org/[orgId]/invitations/page.tsx.
Component: features/invitations/components/invite-form.tsx.
API: features/invitations/api/invite.ts.


App Owner Dashboard:
Route: app/superadmin/page.tsx.
Component: features/superadmin/components/dashboard.tsx.


Notification Service:
Route: app/settings/notifications/page.tsx.
Component: features/notifications/components/preferences.tsx.
Service: packages/services/notificationService.ts.
Edge Function: supabase/functions/notify.ts (Lower Priority Optimization: debounce).


Report Subscriptions:
Route: app/org/[orgId]/reports/page.tsx.
Component: features/reports/components/report-subscription-form.tsx.
Service: packages/services/reportService.ts.
Cron Job: supabase/functions/run-reports.ts.


Org Dashboard:
Route: app/org/[orgId]/dashboard/page.tsx.
Component: features/org/components/org-dashboard.tsx.


Actual vs. Budget (Priority):
Route: app/org/[orgId]/budgets/page.tsx.
Component: features/budgets/components/budget-comparison.tsx.
API: features/budgets/api/budget.ts.


Scenario Comparison (Priority):
Route: app/org/[orgId]/scenarios/compare/page.tsx.
Component: features/scenarios/components/scenario-comparison.tsx.
API: features/scenarios/api/scenario.ts.


White-Labeling (Priority):
Route: app/financial-analysis/page.tsx.
API: app/api/financial-analysis/route.ts (Must-Have Optimization: dynamic rate limiting).
Package: packages/analytics.


Secondary Features:
Data Import/Export: app/org/[orgId]/data-import/page.tsx.
Customizable Dashboards: features/dashboards/.
Offline Support: features/offline/.
Multi-Currency: features/settings/.
Scenario Versioning: features/scenarios/.
Audit Logs: app/org/[orgId]/audit-logs/page.tsx.
Onboarding: app/onboarding/page.tsx (Lower Priority Optimization: two steps).



6. Optimizations

Database Query Performance (Must-Have): Use materialized views (budget_summary), indexes on scenarios, accounts.
Integration Sync Efficiency (Must-Have): Edge Functions for incremental syncs, last_synced_at in accounts.
API Rate Limiting Granularity (Must-Have): Dynamic limits in app/api/financial-analysis/route.ts.
Client-Side State Management (Nice-to-Have): Single Zustand store in lib/stores/app-store.ts.
Bundle Size Reduction (Nice-to-Have): Dynamic imports for chart, budget-comparison.tsx.
Developer Experience (Nice-to-Have): Automate type generation in CI:name: Generate Types
on: push
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run generate-types
      - commit: "Update Supabase types"


Onboarding Streamlining (Lower Priority): Two-step flow (org setup, integrations).
Real-Time Performance (Lower Priority): Debounce subscriptions in features/notifications/hooks/use-notifications.ts.

7. Testing

Install Jest (jest, @testing-library/react, @testing-library/jest-dom) and Cypress (cypress).
Unit tests: tests/features/[feature]/[feature].test.ts.
E2e tests: tests/cypress/e2e/[feature].cy.js.
Example unit test:import { getScenarios } from '@features/scenarios/api/scenario';
import { supabase } from 'config/supabase';

jest.mock('config/supabase');

describe('Scenarios API', () => {
  it('fetches scenarios for org', async () => {
    const mockData = [{ id: '1', org_id: 'org1', name: 'Scenario 1' }];
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: mockData }) }),
    });
    const scenarios = await getScenarios({ orgId: 'org1' });
    expect(scenarios).toEqual(mockData);
  });
});


Example e2e test:describe('Scenarios', () => {
  it('creates a scenario', () => {
    cy.visit('/org/org1/scenarios');
    cy.get('[data-testid="create-scenario"]').click();
    cy.get('[data-testid="scenario-name"]').type('Test Scenario');
    cy.get('[data-testid="submit"]').click();
    cy.contains('Test Scenario').should('be.visible');
  });
});


CI/CD (GitHub Actions):name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e



8. Cursor Rules

Create/update .cursor/rules.md:# Cursor Rules

## Coding Conventions
- **File Names**: kebab-case (e.g., `scenario-form.tsx`, `use-get-scenarios.ts`).
- **Components**: PascalCase (e.g., `ScenarioForm`).
- **Hooks**: camelCase with `use` prefix (e.g., `useGetScenarios`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `SCENARIO_MAX_DATA_SIZE`).
- **Folder Structure**: `app/`, `features/[feature]/` (api/, components/, constants/, hooks/, pages/, schemas/, types/), `components/`, `hooks/`, `lib/`, `types/`, `utils/`.
- **Path Aliases**: `@features/`, `@components/`, `analytics`, `integrations`, `services`.

## Best Practices for Using Cursor
- Enable YOLO mode in Cursor settings to allow automated test runs and builds.
- Write tests first for new features: "Write tests for this feature, then implement the code, and ensure all tests pass."
- Use logging for debugging: "Add logs to this code to understand the issue, then suggest fixes based on log output."
- Fix build errors: "Run nr build to see errors, then fix them until build passes."
- Use Command K for quick changes, Command I for in-depth code discussions.
- Run bug finder (Command Shift P) to identify issues in changes.
- Monitor Cursor’s actions and recalibrate if off track: "Reset, recalibrate, get back on the right track."

## Recommended Prompts
- Testing: "Write unit and e2e tests for this feature, then implement the code, and ensure tests pass."
- Debugging: "Add logs to diagnose this issue, then analyze logs and fix the code."
- Build Fixes: "Run pre-PR checks (tsc, Biome, ESLint) and fix issues until all pass."
- Feature Implementation: "Generate code for [feature], including components, APIs, hooks, tests, and ensure Biome linting passes."

## Tooling
- **Biome**: Linting/formatting with `.biome.json`.
- **Prettier**: Code style with `.prettierrc`.
- **TypeScript**: Strict mode with path aliases.
- **Next.js**: App Router, Webpack config.


Ensure rules are updated for each feature to reflect new conventions or practices.

9. Additional Instructions

Feature Tracking: For each feature, generate:
Components, APIs, hooks, routes.
Unit tests in tests/features/.
E2e tests in tests/cypress/e2e/.
Update .cursor/rules.md if new conventions arise.


Test Updates: Automatically update tests when modifying features, ensuring coverage for new code paths.
Linting: Run npm run lint and fix Biome errors before finalizing code.
Build Errors: Run npm run build to check for errors, fix iteratively: "Run nr build, fix errors until build passes."
Debugging: Add logs for complex features: "Add logs to diagnose issues, then fix based on log output."
YOLO Mode: Enable in Cursor settings with prompt: "Allow vitest, npm test, nr test, build, tsc, mkdir, touch."
README.md: Include setup (npm install, supabase start, npm run dev), deployment (Vercel, Supabase), feature overview, and tech stack.

Execution Guidelines

Generate code sequentially by task, ensuring each feature is complete with tests.
Write tests first for non-trivial features, then code, and verify tests pass.
Use clear, specific prompts for each task, detailing files, tools, and outcomes.
Monitor generated code and recalibrate if off track: "Reset, recalibrate, get back on the right track."
Ensure all code passes Biome linting and build checks.
Update .cursor/rules.md to reflect any new conventions or practices introduced during generation.
