import { getPool } from '../db/index.js';

const pool = getPool();

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: Date;
  user_type: string;
}

export const NotificationModel = {
  // Get user notifications
  getUserNotifications: async (userId: number, limit: number = 50): Promise<Notification[]> => {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Create notification
  create: async (userId: number, message: string, userType: string): Promise<Notification> => {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, message, user_type) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [userId, message, userType]
    );
    return result.rows[0];
  },

  // Mark as read
  markAsRead: async (id: number, userId: number): Promise<void> => {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
  },

  // Mark all as read
  markAllAsRead: async (userId: number): Promise<void> => {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  },

  // Delete notification
  delete: async (id: number, userId: number): Promise<void> => {
    await pool.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
  },

  // Get unread count
  getUnreadCount: async (userId: number): Promise<number> => {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  },
};
