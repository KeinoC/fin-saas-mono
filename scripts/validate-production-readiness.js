#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * 
 * This script runs comprehensive checks to ensure the application
 * is ready for production deployment without breaking changes.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

class ProductionValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passed = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '🔍',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type]
    
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async runCommand(command, description, options = {}) {
    this.log(`Running: ${description}`)
    
    try {
      const result = execSync(command, {
        stdio: 'pipe',
        encoding: 'utf-8',
        timeout: options.timeout || 60000,
        ...options
      })
      
      this.passed.push(description)
      this.log(`${description} - PASSED`, 'success')
      return result
    } catch (error) {
      const errorMessage = `${description} - FAILED: ${error.message}`
      
      if (options.critical !== false) {
        this.errors.push(errorMessage)
        this.log(errorMessage, 'error')
      } else {
        this.warnings.push(errorMessage)
        this.log(errorMessage, 'warning')
      }
      
      throw error
    }
  }

  async checkEnvironmentFiles() {
    this.log('Checking environment configuration...')
    
    const envPath = path.join(process.cwd(), '.env')
    const envExamplePath = path.join(process.cwd(), '.env.example')
    
    if (!fs.existsSync(envPath)) {
      this.warnings.push('No .env file found')
      this.log('No .env file found', 'warning')
    } else {
      this.passed.push('Environment file exists')
      this.log('Environment file exists', 'success')
    }

    if (!fs.existsSync(envExamplePath)) {
      this.warnings.push('No .env.example file found')
      this.log('No .env.example file found', 'warning')
    }
  }

  async checkDependencies() {
    this.log('Checking dependencies...')
    
    try {
      await this.runCommand('npm audit --audit-level moderate', 'Security audit')
    } catch (error) {
      // Security audit might fail but shouldn't block deployment
      this.log('Security audit found issues - review recommended', 'warning')
    }

    await this.runCommand('npm ls --depth=0', 'Dependency tree validation', { critical: false })
  }

  async runCodeQualityChecks() {
    this.log('Running code quality checks...')
    
    await this.runCommand('npm run lint', 'Code linting')
    await this.runCommand('npm run type-check', 'TypeScript type checking')
    
    try {
      await this.runCommand('npm run format -- --check', 'Code formatting check', { critical: false })
    } catch (error) {
      this.log('Code formatting issues found - consider running npm run format', 'warning')
    }
  }

  async runTests() {
    this.log('Running test suites...')
    
    // Unit tests
    await this.runCommand(
      'npm run test:coverage -- --watchAll=false --passWithNoTests', 
      'Unit tests with coverage',
      { timeout: 120000 }
    )

    // API tests
    await this.runCommand(
      'npm run test:api -- --watchAll=false --passWithNoTests', 
      'API integration tests',
      { timeout: 60000 }
    )

    // Build validation tests
    await this.runCommand(
      'npm run test:build -- --watchAll=false --passWithNoTests', 
      'Build validation tests',
      { timeout: 180000 }
    )

    // Smoke tests
    await this.runCommand(
      'npm run test:smoke -- --watchAll=false --passWithNoTests', 
      'Smoke tests',
      { timeout: 60000 }
    )
  }

  async validateBuild() {
    this.log('Validating build process...')
    
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'production-secret',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://k-fin-ten.vercel.app',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'production-client-id',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'production-client-secret'
    }

    await this.runCommand('npm run build', 'Production build', { 
      timeout: 300000,
      env: buildEnv
    })

    // Check build artifacts
    const buildDir = path.join(process.cwd(), 'apps/web/.next')
    if (!fs.existsSync(buildDir)) {
      this.errors.push('Build directory not found')
      this.log('Build directory not found', 'error')
    } else {
      this.passed.push('Build artifacts generated')
      this.log('Build artifacts generated', 'success')
    }
  }

  async checkCriticalFiles() {
    this.log('Checking critical files...')
    
    const criticalFiles = [
      'apps/web/app/api/auth/[...all]/route.ts',
      'apps/web/lib/auth.ts',
      'apps/web/next.config.ts',
      'packages/database/prisma/schema.prisma',
      '.github/workflows/ci.yml'
    ]

    criticalFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        this.passed.push(`Critical file exists: ${file}`)
        this.log(`Critical file exists: ${file}`, 'success')
      } else {
        this.errors.push(`Critical file missing: ${file}`)
        this.log(`Critical file missing: ${file}`, 'error')
      }
    })
  }

  async validateDatabase() {
    this.log('Validating database configuration...')
    
    try {
      await this.runCommand(
        'cd packages/database && npx prisma generate',
        'Prisma client generation'
      )
      
      // Try to validate schema without connecting to database
      await this.runCommand(
        'cd packages/database && npx prisma validate',
        'Prisma schema validation'
      )
    } catch (error) {
      this.log('Database validation failed - check connection and schema', 'warning')
    }
  }

  generateReport() {
    this.log('\n' + '='.repeat(60))
    this.log('PRODUCTION READINESS VALIDATION REPORT')
    this.log('='.repeat(60))
    
    this.log(`\n✅ PASSED CHECKS (${this.passed.length}):`)
    this.passed.forEach(check => this.log(`  • ${check}`))
    
    if (this.warnings.length > 0) {
      this.log(`\n⚠️  WARNINGS (${this.warnings.length}):`)
      this.warnings.forEach(warning => this.log(`  • ${warning}`))
    }
    
    if (this.errors.length > 0) {
      this.log(`\n❌ CRITICAL ERRORS (${this.errors.length}):`)
      this.errors.forEach(error => this.log(`  • ${error}`))
    }
    
    const totalChecks = this.passed.length + this.warnings.length + this.errors.length
    const successRate = Math.round((this.passed.length / totalChecks) * 100)
    
    this.log(`\n📊 SUMMARY:`)
    this.log(`  • Total checks: ${totalChecks}`)
    this.log(`  • Success rate: ${successRate}%`)
    this.log(`  • Status: ${this.errors.length === 0 ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`)
    
    return this.errors.length === 0
  }

  async run() {
    try {
      this.log('Starting production readiness validation...')
      
      await this.checkEnvironmentFiles()
      await this.checkCriticalFiles()
      await this.checkDependencies()
      await this.runCodeQualityChecks()
      await this.validateDatabase()
      await this.runTests()
      await this.validateBuild()
      
    } catch (error) {
      this.log(`Validation interrupted: ${error.message}`, 'error')
    }
    
    const isReady = this.generateReport()
    
    if (!isReady) {
      process.exit(1)
    }
    
    this.log('\n🚀 Application is ready for production deployment!')
    return true
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ProductionValidator()
  validator.run().catch(error => {
    console.error('Validation failed:', error)
    process.exit(1)
  })
}

module.exports = ProductionValidator