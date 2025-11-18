import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

async function createAdmin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Prompt for admin details (you'll enter these when running the script)
    console.log('Create Admin Account');
    console.log('===================\n');
    
    // You can change these values when you run the script:
    const email = process.argv[2];
    const password = process.argv[3];
    const displayName = process.argv[4] || 'Admin';

    if (!email || !password) {
      console.log('Usage: node scripts/create-admin.js <email> <password> [displayName]');
      console.log('Example: node scripts/create-admin.js admin@example.com MySecurePass123 "Site Admin"');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id, is_admin FROM users WHERE email = $1', [email.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      // User exists, just make them admin
      await pool.query('UPDATE users SET is_admin = true WHERE email = $1', [email.toLowerCase()]);
      console.log(`✅ User ${email} is now an admin!`);
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (email, password_hash, display_name, is_admin) VALUES ($1, $2, $3, true)',
        [email.toLowerCase(), passwordHash, displayName]
      );
      console.log(`✅ Admin account created successfully!`);
      console.log(`   Email: ${email}`);
      console.log(`   Display Name: ${displayName}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create admin:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();
