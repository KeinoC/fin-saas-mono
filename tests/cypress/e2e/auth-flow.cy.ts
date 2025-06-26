describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.seedDatabase()
  })

  describe('Login', () => {
    it('allows user to sign in with valid credentials', () => {
      cy.createTestUser('test@example.com', 'password123')
      
      cy.visit('/auth/login')
      
      cy.get('[data-testid="email-input"]').type('test@example.com')
      cy.get('[data-testid="password-input"]').type('password123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.url().should('include', '/org/select')
      cy.contains('Select Organization').should('be.visible')
    })

    it('shows error for invalid credentials', () => {
      cy.visit('/auth/login')
      
      cy.get('[data-testid="email-input"]').type('invalid@example.com')
      cy.get('[data-testid="password-input"]').type('wrongpassword')
      cy.get('[data-testid="login-button"]').click()
      
      cy.contains('Invalid credentials').should('be.visible')
      cy.url().should('include', '/auth/login')
    })

    it('redirects to login when accessing protected routes without auth', () => {
      cy.visit('/org/test-org/dashboard')
      cy.url().should('include', '/auth/login')
    })
  })

  describe('Sign Up', () => {
    it('allows new user to create account', () => {
      cy.visit('/auth/login')
      
      cy.contains("Don't have an account? Sign up").click()
      
      cy.get('[data-testid="email-input"]').type('newuser@example.com')
      cy.get('[data-testid="password-input"]').type('newpassword123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.contains('Account created successfully').should('be.visible')
    })

    it('shows error for existing email', () => {
      cy.createTestUser('existing@example.com', 'password123')
      
      cy.visit('/auth/login')
      cy.contains("Don't have an account? Sign up").click()
      
      cy.get('[data-testid="email-input"]').type('existing@example.com')
      cy.get('[data-testid="password-input"]').type('newpassword123')
      cy.get('[data-testid="login-button"]').click()
      
      cy.contains('Email already exists').should('be.visible')
    })
  })

  describe('Organization Selection', () => {
    beforeEach(() => {
      cy.createTestOrg('Test Organization')
      cy.login()
    })

    it('shows available organizations', () => {
      cy.contains('Test Organization').should('be.visible')
      cy.contains('Select Organization').should('be.visible')
    })

    it('allows user to select organization and navigate to dashboard', () => {
      cy.contains('Test Organization').click()
      
      cy.url().should('match', /\/org\/[^\/]+\/dashboard/)
      cy.contains('Dashboard').should('be.visible')
    })

    it('allows user to create new organization', () => {
      cy.contains('Create New Organization').click()
      
      cy.get('[data-testid="org-name-input"]').type('New Test Org')
      cy.get('[data-testid="create-org-button"]').click()
      
      cy.url().should('match', /\/org\/[^\/]+\/dashboard/)
      cy.contains('New Test Org').should('be.visible')
    })
  })

  describe('Session Management', () => {
    it('maintains session across page refreshes', () => {
      cy.createTestOrg('Test Organization')
      cy.login()
      
      cy.contains('Test Organization').click()
      cy.reload()
      
      cy.url().should('match', /\/org\/[^\/]+\/dashboard/)
    })

    it('allows user to logout', () => {
      cy.createTestOrg('Test Organization')
      cy.login()
      cy.contains('Test Organization').click()
      
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="logout-button"]').click()
      
      cy.url().should('include', '/auth/login')
    })
  })

  describe('OAuth Login', () => {
    it('shows OAuth login options', () => {
      cy.visit('/auth/login')
      
      cy.contains('Continue with Google').should('be.visible')
      cy.contains('Continue with GitHub').should('be.visible')
    })

    // Note: OAuth testing would require additional setup with test providers
    // or mocking the OAuth flow
  })
}) 