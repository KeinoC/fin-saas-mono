// Placeholder Google API service
// This file exists to satisfy Jest mocks during testing
// The actual implementation is in google-api.ts.disabled

export const googleAPIService = {
  generateOAuthUrl: () => Promise.resolve(''),
  exchangeCodeForTokens: () => Promise.resolve({}),
  refreshTokens: () => Promise.resolve({}),
  createSpreadsheet: () => Promise.resolve({}),
  updateSpreadsheet: () => Promise.resolve({}),
};