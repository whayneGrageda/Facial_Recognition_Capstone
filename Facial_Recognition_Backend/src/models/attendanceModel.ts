import { query } from '../db/index.js';
import { AttendanceEntity, CreateAttendanceRequest } from '../types/attendanceEntity.js';

// Hard cap to prevent accidental full-table fetches
const MAX_QUERY_LIMIT = 10000;

/**
 * Shared filter builder — eliminates duplicated filter logic between getAll() and getTotalCount().
 * Returns the WHERE clause suffix and the corresponding parameter array.
 */
const buildFilterClause = (filters: any, startParamIndex: number = 1) => {
  let clause = '';
  const params: any[] = [];
  let paramIndex = startParamIndex;

  if (filters?.user_id) {
    clause += ` AND a.user_id = $${paramIndex++}`;
    params.push(filters.user_id);
  }

  if (filters?.user_type) {
    clause += ` AND a.user_type = $${paramIndex++}`;
    params.push(filters.user_type);
  }

  if (filters?.date) {
    // Use proper date range instead of CAST(timestamp AS TEXT) LIKE
    // This allows PostgreSQL to use indexes on the timestamp column
    const dateStr = filters.date as string;
    if (dateStr.length === 4) {
      // Year only: YYYY
      clause += ` AND a.timestamp >= $${paramIndex++}::date AND a.timestamp < ($${paramIndex++}::date + INTERVAL '1 year')`;
      params.push(`${dateStr}-01-01`, `${dateStr}-01-01`);
    } else if (dateStr.length === 7) {
      // Year-Month: YYYY-MM
      clause += ` AND a.timestamp >= $${paramIndex++}::date AND a.timestamp < ($${paramIndex++}::date + INTERVAL '1 month')`;
      params.push(`${dateStr}-01`, `${dateStr}-01`);
    } else {
      // Full date: YYYY-MM-DD
      clause += ` AND a.timestamp >= $${paramIndex++}::date AND a.timestamp < ($${paramIndex++}::date + INTERVAL '1 day')`;
      params.push(dateStr, dateStr);
    }
  }

  if (filters?.start_date && filters?.end_date) {
    clause += ` AND DATE(a.timestamp) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
    params.push(filters.start_date, filters.end_date);
  }

  if (filters?.attendance_type) {
    clause += ` AND a.attendance_type = $${paramIndex++}`;
    params.push(filters.attendance_type);
  }

  if (filters?.course_strand_dept) {
    clause += ` AND (c.name = $${paramIndex} OR s.name = $${paramIndex} OR s.acronym = $${paramIndex} OR d.department_name = $${paramIndex})`;
    paramIndex++;
    params.push(filters.course_strand_dept);
  }

  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    clause += ` AND (
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

  return { clause, params, nextParamIndex: paramIndex };
};

/** Shared base SELECT with all LEFT JOINs for user resolution */
const BASE_SELECT = `
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

/** Shared base COUNT with all LEFT JOINs */
const BASE_COUNT = `
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
    const safeLimitVal = Math.min(Math.max(1, limit), MAX_QUERY_LIMIT);
    const { clause, params, nextParamIndex } = buildFilterClause(filters);

    let sql = BASE_SELECT + clause;
    sql += ` ORDER BY a.timestamp DESC LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
    params.push(safeLimitVal, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    const { clause, params } = buildFilterClause(filters);
    const sql = BASE_COUNT + clause;

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count);
  },

  /**
   * Get aggregated attendance stats via SQL — replaces fetching 1000+ rows into JS.
   * Returns counts grouped by attendance_type and user_type in a single query.
   */
  getAggregatedStats: async (date?: string): Promise<{ attendance_type: string; user_type: string; count: number }[]> => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const sql = `
      SELECT 
        attendance_type,
        user_type,
        COUNT(*) as count
      FROM attendance
      WHERE timestamp >= $1::date AND timestamp < ($1::date + INTERVAL '1 day')
      GROUP BY attendance_type, user_type
    `;
    const { rows } = await query(sql, [targetDate]);
    return rows;
  },

  /**
   * Get user stats via SQL aggregation — replaces fetching 10,000 rows into JS.
   */
  getUserAggregatedStats: async (userId: number): Promise<{
    total_records: number;
    total_days: number;
    time_ins: number;
    time_outs: number;
    most_active_day: string;
    avg_per_day: number;
  }> => {
    const sql = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT DATE(timestamp)) as total_days,
        COUNT(*) FILTER (WHERE attendance_type = 'time-in') as time_ins,
        COUNT(*) FILTER (WHERE attendance_type = 'time-out') as time_outs,
        MODE() WITHIN GROUP (ORDER BY TO_CHAR(timestamp, 'Day')) as most_active_day,
        ROUND(COUNT(*)::numeric / GREATEST(COUNT(DISTINCT DATE(timestamp)), 1), 2) as avg_per_day
      FROM attendance
      WHERE user_id = $1
    `;
    const { rows } = await query(sql, [userId]);
    return rows[0];
  },

  getTodayAttendance: async (): Promise<AttendanceEntity[]> => {
    const sql = BASE_SELECT.replace('WHERE 1=1', 'WHERE DATE(a.timestamp) = CURRENT_DATE') +
      ` ORDER BY a.timestamp DESC`;
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
      WHERE timestamp >= NOW() - INTERVAL '30 days'
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

  getHeatmapData: async (): Promise<any[]> => {
    // Returns count per day-of-week (1=Mon..5=Fri) and hour (8..19)
    // for the last 90 days, time-in records only
    const sql = `
      SELECT
        EXTRACT(DOW FROM timestamp)::int AS dow,
        EXTRACT(HOUR FROM timestamp)::int AS hour,
        COUNT(*) AS count
      FROM attendance
      WHERE attendance_type = 'time-in'
        AND timestamp >= NOW() - INTERVAL '90 days'
        AND EXTRACT(DOW FROM timestamp) BETWEEN 1 AND 5
        AND EXTRACT(HOUR FROM timestamp) BETWEEN 8 AND 19
      GROUP BY dow, hour
      ORDER BY dow, hour
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
