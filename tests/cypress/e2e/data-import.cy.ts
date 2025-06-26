describe('Data Import Feature', () => {
  beforeEach(() => {
    cy.seedDatabase()
    cy.createTestOrg('Test Organization')
    cy.login()
    cy.contains('Test Organization').click()
  })

  describe('CSV Upload', () => {
    it('uploads CSV file successfully', () => {
      cy.visit('/org/test-org/data/uploads')
      
      cy.uploadFile('sample-data.csv')
      
      cy.get('[data-testid="preview-data"]').should('be.visible')
      cy.contains('Account Name').should('be.visible')
      cy.contains('Checking Account').should('be.visible')
      cy.contains('5000.00').should('be.visible')
    })

    it('validates CSV file format', () => {
      cy.visit('/org/test-org/data/uploads')
      
      // Try to upload invalid file format
      cy.fixture('invalid-file.txt').then((fileContent) => {
        cy.get('[data-testid="file-upload"]').selectFile({
          contents: Cypress.Buffer.from(fileContent),
          fileName: 'invalid-file.txt',
          mimeType: 'text/plain',
        })
      })
      
      cy.contains('Please upload a valid CSV file').should('be.visible')
    })

    it('shows file size validation', () => {
      cy.visit('/org/test-org/data/uploads')
      
      // Create a large file content
      const largeContent = 'A,B,C\n'.repeat(100000)
      cy.get('[data-testid="file-upload"]').selectFile({
        contents: Cypress.Buffer.from(largeContent),
        fileName: 'large-file.csv',
        mimeType: 'text/csv',
      })
      
      cy.contains('File size too large').should('be.visible')
    })
  })

  describe('Data Preview and Validation', () => {
    beforeEach(() => {
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
    })

    it('displays data preview correctly', () => {
      cy.get('[data-testid="preview-table"]').should('be.visible')
      cy.get('[data-testid="preview-row"]').should('have.length.at.least', 5)
      
      // Check headers
      cy.contains('Account Name').should('be.visible')
      cy.contains('Category').should('be.visible')
      cy.contains('Amount').should('be.visible')
      cy.contains('Date').should('be.visible')
      cy.contains('Description').should('be.visible')
    })

    it('allows column mapping', () => {
      cy.get('[data-testid="column-mapping"]').should('be.visible')
      
      // Map columns to expected fields
      cy.get('[data-testid="map-account"]').select('Account Name')
      cy.get('[data-testid="map-amount"]').select('Amount')
      cy.get('[data-testid="map-date"]').select('Date')
      
      cy.get('[data-testid="mapping-valid"]').should('be.visible')
    })

    it('validates data types', () => {
      cy.get('[data-testid="validation-errors"]').should('be.visible')
      cy.contains('Invalid date format').should('not.exist')
      cy.contains('Invalid amount format').should('not.exist')
    })

    it('shows data statistics', () => {
      cy.get('[data-testid="data-stats"]').should('be.visible')
      cy.contains('5 rows').should('be.visible')
      cy.contains('Total amount: $4,524.50').should('be.visible')
    })
  })

  describe('Import Process', () => {
    beforeEach(() => {
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
    })

    it('imports data successfully', () => {
      cy.get('[data-testid="import-button"]').click()
      
      cy.get('[data-testid="import-progress"]').should('be.visible')
      cy.contains('Processing...').should('be.visible')
      
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="import-summary"]').should('be.visible')
      cy.contains('5 records imported').should('be.visible')
    })

    it('handles import errors gracefully', () => {
      // Upload file with some invalid data
      cy.uploadFile('invalid-data.csv')
      cy.get('[data-testid="import-button"]').click()
      
      cy.contains('Import completed with errors').should('be.visible')
      cy.get('[data-testid="error-details"]').should('be.visible')
      cy.contains('3 records imported, 2 failed').should('be.visible')
    })

    it('allows duplicate handling selection', () => {
      cy.get('[data-testid="duplicate-handling"]').should('be.visible')
      cy.get('[data-testid="duplicate-skip"]').check()
      
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Skipping duplicates').should('be.visible')
    })
  })

  describe('Import History', () => {
    it('shows import history', () => {
      cy.visit('/org/test-org/data/uploads')
      
      cy.get('[data-testid="import-history"]').should('be.visible')
      cy.contains('Recent Imports').should('be.visible')
    })

    it('allows viewing import details', () => {
      // First create an import
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')
      
      // View import history
      cy.reload()
      cy.get('[data-testid="import-history-item"]').first().click()
      
      cy.get('[data-testid="import-details"]').should('be.visible')
      cy.contains('sample-data.csv').should('be.visible')
      cy.contains('5 records').should('be.visible')
    })

    it('allows downloading import results', () => {
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')
      
      cy.get('[data-testid="download-results"]').click()
      
      // Verify download initiated
      cy.readFile('cypress/downloads/import-results.csv').should('exist')
    })
  })

  describe('Excel File Support', () => {
    it('handles Excel files', () => {
      cy.visit('/org/test-org/data/uploads')
      
      cy.uploadFile('sample-data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      
      cy.get('[data-testid="preview-data"]').should('be.visible')
      cy.contains('Sheet selection').should('be.visible')
      cy.get('[data-testid="sheet-selector"]').select('Sheet1')
    })
  })

  describe('Data Transformation', () => {
    beforeEach(() => {
      cy.visit('/org/test-org/data/uploads')
      cy.uploadFile('sample-data.csv')
    })

    it('allows data transformation rules', () => {
      cy.get('[data-testid="transformation-rules"]').should('be.visible')
      
      // Add transformation rule
      cy.get('[data-testid="add-rule"]').click()
      cy.get('[data-testid="rule-field"]').select('Amount')
      cy.get('[data-testid="rule-operation"]').select('Convert to positive')
      
      cy.get('[data-testid="preview-transformation"]').click()
      cy.contains('Preview updated').should('be.visible')
    })

    it('validates transformation rules', () => {
      cy.get('[data-testid="add-rule"]').click()
      cy.get('[data-testid="rule-field"]').select('Date')
      cy.get('[data-testid="rule-operation"]').select('Format date')
      cy.get('[data-testid="rule-format"]').type('YYYY-MM-DD')
      
      cy.get('[data-testid="validate-rule"]').click()
      cy.contains('Rule validated successfully').should('be.visible')
    })
  })

  describe('Integration with Data Processing', () => {
    it('processes imported data for analysis', () => {
      cy.uploadFile('sample-data.csv')
      cy.get('[data-testid="import-button"]').click()
      cy.contains('Data imported successfully', { timeout: 10000 }).should('be.visible')
      
      // Navigate to dashboard to see processed data
      cy.visit('/org/test-org/dashboard')
      
      cy.get('[data-testid="financial-summary"]').should('be.visible')
      cy.contains('Recent transactions: 5').should('be.visible')
    })
  })
}) 