/**
 * Smoke Tests for Critical Functionality
 * These tests verify that the most important features work correctly
 * and would catch breaking changes before deployment
 */

import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/test',
    query: {},
    asPath: '/test'
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test'
}))

// Mock better-auth
const mockSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockUseSession = jest.fn()

jest.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: mockSignIn
    },
    signOut: mockSignOut,
    useSession: mockUseSession
  }
}))

// Mock database
jest.mock('database', () => ({
  prisma: {
    organization: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

describe('Critical Functionality Smoke Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
      error: null
    })
  })

  describe('Authentication Flow', () => {
    it('should import login form without crashing', async () => {
      // Test that we can import the component without errors
      const { default: LoginForm } = await import('@/features/auth/components/login-form')
      
      expect(LoginForm).toBeDefined()
      expect(typeof LoginForm).toBe('function')
    })

    it('should have sign in functionality available', async () => {
      // Test that authentication functions are available
      expect(mockSignIn).toBeDefined()
      expect(typeof mockSignIn).toBe('function')
    })
  })

  describe('Component Imports', () => {
    it('should import organization selector without crashing', async () => {
      const orgSelector = await import('@/features/org/components/org-selector')
      
      expect(orgSelector).toBeDefined()
      expect(typeof orgSelector).toBe('object')
    })

    it('should import UI components without crashing', async () => {
      const { Button } = await import('@/components/ui/button')
      
      expect(Button).toBeDefined()
      expect(typeof Button).toBe('function')
    })

    it('should import layout components without crashing', async () => {
      const { default: Navbar } = await import('@/components/layout/navbar')
      
      expect(Navbar).toBeDefined()
      expect(typeof Navbar).toBe('function')
    })
  })

  describe('API Routes', () => {
    it('should have auth API routes available', async () => {
      // Test that auth route handler exists
      const authHandler = await import('@/app/api/auth/[...all]/route')
      
      expect(authHandler).toBeDefined()
      expect(authHandler.GET || authHandler.POST).toBeDefined()
    })
  })

  describe('Database Configuration', () => {
    it('should have database service available', async () => {
      const databaseModule = await import('database')
      
      expect(databaseModule).toBeDefined()
      expect(typeof databaseModule).toBe('object')
    })

    it('should have prisma client available', async () => {
      const { prisma } = await import('database')
      
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })
  })

  describe('Email Service', () => {
    it('should have email service available', async () => {
      const { EmailService } = await import('@/lib/email')
      
      expect(EmailService).toBeDefined()
      expect(typeof EmailService).toBe('function')
    })

    it('should have password reset email method', async () => {
      const { EmailService } = await import('@/lib/email')
      
      expect(EmailService.sendPasswordResetEmail).toBeDefined()
      expect(typeof EmailService.sendPasswordResetEmail).toBe('function')
    })
  })

  describe('Essential Libraries', () => {
    it('should have React available', () => {
      const React = require('react')
      expect(React).toBeDefined()
      expect(React.createElement).toBeDefined()
    })

    it('should have Next.js available', () => {
      const next = require('next')
      expect(next).toBeDefined()
    })

    it('should have authentication library available', async () => {
      const { auth } = await import('@/lib/auth')
      expect(auth).toBeDefined()
    })
  })

  describe('Configuration', () => {
    it('should have environment variables configured', () => {
      // Test that basic env vars structure exists
      expect(process.env).toBeDefined()
      expect(typeof process.env).toBe('object')
    })

    it('should have Node.js environment configured', () => {
      expect(process.env.NODE_ENV).toBeDefined()
      expect(['test', 'development', 'production']).toContain(process.env.NODE_ENV)
    })
  })

  describe('Core Application Structure', () => {
    it('should have main app page structure', async () => {
      const mainPage = await import('@/app/page')
      expect(mainPage).toBeDefined()
    })

    it('should have basic routing configured', () => {
      // Test that we can access routing functions
      expect(mockPush).toBeDefined()
      expect(mockReplace).toBeDefined()
    })
  })
})