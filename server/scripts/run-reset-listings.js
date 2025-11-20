import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runReset() {
  const client = await pool.connect();
  
  try {
    console.log('Starting reset of all listings and items sold...\n');
    
    // Count current records
    const itemsCount = await client.query('SELECT COUNT(*) FROM items');
    const itemsSoldCount = await client.query('SELECT COUNT(*) FROM items_sold');
    
    console.log(`Current active listings: ${itemsCount.rows[0].count}`);
    console.log(`Current sold items: ${itemsSoldCount.rows[0].count}\n`);
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'reset-listings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✓ Successfully deleted all active listings');
    console.log('✓ Successfully reset items sold history\n');
    
    // Verify deletion
    const finalItemsCount = await client.query('SELECT COUNT(*) FROM items');
    const finalItemsSoldCount = await client.query('SELECT COUNT(*) FROM items_sold');
    
    console.log(`Remaining active listings: ${finalItemsCount.rows[0].count}`);
    console.log(`Remaining sold items: ${finalItemsSoldCount.rows[0].count}`);
    
    console.log('\n✓ Reset completed successfully!');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during reset:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runReset().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
