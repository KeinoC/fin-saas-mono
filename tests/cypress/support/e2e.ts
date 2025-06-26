import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string): Chainable<void>
      seedDatabase(): Chainable<void>
      createTestOrg(name?: string): Chainable<any>
      createTestUser(email?: string, password?: string): Chainable<any>
      uploadFile(fileName: string, fileType?: string): Chainable<void>
    }
  }
} 