describe('Complete User Journey', () => {
  it('walks through the full application workflow', () => {
    // 1. Landing page and signup
    cy.visit('/')
    cy.contains('Welcome to K-Fin').should('be.visible')
    cy.get('[data-testid="get-started"]').click()

    // 2. Authentication
    cy.url().should('include', '/auth/login')
    cy.get('[data-testid="signup-toggle"]').click()
    
    const testEmail = `test-${Date.now()}@example.com`
    cy.get('[data-testid="email-input"]').type(testEmail)
    cy.get('[data-testid="password-input"]').type('TestPassword123!')
    cy.get('[data-testid="login-button"]').click()

    // 3. Organization creation
    cy.url().should('include', '/org/create')
    cy.get('[data-testid="org-name"]').type('Test Company')
    cy.get('[data-testid="currency-select"]').select('USD')
    cy.get('[data-testid="plan-select"]').select('pro')
    cy.get('[data-testid="create-org"]').click()

    // 4. Dashboard landing
    cy.url().should('include', '/org/')
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome to Test Company').should('be.visible')

    // 5. Data upload workflow
    cy.get('[data-testid="sidebar-data"]').click()
    cy.get('[data-testid="uploads-tab"]').click()
    
    cy.uploadFile('sample-data.csv')
    cy.get('[data-testid="file-preview"]').should('be.visible')
    cy.contains('50 rows detected').should('be.visible')
    
    // Column mapping
    cy.get('[data-testid="column-mapping"]').should('be.visible')
    cy.get('[data-testid="map-date"]').select('Date')
    cy.get('[data-testid="map-description"]').select('Description')
    cy.get('[data-testid="map-amount"]').select('Amount')
    
    cy.get('[data-testid="import-button"]').click()
    cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')

    // 6. View imported data
    cy.get('[data-testid="view-data"]').click()
    cy.get('[data-testid="transactions-table"]').should('be.visible')
    cy.get('[data-testid="transaction-row"]').should('have.length.at.least', 10)

    // 7. Create a budget
    cy.get('[data-testid="sidebar-budgets"]').click()
    cy.get('[data-testid="create-budget"]').click()
    
    cy.get('[data-testid="budget-name"]').type('Monthly Budget')
    cy.get('[data-testid="budget-amount"]').type('5000')
    cy.get('[data-testid="budget-category"]').select('All Categories')
    cy.get('[data-testid="save-budget"]').click()
    
    cy.contains('Budget created successfully').should('be.visible')

    // 8. Generate a report
    cy.get('[data-testid="sidebar-reports"]').click()
    cy.get('[data-testid="generate-report"]').click()
    
    cy.get('[data-testid="report-type"]').select('Monthly Summary')
    cy.get('[data-testid="date-range"]').type('2024-01-01 to 2024-12-31')
    cy.get('[data-testid="create-report"]').click()
    
    cy.get('[data-testid="report-chart"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="report-metrics"]').should('be.visible')

    // 9. Set up Google integration
    cy.get('[data-testid="sidebar-integrations"]').click()
    cy.get('[data-testid="integration-google"]').click()
    
    cy.get('[data-testid="service-account-tab"]').click()
    cy.get('[data-testid="integration-name"]').type('Test Integration')
    
    // Upload mock service account file
    cy.fixture('service-account-credentials.json').then((credentials) => {
      cy.get('[data-testid="credentials-json"]').type(JSON.stringify(credentials))
    })
    
    cy.get('[data-testid="setup-service-account"]').click()
    cy.contains('Service account integration set up successfully').should('be.visible')

    // 10. Export to Google Sheets
    cy.get('[data-testid="sidebar-data"]').click()
    cy.get('[data-testid="export-tab"]').click()
    cy.get('[data-testid="export-to-sheets"]').click()
    
    cy.get('[data-testid="select-integration"]').select('Test Integration')
    cy.get('[data-testid="spreadsheet-name"]').type('Financial Data Export')
    cy.get('[data-testid="start-export"]').click()
    
    cy.contains('Export completed successfully', { timeout: 15000 }).should('be.visible')

    // 11. Team management (if pro plan)
    cy.get('[data-testid="sidebar-team"]').click()
    cy.get('[data-testid="invite-member"]').click()
    
    cy.get('[data-testid="member-email"]').type('colleague@example.com')
    cy.get('[data-testid="member-role"]').select('editor')
    cy.get('[data-testid="send-invitation"]').click()
    
    cy.contains('Invitation sent successfully').should('be.visible')

    // 12. Settings and profile
    cy.get('[data-testid="user-dropdown"]').click()
    cy.get('[data-testid="profile-link"]').click()
    
    cy.get('[data-testid="display-name"]').clear().type('Test User Updated')
    cy.get('[data-testid="save-profile"]').click()
    
    cy.contains('Profile updated successfully').should('be.visible')

    // 13. Organization settings
    cy.get('[data-testid="sidebar-settings"]').click()
    cy.get('[data-testid="org-settings-tab"]').click()
    
    cy.get('[data-testid="org-name"]').should('have.value', 'Test Company')
    cy.get('[data-testid="default-currency"]').should('have.value', 'USD')

    // 14. Verify dashboard summary
    cy.get('[data-testid="sidebar-dashboard"]').click()
    
    // Should show data from all our actions
    cy.get('[data-testid="total-transactions"]').should('not.contain', '0')
    cy.get('[data-testid="active-budgets"]').should('contain', '1')
    cy.get('[data-testid="connected-integrations"]').should('contain', '1')
    
    // 15. Logout
    cy.get('[data-testid="user-dropdown"]').click()
    cy.get('[data-testid="logout"]').click()
    
    cy.url().should('include', '/auth/login')
    cy.contains('Sign in to your account').should('be.visible')
  })

  it('handles error scenarios gracefully', () => {
    // Test error handling throughout the journey
    cy.visit('/org/nonexistent-org/dashboard')
    cy.contains('Organization not found').should('be.visible')
    
    // Invalid file upload
    cy.login('test@example.com', 'password123')
    cy.visit('/org/test-org/data/uploads')
    
    cy.fixture('invalid-file.txt').then(fileContent => {
      cy.get('[data-testid="file-input"]').selectFile({
        contents: Cypress.Buffer.from(fileContent),
        fileName: 'invalid.txt',
        mimeType: 'text/plain'
      }, { force: true })
    })
    
    cy.contains('Invalid file type').should('be.visible')
    
    // Network error simulation
    cy.intercept('POST', '/api/data/upload', { statusCode: 500 }).as('uploadError')
    cy.uploadFile('sample-data.csv')
    cy.get('[data-testid="import-button"]').click()
    
    cy.contains('Upload failed').should('be.visible')
    cy.get('[data-testid="retry-upload"]').should('be.visible')
  })
}) 