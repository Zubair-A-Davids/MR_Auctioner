import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('Running warnings table migration...');
    const sql = readFileSync(join(__dirname, 'create-warnings-table.sql'), 'utf8');
    await query(sql);
    console.log('✓ Warnings table migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
