#!/usr/bin/env tsx

/**
 * Development User Creation Script for Better Auth
 * Creates a development user for quick login in Docker environment
 * 
 * Usage: npx tsx scripts/create-dev-user-better-auth.ts
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Import database client
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEV_USER = {
  email: 'keino.chichester@gmail.com',
  password: 'dev123456', // Simple password for development only
  name: 'Keino Chichester',
};

async function createDevUser() {
  console.log('🔧 Creating development user with Better Auth...');
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: DEV_USER.email,
      },
    });

    if (existingUser) {
      console.log(`✅ Development user ${DEV_USER.email} already exists`);
      console.log(`📧 Email: ${DEV_USER.email}`);
      console.log(`🔑 Password: ${DEV_USER.password}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(DEV_USER.password, 12);

    // Create user with Better Auth compatible structure
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: DEV_USER.email,
        name: DEV_USER.name,
        emailVerified: true, // Skip email verification in dev
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create account record for email/password login
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: 'credential',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Development user created successfully!');
    console.log(`📧 Email: ${DEV_USER.email}`);
    console.log(`🔑 Password: ${DEV_USER.password}`);
    console.log(`👤 Name: ${DEV_USER.name}`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log('');
    console.log('🎉 You can now login at http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Error creating development user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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