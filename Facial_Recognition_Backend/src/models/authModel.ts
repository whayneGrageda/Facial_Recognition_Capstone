import { query } from '../db/index.js';

export const AuthModel = {
  findAdminByUsername: async (username: string) => {
    const sql = `SELECT * FROM admins WHERE username = $1 OR email = $1`;
    const { rows } = await query(sql, [username]);
    return rows[0] || null;
  },

  findModeratorByUsername: async (username: string) => {
    const sql = `SELECT * FROM moderators WHERE (username = $1 OR email = $1) AND status = 'active'`;
    const { rows } = await query(sql, [username]);
    return rows[0] || null;
  },

  findUserByEmail: async (email: string, userType: string) => {
    let sql = '';
    
    if (userType === 'college') {
      sql = `
        SELECT 
          u.*,
          c.name as course_name,
          y.year_name
        FROM users u
        LEFT JOIN courses c ON u.course_id = c.id
        LEFT JOIN years y ON u.year_id = y.id
        WHERE u.email = $1 AND u.status = 'active'
      `;
    } else if (userType === 'shs') {
      sql = `
        SELECT 
          u.*,
          s.name as strand_name,
          s.acronym as strand_acronym,
          g.grade_name
        FROM shs_users u
        LEFT JOIN shs_strands s ON u.strand_id = s.id
        LEFT JOIN shs_grades g ON u.grade_id = g.id
        WHERE u.email = $1 AND u.status = 'active'
      `;
    } else if (userType === 'faculty') {
      sql = `
        SELECT 
          u.*,
          d.department_name
        FROM faculty_users u
        LEFT JOIN faculty_department d ON u.department_id = d.id
        WHERE u.email = $1 AND u.status = 'active'
      `;
    }

    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  storeToken: async (userId: string, token: string, userType: string, role: string, expiresAt: Date) => {
    const sql = `
      INSERT INTO jwt_tokens (user_id, token, user_type, role, is_active, expires_at)
      VALUES ($1, $2, $3, $4, true, $5)
      RETURNING *
    `;
    const { rows } = await query(sql, [userId, token, userType, role, expiresAt]);
    return rows[0];
  },

  verifyToken: async (token: string) => {
    const sql = `
      SELECT * FROM jwt_tokens
      WHERE token = $1 AND is_active = true AND expires_at > NOW()
    `;
    const { rows } = await query(sql, [token]);
    return rows[0] || null;
  },

  invalidateToken: async (token: string) => {
    const sql = `
      UPDATE jwt_tokens
      SET is_active = false, updated_at = NOW()
      WHERE token = $1
    `;
    await query(sql, [token]);
  },

  invalidateAllUserTokens: async (userId: string, userType: string) => {
    const sql = `
      UPDATE jwt_tokens
      SET is_active = false, updated_at = NOW()
      WHERE user_id = $1 AND user_type = $2
    `;
    await query(sql, [userId, userType]);
  },
};
