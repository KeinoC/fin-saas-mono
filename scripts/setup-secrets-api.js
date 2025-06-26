#!/usr/bin/env node

/**
 * Setup GitHub Secrets using REST API
 * 
 * Prerequisites:
 * 1. Create a GitHub Personal Access Token with 'repo' scope
 * 2. Set GITHUB_TOKEN environment variable
 * 3. Install dependencies: npm install @octokit/rest sodium-native
 */

const { Octokit } = require('@octokit/rest');
const sodium = require('sodium-native');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'your-username';
const REPO_NAME = process.env.REPO_NAME || 'your-repo-name';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.error('   Create a Personal Access Token at: https://github.com/settings/tokens');
  console.error('   Grant it "repo" scope and set: export GITHUB_TOKEN=your_token');
  process.exit(1);
}

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

/**
 * Encrypt a secret value for GitHub
 */
function encryptSecret(publicKey, secret) {
  const secretBytes = Buffer.from(secret, 'utf8');
  const publicKeyBytes = Buffer.from(publicKey, 'base64');
  
  const encryptedBytes = Buffer.alloc(secretBytes.length + sodium.crypto_box_SEALBYTES);
  sodium.crypto_box_seal(encryptedBytes, secretBytes, publicKeyBytes);
  
  return encryptedBytes.toString('base64');
}

/**
 * Set a repository secret
 */
async function setSecret(name, value, description = '') {
  try {
    if (!value || value.trim() === '') {
      console.log(`⚠️  Skipping ${name} (empty value)`);
      return;
    }

    console.log(`🔑 Setting secret: ${name}`);

    // Get the repository's public key
    const { data: publicKeyData } = await octokit.rest.actions.getRepoPublicKey({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    // Encrypt the secret
    const encryptedValue = encryptSecret(publicKeyData.key, value);

    // Create or update the secret
    await octokit.rest.actions.createOrUpdateRepoSecret({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      secret_name: name,
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id,
    });

    console.log(`✅ ${name} set successfully`);
  } catch (error) {
    console.error(`❌ Failed to set ${name}:`, error.message);
  }
}

/**
 * Load secrets from environment file
 */
function loadSecretsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Secrets file not found: ${filePath}`);
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const secrets = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (value && value !== 'your_token_here' && !value.includes('your_')) {
        secrets[key.trim()] = value;
      }
    }
  });

  return secrets;
}

/**
 * Main setup function
 */
async function setupSecrets() {
  console.log('🔐 Setting up GitHub repository secrets...');
  console.log(`📁 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log('');

  // Load secrets from file if it exists
  const secretsFile = path.join(__dirname, 'secrets.env');
  const fileSecrets = loadSecretsFromFile(secretsFile);

  // Define secrets with fallbacks to environment variables
  const secrets = {
    // Testing & Coverage
    CODECOV_TOKEN: process.env.CODECOV_TOKEN || fileSecrets.CODECOV_TOKEN || '',
    CYPRESS_RECORD_KEY: process.env.CYPRESS_RECORD_KEY || fileSecrets.CYPRESS_RECORD_KEY || '',

    // Deployment
    VERCEL_TOKEN: process.env.VERCEL_TOKEN || fileSecrets.VERCEL_TOKEN || '',
    VERCEL_ORG_ID: process.env.VERCEL_ORG_ID || fileSecrets.VERCEL_ORG_ID || '',
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID || fileSecrets.VERCEL_PROJECT_ID || '',

    // Notifications
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || fileSecrets.SLACK_WEBHOOK_URL || '',

    // Database & Services
    DATABASE_URL: process.env.DATABASE_URL || fileSecrets.DATABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || fileSecrets.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fileSecrets.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || fileSecrets.SUPABASE_SERVICE_ROLE_KEY || '',

    // OAuth & Integrations
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || fileSecrets.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || fileSecrets.GOOGLE_CLIENT_SECRET || '',
    PLAID_CLIENT_ID: process.env.PLAID_CLIENT_ID || fileSecrets.PLAID_CLIENT_ID || '',
    PLAID_SECRET: process.env.PLAID_SECRET || fileSecrets.PLAID_SECRET || '',

    // Optional
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || fileSecrets.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || fileSecrets.STRIPE_WEBHOOK_SECRET || '',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || fileSecrets.SENDGRID_API_KEY || '',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || fileSecrets.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || fileSecrets.TWILIO_AUTH_TOKEN || '',
  };

  // Set all secrets
  for (const [name, value] of Object.entries(secrets)) {
    await setSecret(name, value);
  }

  console.log('');
  console.log('✅ All secrets have been processed!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Verify secrets in GitHub repository settings');
  console.log('   2. Update any missing values and re-run this script');
  console.log('   3. Test your CI/CD pipeline');
}

/**
 * List existing secrets
 */
async function listSecrets() {
  try {
    const { data } = await octokit.rest.actions.listRepoSecrets({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    console.log(`🔍 Existing secrets in ${REPO_OWNER}/${REPO_NAME}:`);
    console.log('');
    
    if (data.secrets.length === 0) {
      console.log('   No secrets found');
    } else {
      data.secrets.forEach(secret => {
        console.log(`   • ${secret.name} (updated: ${secret.updated_at})`);
      });
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to list secrets:', error.message);
  }
}

// CLI handling
const command = process.argv[2];

if (command === 'list') {
  listSecrets();
} else if (command === 'setup' || !command) {
  setupSecrets();
} else {
  console.log('Usage:');
  console.log('  node setup-secrets-api.js setup   # Set up secrets');
  console.log('  node setup-secrets-api.js list    # List existing secrets');
} 