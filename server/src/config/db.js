const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'abhimanyu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Verify that the database is reachable.
 * Logs success or failure but does NOT throw — the server
 * should still start even if MySQL is temporarily unavailable.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('[DB] MySQL connected successfully');
    connection.release();
    return true;
  } catch (err) {
    console.error('[DB] MySQL connection failed:', err.message);
    return false;
  }
}

module.exports = { pool, testConnection };
