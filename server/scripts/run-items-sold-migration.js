import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'create-items-sold-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('Running items_sold table migration...');
    await query(sql);
    console.log('✓ items_sold table created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
