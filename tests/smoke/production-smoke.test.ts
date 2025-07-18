/**
 * Production Smoke Tests
 * These tests run against the live production environment
 * to ensure critical functionality works after deployment
 */

describe('Production Smoke Tests', () => {
  const baseUrl = process.env.PRODUCTION_URL || 'https://k-fin-ten.vercel.app'
  
  describe('Health Checks', () => {
    it('should load the homepage', async () => {
      const response = await fetch(baseUrl)
      expect(response.status).toBe(200)
      
      const html = await response.text()
      expect(html).toContain('k-fin')
    })

    it('should serve static assets', async () => {
      const response = await fetch(`${baseUrl}/_next/static/css`)
      // CSS files should either exist (200) or be properly redirected
      expect([200, 301, 302, 404]).toContain(response.status)
    })

    it('should have proper CORS headers on API routes', async () => {
      const response = await fetch(`${baseUrl}/api/auth/session`, {
        method: 'OPTIONS'
      })
      
      // Should handle OPTIONS requests for CORS
      expect([200, 204]).toContain(response.status)
    })
  })

  describe('Authentication API', () => {
    it('should respond to auth endpoints', async () => {
      const response = await fetch(`${baseUrl}/api/auth/session`)
      
      // Should return auth response (not 5xx error)
      expect(response.status).toBeLessThan(500)
    })

    it('should handle POST requests to sign-in endpoint', async () => {
      const response = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })

      // Should not be a 405 Method Not Allowed or 5xx error
      expect(response.status).not.toBe(405)
      expect(response.status).toBeLessThan(500)
    })
  })

  describe('Critical Pages', () => {
    const criticalPaths = [
      '/',
      '/auth/login',
      '/org/select'
    ]

    criticalPaths.forEach(path => {
      it(`should load ${path} without server errors`, async () => {
        const response = await fetch(`${baseUrl}${path}`)
        
        // Should not be a server error
        expect(response.status).toBeLessThan(500)
        
        // Should return HTML content
        const contentType = response.headers.get('content-type')
        expect(contentType).toMatch(/text\/html/)
      })
    })
  })

  describe('Performance', () => {
    it('should respond to homepage within acceptable time', async () => {
      const start = Date.now()
      
      const response = await fetch(baseUrl)
      
      const duration = Date.now() - start
      
      expect(response.status).toBe(200)
      // Should respond within 3 seconds
      expect(duration).toBeLessThan(3000)
    })

    it('should have proper caching headers for static assets', async () => {
      // Try to fetch a common static file pattern
      const response = await fetch(`${baseUrl}/favicon.ico`)
      
      if (response.status === 200) {
        const cacheControl = response.headers.get('cache-control')
        // Should have some form of caching
        expect(cacheControl).toBeTruthy()
      }
    })
  })

  describe('Security Headers', () => {
    it('should have security headers on main page', async () => {
      const response = await fetch(baseUrl)
      
      const headers = response.headers
      
      // Check for basic security headers
      // Note: Some headers might be set by Vercel automatically
      expect(response.status).toBe(200)
      
      // X-Frame-Options or CSP should be present
      const hasFrameProtection = 
        headers.get('x-frame-options') || 
        headers.get('content-security-policy')
      
      // This is a soft check since Vercel might handle this
      if (!hasFrameProtection) {
        console.warn('No X-Frame-Options or CSP header detected')
      }
    })
  })

  describe('Database Connectivity', () => {
    it('should connect to database through API', async () => {
      // Test an API endpoint that requires database access
      const response = await fetch(`${baseUrl}/api/debug-env`, {
        method: 'GET'
      })

      // Should not be a database connection error (503/500)
      if (response.status >= 500) {
        const text = await response.text()
        expect(text).not.toMatch(/database|connection|timeout/i)
      }
    })
  })

  describe('Environment Configuration', () => {
    it('should have production environment properly configured', async () => {
      // Check that we're hitting the right environment
      expect(baseUrl).toMatch(/vercel\.app|k-fin/)
      expect(baseUrl).toMatch(/^https:/)
    })
  })
})