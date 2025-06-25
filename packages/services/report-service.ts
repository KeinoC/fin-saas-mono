import { supabase } from 'config';

export interface ReportSubscription {
  id?: string;
  userId: string;
  reportType: string;
  method: 'email' | 'sms';
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRunAt: string;
  lastRunAt?: string;
}

export class ReportService {
  static async createSubscription(subscription: ReportSubscription) {
    const { data, error } = await supabase
      .from('report_subscriptions')
      .insert({
        user_id: subscription.userId,
        report_type: subscription.reportType,
        method: subscription.method,
        frequency: subscription.frequency,
        next_run_at: subscription.nextRunAt,
        last_run_at: subscription.lastRunAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getSubscriptions(userId: string) {
    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  static async updateSubscription(id: string, updates: Partial<ReportSubscription>) {
    const { data, error } = await supabase
      .from('report_subscriptions')
      .update({
        report_type: updates.reportType,
        method: updates.method,
        frequency: updates.frequency,
        next_run_at: updates.nextRunAt,
        last_run_at: updates.lastRunAt,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSubscription(id: string) {
    const { error } = await supabase
      .from('report_subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getDueReports() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('report_subscriptions')
      .select('*')
      .lte('next_run_at', now);

    if (error) throw error;
    return data;
  }
} 