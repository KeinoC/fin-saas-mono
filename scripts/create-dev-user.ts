#!/usr/bin/env tsx

/**
 * Development User Creation Script
 * Creates a development user for quick login in Docker environment
 * 
 * Usage: npx tsx scripts/create-dev-user.ts
 */

import { authLocal } from '../apps/web/lib/auth-local';

const DEV_USER = {
  email: 'keino.chichester@gmail.com',
  password: 'dev123456', // Simple password for development only
  name: 'Keino Chichester',
};

async function createDevUser() {
  console.log('🔧 Creating development user...');
  
  try {
    // Check if user already exists
    const existingUser = await authLocal.api.getUser({
      query: {
        email: DEV_USER.email,
      },
    });

    if (existingUser) {
      console.log(`✅ Development user ${DEV_USER.email} already exists`);
      console.log(`📧 Email: ${DEV_USER.email}`);
      console.log(`🔑 Password: ${DEV_USER.password}`);
      return;
    }

    // Create the user
    const user = await authLocal.api.signUpEmail({
      body: {
        email: DEV_USER.email,
        password: DEV_USER.password,
        name: DEV_USER.name,
      },
    });

    if (user) {
      console.log('✅ Development user created successfully!');
      console.log(`📧 Email: ${DEV_USER.email}`);
      console.log(`🔑 Password: ${DEV_USER.password}`);
      console.log(`👤 Name: ${DEV_USER.name}`);
      console.log('');
      console.log('🎉 You can now login at http://localhost:3000/auth/login');
    } else {
      console.error('❌ Failed to create user');
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`✅ Development user ${DEV_USER.email} already exists`);
      console.log(`📧 Email: ${DEV_USER.email}`);
      console.log(`🔑 Password: ${DEV_USER.password}`);
    } else {
      console.error('❌ Error creating development user:', error);
      process.exit(1);
    }
  }
}

// Only run in development environment
if (process.env.NODE_ENV !== 'development') {
  console.error('❌ This script only runs in development environment');
  console.error('Set NODE_ENV=development to run this script');
  process.exit(1);
}

createDevUser().catch((error) => {
  console.error('❌ Failed to create development user:', error);
  process.exit(1);
});