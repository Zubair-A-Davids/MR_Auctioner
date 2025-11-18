import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const migrationSQL = readFileSync(join(__dirname, 'add-profile-fields.sql'), 'utf8');
    console.log('Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    console.log('New columns added to users table:');
    console.log('  - discord');
    console.log('  - bio');
    console.log('  - avatar');
    console.log('  - is_admin');
    console.log('  - is_mod');
    console.log('  - banned_until');
    console.log('  - banned_reason');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
