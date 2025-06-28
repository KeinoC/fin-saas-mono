import { prisma } from './client';

export interface AuditLogEntry {
  orgId: string;
  userId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          orgId: entry.orgId,
          userId: entry.userId,
          action: entry.action,
          details: entry.details,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  // Google Integration specific audit actions
  async logGoogleIntegrationCreated(
    orgId: string,
    userId: string,
    integrationId: string,
    authMethod: 'oauth' | 'service_account',
    email: string
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'GOOGLE_INTEGRATION_CREATED',
      details: {
        integrationId,
        authMethod,
        email,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logGoogleIntegrationDeleted(
    orgId: string,
    userId: string,
    integrationId: string,
    authMethod: 'oauth' | 'service_account'
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'GOOGLE_INTEGRATION_DELETED',
      details: {
        integrationId,
        authMethod,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logGoogleSheetsExport(
    orgId: string,
    userId: string,
    integrationId: string,
    fileName: string,
    rowCount: number,
    spreadsheetId?: string
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'GOOGLE_SHEETS_EXPORT',
      details: {
        integrationId,
        fileName,
        rowCount,
        spreadsheetId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logGoogleTokenRefresh(
    orgId: string,
    integrationId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.log({
      orgId,
      action: 'GOOGLE_TOKEN_REFRESH',
      details: {
        integrationId,
        success,
        error,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logGoogleIntegrationUsed(
    orgId: string,
    userId: string,
    integrationId: string,
    action: string
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'GOOGLE_INTEGRATION_USED',
      details: {
        integrationId,
        subAction: action,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Query audit logs
  async getGoogleIntegrationLogs(
    orgId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return prisma.auditLog.findMany({
      where: {
        orgId,
        action: {
          startsWith: 'GOOGLE_',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  async getIntegrationUsageStats(orgId: string, integrationId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        orgId,
        action: 'GOOGLE_INTEGRATION_USED',
        details: {
          path: ['integrationId'],
          equals: integrationId,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    const today = new Date();
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: logs.length,
      today: logs.filter(log => log.createdAt >= new Date(today.toDateString())).length,
      thisWeek: logs.filter(log => log.createdAt >= thisWeek).length,
      thisMonth: logs.filter(log => log.createdAt >= thisMonth).length,
      lastUsed: logs[0]?.createdAt,
    };
  }
}

export const auditService = new AuditService(); 