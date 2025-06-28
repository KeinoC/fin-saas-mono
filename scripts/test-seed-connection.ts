import { prisma } from '../packages/database';
import { authLocal } from '../apps/web/lib/auth-local';

async function testConnections() {
  console.log('🔧 Testing database connections...\n');

  try {
    console.log('1. Testing Prisma connection...');
    const orgCount = await prisma.organization.count();
    console.log(`   ✅ Prisma connected - Found ${orgCount} organizations`);
  } catch (error) {
    console.error('   ❌ Prisma connection failed:', error.message);
    return false;
  }

  try {
    console.log('2. Testing Better Auth connection...');
    const testResult = await authLocal.api.signUpEmail({
      body: {
        email: `test-${Date.now()}@example.com`,
        password: 'test123',
        name: 'Test User',
      },
    });
    
    if (testResult.error && !testResult.error.message?.includes('already exists')) {
      throw new Error(testResult.error.message);
    }
    
    console.log('   ✅ Better Auth connected');
  } catch (error) {
    console.error('   ❌ Better Auth connection failed:', error.message);
    return false;
  }

  console.log('\n✅ All connections successful! Ready to run seed script.');
  return true;
}

async function main() {
  const success = await testConnections();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error('❌ Connection test failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 