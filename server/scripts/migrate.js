import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import { query } from '../src/db.js';

dotenv.config();

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  console.log('Running migrations...');
  await query(sql);
  console.log('Migrations completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
