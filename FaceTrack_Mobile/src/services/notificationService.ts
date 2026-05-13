import { apiService } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  user_type: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const notificationService = {
  /**
   * GET /notifications
   * Returns the authenticated user's notifications.
   */
  getAll: async (limit = 50): Promise<Notification[]> => {
    const result = await apiService.get<Notification[] | { notifications?: Notification[] }>(
      '/notifications',
      { limit }
    );
    // Handle both array response and wrapped response
    if (Array.isArray(result)) return result;
    if ((result as any).notifications) return (result as any).notifications;
    return [];
  },

  /**
   * GET /notifications/unread-count
   */
  getUnreadCount: (): Promise<{ count: number }> =>
    apiService.get<{ count: number }>('/notifications/unread-count'),

  /**
   * PATCH /notifications/:id/read
   */
  markAsRead: (id: number): Promise<void> =>
    apiService.patch<void>(`/notifications/${id}/read`),

  /**
   * PATCH /notifications/mark-all-read
   */
  markAllAsRead: (): Promise<void> =>
    apiService.patch<void>('/notifications/mark-all-read'),

  /**
   * DELETE /notifications/:id
   */
  delete: (id: number): Promise<void> =>
    apiService.delete<void>(`/notifications/${id}`),
};
