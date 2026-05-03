import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * DATABASE SEEDING ENGINE
 * @description Automates the population of initial reference data into PostgreSQL.
 */
export const runSeeds = async (): Promise<void> => {
  const seedsDir = path.join(__dirname, 'scripts');
  
  if (!fs.existsSync(seedsDir)) {
    console.warn('⚠️ Seeds directory not found, skipping...');
    return;
  }

  const files = fs.readdirSync(seedsDir).sort();

  console.log('--- Seeding Initial Data ---');

  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(seedsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await query(sql);
        console.log(`🌱 Seeded: ${file}`);
      } catch (error: any) {
        // Check if error is "already exists" or duplicate key - these are safe to ignore
        const isDuplicateError = 
          error.code === '23505' || // unique violation
          error.code === '23503' || // foreign key violation
          error.message?.includes('duplicate key') ||
          error.message?.includes('already exists');

        if (isDuplicateError) {
          console.log(`🌱 Seeded: ${file} (already exists)`);
        } else {
          // Log actual errors
          console.error(`❌ Seeding failed at ${file}:`, error.message);
        }
      }
    }
  }
  console.log('--- All Database Seeds Completed ---');
};
