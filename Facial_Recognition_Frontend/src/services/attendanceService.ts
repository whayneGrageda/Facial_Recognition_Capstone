import { apiService } from './api';
import type { Attendance, AttendanceFilters, PaginatedResponse } from '../types';

export const attendanceService = {
  // Get all attendance records
  getAll: (limit = 10, offset = 0, filters?: AttendanceFilters) => {
    return apiService.get<PaginatedResponse<Attendance>>('/attendance', {
      limit,
      offset,
      ...filters,
    });
  },

  // Get attendance by ID
  getById: (id: number) => {
    return apiService.get<Attendance>(`/attendance/${id}`);
  },

  // Create attendance record
  create: (data: {
    user_id: number;
    user_type: string;
    attendance_type?: string;
  }) => {
    return apiService.post<Attendance>('/attendance', data);
  },

  // Get recent attendance
  getRecent: () => {
    return apiService.get<Attendance[]>('/attendance/recent');
  },

  // Get user attendance history
  getUserHistory: (userId: number, userType: string, limit = 10) => {
    return apiService.get<Attendance[]>('/attendance/user-history', {
      user_id: userId,
      user_type: userType,
      limit,
    });
  },

  // Get attendance by date range
  getByDateRange: (startDate: string, endDate: string) => {
    return apiService.get<Attendance[]>('/attendance/date-range', {
      start_date: startDate,
      end_date: endDate,
    });
  },

  // Get attendance stats
  getStats: (date?: string) => {
    return apiService.get<{
      total: number;
      timeIn: number;
      timeOut: number;
      byUserType: {
        college: number;
        shs: number;
        faculty: number;
        guest: number;
      };
    }>('/attendance/stats', date ? { date } : {});
  },

  // Get today's attendance
  getTodayAttendance: () => {
    return apiService.get<Attendance[]>('/attendance/today');
  },

  // Get monthly trends for analytics
  getMonthlyTrends: () => {
    return apiService.get<any[]>('/attendance/analytics/monthly');
  },

  // Get daily trends for analytics
  getDailyTrends: () => {
    return apiService.get<any[]>('/attendance/analytics/daily');
  },

  // Get peak hours for analytics
  getPeakHours: () => {
    return apiService.get<any[]>('/attendance/analytics/peak-hours');
  },

  // Get department distribution for analytics
  getDepartmentDistribution: () => {
    return apiService.get<any[]>('/attendance/analytics/department');
  },

  // Get weekly performance for analytics
  getWeeklyPerformance: () => {
    return apiService.get<any[]>('/attendance/analytics/weekly');
  },

  // Get report (CSV)
  getReport: (filters?: AttendanceFilters) => {
    return apiService.download('/attendance/report', filters);
  },

  // Get user attendance statistics
  getUserStats: (userId: number) => {
    return apiService.get<{
      totalDays: number;
      presentDays: number;
      lateDays: number;
      attendanceRate: number;
      thisWeekPresent: number;
      thisMonthPresent: number;
    }>(`/attendance/user/${userId}/stats`);
  },
};
