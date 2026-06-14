/**
 * ============================================================================
 * DATABASE CONNECTION POOL
 * ============================================================================
 * 
 * PostgreSQL connection pool using the `pg` package.
 * Provides a reusable query helper with automatic connection management,
 * error handling, and connection pooling for optimal performance.
 * 
 * Usage:
 *   import { query, pool } from '@/lib/db';
 *   const result = await query('SELECT * FROM payments WHERE id = $1', [id]);
 * ============================================================================
 */

import { Pool } from 'pg';

// ---------------------------------------------------------------------------
// Connection Configuration
// ---------------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres';

const pool = new Pool({
  connectionString,

  // Pool sizing – keep a handful of idle connections ready
  max: 20,                    // Maximum connections in the pool
  min: 2,                     // Minimum idle connections
  idleTimeoutMillis: 30_000,  // Close idle connections after 30 s
  connectionTimeoutMillis: 10_000, // Fail if a connection takes > 10 s

  // Prevent stale connections
  allowExitOnIdle: true,
});

// ---------------------------------------------------------------------------
// Connection lifecycle logging (non-fatal, helps with debugging)
// ---------------------------------------------------------------------------
pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
  // Don't crash – the pool will attempt to reconnect automatically
});

pool.on('remove', () => {
  console.log('[DB] Client removed from pool');
});

// ---------------------------------------------------------------------------
// Query helper
// ---------------------------------------------------------------------------
/**
 * Execute a parameterised SQL query against the pool.
 *
 * @param {string}   text   - SQL statement (use $1, $2 … for params)
 * @param {any[]}    params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 *
 * @example
 *   const { rows } = await query('SELECT * FROM students WHERE hall = $1', ['LLR']);
 */
async function query(text, params) {
  const start = Date.now();

  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    // Log slow queries (> 500 ms) for performance monitoring
    if (duration > 500) {
      console.warn(`[DB] Slow query (${duration}ms):`, text);
    }

    return result;
  } catch (error) {
    console.error('[DB] Query error:', {
      message: error.message,
      query: text,
      params,
    });
    throw error; // Re-throw so callers can handle
  }
}

// ---------------------------------------------------------------------------
// Transaction helper
// ---------------------------------------------------------------------------
/**
 * Run a series of queries inside a single transaction.
 *
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 * @returns {Promise<any>} - Whatever the callback returns
 *
 * @example
 *   const result = await transaction(async (client) => {
 *     await client.query('UPDATE accounts SET balance = balance - $1', [100]);
 *     await client.query('INSERT INTO ledger (amount) VALUES ($1)', [100]);
 *     return { success: true };
 *   });
 */
async function transaction(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DB] Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Health-check helper (useful for /api/health endpoints)
// ---------------------------------------------------------------------------
async function healthCheck() {
  try {
    const { rows } = await query('SELECT NOW() as now');
    return { ok: true, timestamp: rows[0].now };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { pool, query, transaction, healthCheck };
export default { pool, query, transaction, healthCheck };
