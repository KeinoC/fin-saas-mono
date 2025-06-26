import { DatabaseService } from 'database';
import type { NotificationMethod } from 'database';

export interface NotificationData {
  orgId: string;
  userId: string;
  type: string;
  message: string;
}

export interface NotificationPreferences {
  userId: string;
  eventType: string;
  method: NotificationMethod;
  enabled: boolean;
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    return await DatabaseService.createNotification(data);
  }

  static async getNotifications(userId: string, orgId: string) {
    return await DatabaseService.getNotifications(orgId, userId);
  }

  static async updatePreferences(preferences: NotificationPreferences) {
    const { prisma } = await import('database');
    
    return await prisma.notificationPreference.upsert({
      where: {
        userId_eventType_method: {
          userId: preferences.userId,
          eventType: preferences.eventType,
          method: preferences.method,
        },
      },
      update: {
        enabled: preferences.enabled,
      },
      create: preferences,
    });
  }

  static async getPreferences(userId: string) {
    const { prisma } = await import('database');
    
    return await prisma.notificationPreference.findMany({
      where: { userId },
    });
  }
} 