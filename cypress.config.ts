import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/cypress/support/e2e.ts',
    fixturesFolder: 'tests/cypress/fixtures',
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'tests/cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'tests/cypress/support/component.ts',
  },
  env: {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:54322/postgres',
  },
}) 