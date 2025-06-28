import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'k-fin-dev.db');

console.log('🚀 Setting up development environment...\n');

try {
  console.log('1. 🧹 Cleaning up existing database...');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('   ✅ Removed existing database file');
  } else {
    console.log('   ✅ No existing database found');
  }

  console.log('\n2. 🔧 Initializing SQLite database...');
  execSync('npm run db:init', { stdio: 'inherit' });

  console.log('\n3. 🌱 Seeding development data...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('\n🎉 Development environment setup complete!');
  console.log('\n📋 Quick Start Guide:');
  console.log('===========================================');
  console.log('1. Start the development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Open your browser to:');
  console.log('   http://localhost:3000');
  console.log('');
  console.log('3. Log in with any of these test accounts:');
  console.log('   • keino.chichester@gmail.com (password: password123)');
  console.log('   • user@example.com (password: user123)');
  console.log('   • demo@example.com (password: demo123)');
  console.log('');
  console.log('4. Test CSV uploads with sample files in:');
  console.log('   scripts/sample-data/');
  console.log('');
  console.log('💡 Happy coding!');

} catch (error) {
  console.error('❌ Setup failed:', error);
  process.exit(1);
} 