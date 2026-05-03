import { apiService } from './api';

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  user_type: string;
}

export const notificationService = {
  // Get user notifications
  getAll: (limit = 50) => {
    return apiService.get<Notification[]>('/notifications', { limit });
  },

  // Get unread count
  getUnreadCount: () => {
    return apiService.get<{ count: number }>('/notifications/unread-count');
  },

  // Mark as read
  markAsRead: (id: number) => {
    return apiService.patch(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return apiService.patch('/notifications/mark-all-read');
  },

  // Delete notification
  delete: (id: number) => {
    return apiService.delete(`/notifications/${id}`);
  },
};
