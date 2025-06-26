Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/auth/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('include', '/org/select')
})

Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase')
})

Cypress.Commands.add('createTestOrg', (name = 'Test Organization') => {
  return cy.request({
    method: 'POST',
    url: '/api/create-test-user',
    body: {
      orgName: name,
      userEmail: 'test@example.com',
      userPassword: 'password123',
    },
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body
  })
})

Cypress.Commands.add('createTestUser', (email = 'test@example.com', password = 'password123') => {
  return cy.request({
    method: 'POST',
    url: '/api/create-test-user',
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200)
    return response.body
  })
})

Cypress.Commands.add('uploadFile', (fileName: string, fileType = 'text/csv') => {
  cy.fixture(fileName).then((fileContent) => {
    cy.get('[data-testid="file-upload"]').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName,
      mimeType: fileType,
    })
  })
}) 