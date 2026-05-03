import { query } from '../db/index.js';
import { GuestEntity, CreateGuestRequest, UpdateGuestRequest } from '../types/guestEntity.js';

export const GuestModel = {
  findById: async (id: number): Promise<GuestEntity | null> => {
    const sql = `SELECT * FROM guests WHERE id = $1`;
    const { rows } = await query(sql, [id]);
    return rows[0] || null;
  },

  getAll: async (limit: number, offset: number, filters?: any): Promise<GuestEntity[]> => {
    let sql = `SELECT * FROM guests WHERE status = 'active'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.visit_date) {
      sql += ` AND visit_date = $${paramIndex++}`;
      params.push(filters.visit_date);
    }

    if (filters?.start_date && filters?.end_date) {
      sql += ` AND visit_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(filters.start_date, filters.end_date);
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${paramIndex++} OR purpose ILIKE $${paramIndex++})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ` ORDER BY visit_date DESC, id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getTotalCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM guests WHERE status = $1';
    const params: any[] = ['active'];
    let paramIndex = 2;

    if (filters?.visit_date) {
      sql += ` AND visit_date = $${paramIndex++}`;
      params.push(filters.visit_date);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  create: async (guestData: CreateGuestRequest): Promise<GuestEntity> => {
    const sql = `
      INSERT INTO guests (name, purpose, visit_date, address, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const { rows } = await query(sql, [
      guestData.name,
      guestData.purpose,
      guestData.visit_date,
      guestData.address || null,
      'active'
    ]);
    return rows[0];
  },

  update: async (id: number, guestData: UpdateGuestRequest): Promise<GuestEntity> => {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (guestData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(guestData.name);
    }
    if (guestData.purpose !== undefined) {
      fields.push(`purpose = $${paramIndex++}`);
      values.push(guestData.purpose);
    }
    if (guestData.visit_date !== undefined) {
      fields.push(`visit_date = $${paramIndex++}`);
      values.push(guestData.visit_date);
    }
    if (guestData.time_in !== undefined) {
      fields.push(`time_in = $${paramIndex++}`);
      values.push(guestData.time_in);
    }
    if (guestData.time_out !== undefined) {
      fields.push(`time_out = $${paramIndex++}`);
      values.push(guestData.time_out);
    }
    if (guestData.address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(guestData.address);
    }

    values.push(id);

    const sql = `UPDATE guests SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const { rows } = await query(sql, values);
    return rows[0];
  },

  delete: async (id: number, archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE guests 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = $1
    `;
    await query(sql, [id, archivedBy || null]);
  },

  search: async (searchQuery: string, limit: number = 10): Promise<GuestEntity[]> => {
    const sql = `
      SELECT * FROM guests
      WHERE status = 'active'
        AND (name ILIKE $1 OR purpose ILIKE $1)
      LIMIT $2
    `;
    const { rows } = await query(sql, [`%${searchQuery}%`, limit]);
    return rows;
  },

  getTodayGuests: async (): Promise<GuestEntity[]> => {
    const sql = `
      SELECT * FROM guests
      WHERE visit_date = CURRENT_DATE AND status = 'active'
      ORDER BY created_at DESC
    `;
    const { rows } = await query(sql);
    return rows;
  },

  // Archive-related functions
  getArchived: async (limit: number, offset: number, filters?: any): Promise<GuestEntity[]> => {
    let sql = `SELECT * FROM guests WHERE status = 'archived'`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.visit_date) {
      sql += ` AND visit_date = $${paramIndex++}`;
      params.push(filters.visit_date);
    }

    if (filters?.start_date && filters?.end_date) {
      sql += ` AND visit_date BETWEEN $${paramIndex++} AND $${paramIndex++}`;
      params.push(filters.start_date, filters.end_date);
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${paramIndex} OR purpose ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY archived_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    return rows;
  },

  getArchivedCount: async (filters?: any): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM guests WHERE status = $1';
    const params: any[] = ['archived'];
    let paramIndex = 2;

    if (filters?.visit_date) {
      sql += ` AND visit_date = $${paramIndex++}`;
      params.push(filters.visit_date);
    }

    const { rows } = await query(sql, params);
    return parseInt(rows[0].count, 10);
  },

  restore: async (id: number): Promise<void> => {
    const sql = `
      UPDATE guests 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = $1 AND status = 'archived'
    `;
    await query(sql, [id]);
  },

  permanentDelete: async (id: number): Promise<void> => {
    const sql = `DELETE FROM guests WHERE id = $1`;
    await query(sql, [id]);
  },

  bulkArchive: async (ids: number[], archivedBy?: number): Promise<void> => {
    const sql = `
      UPDATE guests 
      SET status = 'archived', archived_at = NOW(), archived_by = $2
      WHERE id = ANY($1::int[])
    `;
    await query(sql, [ids, archivedBy || null]);
  },

  bulkRestore: async (ids: number[]): Promise<void> => {
    const sql = `
      UPDATE guests 
      SET status = 'active', archived_at = NULL, archived_by = NULL
      WHERE id = ANY($1::int[]) AND status = 'archived'
    `;
    await query(sql, [ids]);
  },

  bulkDelete: async (ids: number[]): Promise<void> => {
    const sql = `DELETE FROM guests WHERE id = ANY($1::int[])`;
    await query(sql, [ids]);
  },
};
