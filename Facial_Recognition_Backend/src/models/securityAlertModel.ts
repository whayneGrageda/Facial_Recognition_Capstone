import { getPool } from '../db/index.js';

const pool = getPool();

export interface SecurityAlert {
  id: number;
  alert_type: string;
  camera_type: string;
  ai_analysis: string;
  image_path: string | null;
  severity: string;
  is_resolved: boolean;
  resolved_by: number | null;
  resolved_at: Date | null;
  created_at: Date;
  metadata: any;
}

export interface CreateSecurityAlertRequest {
  alert_type: string;
  camera_type: string;
  ai_analysis: string;
  image_path?: string;
  severity?: string;
  metadata?: any;
}

export const SecurityAlertModel = {
  /**
   * Create a new security alert
   */
  create: async (data: CreateSecurityAlertRequest): Promise<SecurityAlert> => {
    const result = await pool.query(
      `INSERT INTO security_alerts (alert_type, camera_type, ai_analysis, image_path, severity, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.alert_type,
        data.camera_type,
        data.ai_analysis,
        data.image_path || null,
        data.severity || 'high',
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );
    return result.rows[0];
  },

  /**
   * Get all security alerts with pagination and filters
   */
  getAll: async (
    limit: number = 50,
    offset: number = 0,
    filters?: {
      alert_type?: string;
      camera_type?: string;
      is_resolved?: boolean;
      severity?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<SecurityAlert[]> => {
    let query = 'SELECT * FROM security_alerts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.alert_type) {
      query += ` AND alert_type = $${paramIndex++}`;
      params.push(filters.alert_type);
    }

    if (filters?.camera_type) {
      query += ` AND camera_type = $${paramIndex++}`;
      params.push(filters.camera_type);
    }

    if (filters?.is_resolved !== undefined) {
      query += ` AND is_resolved = $${paramIndex++}`;
      params.push(filters.is_resolved);
    }

    if (filters?.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters?.start_date && filters?.end_date) {
      query += ` AND DATE(created_at) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(filters.start_date, filters.end_date);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  },

  /**
   * Get total count of alerts
   */
  getTotalCount: async (filters?: any): Promise<number> => {
    let query = 'SELECT COUNT(*) as count FROM security_alerts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.alert_type) {
      query += ` AND alert_type = $${paramIndex++}`;
      params.push(filters.alert_type);
    }

    if (filters?.camera_type) {
      query += ` AND camera_type = $${paramIndex++}`;
      params.push(filters.camera_type);
    }

    if (filters?.is_resolved !== undefined) {
      query += ` AND is_resolved = $${paramIndex++}`;
      params.push(filters.is_resolved);
    }

    if (filters?.severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }

    if (filters?.start_date && filters?.end_date) {
      query += ` AND DATE(created_at) BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(filters.start_date, filters.end_date);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  /**
   * Get recent unresolved alerts (for dashboard)
   */
  getRecentUnresolved: async (limit: number = 10): Promise<SecurityAlert[]> => {
    const result = await pool.query(
      `SELECT * FROM security_alerts 
       WHERE is_resolved = false 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Get alert by ID
   */
  findById: async (id: number): Promise<SecurityAlert | null> => {
    const result = await pool.query(
      'SELECT * FROM security_alerts WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Mark alert as resolved
   */
  markAsResolved: async (id: number, resolvedBy: number): Promise<void> => {
    await pool.query(
      `UPDATE security_alerts 
       SET is_resolved = true, resolved_by = $1, resolved_at = NOW() 
       WHERE id = $2`,
      [resolvedBy, id]
    );
  },

  /**
   * Delete alert
   */
  delete: async (id: number): Promise<void> => {
    await pool.query('DELETE FROM security_alerts WHERE id = $1', [id]);
  },

  /**
   * Get alert statistics
   */
  getStats: async (): Promise<{
    total: number;
    unresolved: number;
    today: number;
    by_type: any[];
    by_severity: any[];
  }> => {
    const [totalRes, unresolvedRes, todayRes, byTypeRes, bySeverityRes] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM security_alerts'),
      pool.query('SELECT COUNT(*) as count FROM security_alerts WHERE is_resolved = false'),
      pool.query('SELECT COUNT(*) as count FROM security_alerts WHERE DATE(created_at) = CURRENT_DATE'),
      pool.query('SELECT alert_type, COUNT(*) as count FROM security_alerts GROUP BY alert_type'),
      pool.query('SELECT severity, COUNT(*) as count FROM security_alerts GROUP BY severity')
    ]);

    return {
      total: parseInt(totalRes.rows[0].count),
      unresolved: parseInt(unresolvedRes.rows[0].count),
      today: parseInt(todayRes.rows[0].count),
      by_type: byTypeRes.rows,
      by_severity: bySeverityRes.rows
    };
  }
};
