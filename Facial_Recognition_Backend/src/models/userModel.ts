import { query } from '../db/index.js';
import { UserEntity, CreateUserRequest, UpdateUserRequest } from '../types/userEntity.js';

export const UserModel = {
  findByEmail: async (email: string): Promise<UserEntity | null> => {
    const sql = `
      SELECT u.*, c.name as course_name, y.year_name
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN years y ON u.year_id = y.id
      WHERE u.email = $1 AND u.status = 'active'
    `;
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  findById: async (id: number): Promise<UserEntity | null> => {
    const sql = `
      SELECT u.*, c.name as course_name, y.year_name
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN years y ON u.year_id = y.id
      WHERE u.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  findByStudentId: async (studentId: string): Promise<UserEntity | null> => {
    const sql = `SELECT * FROM users WHERE student_id = $1 AND status = 'active'`;
    const { rows } = await query(sql, [studentId]);
    return rows[0] || null;
  },

  getAll: async (limit: number, offset: number, filters?: any): Promise<UserEntity[]> => {
    let sql = `
      SELECT u.*, c.name as course_name, y.year_name
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN years y ON u.year_id = y.id
      WHERE u.status = 'active'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.course_id) {
      sql += ` AND u.course_id = $${paramIndex++}`;
      params.push(filters.course_id);
    }

    if (filters?.year_id) {
      sql += ` AND u.year_id = $${paramIndex++}`;
      params.push(filters.year_id);
    }

    if (filters?.search) {
      sql += ` AND (u.name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++} OR u.student_id ILIKE $${paramIndex++})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY u.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE status = $1';
    const params: any[] = ['active'];
    let paramIndex = 2;

    if (filters?.course_id) {
      sql += ` AND course_id = $${paramIndex++}`;
      params.push(filters.course_id);
    }

    if (filters?.year_id) {
      sql += ` AND year_id = $${paramIndex++}`;
      params.push(filters.year_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  create: async (userData: CreateUserRequest): Promise<UserEntity> => {
    const sql = `
      INSERT INTO users (
        first_name, middle_initial, last_name, name, email, contact_number,
        student_id, password, course_id, year_id, role, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    
    const fullName = `${userData.first_name} ${userData.middle_initial || ''} ${userData.last_name}`.trim();
    
    const { rows } = await query(sql, [
      userData.first_name,
      userData.middle_initial || null,
      userData.last_name,
      fullName,
      userData.email,
      userData.contact_number || null,
      userData.student_id || null,
      userData.password,
      userData.course_id || null,
      userData.year_id || null,
      userData.role || 'student',
      'active'
    ]);
    return rows[0];
  },

  update: async (id: number, userData: UpdateUserRequest): Promise<UserEntity> => {
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
    if (userData.course_id !== undefined) {
      fields.push(`course_id = $${paramIndex++}`);
      values.push(userData.course_id);
    }
    if (userData.year_id !== undefined) {
      fields.push(`year_id = $${paramIndex++}`);
      values.push(userData.year_id);
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(userData.password);
    }

    // Update name if first_name or last_name changed
    if (userData.first_name || userData.last_name) {
      const user = await UserModel.findById(id);
      if (user) {
        const firstName = userData.first_name || user.first_name;
        const middleInitial = userData.middle_initial !== undefined ? userData.middle_initial : user.middle_initial;
        const lastName = userData.last_name || user.last_name;
        const fullName = `${firstName} ${middleInitial || ''} ${lastName}`.trim();
        fields.push(`name = $${paramIndex++}`);
        values.push(fullName);
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  },

  delete: async (id: number, archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = $1
    `;
    await query(sql, [id, archivedBy || null]);
  },

  search: async (searchQuery: string, limit: number = 10): Promise<UserEntity[]> => {
    const sql = `
      SELECT u.*, c.name as course_name, y.year_name
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN years y ON u.year_id = y.id
      WHERE u.status = 'active'
        AND (u.name ILIKE $1 OR u.email ILIKE $1 OR u.student_id ILIKE $1)
      LIMIT $2
    `;
    const { rows } = await query(sql, [`%${searchQuery}%`, limit]);
    return rows;
  },

  // Archive-related functions
  getArchived: async (limit: number, offset: number, filters?: any): Promise<UserEntity[]> => {
    let sql = `
      SELECT u.*, c.name as course_name, y.year_name
      FROM users u
      LEFT JOIN courses c ON u.course_id = c.id
      LEFT JOIN years y ON u.year_id = y.id
      WHERE u.status = 'archived'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.course_id) {
      sql += ` AND u.course_id = $${paramIndex++}`;
      params.push(filters.course_id);
    }

    if (filters?.year_id) {
      sql += ` AND u.year_id = $${paramIndex++}`;
      params.push(filters.year_id);
    }

    if (filters?.search) {
      sql += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.student_id ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY u.archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getArchivedCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE status = $1';
    const params: any[] = ['archived'];
    let paramIndex = 2;

    if (filters?.course_id) {
      sql += ` AND course_id = $${paramIndex++}`;
      params.push(filters.course_id);
    }

    if (filters?.year_id) {
      sql += ` AND year_id = $${paramIndex++}`;
      params.push(filters.year_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  restore: async (id: number): Promise<void> => {
    const sql = `
      UPDATE users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = $1 AND status = 'archived'
    `;
    await query(sql, [id]);
  },

  permanentDelete: async (id: number): Promise<void> => {
    const sql = `DELETE FROM users WHERE id = $1`;
    await query(sql, [id]);
  },

  bulkArchive: async (ids: number[], archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = ANY($1::int[])
    `;
    await query(sql, [ids, archivedBy || null]);
  },

  bulkRestore: async (ids: number[]): Promise<void> => {
    const sql = `
      UPDATE users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = ANY($1::int[]) AND status = 'archived'
    `;
    await query(sql, [ids]);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const sql = `DELETE FROM users WHERE id = ANY($1::int[])`;
    await query(sql, [ids]);
  },

  updatePassword: async (id: number, hashedPassword: string): Promise<void> => {
    const sql = `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`;
    await query(sql, [hashedPassword, id]);
  },
};
