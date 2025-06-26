import { mount } from 'cypress/react18'
import './commands'

Cypress.Commands.add('mount', mount)

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
} 