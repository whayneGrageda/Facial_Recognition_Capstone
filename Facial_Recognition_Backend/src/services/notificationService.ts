import { NotificationModel } from '../models/notificationModel.js';

export interface NotificationOptions {
  userId: number;
  userType: string;
  message: string;
}

export const NotificationService = {
  /**
   * Create a notification for a user
   */
  create: async (options: NotificationOptions) => {
    try {
      return await NotificationModel.create(
        options.userId,
        options.message,
        options.userType
      );
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  },

  /**
   * Notify user about attendance recording
   */
  notifyAttendanceRecorded: async (
    userId: number,
    userType: string,
    attendanceType: 'time-in' | 'time-out',
    timestamp: Date = new Date()
  ) => {
    const time = timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const message =
      attendanceType === 'time-in'
        ? `✅ Time-in recorded successfully at ${time}`
        : `🚪 Time-out recorded successfully at ${time}`;

    return await NotificationService.create({
      userId,
      userType,
      message,
    });
  },

  /**
   * Notify user about anomaly detection
   */
  notifyAnomalyDetected: async (
    userId: number,
    userType: string,
    severity: 'abnormal' | 'dangerous',
    reasons: string[]
  ) => {
    const emoji = severity === 'dangerous' ? '🚨' : '⚠️';
    const severityText = severity === 'dangerous' ? 'ALERT' : 'Warning';
    const reasonsList = reasons.join(', ');

    const message = `${emoji} ${severityText}: Unusual attendance pattern detected - ${reasonsList}`;

    return await NotificationService.create({
      userId,
      userType,
      message,
    });
  },

  /**
   * Notify user about successful registration
   */
  notifyRegistrationSuccess: async (userId: number, userType: string, name: string) => {
    const message = `🎉 Welcome ${name}! Your account has been created successfully.`;

    return await NotificationService.create({
      userId,
      userType,
      message,
    });
  },

  /**
   * Notify user about password reset
   */
  notifyPasswordReset: async (userId: number, userType: string) => {
    const message = `🔒 Your password has been reset successfully.`;

    return await NotificationService.create({
      userId,
      userType,
      message,
    });
  },

  /**
   * Notify user about missing time-out
   */
  notifyMissingTimeOut: async (userId: number, userType: string, date: string) => {
    const message = `⏰ Reminder: You forgot to time-out on ${date}. Please contact admin if this is an error.`;

    return await NotificationService.create({
      userId,
      userType,
      message,
    });
  },

  /**
   * Send system notification to user
   */
  notifySystem: async (userId: number, userType: string, message: string) => {
    return await NotificationService.create({
      userId,
      userType,
      message: `📢 ${message}`,
    });
  },

  /**
   * Bulk notify multiple users
   */
  notifyBulk: async (userIds: number[], userType: string, message: string) => {
    const promises = userIds.map((userId) =>
      NotificationService.create({
        userId,
        userType,
        message,
      })
    );

    return await Promise.allSettled(promises);
  },
};
