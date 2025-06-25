import { supabase } from 'config';

export interface NotificationData {
  orgId: string;
  userId: string;
  type: string;
  message: string;
}

export interface NotificationPreferences {
  userId: string;
  eventType: string;
  method: 'email' | 'in-app' | 'sms';
  enabled: boolean;
}

export class NotificationService {
  static async createNotification(data: NotificationData) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        org_id: data.orgId,
        user_id: data.userId,
        type: data.type,
        message: data.message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return notification;
  }

  static async getNotifications(userId: string, orgId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updatePreferences(preferences: NotificationPreferences) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: preferences.userId,
        event_type: preferences.eventType,
        method: preferences.method,
        enabled: preferences.enabled,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
} 