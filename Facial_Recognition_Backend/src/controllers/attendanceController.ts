import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendanceService.js';
import { API_MESSAGES } from '../constants/messages.js';
import { sendResponse } from '../helpers/responseHelper.js';

export const recordAttendance = async (req: Request, res: Response) => {
  try {
    const { user_id, user_type, name, attendance_type } = req.body;

    if (!user_id || !user_type || !name || !attendance_type) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const attendance = await AttendanceService.recordAttendance({
      user_id,
      user_type,
      name,
      attendance_type,
    });

    return sendResponse(res, API_MESSAGES.ATTENDANCE.RECORD_SUCCESS, attendance);
  } catch (error) {
    console.error('Error recording attendance:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    const userId = requestingUser.userId || requestingUser.id; // Handle both userId and id
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const filters = {
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      user_type: req.query.user_type as string,
      date: req.query.date as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      attendance_type: req.query.attendance_type as string,
      search: req.query.search as string,
    };

    // If user is not admin/moderator, they can only view their own attendance
    if (!['admin', 'moderator'].includes(requestingUser.role)) {
      // Students and faculty can only view their own records
      if (filters.user_id && filters.user_id !== userId) {
        console.log('Forbidden: User', userId, 'trying to access user', filters.user_id);
        return sendResponse(res, { status: 403, message: 'Forbidden' });
      }
      // Force filter to only show their own records
      filters.user_id = userId;
      filters.user_type = requestingUser.userType; // Also set the user_type from the authenticated user
    }

    const result = await AttendanceService.getAttendance(limit, offset, filters);
    return sendResponse(res, API_MESSAGES.ATTENDANCE.LIST_SUCCESS, result);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const attendance = await AttendanceService.getAttendanceById(id);
    return sendResponse(res, API_MESSAGES.ATTENDANCE.FETCH_SUCCESS, attendance);
  } catch (error: any) {
    if (error.message === 'ATTENDANCE_NOT_FOUND') {
      return sendResponse(res, API_MESSAGES.ATTENDANCE.NOT_FOUND);
    }
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await AttendanceService.getTodayAttendance();
    return sendResponse(res, API_MESSAGES.ATTENDANCE.LIST_SUCCESS, attendance);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getUserAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const userType = req.query.userType as string || 'college';
    const limit = parseInt(req.query.limit as string) || 30;

    if (isNaN(userId)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const attendance = await AttendanceService.getUserAttendanceHistory(userId, userType, limit);
    return sendResponse(res, API_MESSAGES.ATTENDANCE.LIST_SUCCESS, attendance);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getAttendanceByDateRange = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    const attendance = await AttendanceService.getAttendanceByDateRange(
      start_date as string,
      end_date as string
    );
    return sendResponse(res, API_MESSAGES.ATTENDANCE.LIST_SUCCESS, attendance);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string;
    const stats = await AttendanceService.getAttendanceStats(date);
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, stats);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const downloadReports = async (req: Request, res: Response) => {
  try {
    const filters = {
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      user_type: req.query.user_type as string,
      date: req.query.date as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      attendance_type: req.query.attendance_type as string,
      search: req.query.search as string,
    };

    const pdfBuffer = await AttendanceService.generateReport(filters);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating report:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getMonthlyTrends = async (req: Request, res: Response) => {
  try {
    const trends = await AttendanceService.getMonthlyTrends();
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, trends);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getDailyTrends = async (req: Request, res: Response) => {
  try {
    const trends = await AttendanceService.getDailyTrends();
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, trends);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getPeakHours = async (req: Request, res: Response) => {
  try {
    const peakHours = await AttendanceService.getPeakHours();
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, peakHours);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getDepartmentDistribution = async (req: Request, res: Response) => {
  try {
    const distribution = await AttendanceService.getDepartmentDistribution();
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, distribution);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getWeeklyPerformance = async (req: Request, res: Response) => {
  try {
    const performance = await AttendanceService.getWeeklyPerformance();
    return sendResponse(res, API_MESSAGES.GENERAL.SUCCESS, performance);
  } catch (error) {
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return sendResponse(res, API_MESSAGES.GENERAL.BAD_REQUEST);
    }

    // Check if user is requesting their own stats or is admin/moderator
    const requestingUser = (req as any).user;
    const requestingUserId = requestingUser.userId || requestingUser.id;
    if (requestingUserId !== userId && !['admin', 'moderator'].includes(requestingUser.role)) {
      return sendResponse(res, { status: 403, message: 'Forbidden' });
    }

    const stats = await AttendanceService.getUserStats(userId);
    return sendResponse(res, API_MESSAGES.ATTENDANCE.FETCH_SUCCESS, stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return sendResponse(res, API_MESSAGES.GENERAL.INTERNAL_SERVER_ERROR);
  }
};
