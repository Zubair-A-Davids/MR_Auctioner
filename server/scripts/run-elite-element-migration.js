import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mr_auctioner'
});

async function migrate() {
  const sql = readFileSync(join(__dirname, 'add-elite-element.sql'), 'utf-8');
  try {
    await pool.query(sql);
    console.log('✅ Elite and Element columns added successfully');
  } catch (e) {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
