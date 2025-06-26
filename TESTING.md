# Testing Guide

This document outlines the testing strategy and practices for the k-fin application.

## Overview

Our testing strategy consists of three main layers:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test how different parts work together  
3. **End-to-End Tests** - Test complete user workflows

## Test Structure

```
tests/
├── cypress/              # E2E tests
│   ├── e2e/              # End-to-end test specs
│   ├── fixtures/         # Test data files
│   └── support/          # Custom commands and utilities
└── features/             # Unit/integration tests
    ├── auth/             # Authentication tests
    ├── database/         # Database service tests
    ├── integrations/     # Integration component tests
    └── org/              # Organization feature tests
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:generate
npm run db:push
```

### Unit Tests

Run all unit tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### End-to-End Tests

Run E2E tests in headless mode:
```bash
npm run test:e2e
```

Open Cypress Test Runner:
```bash
npm run test:e2e:open
```

### All Tests

Run the complete test suite:
```bash
npm run test:all
```

## Testing Philosophy

### Unit Tests

- Test components in isolation with mocked dependencies
- Focus on testing behavior, not implementation details
- Use data-testid attributes for element selection
- Mock external services and database calls

Example:
```typescript
// Good - Testing behavior
it('displays error message when login fails', async () => {
  mockSignIn.email.mockResolvedValue({
    error: { message: 'Invalid credentials' }
  })
  
  render(<LoginForm />)
  // ... user interactions
  
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
})

// Avoid - Testing implementation details
it('calls setState when button is clicked', () => {
  // Don't test React internal state
})
```

### Integration Tests

- Test how multiple components work together
- Test API routes with database interactions
- Use Prisma mocks for database operations

### End-to-End Tests

- Test complete user workflows
- Use real data and interactions
- Test critical paths and edge cases
- Focus on user-facing functionality

## Test Organization

### Database Tests

Located in `tests/features/database/`, these test the Prisma service layer:

- **DatabaseService tests** - Test CRUD operations for all models
- **Error handling** - Test database connection failures and constraint violations
- **Transactions** - Test multi-table operations and rollbacks

### Component Tests

Located in `tests/features/[feature]/`, these test React components:

- **Rendering** - Test component displays correctly
- **Interactions** - Test user interactions and state changes
- **Props** - Test different prop combinations
- **Error states** - Test error handling and loading states

### API Tests

Tested within component tests and E2E tests:

- **Authentication** - Test protected routes and sessions
- **Data operations** - Test CRUD operations through API
- **Integration flows** - Test OAuth and external service integrations

## Mocking Strategy

### Database Mocking

We mock Prisma operations in unit tests:

```typescript
jest.mock('database', () => ({
  prisma: {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      // ... other methods
    },
  },
}))
```

### External Service Mocking

Mock external APIs and services:

```typescript
jest.mock('@lib/services/google-api', () => ({
  googleAPIService: {
    generateOAuthUrl: jest.fn(),
    createSpreadsheet: jest.fn(),
  },
}))
```

### React Router Mocking

Mock Next.js navigation:

```typescript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
  })),
}))
```

## Test Data

### Fixtures

Test data is stored in `tests/cypress/fixtures/`:

- `sample-data.csv` - Valid CSV for import testing
- `invalid-data.csv` - Invalid CSV for error testing
- `service-account-credentials.json` - Mock Google credentials

### Factories

Create test data programmatically:

```typescript
const createMockOrganization = (overrides = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  subscriptionPlan: 'pro',
  currency: 'USD',
  ...overrides,
})
```

## Coverage Requirements

We maintain these minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

Critical features require higher coverage:

- Authentication flows: 90%+
- Data import/export: 90%+
- Payment processing: 95%+

## Best Practices

### Writing Tests

1. **Use descriptive test names**:
   ```typescript
   // Good
   it('shows error message when invalid credentials are provided')
   
   // Avoid
   it('should work')
   ```

2. **Follow AAA pattern** (Arrange, Act, Assert):
   ```typescript
   it('creates organization successfully', async () => {
     // Arrange
     const mockOrgData = { name: 'Test Org' }
     mockPrisma.organization.create.mockResolvedValue(mockOrganization)
     
     // Act
     const result = await DatabaseService.createOrganization(mockOrgData)
     
     // Assert
     expect(result).toEqual(mockOrganization)
   })
   ```

3. **Test edge cases**:
   - Empty states
   - Error conditions
   - Boundary values
   - Network failures

4. **Use data-testid for reliable element selection**:
   ```jsx
   <button data-testid="submit-button">Submit</button>
   ```

### E2E Tests

1. **Test user journeys, not features**:
   ```typescript
   // Good - Complete workflow
   it('allows user to import data and view dashboard')
   
   // Avoid - Single action
   it('clicks import button')
   ```

2. **Use page objects for complex interactions**:
   ```typescript
   class LoginPage {
     visit() { cy.visit('/auth/login') }
     enterCredentials(email, password) {
       cy.get('[data-testid="email-input"]').type(email)
       cy.get('[data-testid="password-input"]').type(password)
     }
     submit() { cy.get('[data-testid="login-button"]').click() }
   }
   ```

3. **Clean up test data**:
   ```typescript
   beforeEach(() => {
     cy.seedDatabase()
   })
   
   afterEach(() => {
     cy.cleanupTestData()
   })
   ```

## Debugging Tests

### Unit Tests

1. **Use debugger**:
   ```typescript
   it('test name', () => {
     debugger; // Will pause execution
     // test code
   })
   ```

2. **Console logging**:
   ```typescript
   console.log(screen.debug()) // Prints DOM
   ```

3. **VS Code debugging**:
   Add to `.vscode/launch.json`:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Jest Debug",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand", "${fileBasenameNoExtension}"],
     "console": "integratedTerminal"
   }
   ```

### E2E Tests

1. **Cypress debugging**:
   ```typescript
   cy.debug() // Pauses execution
   cy.pause() // Pauses with UI
   ```

2. **Screenshots and videos**:
   Automatically captured on failure in CI

3. **Browser DevTools**:
   Available in Cypress Test Runner

## CI/CD Integration

Tests run automatically on:

- **Pull requests** - All tests must pass
- **Push to main** - Full test suite + deployment
- **Nightly** - Extended test suite with performance tests

### GitHub Actions

Our CI pipeline includes:

1. **Lint and Type Check** - Code quality checks
2. **Unit Tests** - Fast feedback on code changes  
3. **E2E Tests** - User workflow validation
4. **Build and Deploy** - Production deployment

### Test Parallelization

- Unit tests run in parallel by default
- E2E tests run in parallel on multiple machines
- Database operations use transactions for isolation

### Setting Up GitHub Secrets Programmatically

Instead of manually setting secrets in the GitHub console, you can use one of these automated approaches:

#### Option 1: GitHub CLI (Recommended)

```bash
# 1. Install GitHub CLI
# macOS: brew install gh
# Other: https://cli.github.com/

# 2. Authenticate
gh auth login

# 3. Copy and configure secrets
cp scripts/secrets.example.env scripts/secrets.env
# Edit scripts/secrets.env with your actual values

# 4. Run the setup script
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh

# 5. Verify secrets were set
gh secret list
```

#### Option 2: Node.js API Script

```bash
# 1. Install dependencies (if not already installed)
npm install @octokit/rest sodium-native

# 2. Set up environment
export GITHUB_TOKEN="your_personal_access_token"
export REPO_OWNER="your-username"
export REPO_NAME="k-fin"

# 3. Configure secrets file
cp scripts/secrets.example.env scripts/secrets.env
# Edit scripts/secrets.env with your actual values

# 4. Run the script
node scripts/setup-secrets-api.js setup

# 5. List existing secrets
node scripts/setup-secrets-api.js list
```

#### Option 3: Terraform (Infrastructure as Code)

```bash
# 1. Install Terraform
# https://terraform.io/downloads

# 2. Configure variables
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your actual values

# 3. Initialize and apply
terraform init
terraform plan
terraform apply

# 4. Verify outputs
terraform output
```

### Required Secrets

The following secrets need to be configured for full CI/CD functionality:

| Secret | Purpose | Where to Get |
|--------|---------|--------------|
| `CODECOV_TOKEN` | Coverage reporting | [codecov.io](https://codecov.io/) |
| `CYPRESS_RECORD_KEY` | Test recordings | [Cypress Dashboard](https://dashboard.cypress.io/) |
| `VERCEL_TOKEN` | Deployment | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Deployment | Vercel Dashboard → Settings |
| `VERCEL_PROJECT_ID` | Deployment | Vercel Project → Settings |
| `SLACK_WEBHOOK_URL` | Notifications | [Slack Webhooks](https://api.slack.com/messaging/webhooks) |
| `DATABASE_URL` | Production DB | Your database provider |
| `GOOGLE_CLIENT_ID` | OAuth | [Google Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google Console |

## Performance Testing

### Database Performance

Monitor query performance:

```typescript
// Use Prisma query analysis
console.time('query')
const result = await prisma.organization.findMany({
  include: { orgUsers: true }
})
console.timeEnd('query')
```

### Component Performance

Test rendering performance:

```typescript
import { render } from '@testing-library/react'
import { performance } from 'perf_hooks'

it('renders large dataset efficiently', () => {
  const start = performance.now()
  render(<DataTable data={largeDataset} />)
  const end = performance.now()
  
  expect(end - start).toBeLessThan(100) // 100ms threshold
})
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**:
   - Check environment variables
   - Verify database state
   - Check timing issues

2. **Flaky E2E tests**:
   - Add proper waits: `cy.wait('@apiCall')`
   - Increase timeouts for slow operations
   - Use deterministic test data

3. **Memory leaks in tests**:
   - Clear mocks between tests: `jest.clearAllMocks()`
   - Clean up event listeners
   - Reset global state

### Getting Help

1. Check this documentation first
2. Look at similar test examples in the codebase
3. Ask in the team chat
4. Create an issue for documentation gaps

## Future Improvements

- [ ] Visual regression testing with Percy/Chromatic
- [ ] API contract testing with Pact
- [ ] Performance regression testing
- [ ] Accessibility testing automation
- [ ] Security testing integration
- [ ] Load testing for critical endpoints 