import { query } from '../db/index.js';
import { ShsUserEntity, CreateShsUserRequest, UpdateShsUserRequest } from '../types/shsUserEntity.js';

export const ShsUserModel = {
  findByEmail: async (email: string): Promise<ShsUserEntity | null> => {
    const sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.email = $1 AND s.status = 'active'
    `;
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  findByStudentId: async (studentId: string): Promise<ShsUserEntity | null> => {
    const sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.student_id = $1 AND s.status = 'active'
    `;
    const { rows } = await query(sql, [studentId]);
    return rows[0] || null;
  },

  findById: async (id: number): Promise<ShsUserEntity | null> => {
    const sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  getAll: async (limit: number, offset: number, filters?: any): Promise<ShsUserEntity[]> => {
    let sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.status = 'active'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.strand_id) {
      sql += ` AND s.strand_id = $${paramIndex++}`;
      params.push(filters.strand_id);
    }

    if (filters?.grade_id) {
      sql += ` AND s.grade_id = $${paramIndex++}`;
      params.push(filters.grade_id);
    }

    if (filters?.search) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
      paramIndex++;
    }

    sql += ` ORDER BY s.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM shs_users WHERE status = $1';
    const params: any[] = ['active'];
    let paramIndex = 2;

    if (filters?.strand_id) {
      sql += ` AND strand_id = $${paramIndex++}`;
      params.push(filters.strand_id);
    }

    if (filters?.grade_id) {
      sql += ` AND grade_id = $${paramIndex++}`;
      params.push(filters.grade_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  create: async (userData: CreateShsUserRequest): Promise<ShsUserEntity> => {
    const sql = `
      INSERT INTO shs_users (
        first_name, middle_initial, last_name, name, email, contact_number,
        student_id, password, strand_id, grade_id, role, status, registered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *
    `;
    
    const fullName = `${userData.first_name} ${userData.middle_initial || ''} ${userData.last_name}`.trim();
    
    const { rows } = await query(sql, [
      userData.first_name,
      userData.middle_initial || null,
      userData.last_name,
      fullName,
      userData.email || null,
      userData.contact_number || null,
      userData.student_id || null,
      userData.password,
      userData.strand_id || null,
      userData.grade_id || null,
      userData.role || 'student',
      'active'
    ]);
    return rows[0];
  },

  update: async (id: number, userData: UpdateShsUserRequest): Promise<ShsUserEntity> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.first_name);
    }
    if (userData.middle_initial !== undefined) {
      fields.push(`middle_initial = $${paramIndex++}`);
      values.push(userData.middle_initial);
    }
    if (userData.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.last_name);
    }
    if (userData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.contact_number !== undefined) {
      fields.push(`contact_number = $${paramIndex++}`);
      values.push(userData.contact_number);
    }
    if (userData.strand_id !== undefined) {
      fields.push(`strand_id = $${paramIndex++}`);
      values.push(userData.strand_id);
    }
    if (userData.grade_id !== undefined) {
      fields.push(`grade_id = $${paramIndex++}`);
      values.push(userData.grade_id);
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(userData.password);
    }

    if (userData.first_name || userData.last_name) {
      const user = await ShsUserModel.findById(id);
      if (user) {
        const firstName = userData.first_name || user.first_name;
        const middleInitial = userData.middle_initial !== undefined ? userData.middle_initial : user.middle_initial;
        const lastName = userData.last_name || user.last_name;
        const fullName = `${firstName} ${middleInitial || ''} ${lastName}`.trim();
        fields.push(`name = $${paramIndex++}`);
        values.push(fullName);
      }
    }

    values.push(id);

    const sql = `UPDATE shs_users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  },

  delete: async (id: number, archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE shs_users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = $1
    `;
    await query(sql, [id, archivedBy || null]);
  },

  search: async (searchQuery: string, limit: number = 10): Promise<ShsUserEntity[]> => {
    const sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.status = 'active'
        AND (s.name ILIKE $1 OR s.email ILIKE $1 OR s.student_id ILIKE $1)
      LIMIT $2
    `;
    const { rows } = await query(sql, [`%${searchQuery}%`, limit]);
    return rows;
  },

  // Archive-related functions
  getArchived: async (limit: number, offset: number, filters?: any): Promise<ShsUserEntity[]> => {
    let sql = `
      SELECT s.*, st.name as strand_name, g.grade_name
      FROM shs_users s
      LEFT JOIN shs_strands st ON s.strand_id = st.id
      LEFT JOIN shs_grades g ON s.grade_id = g.id
      WHERE s.status = 'archived'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.strand_id) {
      sql += ` AND s.strand_id = $${paramIndex++}`;
      params.push(filters.strand_id);
    }

    if (filters?.grade_id) {
      sql += ` AND s.grade_id = $${paramIndex++}`;
      params.push(filters.grade_id);
    }

    if (filters?.search) {
      sql += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex} OR s.student_id ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY s.archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getArchivedCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM shs_users WHERE status = $1';
    const params: any[] = ['archived'];
    let paramIndex = 2;

    if (filters?.strand_id) {
      sql += ` AND strand_id = $${paramIndex++}`;
      params.push(filters.strand_id);
    }

    if (filters?.grade_id) {
      sql += ` AND grade_id = $${paramIndex++}`;
      params.push(filters.grade_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  restore: async (id: number): Promise<void> => {
    const sql = `
      UPDATE shs_users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = $1 AND status = 'archived'
    `;
    await query(sql, [id]);
  },

  deactivate: async (id: number, deactivatedBy: number): Promise<void> => {
    const sql = `
      UPDATE shs_users
      SET status = 'deactivated', deactivated_at = NOW(), deactivated_by = $2
      WHERE id = $1 AND status = 'active'
    `;
    await query(sql, [id, deactivatedBy]);
  },

  reactivate: async (id: number): Promise<void> => {
    const sql = `
      UPDATE shs_users
      SET status = 'active', deactivated_at = NULL, deactivated_by = NULL
      WHERE id = $1 AND status = 'deactivated'
    `;
    await query(sql, [id]);
  },

  permanentDelete: async (id: number): Promise<void> => {
    const sql = `DELETE FROM shs_users WHERE id = $1`;
    await query(sql, [id]);
  },

  bulkArchive: async (ids: number[], archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE shs_users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = ANY($1::int[])
    `;
    await query(sql, [ids, archivedBy || null]);
  },

  bulkRestore: async (ids: number[]): Promise<void> => {
    const sql = `
      UPDATE shs_users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = ANY($1::int[]) AND status = 'archived'
    `;
    await query(sql, [ids]);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const sql = `DELETE FROM shs_users WHERE id = ANY($1::int[])`;
    await query(sql, [ids]);
  },

  updatePassword: async (id: number, hashedPassword: string): Promise<void> => {
    const sql = `UPDATE shs_users SET password = $1 WHERE id = $2`;
    await query(sql, [hashedPassword, id]);
  },
};
