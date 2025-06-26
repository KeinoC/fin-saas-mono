import type { NotificationMethod, Frequency } from 'database';

export interface ReportSubscription {
  id?: string;
  userId: string;
  reportType: string;
  method: NotificationMethod;
  frequency: Frequency;
  nextRunAt: Date;
  lastRunAt?: Date;
}

export class ReportService {
  static async createSubscription(subscription: ReportSubscription) {
    const { prisma } = await import('database');
    
    return await prisma.reportSubscription.create({
      data: {
        userId: subscription.userId,
        reportType: subscription.reportType,
        method: subscription.method,
        frequency: subscription.frequency,
        nextRunAt: subscription.nextRunAt,
        lastRunAt: subscription.lastRunAt,
      },
    });
  }

  static async getSubscriptions(userId: string) {
    const { prisma } = await import('database');
    
    return await prisma.reportSubscription.findMany({
      where: { userId },
    });
  }

  static async updateSubscription(id: string, updates: Partial<ReportSubscription>) {
    const { prisma } = await import('database');
    
    return await prisma.reportSubscription.update({
      where: { id },
      data: {
        reportType: updates.reportType,
        method: updates.method,
        frequency: updates.frequency,
        nextRunAt: updates.nextRunAt,
        lastRunAt: updates.lastRunAt,
      },
    });
  }

  static async deleteSubscription(id: string) {
    const { prisma } = await import('database');
    
    await prisma.reportSubscription.delete({
      where: { id },
    });
  }

  static async getDueReports() {
    const { prisma } = await import('database');
    
    return await prisma.reportSubscription.findMany({
      where: {
        nextRunAt: {
          lte: new Date(),
        },
      },
    });
  }
} 