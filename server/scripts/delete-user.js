import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

async function deleteUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const email = process.argv[2];

    if (!email) {
      console.log('Usage: node scripts/delete-user.js <email>');
      console.log('Example: node scripts/delete-user.js admin@example.com');
      process.exit(1);
    }

    const result = await pool.query('DELETE FROM users WHERE email = $1 RETURNING email', [email.toLowerCase()]);
    
    if (result.rows.length > 0) {
      console.log(`✅ User ${email} has been deleted!`);
    } else {
      console.log(`❌ User ${email} not found.`);
    }
    
  } catch (error) {
    console.error('❌ Failed to delete user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteUser();
