import { NextRequest } from 'next/server'
import { GET, POST, OPTIONS } from '@/app/api/auth/[...all]/route'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: {
    handler: jest.fn()
  }
}))

describe('/api/auth/[...all] Route Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Route Exports', () => {
    it('should export all required HTTP methods', () => {
      expect(GET).toBeDefined()
      expect(POST).toBeDefined()
      expect(OPTIONS).toBeDefined()
    })

    it('should export handler for all methods', () => {
      const { auth } = require('@/lib/auth')
      expect(GET).toBe(auth.handler)
      expect(POST).toBe(auth.handler)
      expect(OPTIONS).toBe(auth.handler)
    })
  })

  describe('Request Handling', () => {
    it('should handle POST requests to sign-in endpoint', async () => {
      const { auth } = require('@/lib/auth')
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
      auth.handler.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      const response = await POST(request)
      
      expect(auth.handler).toHaveBeenCalledWith(request)
      expect(response).toBe(mockResponse)
    })

    it('should handle GET requests', async () => {
      const { auth } = require('@/lib/auth')
      const mockResponse = new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
      
      auth.handler.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/auth/session', {
        method: 'GET'
      })

      const response = await GET(request)
      
      expect(auth.handler).toHaveBeenCalledWith(request)
      expect(response).toBe(mockResponse)
    })

    it('should handle OPTIONS requests for CORS', async () => {
      const { auth } = require('@/lib/auth')
      const mockResponse = new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
      
      auth.handler.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/auth/sign-in/email', {
        method: 'OPTIONS'
      })

      const response = await OPTIONS(request)
      
      expect(auth.handler).toHaveBeenCalledWith(request)
      expect(response).toBe(mockResponse)
    })
  })

  describe('Error Handling', () => {
    it('should handle auth handler errors gracefully', async () => {
      const { auth } = require('@/lib/auth')
      const error = new Error('Database connection failed')
      auth.handler.mockRejectedValue(error)

      const request = new NextRequest('http://localhost:3000/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      })

      await expect(POST(request)).rejects.toThrow('Database connection failed')
    })
  })
})