import { AttendanceModel } from '../models/attendanceModel.js';
import { CreateAttendanceRequest } from '../types/attendanceEntity.js';
import { NotificationService } from './notificationService.js';
import { query } from '../db/index.js';
import pdfmake from 'pdfmake';

export const AttendanceService = {
  recordAttendance: async (data: CreateAttendanceRequest) => {
    const attendance = await AttendanceModel.create(data);
    
    // Create notification for the user
    try {
      await NotificationService.notifyAttendanceRecorded(
        data.user_id,
        data.user_type,
        data.attendance_type
      );
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the attendance recording if notification fails
    }
    
    return attendance;
  },

  getAttendance: async (limit: number, offset: number, filters?: any) => {
    const attendance = await AttendanceModel.getAll(limit, offset, filters);
    const totalCount = await AttendanceModel.getTotalCount(filters);

    return {
      attendance,
      totalCount,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalCount / limit),
    };
  },

  getAttendanceById: async (id: number) => {
    const attendance = await AttendanceModel.findById(id);
    if (!attendance) throw new Error('ATTENDANCE_NOT_FOUND');
    return attendance;
  },

  getTodayAttendance: async () => {
    return await AttendanceModel.getTodayAttendance();
  },

  getUserAttendanceHistory: async (userId: number, userType: string, limit: number = 30) => {
    return await AttendanceModel.getUserAttendanceHistory(userId, userType, limit);
  },

  getAttendanceByDateRange: async (startDate: string, endDate: string) => {
    return await AttendanceModel.getAttendanceByDateRange(startDate, endDate);
  },

  getAttendanceStats: async (date?: string) => {
    const rows = await AttendanceModel.getAggregatedStats(date);

    // Build stats from SQL aggregation (no row-level fetch needed)
    const stats = {
      total: 0,
      timeIn: 0,
      timeOut: 0,
      byUserType: {
        college: 0,
        shs: 0,
        faculty: 0,
        guest: 0,
      } as Record<string, number>,
    };

    for (const row of rows) {
      const count = parseInt(row.count as any) || 0;
      stats.total += count;
      if (row.attendance_type === 'time-in') stats.timeIn += count;
      if (row.attendance_type === 'time-out') stats.timeOut += count;
      if (row.user_type in stats.byUserType) {
        stats.byUserType[row.user_type] += count;
      }
    }

    return stats;
  },

  getMonthlyTrends: async () => {
    return await AttendanceModel.getMonthlyTrends();
  },

  getDailyTrends: async () => {
    return await AttendanceModel.getDailyTrends();
  },

  getPeakHours: async () => {
    return await AttendanceModel.getPeakHours();
  },

  getDepartmentDistribution: async () => {
    return await AttendanceModel.getDepartmentDistribution();
  },

  getWeeklyPerformance: async () => {
    return await AttendanceModel.getWeeklyPerformance();
  },

  generateReport: async (filters: any): Promise<Buffer> => {
    // Fetch all records for the report (max 10000 for safety)
    const logs = await AttendanceModel.getAll(10000, 0, filters);

    // Group logs for analysis
    const grouped = logs.reduce((acc: any, log: any) => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      const key = `${log.user_id}_${dateStr}`;
      if (!acc[key]) acc[key] = { in: null, out: null, name: log.user_name, user_id: log.user_id, date: dateStr, user_type: log.user_type };
      
      if (log.attendance_type === 'time-in' && (!acc[key].in || log.timestamp < acc[key].in.timestamp)) {
        acc[key].in = log;
      }
      if (log.attendance_type === 'time-out' && (!acc[key].out || log.timestamp > acc[key].out.timestamp)) {
        acc[key].out = log;
      }
      return acc;
    }, {});

    const analysisData: any[] = [];
    const stats = { Normal: 0, Abnormal: 0, Dangerous: 0 };
    const uniqueUsers = new Set<number>();

    Object.values(grouped).forEach((group: any) => {
      let status = "Normal";
      let statement = "Regular attendance pattern.";
      let durationStr = "N/A";
      let inTimeStr = "MISSING";
      let outTimeStr = "MISSING";

      // Track unique users
      uniqueUsers.add(group.user_id);

      if (group.in && group.out) {
        const inTime = new Date(group.in.timestamp);
        const outTime = new Date(group.out.timestamp);
        const duration = Math.round((outTime.getTime() - inTime.getTime()) / (1000 * 60));
        
        // Format duration dynamically
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        if (hours > 0) {
          durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
          durationStr = `${mins}m`;
        }
        
        inTimeStr = inTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        outTimeStr = outTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const inHour = inTime.getHours();
        const outHour = outTime.getHours();

        if (duration > 720) {
          status = "Dangerous";
          statement = "Extremely long shift detected (>12h).";
        } else if (inHour >= 21 || outHour >= 21 || inHour <= 4) {
          status = "Dangerous";
          statement = "Late night activity detected.";
        } else if (inHour >= 10) {
          status = "Abnormal";
          statement = "Late arrival (after 10:00 AM).";
        } else if (outHour < 15) {
          status = "Abnormal";
          statement = "Early departure (before 3:00 PM).";
        } else if (duration < 60) {
          status = "Abnormal";
          statement = "Short stay (<1h).";
        }
      } else {
        status = "Abnormal";
        statement = "Missing " + (group.in ? "Time-Out" : "Time-In") + ".";
        if (group.in) inTimeStr = new Date(group.in.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (group.out) outTimeStr = new Date(group.out.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      stats[status as keyof typeof stats]++;
      analysisData.push({
        user_id: group.user_id,
        name: group.name || 'N/A',
        date: group.date,
        in: inTimeStr,
        out: outTimeStr,
        duration: durationStr,
        status: status,
        statement: statement
      });
    });

    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf'
      }
    };

    const docDefinition: any = {
      content: [
        { text: 'ATTENDANCE BEHAVIORAL REPORT', style: 'header' },
        { text: `Generated on: ${new Date().toLocaleString()}`, style: 'subheader' },
        { text: '\n' },
        
        // Stats Summary
        {
          columns: [
            {
              stack: [
                { text: 'Total Users Flagged', style: 'statsLabel' },
                { text: uniqueUsers.size.toString(), style: 'statsValue' }
              ]
            },
            {
              stack: [
                { text: 'Normal', style: 'statsLabel' },
                { text: stats.Normal.toString(), style: 'statsValue', color: '#2e7d32' }
              ]
            },
            {
              stack: [
                { text: 'Abnormal', style: 'statsLabel' },
                { text: stats.Abnormal.toString(), style: 'statsValue', color: '#ed6c02' }
              ]
            },
            {
              stack: [
                { text: 'Dangerous', style: 'statsLabel' },
                { text: stats.Dangerous.toString(), style: 'statsValue', color: '#d32f2f' }
              ]
            }
          ]
        },
        { text: '\n\n' },
        { text: 'DETAILED BEHAVIORAL ANALYSIS', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: [50, '*', 60, 50, 50, 40, 50, '*'],
            body: [
              [
                { text: 'ID', style: 'tableHeader' },
                { text: 'Name', style: 'tableHeader' },
                { text: 'Date', style: 'tableHeader' },
                { text: 'In', style: 'tableHeader' },
                { text: 'Out', style: 'tableHeader' },
                { text: 'Dur', style: 'tableHeader' },
                { text: 'Status', style: 'tableHeader' },
                { text: 'Statement', style: 'tableHeader' }
              ],
              ...analysisData.map(row => [
                row.user_id,
                row.name,
                row.date,
                row.in,
                row.out,
                row.duration,
                { text: row.status, color: row.status === 'Dangerous' ? '#d32f2f' : row.status === 'Abnormal' ? '#ed6c02' : '#2e7d32', bold: true },
                { text: row.statement, fontSize: 9 }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: '\n\n' },
        { text: 'RAW ATTENDANCE LOGS', style: 'sectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: [50, '*', 120, 70, 60],
            body: [
              [
                { text: 'ID', style: 'tableHeader' },
                { text: 'Name', style: 'tableHeader' },
                { text: 'Timestamp', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'User Type', style: 'tableHeader' }
              ],
              ...logs.map((log: any) => [
                log.user_id,
                log.user_name || 'N/A',
                new Date(log.timestamp).toLocaleString(),
                { text: log.attendance_type.toUpperCase(), color: log.attendance_type === 'time-out' ? '#d32f2f' : '#2e7d32', bold: true },
                log.user_type
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, alignment: 'center', color: '#666' },
        sectionTitle: { fontSize: 14, bold: true, margin: [0, 10, 0, 10], color: '#333' },
        statsLabel: { fontSize: 10, color: '#666', alignment: 'center' },
        statsValue: { fontSize: 18, bold: true, alignment: 'center' },
        tableHeader: { bold: true, fontSize: 10, fillColor: '#f3f4f6', margin: [0, 5, 0, 5] }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10 }
    };

    // Use pdfmake instance directly (pdfmake 0.3.x style)
    (pdfmake as any).setUrlAccessPolicy(() => true);
    (pdfmake as any).setFonts(fonts);
    const pdfDoc = (pdfmake as any).createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  },

  getUserStats: async (userId: number) => {
    // First, determine the user's type by checking which table they exist in
    let userType: 'college' | 'shs' | 'faculty' | 'guest' = 'college';
    
    try {
      // Check college users
      const collegeUser = await query('SELECT id FROM users WHERE id = $1', [userId]);
      if (collegeUser.rows.length > 0) {
        userType = 'college';
      } else {
        // Check SHS users
        const shsUser = await query('SELECT id FROM shs_users WHERE id = $1', [userId]);
        if (shsUser.rows.length > 0) {
          userType = 'shs';
        } else {
          // Check faculty users
          const facultyUser = await query('SELECT id FROM faculty_users WHERE id = $1', [userId]);
          if (facultyUser.rows.length > 0) {
            userType = 'faculty';
          } else {
            // Check guests
            const guest = await query('SELECT id FROM guests WHERE id = $1', [userId]);
            if (guest.rows.length > 0) {
              userType = 'guest';
            }
          }
        }
      }
    } catch (error) {
      console.error('Error determining user type:', error);
      // Default to college if we can't determine
      userType = 'college';
    }
    
    // Use SQL aggregation instead of fetching 10,000 rows
    const dbStats = await AttendanceModel.getUserAggregatedStats(userId);
    
    const presentDays = parseInt(dbStats.total_days as any) || 0;
    
    // Calculate attendance rate (assuming 20 working days per month)
    const totalExpectedDays = 20;
    const attendanceRate = Math.min(100, Math.round((presentDays / totalExpectedDays) * 100));
    
    // For week/month specific counts, use targeted queries instead of full scan
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const weekRecords = await AttendanceModel.getUserAttendanceHistory(userId, userType, 100);
    const thisWeekPresent = weekRecords.filter(a => 
      a.attendance_type === 'time-in' && new Date(a.timestamp) >= startOfWeek
    ).length;
    const thisMonthPresent = weekRecords.filter(a => 
      a.attendance_type === 'time-in' && new Date(a.timestamp) >= startOfMonth
    ).length;
    
    return {
      totalDays: totalExpectedDays,
      presentDays,
      lateDays: 0, // This would need a separate SQL query with hour extraction
      attendanceRate,
      thisWeekPresent,
      thisMonthPresent,
    };
  },
};
