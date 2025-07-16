// import { string } from '@prisma/client'
import { prisma } from './client'
import type {
  CreateOrganizationData,
  CreateDataImportData,
  CreateNotificationData,
  CreateAccountData,
  CreateCategoryData
} from './types'

export class DatabaseService {
  // Organization methods
  static async createOrganization(data: CreateOrganizationData) {
    return await prisma.organization.create({
      data,
      include: { orgUsers: true }
    })
  }

  static async getOrganization(id: string) {
    return await prisma.organization.findUnique({
      where: { id },
      include: { orgUsers: true }
    })
  }

  static async updateOrganization(id: string, data: Partial<CreateOrganizationData>) {
    return await prisma.organization.update({
      where: { id },
      data,
      include: { orgUsers: true }
    })
  }

  static async deleteOrganization(id: string) {
    return await prisma.organization.delete({
      where: { id }
    })
  }

  // Category methods
  // static async createCategory(data: CreateCategoryData) {
  //   return await prisma.category.create({
  //     data,
  //   });
  // }

  // static async getCategoriesByOrgId(orgId: string) {
  //   return await prisma.category.findMany({
  //     where: { orgId },
  //     orderBy: { name: 'asc' },
  //   });
  // }

  // static async updateCategory(id: string, data: Partial<CreateCategoryData>) {
  //   return await prisma.category.update({
  //     where: { id },
  //     data,
  //   });
  // }

  // static async deleteCategory(id: string) {
  //   // Note: This is a simple delete. In a real-world scenario, you might need to handle
  //   // what happens to items associated with this category.
  //   // Also, deleting a category with children might fail if there's a foreign key constraint.
  //   // You might need to handle children reassignment or deletion in a transaction.
  //   return await prisma.category.delete({
  //     where: { id },
  //   });
  // }

  // Data Import methods
  static async createDataImport(data: CreateDataImportData) {
    return await prisma.dataImport.create({
      data,
      include: { organization: true }
    })
  }

  static async getDataImports(orgId: string) {
    return await prisma.dataImport.findMany({
      where: { orgId },
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getDataImport(id: string) {
    return await prisma.dataImport.findUnique({
      where: { id },
      include: { organization: true }
    })
  }

  static async getDataImportById(id: string) {
    return await prisma.dataImport.findUnique({
      where: { id },
      include: { organization: true }
    })
  }

  static async updateDataImport(id: string, data: Partial<CreateDataImportData>) {
    return await prisma.dataImport.update({
      where: { id },
      data,
      include: { organization: true }
    })
  }

  static async deleteDataImport(id: string) {
    return await prisma.dataImport.delete({
      where: { id }
    })
  }

  // Notification methods
  static async createNotification(data: CreateNotificationData) {
    return await prisma.notification.create({
      data,
      include: { organization: true }
    })
  }

  static async getNotifications(orgId: string, userId?: string) {
    const where: any = { orgId }
    if (userId) where.userId = userId

    return await prisma.notification.findMany({
      where,
      include: { organization: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async markNotificationAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { read: true }
    })
  }

  static async deleteNotification(id: string) {
    return await prisma.notification.delete({
      where: { id }
    })
  }

  // Account (Integration) methods
  static async createAccount(data: CreateAccountData) {
    return await prisma.account.create({
      data: {
        ...data,
        source: data.source as any
      },
      include: { organization: true }
    })
  }

  static async getAccounts(orgId: string) {
    return await prisma.account.findMany({
      where: { orgId },
      include: { organization: true }
    })
  }

  static async getAccount(orgId: string, source: string) {
    return await prisma.account.findUnique({
      where: { 
        orgId_source: { orgId, source: source as any }
      },
      include: { organization: true }
    })
  }

  static async updateAccount(id: string, data: Partial<CreateAccountData>) {
    return await prisma.account.update({
      where: { id },
      data: {
        ...data,
        source: data.source as any
      },
      include: { organization: true }
    })
  }

  static async deleteAccount(id: string) {
    return await prisma.account.delete({
      where: { id }
    })
  }

  static async deleteAccountsByOrg(orgId: string) {
    return await prisma.account.deleteMany({
      where: { orgId }
    })
  }

  // Scenario methods
  static async createScenario(data: {
    orgId: string
    name: string
    data?: any
    createdBy?: string
  }) {
    return await prisma.scenario.create({
      data,
      include: { organization: true, scenarioVersions: true }
    })
  }

  static async getScenarios(orgId: string) {
    return await prisma.scenario.findMany({
      where: { orgId },
      include: { scenarioVersions: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Budget methods
  static async createBudget(data: {
    orgId: string
    name: string
    data?: any
    createdBy?: string
  }) {
    return await prisma.budget.create({
      data,
      include: { organization: true }
    })
  }

  static async getBudgets(orgId: string) {
    return await prisma.budget.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Organization User methods
  static async addUserToOrg(userId: string, orgId: string, role: 'admin' | 'editor' | 'viewer') {
    return await prisma.organizationUser.create({
      data: { userId, orgId, role },
      include: { organization: true }
    })
  }

  static async getUserOrgs(userId: string) {
    return await prisma.organizationUser.findMany({
      where: { userId },
      include: { organization: true }
    })
  }

  static async removeUserFromOrg(userId: string, orgId: string) {
    return await prisma.organizationUser.delete({
      where: { userId_orgId: { userId, orgId } }
    })
  }

  // Audit Log methods
  static async createAuditLog(data: {
    orgId: string
    userId?: string
    action: string
    details?: any
  }) {
    return await prisma.auditLog.create({
      data,
      include: { organization: true }
    })
  }

  static async getAuditLogs(orgId: string, limit = 100) {
    return await prisma.auditLog.findMany({
      where: { orgId },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
} 