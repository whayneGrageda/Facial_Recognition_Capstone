import { SecurityAlertModel, CreateSecurityAlertRequest } from '../models/securityAlertModel.js';
import { NotificationService } from './notificationService.js';

export const SecurityAlertService = {
  /**
   * Create a new security alert
   */
  createAlert: async (data: CreateSecurityAlertRequest) => {
    const alert = await SecurityAlertModel.create(data);

    // Notify all admins and moderators about the security alert
    try {
      await SecurityAlertService.notifyAdminsAndModerators(alert);
    } catch (error) {
      console.error('Failed to send security alert notifications:', error);
    }

    return alert;
  },

  /**
   * Get all alerts with pagination
   */
  getAlerts: async (limit: number, offset: number, filters?: any) => {
    const alerts = await SecurityAlertModel.getAll(limit, offset, filters);
    const totalCount = await SecurityAlertModel.getTotalCount(filters);

    return {
      alerts,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  /**
   * Get recent unresolved alerts for dashboard
   */
  getRecentUnresolved: async (limit: number = 10) => {
    return await SecurityAlertModel.getRecentUnresolved(limit);
  },

  /**
   * Get alert by ID
   */
  getAlertById: async (id: number) => {
    const alert = await SecurityAlertModel.findById(id);
    if (!alert) {
      throw new Error('ALERT_NOT_FOUND');
    }
    return alert;
  },

  /**
   * Mark alert as resolved
   */
  resolveAlert: async (id: number, resolvedBy: number) => {
    await SecurityAlertModel.markAsResolved(id, resolvedBy);
  },

  /**
   * Delete alert
   */
  deleteAlert: async (id: number) => {
    await SecurityAlertModel.delete(id);
  },

  /**
   * Get alert statistics
   */
  getStats: async () => {
    return await SecurityAlertModel.getStats();
  },

  /**
   * Notify all admins and moderators about a security alert
   */
  notifyAdminsAndModerators: async (alert: any) => {
    // This is a placeholder - you'll need to fetch admin/moderator user IDs
    // For now, we'll just log it
    const message = `🚨 SECURITY ALERT: ${alert.alert_type} detected on ${alert.camera_type.toUpperCase()} camera. ${alert.ai_analysis.substring(0, 100)}...`;
    
    console.log(`[SECURITY ALERT] Broadcasting to admins/moderators: ${message}`);
    
    // TODO: Implement actual notification to admin/moderator users
    // This would require fetching all admin/moderator user IDs and calling NotificationService.create for each
  }
};
