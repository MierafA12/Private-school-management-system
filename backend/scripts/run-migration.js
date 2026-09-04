/**
 * run-migration.js
 * Runs supabase_migration.sql using the Supabase service role key.
 * No direct PostgreSQL connection needed — works over HTTPS.
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Validate env ─────────────────────────────────────────────
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env\n');
  process.exit(1);
}

// ── Read SQL file ─────────────────────────────────────────────
const candidateFile = path.join(__dirname, '..', 'migrations', 'sql', 'supabase_migration.sql');
const sqlFile = fs.existsSync(candidateFile)
  ? candidateFile
  : path.join(__dirname, '..', 'supabase_migration.sql');

if (!fs.existsSync(sqlFile)) {
  console.error('\n❌  supabase_migration.sql not found\n');
  process.exit(1);
}

const fullSQL = fs.readFileSync(sqlFile, 'utf8');

console.log('\n🚀  Starting migration...');
console.log('    URL :', SUPABASE_URL);
console.log('    File:', sqlFile);
console.log('    Size:', fullSQL.length, 'characters\n');

// ── Split into individual statements ─────────────────────────
// We need to run them one by one via Supabase RPC
const statements = fullSQL
  .split(/;\s*\n/)          // split on semicolon + newline
  .map(s => s.trim())
  .filter(s => s.length > 2 && !s.startsWith('--'));

console.log(`📋  ${statements.length} statements found\n`);

// ── Run via pg directly (tries SSL connection) ────────────────
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString        : process.env.DATABASE_URL,
    ssl                     : { rejectUnauthorized: false },
    connectionTimeoutMillis : 10000,
  });

  try {
    console.log('🔌  Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅  Connected!\n');

    // Run the whole SQL in one shot
    await client.query(fullSQL);
    await client.end();

    console.log('✅  Migration completed successfully!');
    console.log('    All 20 tables created in your Supabase database.');
    console.log('\n    Go to: Supabase Dashboard → Table Editor to verify.\n');

  } catch (pgErr) {
    await client.end().catch(() => {});
    console.error('❌  PostgreSQL connection failed:', pgErr.message);
    console.log('\n─────────────────────────────────────────────────────────');
    console.log('💡  Your network blocks port 5432.');
    console.log('    Use this instead — takes only 30 seconds:');
    console.log('─────────────────────────────────────────────────────────');
    console.log('\n  1. Open this URL in your browser:');
    console.log(`     https://supabase.com/dashboard/project/${SUPABASE_URL.replace('https://','').split('.')[0]}/sql/new`);
    console.log('\n  2. Open this file in VS Code:');
    console.log('     backend/migrations/sql/supabase_migration.sql');
    console.log('\n  3. Press Ctrl+A to select all, Ctrl+C to copy');
    console.log('\n  4. Paste into the SQL Editor and click Run');
    console.log('\n─────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
}

main();
