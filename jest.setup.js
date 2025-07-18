import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Prisma client early to prevent browser environment issues
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    organization: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    account: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    scenario: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    budget: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    dataImport: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockResolvedValue({}),
    $connect: jest.fn().mockResolvedValue({}),
    $disconnect: jest.fn().mockResolvedValue({}),
  })),
}))

// Mock Prisma client for browser environment
Object.defineProperty(globalThis, '__prismaClient', {
  value: {
    organization: {
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
  writable: true,
  configurable: true,
})

// Mock fetch for tests that need it
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('k-fin application'),
    headers: {
      get: jest.fn((key) => {
        if (key === 'content-type') return 'text/html; charset=utf-8'
        if (key === 'cache-control') return 'public, max-age=3600'
        return null
      })
    }
  })
)

// Mock Request and Response with proper Web API structure
global.Request = jest.fn().mockImplementation((url, options = {}) => ({
  url,
  method: options.method || 'GET',
  headers: {
    get: jest.fn()
  },
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
  ...options
}))

global.Response = jest.fn().mockImplementation((body, options = {}) => ({
  ok: true,
  status: options.status || 200,
  statusText: options.statusText || 'OK',
  headers: {
    get: jest.fn((key) => {
      if (key === 'content-type') return 'application/json'
      return null
    })
  },
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(body || ''),
  ...options
}))

// Mock Headers
global.Headers = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
  append: jest.fn(),
  delete: jest.fn(),
  entries: jest.fn(),
  keys: jest.fn(),
  values: jest.fn(),
  forEach: jest.fn()
}))

// Mock NextRequest specifically
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || 'GET',
    headers: {
      get: jest.fn()
    },
    nextUrl: {
      pathname: new URL(url).pathname,
      searchParams: new URLSearchParams()
    },
    cookies: {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn()
    },
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    formData: jest.fn().mockResolvedValue(new FormData()),
    ...options
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, options = {}) => ({
      ok: true,
      status: options.status || 200,
      json: () => Promise.resolve(data),
      headers: {
        get: jest.fn()
      }
    })),
    redirect: jest.fn().mockImplementation((url, options = {}) => ({
      ok: true,
      status: options.status || 302,
      headers: {
        get: jest.fn()
      }
    }))
  }
}))

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
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    organizationUser: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    scenario: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    budget: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    account: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    dataImport: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    notification: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn().mockResolvedValue({}),
  },
  DatabaseService: {
    createOrganization: jest.fn().mockResolvedValue({}),
    getOrganization: jest.fn().mockResolvedValue(null),
    getOrganizations: jest.fn().mockResolvedValue([]),
    updateOrganization: jest.fn().mockResolvedValue({}),
    deleteOrganization: jest.fn().mockResolvedValue({}),
    createScenario: jest.fn().mockResolvedValue({}),
    getScenarios: jest.fn().mockResolvedValue([]),
    createBudget: jest.fn().mockResolvedValue({}),
    getBudgets: jest.fn().mockResolvedValue([]),
    createAccount: jest.fn().mockResolvedValue({}),
    getAccounts: jest.fn().mockResolvedValue([]),
    getAccount: jest.fn().mockResolvedValue(null),
    createDataImport: jest.fn().mockResolvedValue({}),
    getDataImports: jest.fn().mockResolvedValue([]),
    getDataImport: jest.fn().mockResolvedValue(null),
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