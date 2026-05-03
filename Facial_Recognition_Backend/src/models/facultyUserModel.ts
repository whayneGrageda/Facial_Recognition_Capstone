import { query } from '../db/index.js';
import { FacultyUserEntity, CreateFacultyUserRequest, UpdateFacultyUserRequest } from '../types/facultyUserEntity.js';

export const FacultyUserModel = {
  findByEmail: async (email: string): Promise<FacultyUserEntity | null> => {
    const sql = `
      SELECT f.*, d.department_name
      FROM faculty_users f
      LEFT JOIN faculty_department d ON f.department_id = d.id
      WHERE f.email = $1 AND f.status = 'active'
    `;
    const { rows } = await query(sql, [email]);
    return rows[0] || null;
  },

  findById: async (id: number): Promise<FacultyUserEntity | null> => {
    const sql = `
      SELECT f.*, d.department_name
      FROM faculty_users f
      LEFT JOIN faculty_department d ON f.department_id = d.id
      WHERE f.id = $1
    `;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  // Removed findByEmployeeId - employee_id column doesn't exist in faculty_users table

  getAll: async (limit: number, offset: number, filters?: any): Promise<FacultyUserEntity[]> => {
    let sql = `
      SELECT f.*, d.department_name
      FROM faculty_users f
      LEFT JOIN faculty_department d ON f.department_id = d.id
      WHERE f.status = 'active'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.department_id) {
      sql += ` AND f.department_id = $${paramIndex++}`;
      params.push(filters.department_id);
    }

    if (filters?.search) {
      sql += ` AND (f.name ILIKE $${paramIndex} OR f.email ILIKE $${paramIndex})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm);
      paramIndex++;
    }

    sql += ` ORDER BY f.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM faculty_users WHERE status = $1';
    const params: any[] = ['active'];
    let paramIndex = 2;

    if (filters?.department_id) {
      sql += ` AND department_id = $${paramIndex++}`;
      params.push(filters.department_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  create: async (userData: CreateFacultyUserRequest): Promise<FacultyUserEntity> => {
    const sql = `
      INSERT INTO faculty_users (
        first_name, middle_initial, last_name, name, email, contact_number,
        password, department_id, role, status, registered_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
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
      userData.password,
      userData.department_id || null,
      userData.role || 'professor',
      'active'
    ]);
    return rows[0];
  },

  update: async (id: number, userData: UpdateFacultyUserRequest): Promise<FacultyUserEntity> => {
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
    if (userData.department_id !== undefined) {
      fields.push(`department_id = $${paramIndex++}`);
      values.push(userData.department_id);
    }
    if (userData.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(userData.password);
    }

    if (userData.first_name || userData.last_name) {
      const user = await FacultyUserModel.findById(id);
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

    const sql = `UPDATE faculty_users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  },

  delete: async (id: number, archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE faculty_users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = $1
    `;
    await query(sql, [id, archivedBy || null]);
  },

  search: async (searchQuery: string, limit: number = 10): Promise<FacultyUserEntity[]> => {
    const sql = `
      SELECT f.*, d.department_name
      FROM faculty_users f
      LEFT JOIN faculty_department d ON f.department_id = d.id
      WHERE f.status = 'active'
        AND (f.name ILIKE $1 OR f.email ILIKE $1)
      LIMIT $2
    `;
    const { rows } = await query(sql, [`%${searchQuery}%`, limit]);
    return rows;
  },

  // Archive-related functions
  getArchived: async (limit: number, offset: number, filters?: any): Promise<FacultyUserEntity[]> => {
    let sql = `
      SELECT f.*, d.department_name
      FROM faculty_users f
      LEFT JOIN faculty_department d ON f.department_id = d.id
      WHERE f.status = 'archived'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.department_id) {
      sql += ` AND f.department_id = $${paramIndex++}`;
      params.push(filters.department_id);
    }

    if (filters?.search) {
      sql += ` AND (f.name ILIKE $${paramIndex} OR f.email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY f.archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getArchivedCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM faculty_users WHERE status = $1';
    const params: any[] = ['archived'];
    let paramIndex = 2;

    if (filters?.department_id) {
      sql += ` AND department_id = $${paramIndex++}`;
      params.push(filters.department_id);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  restore: async (id: number): Promise<void> => {
    const sql = `
      UPDATE faculty_users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = $1 AND status = 'archived'
    `;
    await query(sql, [id]);
  },

  permanentDelete: async (id: number): Promise<void> => {
    const sql = `DELETE FROM faculty_users WHERE id = $1`;
    await query(sql, [id]);
  },

  bulkArchive: async (ids: number[], archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE faculty_users 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = ANY($1::int[])
    `;
    await query(sql, [ids, archivedBy || null]);
  },

  bulkRestore: async (ids: number[]): Promise<void> => {
    const sql = `
      UPDATE faculty_users 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = ANY($1::int[]) AND status = 'archived'
    `;
    await query(sql, [ids]);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const sql = `DELETE FROM faculty_users WHERE id = ANY($1::int[])`;
    await query(sql, [ids]);
  },

  updatePassword: async (id: number, hashedPassword: string): Promise<void> => {
    const sql = `UPDATE faculty_users SET password = $1 WHERE id = $2`;
    await query(sql, [hashedPassword, id]);
  },
};
