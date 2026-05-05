import { Request, Response } from 'express';
import { NotificationModel } from '../models/notificationModel.js';
import { sendResponse } from '../helpers/responseHelper.js';
import { API_MESSAGES } from '../constants/messages.js';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const limit = parseInt(req.query.limit as string) || 50;

    const notifications = await NotificationModel.getUserNotifications(requestingUser.userId, limit);
    return sendResponse(res, { status: 200, message: 'Notifications fetched successfully' }, notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    await NotificationModel.markAsRead(notificationId, requestingUser.userId);
    return sendResponse(res, { status: 200, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;

    await NotificationModel.markAllAsRead(requestingUser.userId);
    return sendResponse(res, { status: 200, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const notificationId = parseInt(req.params.id);

    if (isNaN(notificationId)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    await NotificationModel.delete(notificationId, requestingUser.userId);
    return sendResponse(res, { status: 200, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;

    const count = await NotificationModel.getUnreadCount(requestingUser.userId);
    return sendResponse(res, { status: 200, message: 'Unread count fetched' }, { count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
