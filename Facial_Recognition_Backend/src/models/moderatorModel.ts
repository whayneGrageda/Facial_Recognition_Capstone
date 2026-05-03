import { query } from '../db/index.js';
import { ModeratorEntity, CreateModeratorRequest, UpdateModeratorRequest } from '../types/moderatorEntity.js';

export const ModeratorModel = {
  findByUsername: async (username: string): Promise<ModeratorEntity | null> => {
    const sql = `SELECT * FROM moderators WHERE username = $1 AND status = 'active'`;
    const { rows } = await query(sql, [username]);
    return rows[0] || null;
  },

  findById: async (id: number): Promise<ModeratorEntity | null> => {
    const sql = `SELECT * FROM moderators WHERE id = $1`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  getAll: async (limit: number, offset: number): Promise<ModeratorEntity[]> => {
    const sql = `
      SELECT * FROM moderators
      WHERE status = 'active'
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await query(sql, [limit, offset]);
    return rows;
  },

  getTotalCount: async (): Promise<number> => {
    const sql = 'SELECT COUNT(*) as count FROM moderators WHERE status = $1';
    const { rows } = await query(sql, ['active']);
    return parseInt(rows[0].count, 10);
  },

  create: async (moderatorData: CreateModeratorRequest): Promise<ModeratorEntity> => {
    const sql = `
      INSERT INTO moderators (username, email, password, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const { rows } = await query(sql, [
      moderatorData.username,
      moderatorData.email || null,
      moderatorData.password,
      moderatorData.role || 'moderator',
      'active'
    ]);
    return rows[0];
  },

  update: async (id: number, moderatorData: UpdateModeratorRequest): Promise<ModeratorEntity> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (moderatorData.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(moderatorData.username);
    }
    if (moderatorData.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(moderatorData.email);
    }
    if (moderatorData.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(moderatorData.password);
    }

    values.push(id);

    const sql = `UPDATE moderators SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  },

  delete: async (id: number, archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE moderators 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = $1
    `;
    await query(sql, [id, archivedBy || null]);
  },

  // Archive-related functions
  getArchived: async (limit: number, offset: number, filters?: any): Promise<ModeratorEntity[]> => {
    let sql = `SELECT * FROM moderators WHERE status = 'archived'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.search) {
      sql += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getArchivedCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM moderators WHERE status = $1';
    const params: any[] = ['archived'];

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  restore: async (id: number): Promise<void> => {
    const sql = `
      UPDATE moderators 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = $1 AND status = 'archived'
    `;
    await query(sql, [id]);
  },

  permanentDelete: async (id: number): Promise<void> => {
    const sql = `DELETE FROM moderators WHERE id = $1`;
    await query(sql, [id]);
  },

  bulkArchive: async (ids: number[], archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE moderators 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = ANY($1::int[])
    `;
    await query(sql, [ids, archivedBy || null]);
  },

  bulkRestore: async (ids: number[]): Promise<void> => {
    const sql = `
      UPDATE moderators 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = ANY($1::int[]) AND status = 'archived'
    `;
    await query(sql, [ids]);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const sql = `DELETE FROM moderators WHERE id = ANY($1::int[])`;
    await query(sql, [ids]);
  },
};
