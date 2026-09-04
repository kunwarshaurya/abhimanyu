/**
 * migrate.js — Run the schema SQL against the configured MySQL instance.
 *
 * Usage:  node src/db/migrate.js
 *
 * This script:
 *  1. Connects WITHOUT a database (so it can CREATE DATABASE).
 *  2. Runs schema.sql which creates the database and tables.
 *  3. Exits cleanly.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');

  // Connect WITHOUT specifying a database — schema.sql handles USE.
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('[Migrate] Running schema.sql …');
    await connection.query(sql);
    console.log('[Migrate] Schema applied successfully.');
  } catch (err) {
    console.error('[Migrate] Error applying schema:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
