Cursor IDE Prompt for Multi-Tenant Next.js Monorepo SaaS Boilerplate
Create a Next.js 15 monorepo SaaS boilerplate with a feature-based structure, multi-tenancy supporting users in multiple orgs with switching, business data integrations (Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody) using OAuth, social login, admin invitations, app owner dashboard, notification service, report subscriptions, org dashboards, reusable components/services, and flexible subscription tiers. Prioritize integrations, multi-tenancy, actual vs. budget, scenario comparison, and white-labeling. Include secondary features: data import/export, notifications, dashboards, offline support, multi-currency, scenario versioning, audit logs, onboarding. Incorporate optimizations: database query performance (Must-Have), integration sync efficiency (Must-Have), API rate limiting granularity (Must-Have), client-side state management (Nice-to-Have), bundle size reduction (Nice-to-Have), developer experience (Nice-to-Have), onboarding streamlining (Lower Priority), real-time performance (Lower Priority). Add Jest for unit tests and Cypress for e2e tests. Ensure Cursor tracks feature implementations, updates tests, and fixes linting errors using Biome. Create/update .cursor/rules.md with coding conventions and Cursor best practices.

## Tasks

### 1. Project Overview

Build a multi-tenant SaaS using Next.js 15, Supabase, Prisma, Stripe, Shadcn UI, Tailwind CSS v4, TypeScript, Zustand, Zod, React Query, Ky, and Biome.
Features: multi-tenancy, OAuth integrations, social login, admin invitations, dashboards, notifications, reports, actual vs. budget, scenario comparison, white-labeling, secondary features.
Optimize for performance, security, and developer experience.

### 2. Monorepo Setup

Use Turborepo to manage monorepo.
Structure:
- apps/web: Next.js app.
- packages/ui: Shadcn UI components.
- packages/stripe: Stripe logic.
- packages/config: Supabase, OAuth configs.
- packages/database: Prisma schema, client, and utilities.
- packages/analytics: Forecasting logic.
- packages/integrations: Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody.
- packages/services: Business logic (notificationService, reportService, featureService).
- tests/: Unit (tests/features/) and e2e (tests/cypress/).

Configure turbo.json for dev and build.
Root package.json scripts:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "jest",
    "test:e2e": "cypress run",
    "lint": "biome check",
    "format": "biome format --write",
    "db:generate": "turbo run db:generate",
    "db:push": "turbo run db:push",
    "db:migrate": "turbo run db:migrate",
    "db:studio": "turbo run db:studio",
    "generate-types": "supabase gen types typescript --project-id your-project > types/supabase.ts"
  }
}
```

### 3. Next.js App Setup

Initialize apps/web with `npx create-next-app@latest . --typescript --app --eslint --tailwind`.
Use App Router, flat structure (no src/).
Folders:
- app/: Routes, globals.css.
- features/: Feature-specific code.
- components/: Shared UI.
- hooks/: Shared hooks.
- lib/: API client, constants, services.
- types/: Shared types.
- utils/: Utilities.
- public/: Static assets.

Configure next.config.js for Webpack, assets, path aliases.
Set up tsconfig.json with aliases: @features/*, @components/*, analytics, integrations, services, database.
Install dependencies: @supabase/supabase-js, prisma, @prisma/client, zustand, zod, @tanstack/react-query, ky, biome, pdfkit, react-grid-layout, localforage, currency.js, statsforecast, papaparse, xlsx, next-rate-limit, uuid.

### 4. Database Setup

#### 4.1 Prisma Configuration

Create packages/database with:
```
packages/database/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── lib/
│   ├── client.ts
│   ├── types.ts
│   └── utils.ts
├── package.json
└── index.ts
```

packages/database/prisma/schema.prisma:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id               String   @id @default(uuid())
  name             String
  subscriptionPlan String   @default("free") @map("subscription_plan")
  currency         String   @default("USD")
  apiKey           String   @unique @default(uuid()) @map("api_key")
  rateLimit        Int      @default(1000) @map("rate_limit")
  createdAt        DateTime @default(now()) @map("created_at")

  // Relations
  orgUsers         OrganizationUser[]
  scenarios        Scenario[]
  budgets          Budget[]
  accounts         Account[]
  dataImports      DataImport[]
  notifications    Notification[]
  dashboards       Dashboard[]
  auditLogs        AuditLog[]
  invitations      Invitation[]

  @@map("orgs")
}

model OrganizationUser {
  userId String @map("user_id")
  orgId  String @map("org_id")
  role   Role
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@id([userId, orgId])
  @@map("org_users")
}

model Profile {
  id           String  @id
  isSuperadmin Boolean @default(false) @map("is_superadmin")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("profiles")
}

model Scenario {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  name      String
  data      Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")

  // Relations
  organization     Organization       @relation(fields: [orgId], references: [id], onDelete: Cascade)
  scenarioVersions ScenarioVersion[]

  @@map("scenarios")
}

model Budget {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  name      String
  data      Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("budgets")
}

model Account {
  id            String    @id @default(uuid())
  orgId         String    @map("org_id")
  source        IntegrationSource
  accessToken   String?   @map("access_token")
  refreshToken  String?   @map("refresh_token")
  expiresAt     DateTime? @map("expires_at")
  lastSyncedAt  DateTime? @map("last_synced_at")
  createdAt     DateTime  @default(now()) @map("created_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, source])
  @@map("accounts")
}

model DataImport {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  fileType  FileType @map("file_type")
  data      Json     @default("{}")
  metadata  Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  createdBy String?  @map("created_by")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("data_imports")
}

model ScenarioVersion {
  id         String   @id @default(uuid())
  scenarioId String   @map("scenario_id")
  orgId      String   @map("org_id")
  version    Int
  data       Json     @default("{}")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  scenario Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)

  @@unique([scenarioId, version])
  @@map("scenario_versions")
}

model Notification {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  userId    String   @map("user_id")
  type      String
  message   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model Dashboard {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  userId    String   @map("user_id")
  config    Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("dashboards")
}

model AuditLog {
  id        String   @id @default(uuid())
  orgId     String   @map("org_id")
  userId    String?  @map("user_id")
  action    String
  details   Json     @default("{}")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("audit_logs")
}

model Invitation {
  id         String    @id @default(uuid())
  orgId      String    @map("org_id")
  email      String
  role       Role
  token      String    @unique @default(uuid())
  createdAt  DateTime  @default(now()) @map("created_at")
  expiresAt  DateTime  @default(dbgenerated("(NOW() + INTERVAL '7 days')")) @map("expires_at")
  acceptedAt DateTime? @map("accepted_at")
  createdBy  String?   @map("created_by")

  // Relations
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@map("invitations")
}

model NotificationPreference {
  userId    String            @map("user_id")
  eventType String            @map("event_type")
  method    NotificationMethod
  enabled   Boolean           @default(true)

  @@id([userId, eventType, method])
  @@map("notification_preferences")
}

model ReportSubscription {
  id         String            @id @default(uuid())
  userId     String            @map("user_id")
  reportType String            @map("report_type")
  method     NotificationMethod
  frequency  Frequency
  nextRunAt  DateTime          @map("next_run_at")
  lastRunAt  DateTime?         @map("last_run_at")
  createdAt  DateTime          @default(now()) @map("created_at")

  @@map("report_subscriptions")
}

model Plan {
  id        String   @id @default(uuid())
  name      String   @unique
  features  Json     @default("{}")
  price     Decimal  @default(0) @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("plans")
}

// Views (for read-only operations)
view BudgetSummary {
  orgId       String  @map("org_id")
  budgetId    String  @map("budget_id")
  budgetName  String  @map("budget_name")
  totalBudget Decimal @map("total_budget")
  itemCount   Int     @map("item_count")

  @@map("budget_summary")
}

// Enums
enum Role {
  admin
  editor
  viewer
}

enum IntegrationSource {
  plaid
  quickbooks
  rippling
  adp
  acuity
  mindbody
}

enum FileType {
  csv
  excel
}

enum NotificationMethod {
  email
  in_app
  sms
}

enum Frequency {
  daily
  weekly
  monthly
}
```

packages/database/lib/client.ts:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

packages/database/index.ts:
```typescript
export { prisma } from './lib/client';
export type * from '@prisma/client';
export type * from './lib/types';
```

#### 4.2 Supabase Integration (for RLS and Auth)

Install @supabase/supabase-js in packages/config.
Create packages/config/supabase.ts:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, OAuth client IDs/secrets, SENDGRID_API_KEY, TWILIO_*, STRIPE_*.

**Database Strategy:**
- **Prisma**: Primary ORM for all application data operations
- **Supabase**: Authentication, RLS policies, real-time subscriptions
- **Better Auth**: Alternative auth system (SQLite) for development

Create initial migration from existing schema:
```bash
npx prisma db pull  # Generate schema from existing database
npx prisma generate # Generate Prisma client
```

### 5. Features

#### Multi-Tenancy with Org Switching (Priority):
- Route: app/org/select/page.tsx
- Component: features/org/components/org-selector.tsx
- Hook: lib/stores/app-store.ts (Zustand, Nice-to-Have Optimization)
- API: features/org/api/org.ts (using Prisma)
- Service: packages/services/organizationService.ts

#### OAuth Integrations (Priority):
- Services: Plaid, QuickBooks, Rippling, ADP, Acuity, Mindbody
- Route: app/org/[orgId]/integrations/page.tsx
- Component: features/integrations/components/integration-connector.tsx
- API: features/integrations/api/[source].ts (using Prisma)
- Callback: app/api/[source]/callback/route.ts
- Edge Function: supabase/functions/sync-[source].ts (Must-Have Optimization)

#### Data Import/Export (Priority - CSV Feature):
- Route: app/org/[orgId]/data-import/page.tsx
- Component: features/data/components/data-upload.tsx
- API: features/data/api/import.ts (using Prisma)
- Service: packages/services/dataImportService.ts

#### Social Login:
- Route: app/auth/login/page.tsx
- Component: features/auth/pages/login.tsx

#### Admin Invitations:
- Route: app/org/[orgId]/invitations/page.tsx
- Component: features/invitations/components/invite-form.tsx
- API: features/invitations/api/invite.ts (using Prisma)
- Service: packages/services/invitationService.ts

#### App Owner Dashboard:
- Route: app/superadmin/page.tsx
- Component: features/superadmin/components/dashboard.tsx

#### Notification Service:
- Route: app/settings/notifications/page.tsx
- Component: features/notifications/components/preferences.tsx
- Service: packages/services/notificationService.ts (using Prisma)
- Edge Function: supabase/functions/notify.ts (Lower Priority Optimization: debounce)

#### Report Subscriptions:
- Route: app/org/[orgId]/reports/page.tsx
- Component: features/reports/components/report-subscription-form.tsx
- Service: packages/services/reportService.ts (using Prisma)
- Cron Job: supabase/functions/run-reports.ts

#### Org Dashboard:
- Route: app/org/[orgId]/dashboard/page.tsx
- Component: features/org/components/org-dashboard.tsx

#### Actual vs. Budget (Priority):
- Route: app/org/[orgId]/budgets/page.tsx
- Component: features/budgets/components/budget-comparison.tsx
- API: features/budgets/api/budget.ts (using Prisma)
- Service: packages/services/budgetService.ts

#### Scenario Comparison (Priority):
- Route: app/org/[orgId]/scenarios/compare/page.tsx
- Component: features/scenarios/components/scenario-comparison.tsx
- API: features/scenarios/api/scenario.ts (using Prisma)
- Service: packages/services/scenarioService.ts

#### White-Labeling (Priority):
- Route: app/financial-analysis/page.tsx
- API: app/api/financial-analysis/route.ts (Must-Have Optimization: dynamic rate limiting)
- Package: packages/analytics

#### Secondary Features:
- Customizable Dashboards: features/dashboards/
- Offline Support: features/offline/
- Multi-Currency: features/settings/
- Scenario Versioning: features/scenarios/
- Audit Logs: app/org/[orgId]/audit-logs/page.tsx (using Prisma)
- Onboarding: app/onboarding/page.tsx (Lower Priority Optimization: two steps)

### 6. Optimizations

#### Database Query Performance (Must-Have):
- Use Prisma's optimized queries with proper includes/selects
- Implement database indexing via Prisma migrations
- Leverage materialized views (budget_summary) for complex aggregations
- Use Prisma's connection pooling and query optimization

#### Integration Sync Efficiency (Must-Have):
- Edge Functions for incremental syncs
- Track last_synced_at in accounts table via Prisma
- Batch operations using Prisma transactions

#### API Rate Limiting Granularity (Must-Have):
- Dynamic limits in app/api/financial-analysis/route.ts
- Org-specific rate limiting using Prisma queries

#### Client-Side State Management (Nice-to-Have):
- Single Zustand store in lib/stores/app-store.ts
- React Query for server state management

#### Bundle Size Reduction (Nice-to-Have):
- Dynamic imports for chart, budget-comparison.tsx
- Code splitting by feature

#### Developer Experience (Nice-to-Have):
- Automate type generation in CI:
```yaml
name: Generate Types
on: push
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run db:generate
      - run: npm run generate-types
      - commit: "Update database and Supabase types"
```

#### Onboarding Streamlining (Lower Priority):
- Two-step flow (org setup, integrations)

#### Real-Time Performance (Lower Priority):
- Debounce subscriptions in features/notifications/hooks/use-notifications.ts

### 7. Testing

Install Jest (jest, @testing-library/react, @testing-library/jest-dom) and Cypress (cypress).
Unit tests: tests/features/[feature]/[feature].test.ts
E2e tests: tests/cypress/e2e/[feature].cy.js

Example unit test with Prisma:
```typescript
import { getScenarios } from '@features/scenarios/api/scenario';
import { prisma } from 'database';

jest.mock('database', () => ({
  prisma: {
    scenario: {
      findMany: jest.fn(),
    },
  },
}));

describe('Scenarios API', () => {
  it('fetches scenarios for org', async () => {
    const mockData = [{ id: '1', orgId: 'org1', name: 'Scenario 1' }];
    (prisma.scenario.findMany as jest.Mock).mockResolvedValue(mockData);
    
    const scenarios = await getScenarios({ orgId: 'org1' });
    expect(scenarios).toEqual(mockData);
    expect(prisma.scenario.findMany).toHaveBeenCalledWith({
      where: { orgId: 'org1' },
      include: { organization: true }
    });
  });
});
```

Example e2e test:
```typescript
describe('Data Import', () => {
  it('uploads CSV file', () => {
    cy.visit('/org/org1/data-import');
    cy.get('[data-testid="file-upload"]').selectFile('fixtures/sample.csv');
    cy.get('[data-testid="preview-data"]').should('be.visible');
    cy.get('[data-testid="import-button"]').click();
    cy.contains('Data imported successfully').should('be.visible');
  });
});
```

CI/CD (GitHub Actions):
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run db:push
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e
```

### 8. Cursor Rules

Create/update .cursor/rules.md:

```markdown
# Cursor Rules

## Coding Conventions
- **File Names**: kebab-case (e.g., `scenario-form.tsx`, `use-get-scenarios.ts`)
- **Components**: PascalCase (e.g., `ScenarioForm`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGetScenarios`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `SCENARIO_MAX_DATA_SIZE`)
- **Folder Structure**: `app/`, `features/[feature]/` (api/, components/, constants/, hooks/, pages/, schemas/, types/), `components/`, `hooks/`, `lib/`, `types/`, `utils/`
- **Path Aliases**: `@features/`, `@components/`, `analytics`, `integrations`, `services`, `database`

## Database Conventions
- **Use Prisma for all database operations**: Import from `database` package
- **Service Layer Pattern**: Create services in `packages/services/` for complex business logic
- **Type Safety**: Use Prisma generated types, extend with custom types in service layer
- **Transactions**: Use Prisma transactions for multi-table operations
- **Relationships**: Leverage Prisma's include/select for efficient queries

## Best Practices for Using Cursor
- Enable YOLO mode in Cursor settings to allow automated test runs and builds
- Write tests first for new features: "Write tests for this feature, then implement the code, and ensure all tests pass"
- Use logging for debugging: "Add logs to this code to understand the issue, then suggest fixes based on log output"
- Fix build errors: "Run nr build to see errors, then fix them until build passes"
- Use Command K for quick changes, Command I for in-depth code discussions
- Run bug finder (Command Shift P) to identify issues in changes
- Monitor Cursor's actions and recalibrate if off track: "Reset, recalibrate, get back on the right track"

## Recommended Prompts
- Testing: "Write unit and e2e tests for this feature using Prisma mocks, then implement the code, and ensure tests pass"
- Debugging: "Add logs to diagnose this issue, then analyze logs and fix the code"
- Build Fixes: "Run pre-PR checks (tsc, Biome, ESLint, Prisma generate) and fix issues until all pass"
- Feature Implementation: "Generate code for [feature], including Prisma service, components, APIs, hooks, tests, and ensure Biome linting passes"
- Database Operations: "Use Prisma for database operations, include proper error handling and type safety"

## Tooling
- **Biome**: Linting/formatting with `.biome.json`
- **Prettier**: Code style with `.prettierrc`
- **TypeScript**: Strict mode with path aliases
- **Next.js**: App Router, Webpack config
- **Prisma**: Database ORM with type generation
- **Jest**: Unit testing with Prisma mocks
- **Cypress**: E2E testing with database seeding
```

Ensure rules are updated for each feature to reflect new conventions or practices.

### 9. Additional Instructions

#### Feature Tracking: For each feature, generate:
- Prisma service layer with proper error handling
- Components with TypeScript interfaces
- APIs using Prisma operations
- Hooks for data fetching with React Query
- Routes with proper error boundaries
- Unit tests with Prisma mocks in tests/features/
- E2e tests in tests/cypress/e2e/
- Update .cursor/rules.md if new conventions arise

#### Database Best Practices:
- Always use transactions for multi-table operations
- Implement proper error handling in service layer
- Use Prisma's type-safe operations
- Leverage relationships for efficient queries
- Add proper indexing via migrations

#### Test Updates:
- Automatically update tests when modifying features, ensuring coverage for new code paths
- Mock Prisma operations in unit tests
- Use database seeding for e2e tests
- Test database constraints and relationships

#### Development Workflow:
- Linting: Run `npm run lint` and fix Biome errors before finalizing code
- Database: Run `npm run db:generate` after schema changes
- Build Errors: Run `npm run build` to check for errors, fix iteratively: "Run nr build, fix errors until build passes"
- Debugging: Add logs for complex features: "Add logs to diagnose issues, then fix based on log output"
- YOLO Mode: Enable in Cursor settings with prompt: "Allow vitest, npm test, nr test, build, tsc, prisma generate, mkdir, touch"

#### README.md:
Include setup (npm install, database setup, npm run dev), deployment (Vercel, Supabase, database migrations), feature overview, and tech stack with Prisma.

## Execution Guidelines

Generate code sequentially by task, ensuring each feature is complete with tests.
Write tests first for non-trivial features, then code, and verify tests pass.
Use clear, specific prompts for each task, detailing files, tools, and outcomes.
Monitor generated code and recalibrate if off track: "Reset, recalibrate, get back on the right track."
Ensure all code passes Biome linting and build checks.
Run Prisma generate after schema changes.
Update .cursor/rules.md to reflect any new conventions or practices introduced during generation.

## Migration Strategy

### Phase 1: Prisma Setup (4 hours)
1. **Install Prisma packages**:
   ```bash
   npm install prisma @prisma/client
   ```

2. **Create packages/database structure**:
   - Set up package.json with database scripts
   - Initialize Prisma schema
   - Configure Prisma client

3. **Generate schema from existing database**:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Verify connection and schema**:
   ```bash
   npx prisma studio
   ```

### Phase 2: Service Layer Migration (4 hours)
1. **Create service classes** in packages/services/:
   - `organizationService.ts`
   - `notificationService.ts` 
   - `reportService.ts`
   - `integrationService.ts`

2. **Migrate existing Supabase operations** to Prisma:
   - Replace `supabase.from().select()` with `prisma.model.findMany()`
   - Replace `supabase.from().insert()` with `prisma.model.create()`
   - Replace `supabase.from().update()` with `prisma.model.update()`
   - Replace `supabase.from().delete()` with `prisma.model.delete()`

3. **Add proper error handling and type safety**

4. **Test service layer operations**

### Phase 3: CSV Data Import Feature (8 hours)
1. **Create data import service** using Prisma:
   - File upload handling
   - CSV parsing with papaparse
   - Data validation with Zod
   - Database storage via Prisma

2. **Build UI components**:
   - File upload component
   - Data preview component
   - Import progress component

3. **Add API routes**:
   - File upload endpoint
   - Data processing endpoint
   - Import status endpoint

4. **Integration testing**

### Phase 4: Testing and Optimization (4 hours)
1. **Update all tests** to use Prisma mocks
2. **Add comprehensive error handling**
3. **Optimize database queries** with proper includes/selects
4. **Add database seeding** for development

### Phase 5: Documentation and Cleanup (2 hours)
1. **Update README.md** with Prisma setup instructions
2. **Document service layer patterns**
3. **Clean up unused Supabase direct calls**
4. **Update development workflow**

**Total Estimated Time: ~22 hours (3-4 days)**

This migration strategy ensures a smooth transition from Supabase direct calls to a proper Prisma-based architecture while building the CSV import feature with clean, maintainable code.