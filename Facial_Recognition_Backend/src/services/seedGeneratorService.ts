/**
 * SEED GENERATOR SERVICE
 * Automatically generates a SQL seed file from current database state.
 * Called after every user creation/deletion to keep seeds in sync.
 * Purpose: disaster recovery — if DB is wiped, run the seed to restore all users.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Output path: seeds/scripts/003_auto_users.sql
const SEED_FILE = path.resolve(__dirname, '../seeds/scripts/003_auto_users.sql');

export const SeedGeneratorService = {
  /**
   * Regenerate the full user seed file from current DB state.
   * Safe to call after every registration — it overwrites the file completely.
   */
  regenerate: async (): Promise<void> => {
    try {
      const lines: string[] = [
        '-- ============================================================',
        '-- AUTO-GENERATED USER SEED',
        `-- Generated: ${new Date().toISOString()}`,
        '-- DO NOT EDIT MANUALLY — regenerated on every user registration',
        '-- Run this file to restore all users after a database wipe.',
        '-- ============================================================',
        '',
        '-- Requires pgcrypto for password hashing',
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
        '',
      ];

      // ── College Users ──
      const college = await query(`
        SELECT first_name, middle_initial, last_name, name, email,
               contact_number, student_id, password, course_id, year_id,
               role, status
        FROM users
        WHERE status != 'deleted'
        ORDER BY id ASC
      `);

      if (college.rows.length > 0) {
        lines.push('-- College Users');
        for (const u of college.rows) {
          lines.push(
            `INSERT INTO users (first_name, middle_initial, last_name, name, email, contact_number, student_id, password, course_id, year_id, role, status, registered_at) VALUES (` +
            `${sq(u.first_name)}, ${sq(u.middle_initial)}, ${sq(u.last_name)}, ${sq(u.name)}, ` +
            `${sq(u.email)}, ${sq(u.contact_number)}, ${sq(u.student_id)}, ${sq(u.password)}, ` +
            `${n(u.course_id)}, ${n(u.year_id)}, ${sq(u.role || 'student')}, ${sq(u.status || 'active')}, NOW()) ` +
            `ON CONFLICT (student_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;`
          );
        }
        lines.push('');
      }

      // ── SHS Users ──
      const shs = await query(`
        SELECT first_name, middle_initial, last_name, name, email,
               contact_number, student_id, password, strand_id, grade_id,
               role, status
        FROM shs_users
        WHERE status != 'deleted'
        ORDER BY id ASC
      `);

      if (shs.rows.length > 0) {
        lines.push('-- SHS Users');
        for (const u of shs.rows) {
          lines.push(
            `INSERT INTO shs_users (first_name, middle_initial, last_name, name, email, contact_number, student_id, password, strand_id, grade_id, role, status, registered_at) VALUES (` +
            `${sq(u.first_name)}, ${sq(u.middle_initial)}, ${sq(u.last_name)}, ${sq(u.name)}, ` +
            `${sq(u.email)}, ${sq(u.contact_number)}, ${sq(u.student_id)}, ${sq(u.password)}, ` +
            `${n(u.strand_id)}, ${n(u.grade_id)}, ${sq(u.role || 'student')}, ${sq(u.status || 'active')}, NOW()) ` +
            `ON CONFLICT (student_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;`
          );
        }
        lines.push('');
      }

      // ── Faculty Users ──
      const faculty = await query(`
        SELECT first_name, middle_initial, last_name, name, email,
               contact_number, password, department_id, role, status
        FROM faculty_users
        WHERE status != 'deleted'
        ORDER BY id ASC
      `);

      if (faculty.rows.length > 0) {
        lines.push('-- Faculty Users');
        for (const u of faculty.rows) {
          lines.push(
            `INSERT INTO faculty_users (first_name, middle_initial, last_name, name, email, contact_number, password, department_id, role, status, registered_at) VALUES (` +
            `${sq(u.first_name)}, ${sq(u.middle_initial)}, ${sq(u.last_name)}, ${sq(u.name)}, ` +
            `${sq(u.email)}, ${sq(u.contact_number)}, ${sq(u.password)}, ` +
            `${n(u.department_id)}, ${sq(u.role || 'faculty')}, ${sq(u.status || 'active')}, NOW()) ` +
            `ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password;`
          );
        }
        lines.push('');
      }

      // ── Moderators ──
      const mods = await query(`
        SELECT username, email, password, role, status
        FROM moderators
        WHERE status != 'deleted'
        ORDER BY id ASC
      `);

      if (mods.rows.length > 0) {
        lines.push('-- Moderators');
        for (const u of mods.rows) {
          lines.push(
            `INSERT INTO moderators (username, email, password, role, status) VALUES (` +
            `${sq(u.username)}, ${sq(u.email)}, ${sq(u.password)}, ` +
            `${sq(u.role || 'moderator')}, ${sq(u.status || 'active')}) ` +
            `ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password;`
          );
        }
        lines.push('');
      }

      // Write to file
      fs.mkdirSync(path.dirname(SEED_FILE), { recursive: true });
      fs.writeFileSync(SEED_FILE, lines.join('\n'), 'utf8');

      console.log(`[SeedGenerator] ✓ Seed file updated: ${SEED_FILE} (${college.rows.length} college, ${shs.rows.length} SHS, ${faculty.rows.length} faculty, ${mods.rows.length} moderators)`);
    } catch (error) {
      // Non-fatal — log but don't crash the registration flow
      console.error('[SeedGenerator] Failed to regenerate seed file:', error);
    }
  },
};

/** Safely quote a string value for SQL, returns NULL for null/undefined */
function sq(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  // Escape single quotes by doubling them
  return `'${String(val).replace(/'/g, "''")}'`;
}

/** Numeric value or NULL */
function n(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  return String(val);
}
