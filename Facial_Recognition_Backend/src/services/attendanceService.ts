import { AttendanceModel } from '../models/attendanceModel.js';
import { CreateAttendanceRequest } from '../types/attendanceEntity.js';
import { NotificationService } from './notificationService.js';
import { AnomalyDetectionService } from './anomalyDetectionService.js';
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

  getHeatmapData: async () => {
    return await AttendanceModel.getHeatmapData();
  },

  getWeeklyPerformance: async () => {
    return await AttendanceModel.getWeeklyPerformance();
  },

  generateReport: async (filters: any): Promise<Buffer> => {
    // Fetch all records for the report (max 10000 for safety)
    const logs = await AttendanceModel.getAll(10000, 0, filters);

    // Group logs by user and date for analysis
    const grouped = logs.reduce((acc: any, log: any) => {
      const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
      const key = `${log.user_id}_${dateStr}`;
      
      if (!acc[key]) {
        acc[key] = {
          userId: log.user_id,
          userName: log.user_name,
          userType: log.user_type,
          date: dateStr,
          timeIn: null,
          timeOut: null,
          duration: 0,
          entries: []
        };
      }
      
      // Add all entries for anomaly detection
      acc[key].entries.push({
        id: log.id,
        user_id: log.user_id,
        user_type: log.user_type,
        timestamp: new Date(log.timestamp),
        attendance_type: log.attendance_type,
        user_name: log.user_name
      });
      
      // Track first time-in and last time-out
      if (log.attendance_type === 'time-in' && (!acc[key].timeIn || log.timestamp < acc[key].timeIn)) {
        acc[key].timeIn = new Date(log.timestamp);
      }
      if (log.attendance_type === 'time-out' && (!acc[key].timeOut || log.timestamp > acc[key].timeOut)) {
        acc[key].timeOut = new Date(log.timestamp);
      }
      
      return acc;
    }, {});

    const analysisData: any[] = [];
    const stats = { Normal: 0, Abnormal: 0, Dangerous: 0 };
    const uniqueUsers = new Set<number>();

    Object.values(grouped).forEach((daily: any) => {
      // Calculate duration in hours
      if (daily.timeIn && daily.timeOut) {
        daily.duration = (daily.timeOut.getTime() - daily.timeIn.getTime()) / (1000 * 60 * 60);
      }

      // Use AnomalyDetectionService for proper analysis
      const anomalyResult = AnomalyDetectionService.analyzeDailyAttendance(daily);
      
      // Track unique users
      uniqueUsers.add(daily.userId);

      // Format times
      let inTimeStr = "MISSING";
      let outTimeStr = "MISSING";
      let durationStr = "N/A";

      if (daily.timeIn) {
        inTimeStr = daily.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (daily.timeOut) {
        outTimeStr = daily.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      if (daily.duration > 0) {
        const hours = Math.floor(daily.duration);
        const mins = Math.round((daily.duration - hours) * 60);
        if (hours > 0) {
          durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } else {
          durationStr = `${mins}m`;
        }
      }

      // Capitalize status for display
      const status = anomalyResult.status.charAt(0).toUpperCase() + anomalyResult.status.slice(1);
      const statement = anomalyResult.reasons.length > 0 
        ? anomalyResult.reasons.join('; ') 
        : 'Regular attendance pattern.';

      stats[status as keyof typeof stats]++;
      analysisData.push({
        user_id: daily.userId,
        name: daily.userName || 'N/A',
        date: daily.date,
        in: inTimeStr,
        out: outTimeStr,
        duration: durationStr,
        status: status,
        statement: statement
      });
    });

    // Generate AI Insights
    const { AIInsightsService } = await import('./aiInsightsService.js');
    const aiInsights = await AIInsightsService.generateAttendanceInsights(
      stats,
      analysisData,
      filters.start_date && filters.end_date 
        ? { start: filters.start_date, end: filters.end_date }
        : undefined
    );

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
        
        // AI Insights Section
        { text: 'AI-POWERED INSIGHTS & RECOMMENDATIONS', style: 'sectionTitle' },
        { text: '\n' },
        
        // Risk Level Badge
        {
          table: {
            widths: ['*'],
            body: [
              [{
                text: `RISK LEVEL: ${aiInsights.riskLevel.toUpperCase()}`,
                style: 'riskBadge',
                fillColor: aiInsights.riskLevel === 'critical' ? '#d32f2f' :
                          aiInsights.riskLevel === 'high' ? '#ed6c02' :
                          aiInsights.riskLevel === 'medium' ? '#f57c00' : '#2e7d32',
                color: '#ffffff',
                alignment: 'center',
                bold: true
              }]
            ]
          },
          layout: 'noBorders'
        },
        { text: '\n' },
        
        // Executive Summary
        { text: 'Executive Summary', style: 'subsectionTitle' },
        { text: aiInsights.summary, style: 'bodyText', margin: [0, 5, 0, 10] },
        
        // Key Findings
        { text: 'Key Findings', style: 'subsectionTitle' },
        {
          ul: aiInsights.keyFindings.map((finding: string) => ({
            text: finding,
            style: 'bodyText'
          })),
          margin: [0, 5, 0, 15]
        },
        
        // Stats Summary
        { text: 'STATISTICAL OVERVIEW', style: 'sectionTitle' },
        { text: '\n' },
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
        { text: 'Summary Table', style: 'subsectionTitle' },
        {
          table: {
            headerRows: 1,
            widths: [40, '*', 70, 50, 50, 50, 60],
            body: [
              [
                { text: 'ID', style: 'tableHeader' },
                { text: 'Name', style: 'tableHeader' },
                { text: 'Date', style: 'tableHeader' },
                { text: 'In', style: 'tableHeader' },
                { text: 'Out', style: 'tableHeader' },
                { text: 'Duration', style: 'tableHeader' },
                { text: 'Status', style: 'tableHeader' }
              ],
              ...analysisData.map(row => [
                row.user_id,
                row.name,
                row.date,
                row.in,
                row.out,
                row.duration,
                { 
                  text: row.status, 
                  color: row.status === 'Dangerous' ? '#d32f2f' : row.status === 'Abnormal' ? '#ed6c02' : '#2e7d32', 
                  bold: true,
                  alignment: 'center'
                }
              ])
            ]
          },
          layout: 'lightHorizontalLines'
        },
        { text: '\n\n' },
        
        // Detailed Findings Section - Only for Dangerous and Abnormal cases
        { text: 'Detailed Findings & Explanations', style: 'subsectionTitle' },
        { text: 'Cases requiring attention:', style: 'bodyText', margin: [0, 5, 0, 10] },
        ...analysisData
          .filter((row: any) => row.status === 'Dangerous' || row.status === 'Abnormal')
          .map((row: any, index: number) => ({
            stack: [
              {
                columns: [
                  { 
                    text: `${index + 1}. ${row.name} (ID: ${row.user_id})`, 
                    style: 'findingTitle',
                    width: '*'
                  },
                  { 
                    text: row.status, 
                    style: 'findingBadge',
                    color: '#ffffff',
                    fillColor: row.status === 'Dangerous' ? '#d32f2f' : '#ed6c02',
                    alignment: 'center',
                    width: 80
                  }
                ]
              },
              { 
                text: `Date: ${row.date} | Time In: ${row.in} | Time Out: ${row.out} | Duration: ${row.duration}`,
                style: 'findingMeta',
                margin: [0, 2, 0, 5]
              },
              { 
                text: row.statement,
                style: 'findingStatement',
                margin: [10, 0, 0, 10]
              }
            ],
            margin: [0, 0, 0, 15]
          })),
        
        { text: '\n' },
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
        subsectionTitle: { fontSize: 12, bold: true, margin: [0, 5, 0, 5], color: '#444' },
        bodyText: { fontSize: 10, color: '#333', lineHeight: 1.4 },
        riskBadge: { fontSize: 12, bold: true, margin: [0, 5, 0, 5] },
        findingTitle: { fontSize: 11, bold: true, color: '#333' },
        findingBadge: { fontSize: 9, bold: true, margin: [2, 2, 2, 2] },
        findingMeta: { fontSize: 9, color: '#666', italics: true },
        findingStatement: { fontSize: 10, color: '#444', lineHeight: 1.3 },
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

    // Count distinct days present THIS MONTH only (not all-time)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const monthResult = await query(
      `SELECT COUNT(DISTINCT DATE(timestamp)) as month_days
       FROM attendance
       WHERE user_id = $1
         AND attendance_type = 'time-in'
         AND DATE(timestamp) >= $2`,
      [userId, startOfMonthStr]
    );
    const presentDays = parseInt(monthResult.rows[0]?.month_days) || 0;
    
    // Calculate attendance rate (assuming 20 working days per month)
    const totalExpectedDays = 20;
    const attendanceRate = Math.min(100, Math.round((presentDays / totalExpectedDays) * 100));
    
    // For week/month specific counts, use targeted queries instead of full scan
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const weekRecords = await AttendanceModel.getUserAttendanceHistory(userId, userType, 200);

    // Count distinct calendar days (not raw records) for week and month
    const thisWeekPresent = new Set(
      weekRecords
        .filter(a => a.attendance_type === 'time-in' && new Date(a.timestamp) >= startOfWeek)
        .map(a => new Date(a.timestamp).toISOString().split('T')[0])
    ).size;

    const thisMonthPresent = new Set(
      weekRecords
        .filter(a => a.attendance_type === 'time-in' && new Date(a.timestamp) >= startOfMonth)
        .map(a => new Date(a.timestamp).toISOString().split('T')[0])
    ).size;
    
    return {
      totalDays: totalExpectedDays,
      presentDays,
      lateDays: 0, // This would need a separate SQL query with hour extraction
      attendanceRate,
      thisWeekPresent,
      thisMonthPresent,
    };
  },

  generateCSV: async (filters: any): Promise<string> => {
    // Fetch all records for the CSV (max 10000 for safety)
    const logs = await AttendanceModel.getAll(10000, 0, filters);

    // CSV Header
    const headers = [
      'ID',
      'User ID',
      'User Name',
      'User Type',
      'Attendance Type',
      'Timestamp',
      'Date',
      'Time',
      'Day of Week'
    ];

    // Build CSV rows
    const rows = logs.map((log: any) => {
      const timestamp = new Date(log.timestamp);
      const date = timestamp.toISOString().split('T')[0];
      const time = timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dayOfWeek = timestamp.toLocaleDateString('en-US', { weekday: 'long' });

      return [
        log.id,
        log.user_id,
        `"${(log.user_name || 'N/A').replace(/"/g, '""')}"`, // Escape quotes in names
        log.user_type,
        log.attendance_type,
        timestamp.toISOString(),
        date,
        time,
        dayOfWeek
      ].join(',');
    });

    // Add summary statistics at the top
    const totalRecords = logs.length;
    const timeIns = logs.filter((l: any) => l.attendance_type === 'time-in').length;
    const timeOuts = logs.filter((l: any) => l.attendance_type === 'time-out').length;
    const uniqueUsers = new Set(logs.map((l: any) => l.user_id)).size;

    const summary = [
      `"Attendance Export Report"`,
      `"Generated on: ${new Date().toLocaleString()}"`,
      `"Total Records: ${totalRecords}"`,
      `"Time-Ins: ${timeIns}"`,
      `"Time-Outs: ${timeOuts}"`,
      `"Unique Users: ${uniqueUsers}"`,
      `"Date Range: ${filters.start_date || 'All'} to ${filters.end_date || 'All'}"`,
      '',
      ''
    ];

    // Combine summary + headers + data
    return [...summary, headers.join(','), ...rows].join('\n');
  },

  exportAnalyticsToCSV: async () => {
    const { CSVExport } = await import('../utils/csvExport.js');
    
    // Fetch all analytics data
    const [monthlyTrends, dailyTrends, peakHours, deptDist, weeklyPerf] = await Promise.all([
      AttendanceModel.getMonthlyTrends(),
      AttendanceModel.getDailyTrends(),
      AttendanceModel.getPeakHours(),
      AttendanceModel.getDepartmentDistribution(),
      AttendanceModel.getWeeklyPerformance()
    ]);

    let csvContent = '';

    // Section 1: Monthly Trends
    csvContent += 'MONTHLY ATTENDANCE TRENDS\n';
    csvContent += 'Month,Attendance Count\n';
    monthlyTrends.forEach((item: any) => {
      csvContent += `${CSVExport.escapeCSV(item.month)},${item.count}\n`;
    });
    csvContent += '\n';

    // Section 2: Daily Trends (Last 30 Days)
    csvContent += 'DAILY ATTENDANCE TRENDS (Last 30 Days)\n';
    csvContent += 'Date,Attendance Count\n';
    dailyTrends.forEach((item: any) => {
      csvContent += `${CSVExport.escapeCSV(item.date)},${item.count}\n`;
    });
    csvContent += '\n';

    // Section 3: Peak Hours Analysis
    csvContent += 'PEAK HOURS ANALYSIS\n';
    csvContent += 'Hour,Attendance Count\n';
    peakHours.forEach((item: any) => {
      csvContent += `${CSVExport.escapeCSV(item.hour)},${item.count}\n`;
    });
    csvContent += '\n';

    // Section 4: Department/Course Distribution
    csvContent += 'ATTENDANCE DISTRIBUTION BY DEPARTMENT/COURSE\n';
    csvContent += 'Category,Attendance Count\n';
    deptDist.forEach((item: any) => {
      csvContent += `${CSVExport.escapeCSV(item.name)},${item.value}\n`;
    });
    csvContent += '\n';

    // Section 5: Weekly Performance
    csvContent += 'WEEKLY PERFORMANCE\n';
    csvContent += 'Week,Day,Attendance Count\n';
    weeklyPerf.forEach((item: any) => {
      csvContent += `${CSVExport.escapeCSV(item.week || 'N/A')},${CSVExport.escapeCSV(item.day || 'N/A')},${item.count}\n`;
    });
    csvContent += '\n';

    // Summary Statistics
    const totalRecords = dailyTrends.reduce((sum: number, item: any) => sum + item.count, 0);
    const avgDaily = dailyTrends.length > 0 ? (totalRecords / dailyTrends.length).toFixed(1) : 0;
    const peakHour = peakHours.length > 0 ? peakHours.reduce((max: any, item: any) => item.count > max.count ? item : max) : null;

    csvContent += 'SUMMARY STATISTICS\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Records (Last 30 Days),${totalRecords}\n`;
    csvContent += `Average Daily Attendance,${avgDaily}\n`;
    csvContent += `Peak Hour,${peakHour ? peakHour.hour : 'N/A'}\n`;
    csvContent += `Peak Hour Count,${peakHour ? peakHour.count : 'N/A'}\n`;
    csvContent += `Export Date,${new Date().toLocaleString()}\n`;

    return csvContent;
  },
};
