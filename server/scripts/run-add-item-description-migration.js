import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('Running item description migration...');
    const sql = fs.readFileSync(path.join(__dirname, 'add-item-description-to-notifications.sql'), 'utf-8');
    await pool.query(sql);
    console.log('✓ Item description migration completed successfully');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  }
}

runMigration();
