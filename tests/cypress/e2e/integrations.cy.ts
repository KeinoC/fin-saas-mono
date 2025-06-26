describe('Integrations Feature', () => {
  beforeEach(() => {
    cy.seedDatabase()
    cy.createTestOrg('Test Organization')
    cy.login()
    cy.contains('Test Organization').click()
  })

  describe('Integration Dashboard', () => {
    it('shows integration overview', () => {
      cy.visit('/org/test-org/integrations')
      
      cy.contains('Integrations').should('be.visible')
      cy.get('[data-testid="integration-grid"]').should('be.visible')
      
      // Should show available integrations
      cy.contains('Google Workspace').should('be.visible')
      cy.contains('Plaid').should('be.visible')
      cy.contains('QuickBooks').should('be.visible')
    })

    it('shows integration status correctly', () => {
      cy.visit('/org/test-org/integrations')
      
      cy.get('[data-testid="integration-google"]').within(() => {
        cy.get('[data-testid="status-badge"]').should('contain', 'Not Connected')
      })
    })
  })

  describe('Google Integration', () => {
    beforeEach(() => {
      cy.visit('/org/test-org/integrations')
      cy.get('[data-testid="integration-google"]').click()
    })

    it('shows Google integration setup page', () => {
      cy.contains('Google Workspace Integration').should('be.visible')
      cy.get('[data-testid="oauth-tab"]').should('be.visible')
      cy.get('[data-testid="service-account-tab"]').should('be.visible')
    })

    describe('OAuth Setup', () => {
      it('initiates OAuth flow', () => {
        // Mock the OAuth redirect
        cy.intercept('GET', '/api/integrations/google/auth*', {
          statusCode: 200,
          body: { authUrl: 'https://accounts.google.com/oauth/authorize?test=true' }
        }).as('getAuthUrl')

        cy.get('[data-testid="connect-oauth"]').click()

        cy.wait('@getAuthUrl')
        // In a real test, this would redirect to Google
        // For testing purposes, we can verify the request was made
      })

      it('handles OAuth callback', () => {
        // Simulate OAuth callback with authorization code
        cy.visit('/api/integrations/google/callback?code=test_auth_code&state=test_state')
        
        // Should redirect back to integrations page with success
        cy.url().should('include', '/integrations')
        cy.contains('Google integration connected successfully').should('be.visible')
      })

      it('handles OAuth errors', () => {
        cy.visit('/api/integrations/google/callback?error=access_denied')
        
        cy.url().should('include', '/integrations')
        cy.contains('Integration setup was cancelled').should('be.visible')
      })
    })

    describe('Service Account Setup', () => {
      beforeEach(() => {
        cy.get('[data-testid="service-account-tab"]').click()
      })

      it('allows service account credentials upload', () => {
        const serviceAccountCredentials = {
          type: 'service_account',
          project_id: 'test-project',
          private_key_id: 'key-id',
          private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
          client_email: 'test@test-project.iam.gserviceaccount.com',
          client_id: '123456789',
        }

        cy.get('[data-testid="integration-name"]').type('Test Service Account')
        cy.get('[data-testid="credentials-json"]').type(JSON.stringify(serviceAccountCredentials))
        
        cy.intercept('POST', '/api/integrations/google/service-account', {
          statusCode: 200,
          body: { success: true }
        }).as('setupServiceAccount')

        cy.get('[data-testid="setup-service-account"]').click()

        cy.wait('@setupServiceAccount')
        cy.contains('Service account integration set up successfully').should('be.visible')
      })

      it('validates service account credentials', () => {
        cy.get('[data-testid="integration-name"]').type('Test Service Account')
        cy.get('[data-testid="credentials-json"]').type('invalid json')
        
        cy.get('[data-testid="setup-service-account"]').click()
        
        cy.contains('Invalid JSON format for credentials').should('be.visible')
      })

      it('allows file upload for credentials', () => {
        cy.fixture('service-account-credentials.json').then((credentials) => {
          cy.get('[data-testid="credentials-file-upload"]').selectFile({
            contents: JSON.stringify(credentials),
            fileName: 'service-account.json',
            mimeType: 'application/json',
          })
        })

        // Credentials should be automatically populated
        cy.get('[data-testid="credentials-json"]').should('not.be.empty')
      })
    })

    describe('Connected Integrations', () => {
      beforeEach(() => {
        // Mock having an existing integration
        cy.intercept('GET', '/api/integrations/google*', {
          statusCode: 200,
          body: {
            integrations: [
              {
                id: 'integration-1',
                authMethod: 'oauth',
                name: 'John Doe',
                email: 'john@example.com',
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                createdAt: new Date().toISOString(),
              }
            ]
          }
        })
        cy.reload()
      })

      it('shows connected integrations', () => {
        cy.contains('John Doe').should('be.visible')
        cy.contains('john@example.com').should('be.visible')
        cy.get('[data-testid="integration-status-connected"]').should('be.visible')
      })

      it('allows disconnecting integration', () => {
        cy.get('[data-testid="disconnect-integration"]').click()
        cy.get('[data-testid="confirm-disconnect"]').click()
        
        cy.contains('Integration disconnected successfully').should('be.visible')
      })

      it('shows integration permissions', () => {
        cy.get('[data-testid="view-permissions"]').click()
        
        cy.contains('Google Sheets (Read/Write)').should('be.visible')
        cy.contains('Permissions granted').should('be.visible')
      })
    })
  })

  describe('Export to Google Sheets', () => {
    beforeEach(() => {
      // Mock having data and connected integration
      cy.intercept('GET', '/api/integrations/google/export-to-sheets*', {
        statusCode: 200,
        body: {
          integrations: [
            {
              id: 'integration-1',
              authMethod: 'service_account',
              name: 'Organization Service Account',
              email: 'service@project.iam.gserviceaccount.com',
              scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            }
          ]
        }
      })
    })

    it('exports data to Google Sheets', () => {
      // First upload some data
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')

      // Then try to export
      cy.get('[data-testid="export-to-sheets"]').click()
      
      cy.get('[data-testid="export-modal"]').should('be.visible')
      cy.get('[data-testid="select-integration"]').select('Organization Service Account')
      cy.get('[data-testid="spreadsheet-name"]').type('Financial Data Export')
      
      cy.intercept('POST', '/api/integrations/google/export-to-sheets', {
        statusCode: 200,
        body: { 
          success: true, 
          spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/test-id/edit'
        }
      }).as('exportToSheets')

      cy.get('[data-testid="start-export"]').click()

      cy.wait('@exportToSheets')
      cy.contains('Export completed successfully').should('be.visible')
      cy.get('[data-testid="view-spreadsheet"]').should('be.visible')
    })

    it('handles export errors', () => {
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')

      cy.get('[data-testid="export-to-sheets"]').click()
      
      cy.intercept('POST', '/api/integrations/google/export-to-sheets', {
        statusCode: 400,
        body: { error: 'Insufficient permissions' }
      }).as('exportError')

      cy.get('[data-testid="start-export"]').click()

      cy.wait('@exportError')
      cy.contains('Export failed: Insufficient permissions').should('be.visible')
    })

    it('shows export progress', () => {
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')

      cy.get('[data-testid="export-to-sheets"]').click()
      
      // Mock slow export for progress testing
      cy.intercept('POST', '/api/integrations/google/export-to-sheets', (req) => {
        req.reply({
          delay: 2000,
          statusCode: 200,
          body: { success: true }
        })
      }).as('slowExport')

      cy.get('[data-testid="start-export"]').click()

      cy.get('[data-testid="export-progress"]').should('be.visible')
      cy.contains('Exporting data...').should('be.visible')
    })
  })

  describe('Plaid Integration', () => {
    it('shows Plaid integration setup', () => {
      cy.visit('/org/test-org/integrations')
      cy.get('[data-testid="integration-plaid"]').click()
      
      cy.contains('Plaid Integration').should('be.visible')
      cy.contains('Connect your bank accounts').should('be.visible')
      cy.get('[data-testid="connect-plaid"]').should('be.visible')
    })

    it('initiates Plaid Link flow', () => {
      cy.visit('/org/test-org/integrations')
      cy.get('[data-testid="integration-plaid"]').click()
      
      cy.intercept('POST', '/api/plaid/link-token', {
        statusCode: 200,
        body: { 
          success: true,
          link_token: 'test-link-token'
        }
      }).as('createLinkToken')

      cy.get('[data-testid="connect-plaid"]').click()

      cy.wait('@createLinkToken')
      // In real implementation, this would open Plaid Link
      cy.contains('Opening Plaid Link...').should('be.visible')
    })
  })

  describe('Integration Settings', () => {
    it('allows configuring integration settings', () => {
      cy.visit('/org/test-org/integrations')
      cy.get('[data-testid="integration-settings"]').click()
      
      cy.contains('Integration Settings').should('be.visible')
      cy.get('[data-testid="auto-sync"]').should('be.visible')
      cy.get('[data-testid="sync-frequency"]').should('be.visible')
      cy.get('[data-testid="notification-settings"]').should('be.visible')
    })

    it('saves integration preferences', () => {
      cy.visit('/org/test-org/integrations')
      cy.get('[data-testid="integration-settings"]').click()
      
      cy.get('[data-testid="auto-sync"]').check()
      cy.get('[data-testid="sync-frequency"]').select('daily')
      cy.get('[data-testid="email-notifications"]').check()
      
      cy.get('[data-testid="save-settings"]').click()
      
      cy.contains('Settings saved successfully').should('be.visible')
    })
  })
}) 