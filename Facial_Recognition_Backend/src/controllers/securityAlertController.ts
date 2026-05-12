import { Request, Response } from 'express';
import { SecurityAlertService } from '../services/securityAlertService.js';
import { sendResponse } from '../helpers/responseHelper.js';
import { API_MESSAGES } from '../constants/messages.js';

/**
 * Create a new security alert (called by camera system)
 */
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { alert_type, camera_type, ai_analysis, image_path, severity, metadata } = req.body;

    if (!alert_type || !camera_type || !ai_analysis) {
      return sendResponse(res, {
        status: 400,
        message: 'Missing required fields: alert_type, camera_type, ai_analysis'
      });
    }

    const alert = await SecurityAlertService.createAlert({
      alert_type,
      camera_type,
      ai_analysis,
      image_path,
      severity,
      metadata
    });

    return sendResponse(
      res,
      { status: 201, message: 'Security alert created successfully' },
      alert
    );
  } catch (error) {
    console.error('Error creating security alert:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get all security alerts with pagination and filters
 */
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    const filters = {
      alert_type: req.query.alert_type as string,
      camera_type: req.query.camera_type as string,
      is_resolved: req.query.is_resolved === 'true' ? true : req.query.is_resolved === 'false' ? false : undefined,
      severity: req.query.severity as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string
    };

    const result = await SecurityAlertService.getAlerts(limit, offset, filters);

    return sendResponse(
      res,
      { status: 200, message: 'Security alerts fetched successfully' },
      result
    );
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get recent unresolved alerts (for dashboard)
 */
export const getRecentUnresolved = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const alerts = await SecurityAlertService.getRecentUnresolved(limit);

    return sendResponse(
      res,
      { status: 200, message: 'Recent unresolved alerts fetched successfully' },
      alerts
    );
  } catch (error) {
    console.error('Error fetching recent unresolved alerts:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get alert by ID
 */
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const alert = await SecurityAlertService.getAlertById(id);

    return sendResponse(
      res,
      { status: 200, message: 'Security alert fetched successfully' },
      alert
    );
  } catch (error: any) {
    if (error.message === 'ALERT_NOT_FOUND') {
      return sendResponse(res, { status: 404, message: 'Security alert not found' });
    }
    console.error('Error fetching security alert:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Mark alert as resolved
 */
export const resolveAlert = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const requestingUser = (req as any).user;

    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    await SecurityAlertService.resolveAlert(id, requestingUser.userId);

    return sendResponse(res, { status: 200, message: 'Security alert marked as resolved' });
  } catch (error) {
    console.error('Error resolving security alert:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Delete alert
 */
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    await SecurityAlertService.deleteAlert(id);

    return sendResponse(res, { status: 200, message: 'Security alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting security alert:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Get alert statistics
 */
export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await SecurityAlertService.getStats();

    return sendResponse(
      res,
      { status: 200, message: 'Security alert statistics fetched successfully' },
      stats
    );
  } catch (error) {
    console.error('Error fetching security alert statistics:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
