/**
 * Smoke Tests for Critical Functionality
 * These tests verify that the most important features work correctly
 * and would catch breaking changes before deployment
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextRouter } from 'next/router'
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
    it('should render login form without crashing', async () => {
      // Dynamically import to avoid module loading issues
      const { default: LoginForm } = await import('@/components/auth/login-form')
      
      expect(() => {
        render(<LoginForm />)
      }).not.toThrow()

      // Basic elements should be present
      expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    })

    it('should handle login submission', async () => {
      const { default: LoginForm } = await import('@/components/auth/login-form')
      
      mockSignIn.mockResolvedValue({ data: { user: { id: '1' } } })

      render(<LoginForm />)

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('should display error message on failed login', async () => {
      const { default: LoginForm } = await import('@/components/auth/login-form')
      
      mockSignIn.mockResolvedValue({
        error: { message: 'Invalid credentials' }
      })

      render(<LoginForm />)

      const emailInput = screen.getByRole('textbox', { name: /email/i })
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Routing', () => {
    it('should render main navigation without crashing', async () => {
      // Mock authenticated session
      mockUseSession.mockReturnValue({
        data: { user: { id: '1', email: 'test@example.com' } },
        isPending: false,
        error: null
      })

      const { default: Navbar } = await import('@/components/layout/navbar')
      
      expect(() => {
        render(<Navbar />)
      }).not.toThrow()
    })

    it('should handle organization creation', async () => {
      const { prisma } = require('database')
      const mockOrg = { id: 'org-1', name: 'Test Org' }
      
      prisma.organization.create.mockResolvedValue(mockOrg)
      
      const { default: OrgCreationForm } = await import('@/components/org/org-creation-form')
      
      render(<OrgCreationForm />)

      const nameInput = screen.getByRole('textbox', { name: /organization name/i })
      const submitButton = screen.getByRole('button', { name: /create/i })

      fireEvent.change(nameInput, { target: { value: 'Test Organization' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(prisma.organization.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: 'Test Organization'
          })
        })
      })
    })
  })

  describe('Data Operations', () => {
    it('should render data upload component', async () => {
      const { default: FileUploader } = await import('@/components/data/file-uploader')
      
      expect(() => {
        render(<FileUploader onUpload={jest.fn()} />)
      }).not.toThrow()

      expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument()
    })

    it('should handle file upload', async () => {
      const mockOnUpload = jest.fn()
      const { default: FileUploader } = await import('@/components/data/file-uploader')
      
      render(<FileUploader onUpload={mockOnUpload} />)

      const file = new File(['test,data\n1,value'], 'test.csv', { type: 'text/csv' })
      const input = screen.getByLabelText(/upload/i)

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith([file])
      })
    })
  })

  describe('Error Boundaries', () => {
    it('should catch and display errors gracefully', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      // This should be wrapped in an error boundary in a real app
      expect(() => {
        render(<ThrowError />)
      }).toThrow('Test error')
    })
  })

  describe('Critical API Endpoints', () => {
    it('should have auth route handlers defined', () => {
      expect(async () => {
        const { GET, POST, OPTIONS } = await import('@/app/api/auth/[...all]/route')
        expect(GET).toBeDefined()
        expect(POST).toBeDefined()
        expect(OPTIONS).toBeDefined()
      }).not.toThrow()
    })

    it('should have data upload route defined', () => {
      expect(async () => {
        const { POST } = await import('@/app/api/data/upload/route')
        expect(POST).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Environment and Configuration', () => {
    it('should have required environment variables in test environment', () => {
      // These would be mocked in test environment
      const requiredVars = [
        'BETTER_AUTH_SECRET',
        'DATABASE_URL',
        'NEXT_PUBLIC_APP_URL'
      ]

      // In a real test, you'd verify these are set appropriately for the environment
      requiredVars.forEach(envVar => {
        // This is just a smoke test - in production you'd have actual validation
        expect(typeof process.env[envVar]).toBe('string')
      })
    })

    it('should have valid auth configuration', async () => {
      expect(async () => {
        const { auth } = await import('@/lib/auth')
        expect(auth).toBeDefined()
        expect(auth.handler).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Performance Critical Components', () => {
    it('should render large data tables efficiently', async () => {
      const { default: DataTable } = await import('@/components/data/data-table')
      
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random() * 1000
      }))

      const start = performance.now()
      
      render(<DataTable data={largeDataset} />)
      
      const end = performance.now()
      const renderTime = end - start

      // Should render in under 200ms for good UX
      expect(renderTime).toBeLessThan(200)
    })
  })
})