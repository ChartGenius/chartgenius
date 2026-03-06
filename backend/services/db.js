/**
 * PostgreSQL Database Service
 * 
 * Supabase-backed connection pool.
 * All routes import this and call db.query() directly.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  // Suppress noisy per-connection logs in production
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] New PostgreSQL connection established');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(r => console.log(`[DB] ✅ PostgreSQL connected — server time: ${r.rows[0].now}`))
  .catch(e => console.error('[DB] ❌ PostgreSQL connection failed:', e.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
