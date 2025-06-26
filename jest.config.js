const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './apps/web',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/apps/web/$1',
    '^@components/(.*)$': '<rootDir>/apps/web/components/$1',
    '^@features/(.*)$': '<rootDir>/apps/web/features/$1',
    '^@lib/(.*)$': '<rootDir>/apps/web/lib/$1',
    '^database$': '<rootDir>/packages/database',
    '^analytics$': '<rootDir>/packages/analytics',
    '^integrations$': '<rootDir>/packages/integrations',
    '^services$': '<rootDir>/packages/services',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/tests/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/apps/**/*.test.(js|jsx|ts|tsx)',
    '<rootDir>/packages/**/*.test.(js|jsx|ts|tsx)',
  ],
  collectCoverageFrom: [
    'apps/**/*.{js,jsx,ts,tsx}',
    'packages/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|ky)/)',
  ],
}

module.exports = createJestConfig(customJestConfig) 