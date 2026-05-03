import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * MODULAR MIGRATION RUNNER
 * @description Automatically executes SQL scripts in /scripts to keep the DB schema in sync.
 */
export const runMigrations = async (): Promise<void> => {
  const migrationsDir = path.join(__dirname, 'scripts');
  
  if (!fs.existsSync(migrationsDir)) {
    console.warn('⚠️ Migrations directory not found, skipping...');
    return;
  }

  const files = fs.readdirSync(migrationsDir).sort();

  console.log('--- Running Database Migrations ---');

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await query(sql);
        console.log(`✅ Migration Executed: ${file}`);
      } catch (error: any) {
        // Check if error is "already exists" type - these are safe to ignore
        const isAlreadyExistsError = 
          error.code === '42P07' || // relation already exists
          error.code === '42710' || // type already exists
          error.code === '42723' || // function already exists
          error.code === '42P06' || // schema already exists
          error.message?.includes('already exists');

        if (isAlreadyExistsError) {
          console.log(`✅ Migration Executed: ${file} (already exists)`);
        } else {
          // Log actual errors
          console.error(`❌ Migration failed at ${file}:`, error.message);
        }
      }
    }
  }
  console.log('--- All Database Migrations Completed ---');
};
