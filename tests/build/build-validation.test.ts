import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

describe('Build Validation', () => {
  const projectRoot = path.resolve(__dirname, '../..')
  const webAppPath = path.join(projectRoot, 'apps/web')
  
  describe('TypeScript Compilation', () => {
    it('should compile TypeScript without errors', () => {
      expect(() => {
        execSync('npm run type-check', { 
          cwd: webAppPath,
          stdio: 'pipe',
          timeout: 60000 // 60 seconds timeout
        })
      }).not.toThrow()
    }, 120000) // 2 minute timeout for the test

    it('should not have any TypeScript errors in critical files', () => {
      const criticalFiles = [
        'app/api/auth/[...all]/route.ts',
        'lib/auth.ts',
        'next.config.ts'
      ]

      criticalFiles.forEach(file => {
        const filePath = path.join(webAppPath, file)
        expect(fs.existsSync(filePath)).toBe(true)
        
        // Check TypeScript compilation for individual files
        expect(() => {
          execSync(`npx tsc --noEmit ${filePath}`, {
            cwd: webAppPath,
            stdio: 'pipe'
          })
        }).not.toThrow()
      })
    })
  })

  describe('Next.js Build', () => {
    it('should build successfully without errors', () => {
      expect(() => {
        execSync('npm run build', {
          cwd: webAppPath,
          stdio: 'pipe',
          timeout: 300000, // 5 minutes timeout
          env: {
            ...process.env,
            NODE_ENV: 'production',
            // Mock required environment variables for build
            BETTER_AUTH_SECRET: 'test-secret-for-build',
            DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
            NEXT_PUBLIC_APP_URL: 'https://test.example.com',
            GOOGLE_CLIENT_ID: 'test-client-id',
            GOOGLE_CLIENT_SECRET: 'test-client-secret'
          }
        })
      }).not.toThrow()
    }, 360000) // 6 minute timeout for the test

    it('should generate required build artifacts', () => {
      const buildDir = path.join(webAppPath, '.next')
      const requiredPaths = [
        '.next/static',
        '.next/server',
        '.next/BUILD_ID'
      ]

      requiredPaths.forEach(buildPath => {
        const fullPath = path.join(webAppPath, buildPath)
        expect(fs.existsSync(fullPath)).toBe(true)
      })
    })
  })

  describe('Environment Configuration', () => {
    it('should have all required environment variables defined', () => {
      const requiredEnvVars = [
        'BETTER_AUTH_SECRET',
        'DATABASE_URL', 
        'NEXT_PUBLIC_APP_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
      ]

      // Check if .env file exists and contains required variables
      const envPath = path.join(projectRoot, '.env')
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        
        requiredEnvVars.forEach(envVar => {
          expect(envContent).toMatch(new RegExp(`${envVar}=`))
        })
      } else {
        console.warn('No .env file found, skipping environment variable validation')
      }
    })

    it('should have valid Next.js configuration', () => {
      const nextConfigPath = path.join(webAppPath, 'next.config.ts')
      expect(fs.existsSync(nextConfigPath)).toBe(true)

      // Basic syntax check by requiring the config
      expect(() => {
        delete require.cache[nextConfigPath]
        require(nextConfigPath)
      }).not.toThrow()
    })
  })

  describe('Critical Dependencies', () => {
    it('should have all critical dependencies installed', () => {
      const packageJsonPath = path.join(webAppPath, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      
      const criticalDeps = [
        'next',
        'react',
        'react-dom',
        'better-auth',
        'pg'
      ]

      criticalDeps.forEach(dep => {
        expect(
          packageJson.dependencies[dep] || packageJson.devDependencies[dep]
        ).toBeDefined()
      })
    })

    it('should have node_modules properly installed', () => {
      const nodeModulesPath = path.join(webAppPath, 'node_modules')
      expect(fs.existsSync(nodeModulesPath)).toBe(true)

      // Check for critical packages
      const criticalPackages = ['next', 'react', 'better-auth']
      criticalPackages.forEach(pkg => {
        const pkgPath = path.join(nodeModulesPath, pkg)
        expect(fs.existsSync(pkgPath)).toBe(true)
      })
    })
  })

  describe('Database Schema', () => {
    it('should generate Prisma client successfully', () => {
      expect(() => {
        execSync('npx prisma generate', {
          cwd: path.join(projectRoot, 'packages/database'),
          stdio: 'pipe',
          timeout: 30000
        })
      }).not.toThrow()
    })

    it('should have valid Prisma schema', () => {
      const schemaPath = path.join(projectRoot, 'packages/database/prisma/schema.prisma')
      expect(fs.existsSync(schemaPath)).toBe(true)

      const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
      expect(schemaContent).toContain('generator client')
      expect(schemaContent).toContain('datasource db')
    })
  })
})