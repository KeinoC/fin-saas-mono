import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
      toString: jest.fn(),
    }
  },
  usePathname() {
    return '/test-path'
  },
}))

// Mock database client
jest.mock('database', () => ({
  prisma: {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationUser: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scenario: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budget: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    dataImport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

// Mock auth
jest.mock('@lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}))

// Mock Google API service
jest.mock('@lib/services/google-api', () => ({
  googleAPIService: {
    generateOAuthUrl: jest.fn(),
    exchangeCodeForTokens: jest.fn(),
    refreshTokens: jest.fn(),
    createSpreadsheet: jest.fn(),
    updateSpreadsheet: jest.fn(),
  },
}))

// Mock Zustand store
jest.mock('@lib/stores/app-store', () => ({
  useAppStore: jest.fn(() => ({
    user: null,
    currentOrg: null,
    setUser: jest.fn(),
    setCurrentOrg: jest.fn(),
    clearAuth: jest.fn(),
  })),
}))

// Global test timeout
jest.setTimeout(10000)

// Console error suppression for tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('ReactDOMTestUtils.act'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
}) 