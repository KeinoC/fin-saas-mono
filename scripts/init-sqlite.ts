import { initializeSQLiteDB } from '../apps/web/lib/init-sqlite';

console.log('🔧 Initializing SQLite database for development...\n');

try {
  const success = initializeSQLiteDB();
  if (success) {
    console.log('✅ SQLite database initialized successfully!');
    console.log('   You can now run: npm run db:seed');
  } else {
    console.error('❌ SQLite database initialization failed');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error during SQLite initialization:', error);
  process.exit(1);
} 