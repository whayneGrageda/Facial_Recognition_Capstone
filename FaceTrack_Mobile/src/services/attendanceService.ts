import { apiService } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_type: string;
  attendance_type: 'time-in' | 'time-out';
  timestamp: string;
}

export interface AttendanceListResponse {
  attendance: AttendanceRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface UserStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  attendanceRate: number;
  thisWeekPresent: number;
  thisMonthPresent: number;
}

export interface DailyRecord {
  date: string;
  timeIn?: string;
  timeOut?: string;
  duration?: string;
  status: 'complete' | 'partial' | 'absent';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDailyRecords(records: AttendanceRecord[]): DailyRecord[] {
  const dailyMap = new Map<string, { timeIn?: string; timeOut?: string }>();

  for (const record of records) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    if (!dailyMap.has(date)) dailyMap.set(date, {});
    const day = dailyMap.get(date)!;

    if (record.attendance_type === 'time-in') {
      if (!day.timeIn || record.timestamp < day.timeIn) {
        day.timeIn = record.timestamp;
      }
    } else if (record.attendance_type === 'time-out') {
      if (!day.timeOut || record.timestamp > day.timeOut) {
        day.timeOut = record.timestamp;
      }
    }
  }

  return Array.from(dailyMap.entries())
    .map(([date, day]) => {
      let duration: string | undefined;
      if (day.timeIn && day.timeOut) {
        const diff =
          new Date(day.timeOut).getTime() - new Date(day.timeIn).getTime();
        const h = Math.floor(diff / 3_600_000);
        const m = Math.floor((diff % 3_600_000) / 60_000);
        duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
      }

      const status: DailyRecord['status'] =
        day.timeIn && day.timeOut
          ? 'complete'
          : day.timeIn
          ? 'partial'
          : 'absent';

      return { date, timeIn: day.timeIn, timeOut: day.timeOut, duration, status };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const attendanceService = {
  /**
   * GET /attendance/user/:userId/stats
   * Returns aggregate stats for the user.
   */
  getStats: (userId: number): Promise<UserStats> =>
    apiService.get<UserStats>(`/attendance/user/${userId}/stats`),

  /**
   * GET /attendance
   * Fetches attendance records with optional filters.
   * The backend enforces that regular users only see their own records.
   */
  getHistory: async (
    userId: number,
    userType: string,
    options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ records: DailyRecord[]; totalCount: number }> => {
    const response = await apiService.get<AttendanceListResponse>('/attendance', {
      user_id: userId,
      user_type: userType,
      start_date: options.startDate,
      end_date: options.endDate,
      limit: options.limit ?? 500,
      offset: options.offset ?? 0,
    });

    // Backend returns { attendance: [...], totalCount, page, totalPages }
    // The api.ts wrapper already unwraps the outer { data } envelope
    const rawList = Array.isArray(response)
      ? (response as unknown as AttendanceRecord[])
      : (response.attendance ?? []);

    const records = buildDailyRecords(rawList);
    return { records, totalCount: records.length };
  },

  /**
   * GET /attendance/user/:userId
   * Fetches raw attendance history for a specific user.
   */
  getRawHistory: async (
    userId: number,
    userType = 'college',
    limit = 100
  ): Promise<AttendanceRecord[]> => {
    const result = await apiService.get<AttendanceRecord[] | AttendanceListResponse>(
      `/attendance/user/${userId}`,
      { userType, limit }
    );
    // Backend may return array directly or wrapped in { attendance: [...] }
    if (Array.isArray(result)) return result;
    if ((result as AttendanceListResponse).attendance) {
      return (result as AttendanceListResponse).attendance;
    }
    return [];
  },

  /**
   * GET /attendance/today
   * Returns today's attendance records (admin/moderator only on backend,
   * but we expose it here for completeness — the backend will 403 for regular users).
   */
  getToday: (): Promise<AttendanceRecord[]> =>
    apiService.get<AttendanceRecord[]>('/attendance/today'),

  /**
   * Utility: build daily records from raw attendance array.
   */
  buildDailyRecords,
};
