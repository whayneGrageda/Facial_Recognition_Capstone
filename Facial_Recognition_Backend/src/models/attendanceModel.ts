import { query } from '../db/index.js';
import { AttendanceEntity, CreateAttendanceRequest } from '../types/attendanceEntity.js';

export const AttendanceModel = {
  create: async (data: CreateAttendanceRequest): Promise<AttendanceEntity> => {
    const sql = `
      INSERT INTO attendance (user_id, user_type, name, timestamp, attendance_type)
      VALUES ($1, $2, $3, NOW(), $4)
      RETURNING *
    `;
    const { rows } = await query(sql, [
      data.user_id,
      data.user_type,
      data.name,
      data.attendance_type
    ]);
    return rows[0];
  },

  findById: async (id: number): Promise<AttendanceEntity | null> => {
    const sql = `SELECT * FROM attendance WHERE id = $1`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  getAll: async (limit: number, offset: number, filters?: any): Promise<AttendanceEntity[]> => {
    let sql = `
      SELECT 
        a.*,
        COALESCE(u.first_name || ' ' || u.last_name, su.first_name || ' ' || su.last_name, fu.first_name || ' ' || fu.last_name, g.name) as user_name,
        COALESCE(u.email, su.email, fu.email, '') as user_email,
        COALESCE(c.name, s.name, d.department_name, '') as course_strand_dept
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id AND a.user_type = 'college'
      LEFT JOIN shs_users su ON a.user_id = su.id AND a.user_type = 'shs'
      LEFT JOIN faculty_users fu ON a.user_id = fu.id AND a.user_type = 'faculty'
      LEFT JOIN guests g ON a.user_id = g.id AND a.user_type = 'guest'
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN shs_strands s ON su.strand_id = s.id
      LEFT JOIN faculty_department d ON fu.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.user_id) {
      sql += ` AND a.user_id = $${paramIndex++}`;
      params.push(filters.user_id);
    }

    if (filters?.user_type) {
      sql += ` AND a.user_type = $${paramIndex++}`;
      params.push(filters.user_type);
    }

    if (filters?.date) {
      // Handle partial date matches (YYYY, YYYY-MM, or YYYY-MM-DD)
      sql += ` AND CAST(a.timestamp AS TEXT) LIKE $${paramIndex++}`;
      params.push(`${filters.date}%`);
    }

    if (filters?.start_date && filters?.end_date) {
      sql += ` AND DATE(a.timestamp) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(filters.start_date, filters.end_date);
    }

    if (filters?.attendance_type) {
      sql += ` AND a.attendance_type = $${paramIndex++}`;
      params.push(filters.attendance_type);
    }
    
    if (filters?.course_strand_dept) {
      sql += ` AND (c.name = $${paramIndex} OR s.name = $${paramIndex} OR s.acronym = $${paramIndex} OR d.department_name = $${paramIndex})`;
      paramIndex++;
      params.push(filters.course_strand_dept);
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      sql += ` AND (
        CAST(a.user_id AS TEXT) LIKE $${paramIndex} OR
        u.first_name || ' ' || u.last_name ILIKE $${paramIndex} OR
        su.first_name || ' ' || su.last_name ILIKE $${paramIndex} OR
        fu.first_name || ' ' || fu.last_name ILIKE $${paramIndex} OR
        g.name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        su.email ILIKE $${paramIndex} OR
        fu.email ILIKE $${paramIndex}
      )`;
      paramIndex++;
      params.push(searchPattern);
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    let sql = `
      SELECT COUNT(*) as count 
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id AND a.user_type = 'college'
      LEFT JOIN shs_users su ON a.user_id = su.id AND a.user_type = 'shs'
      LEFT JOIN faculty_users fu ON a.user_id = fu.id AND a.user_type = 'faculty'
      LEFT JOIN guests g ON a.user_id = g.id AND a.user_type = 'guest'
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN shs_strands s ON su.strand_id = s.id
      LEFT JOIN faculty_department d ON fu.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.user_id) {
      sql += ` AND a.user_id = $${paramIndex++}`;
      params.push(filters.user_id);
    }

    if (filters?.user_type) {
      sql += ` AND a.user_type = $${paramIndex++}`;
      params.push(filters.user_type);
    }

    if (filters?.date) {
      sql += ` AND CAST(a.timestamp AS TEXT) LIKE $${paramIndex++}`;
      params.push(`${filters.date}%`);
    }

    if (filters?.attendance_type) {
      sql += ` AND a.attendance_type = $${paramIndex++}`;
      params.push(filters.attendance_type);
    }

    if (filters?.course_strand_dept) {
      sql += ` AND (c.name = $${paramIndex} OR s.name = $${paramIndex} OR s.acronym = $${paramIndex} OR d.department_name = $${paramIndex})`;
      paramIndex++;
      params.push(filters.course_strand_dept);
    }

    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      sql += ` AND (
        CAST(a.user_id AS TEXT) LIKE $${paramIndex} OR 
        u.first_name || ' ' || u.last_name ILIKE $${paramIndex} OR
        su.first_name || ' ' || su.last_name ILIKE $${paramIndex} OR
        fu.first_name || ' ' || fu.last_name ILIKE $${paramIndex} OR
        g.name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        su.email ILIKE $${paramIndex} OR
        fu.email ILIKE $${paramIndex}
      )`;
      paramIndex++;
      params.push(searchPattern);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count);
  },

  getTodayAttendance: async (): Promise<AttendanceEntity[]> => {
    const sql = `
      SELECT 
        a.*,
        COALESCE(u.first_name || ' ' || u.last_name, su.first_name || ' ' || su.last_name, fu.first_name || ' ' || fu.last_name, g.name) as user_name,
        COALESCE(u.email, su.email, fu.email, '') as user_email,
        COALESCE(c.name, s.name, d.department_name, '') as course_strand_dept
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id AND a.user_type = 'college'
      LEFT JOIN shs_users su ON a.user_id = su.id AND a.user_type = 'shs'
      LEFT JOIN faculty_users fu ON a.user_id = fu.id AND a.user_type = 'faculty'
      LEFT JOIN guests g ON a.user_id = g.id AND a.user_type = 'guest'
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN shs_strands s ON su.strand_id = s.id
      LEFT JOIN faculty_department d ON fu.department_id = d.id
      WHERE DATE(a.timestamp) = CURRENT_DATE
      ORDER BY a.timestamp DESC
    `;
    const { rows } = await query(sql);
    return rows;
  },

  getUserAttendanceHistory: async (userId: number, userType: string, limit: number = 30): Promise<AttendanceEntity[]> => {
    const sql = `
      SELECT * FROM attendance
      WHERE user_id = $1 AND user_type = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    const { rows } = await query(sql, [userId, userType, limit]);
    return rows;
  },

  getAttendanceByDateRange: async (startDate: string, endDate: string): Promise<AttendanceEntity[]> => {
    const sql = `
      SELECT * FROM attendance
      WHERE DATE(timestamp) BETWEEN $1 AND $2
      ORDER BY timestamp DESC
    `;
    const { rows } = await query(sql, [startDate, endDate]);
    return rows;
  },

  getMonthlyTrends: async (): Promise<any[]> => {
    const sql = `
      SELECT 
        TO_CHAR(timestamp, 'Mon') as month,
        COUNT(*) as count
      FROM attendance
      WHERE timestamp >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(timestamp, 'Mon'), DATE_TRUNC('month', timestamp)
      ORDER BY DATE_TRUNC('month', timestamp)
    `;
    const { rows } = await query(sql);
    return rows;
  },

  getDailyTrends: async (): Promise<any[]> => {
    const sql = `
      SELECT 
        TO_CHAR(timestamp, 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM attendance
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date
    `;
    const { rows } = await query(sql);
    return rows;
  },

  getPeakHours: async (): Promise<any[]> => {
    const sql = `
      SELECT 
        TO_CHAR(timestamp, 'HH24:00') as hour,
        COUNT(*) as count
      FROM attendance
      GROUP BY hour
      ORDER BY hour
    `;
    const { rows } = await query(sql);
    return rows;
  },

  getDepartmentDistribution: async (): Promise<any[]> => {
    const sql = `
      SELECT 
        user_type as name,
        COUNT(*) as value
      FROM attendance
      GROUP BY user_type
    `;
    const { rows } = await query(sql);
    return rows;
  },

  getWeeklyPerformance: async (): Promise<any[]> => {
    const sql = `
      SELECT 
        'Week ' || TO_CHAR(timestamp, 'W') as week,
        COUNT(*) as count
      FROM attendance
      WHERE timestamp >= NOW() - INTERVAL '4 weeks'
      GROUP BY week, DATE_TRUNC('week', timestamp)
      ORDER BY DATE_TRUNC('week', timestamp)
    `;
    const { rows } = await query(sql);
    return rows;
  },
};
