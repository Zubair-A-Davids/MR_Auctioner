import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    const sql = readFileSync(join(__dirname, 'add-last-seen.sql'), 'utf8');
    await query(sql);
    console.log('✅ Migration completed: last_seen column added to users table');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  }
}

runMigration();
