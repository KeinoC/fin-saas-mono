import { DatabaseService } from 'database/lib/service'
import { prisma } from 'database'
import type { CreateOrganizationData, CreateDataImportData } from 'database/lib/types'

jest.mock('database', () => ({
  prisma: {
    organization: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dataImport: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scenario: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Organization methods', () => {
    const mockOrgData: CreateOrganizationData = {
      name: 'Test Organization',
      subscriptionPlan: 'pro',
      currency: 'USD',
    }

    const mockOrganization = {
      id: 'org-123',
      ...mockOrgData,
      apiKey: 'api-key-123',
      rateLimit: 1000,
      createdAt: new Date(),
      orgUsers: [],
    }

    it('creates organization successfully', async () => {
      mockPrisma.organization.create.mockResolvedValue(mockOrganization)

      const result = await DatabaseService.createOrganization(mockOrgData)

      expect(mockPrisma.organization.create).toHaveBeenCalledWith({
        data: mockOrgData,
        include: { orgUsers: true },
      })
      expect(result).toEqual(mockOrganization)
    })

    it('gets organization by id', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(mockOrganization)

      const result = await DatabaseService.getOrganization('org-123')

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        include: { orgUsers: true },
      })
      expect(result).toEqual(mockOrganization)
    })

    it('updates organization', async () => {
      const updateData = { name: 'Updated Organization' }
      const updatedOrg = { ...mockOrganization, ...updateData }
      
      mockPrisma.organization.update.mockResolvedValue(updatedOrg)

      const result = await DatabaseService.updateOrganization('org-123', updateData)

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-123' },
        data: updateData,
        include: { orgUsers: true },
      })
      expect(result).toEqual(updatedOrg)
    })

    it('deletes organization', async () => {
      mockPrisma.organization.delete.mockResolvedValue(mockOrganization)

      const result = await DatabaseService.deleteOrganization('org-123')

      expect(mockPrisma.organization.delete).toHaveBeenCalledWith({
        where: { id: 'org-123' },
      })
      expect(result).toEqual(mockOrganization)
    })
  })

  describe('Data Import methods', () => {
    const mockDataImportData: CreateDataImportData = {
      orgId: 'org-123',
      fileType: 'csv',
      data: { rows: [{ account: 'Test', amount: 100 }] },
      metadata: { fileName: 'test.csv', size: 1024 },
      createdBy: 'user-123',
    }

    const mockDataImport = {
      id: 'import-123',
      ...mockDataImportData,
      createdAt: new Date(),
      organization: { id: 'org-123', name: 'Test Org' },
    }

    it('creates data import successfully', async () => {
      mockPrisma.dataImport.create.mockResolvedValue(mockDataImport)

      const result = await DatabaseService.createDataImport(mockDataImportData)

      expect(mockPrisma.dataImport.create).toHaveBeenCalledWith({
        data: mockDataImportData,
        include: { organization: true },
      })
      expect(result).toEqual(mockDataImport)
    })

    it('gets data imports for organization', async () => {
      const mockImports = [mockDataImport]
      mockPrisma.dataImport.findMany.mockResolvedValue(mockImports)

      const result = await DatabaseService.getDataImports('org-123')

      expect(mockPrisma.dataImport.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        include: { organization: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockImports)
    })

    it('gets single data import by id', async () => {
      mockPrisma.dataImport.findUnique.mockResolvedValue(mockDataImport)

      const result = await DatabaseService.getDataImport('import-123')

      expect(mockPrisma.dataImport.findUnique).toHaveBeenCalledWith({
        where: { id: 'import-123' },
        include: { organization: true },
      })
      expect(result).toEqual(mockDataImport)
    })
  })

  describe('Account methods', () => {
    const mockAccountData = {
      orgId: 'org-123',
      source: 'plaid' as const,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    }

    const mockAccount = {
      id: 'account-123',
      ...mockAccountData,
      expiresAt: new Date(),
      lastSyncedAt: new Date(),
      createdAt: new Date(),
      organization: { id: 'org-123', name: 'Test Org' },
    }

    it('creates account successfully', async () => {
      mockPrisma.account.create.mockResolvedValue(mockAccount)

      const result = await DatabaseService.createAccount(mockAccountData)

      expect(mockPrisma.account.create).toHaveBeenCalledWith({
        data: mockAccountData,
        include: { organization: true },
      })
      expect(result).toEqual(mockAccount)
    })

    it('gets accounts for organization', async () => {
      const mockAccounts = [mockAccount]
      mockPrisma.account.findMany.mockResolvedValue(mockAccounts)

      const result = await DatabaseService.getAccounts('org-123')

      expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        include: { organization: true },
      })
      expect(result).toEqual(mockAccounts)
    })

    it('gets account by org and source', async () => {
      mockPrisma.account.findUnique.mockResolvedValue(mockAccount)

      const result = await DatabaseService.getAccount('org-123', 'plaid')

      expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
        where: { 
          orgId_source: { orgId: 'org-123', source: 'plaid' }
        },
        include: { organization: true },
      })
      expect(result).toEqual(mockAccount)
    })
  })

  describe('Scenario methods', () => {
    const mockScenarioData = {
      orgId: 'org-123',
      name: 'Test Scenario',
      data: { assumptions: { growth: 0.05 } },
      createdBy: 'user-123',
    }

    const mockScenario = {
      id: 'scenario-123',
      ...mockScenarioData,
      createdAt: new Date(),
      organization: { id: 'org-123', name: 'Test Org' },
      scenarioVersions: [],
    }

    it('creates scenario successfully', async () => {
      mockPrisma.scenario.create.mockResolvedValue(mockScenario)

      const result = await DatabaseService.createScenario(mockScenarioData)

      expect(mockPrisma.scenario.create).toHaveBeenCalledWith({
        data: mockScenarioData,
        include: { organization: true, scenarioVersions: true },
      })
      expect(result).toEqual(mockScenario)
    })

    it('gets scenarios for organization', async () => {
      const mockScenarios = [mockScenario]
      mockPrisma.scenario.findMany.mockResolvedValue(mockScenarios)

      const result = await DatabaseService.getScenarios('org-123')

      expect(mockPrisma.scenario.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        include: { scenarioVersions: true },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockScenarios)
    })
  })

  describe('Budget methods', () => {
    const mockBudgetData = {
      orgId: 'org-123',
      name: 'Q1 Budget',
      data: { categories: { marketing: 10000 } },
      createdBy: 'user-123',
    }

    const mockBudget = {
      id: 'budget-123',
      ...mockBudgetData,
      createdAt: new Date(),
      organization: { id: 'org-123', name: 'Test Org' },
    }

    it('creates budget successfully', async () => {
      mockPrisma.budget.create.mockResolvedValue(mockBudget)

      const result = await DatabaseService.createBudget(mockBudgetData)

      expect(mockPrisma.budget.create).toHaveBeenCalledWith({
        data: mockBudgetData,
        include: { organization: true },
      })
      expect(result).toEqual(mockBudget)
    })

    it('gets budgets for organization', async () => {
      const mockBudgets = [mockBudget]
      mockPrisma.budget.findMany.mockResolvedValue(mockBudgets)

      const result = await DatabaseService.getBudgets('org-123')

      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockBudgets)
    })
  })

  describe('Audit Log methods', () => {
    const mockAuditLogData = {
      orgId: 'org-123',
      userId: 'user-123',
      action: 'CREATE_BUDGET',
      details: { budgetId: 'budget-123' },
    }

    const mockAuditLog = {
      id: 'audit-123',
      ...mockAuditLogData,
      createdAt: new Date(),
      organization: { id: 'org-123', name: 'Test Org' },
    }

    it('creates audit log successfully', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(mockAuditLog)

      const result = await DatabaseService.createAuditLog(mockAuditLogData)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: mockAuditLogData,
        include: { organization: true },
      })
      expect(result).toEqual(mockAuditLog)
    })

    it('gets audit logs for organization', async () => {
      const mockAuditLogs = [mockAuditLog]
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs)

      const result = await DatabaseService.getAuditLogs('org-123', 50)

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        include: { organization: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      expect(result).toEqual(mockAuditLogs)
    })
  })

  describe('Error handling', () => {
    it('throws error when organization creation fails', async () => {
      const error = new Error('Database connection failed')
      mockPrisma.organization.create.mockRejectedValue(error)

      await expect(
        DatabaseService.createOrganization({ name: 'Test' })
      ).rejects.toThrow('Database connection failed')
    })

    it('throws error when data import not found', async () => {
      mockPrisma.dataImport.findUnique.mockResolvedValue(null)

      const result = await DatabaseService.getDataImport('non-existent')
      expect(result).toBeNull()
    })
  })
}) 