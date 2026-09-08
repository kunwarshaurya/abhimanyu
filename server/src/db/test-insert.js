/**
 * test-insert.js — Verify the database layer by inserting a sample payload
 * and querying back the results.
 *
 * Usage:  node src/db/test-insert.js
 *
 * Prerequisites:
 *  1. MySQL running with correct credentials in .env
 *  2. Migration applied (node src/db/migrate.js)
 */

require('dotenv').config();

const { pool } = require('../config/db');
const { savePayload } = require('../services/payloadService');

// The exact sample payload from the AI/ML contract
const samplePayload = {
  timestamp: '2026-09-03T10:15:20Z',

  sensorData: {
    temperature: 31.5,
    voltage: 12.1,
    current: 0.82,
    power: 9.9,
    distance: 0.0,
    motorSpeed: 70,
  },

  vibration: {
    accX: 0.12,
    accY: -0.03,
    accZ: 9.81,
    gyroX: 0.42,
    gyroY: 0.18,
    gyroZ: 0.25,
  },

  detection: {
    crackDetected: false,
  },

  health: {
    score: 100,
    confidence: 0.98,
    status: 'Healthy',
  },

  alerts: [
    {
      id: 1,
      time: '2026-09-03T10:15:20Z',
      message: 'No active alerts',
      damageSeverity: 'Low',
    },
  ],
};

async function run() {
  console.log('=== Phase 2 — Database Layer Test ===\n');

  // 1. Test insert
  console.log('[1] Inserting sample payload …');
  try {
    const result = await savePayload(samplePayload);
    console.log('    ✅ Insert succeeded:', result);
  } catch (err) {
    console.error('    ❌ Insert failed:', err.message);
    process.exit(1);
  }

  // 2. Verify records
  console.log('\n[2] Verifying records …\n');

  const tables = [
    'sensor_readings',
    'vibration_readings',
    'detections',
    'health_assessments',
    'alerts',
  ];

  for (const table of tables) {
    const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1`);
    if (rows.length > 0) {
      console.log(`    ✅ ${table}: found record (id=${rows[0].id})`);
    } else {
      console.log(`    ❌ ${table}: no records found`);
    }
  }

  // 3. Test error handling — insert with bad data
  console.log('\n[3] Testing error handling (bad timestamp) …');
  try {
    await savePayload({ timestamp: 'not-a-date', sensorData: { temperature: 1 } });
    console.log('    ⚠️  No error thrown (MySQL may accept the value)');
  } catch (err) {
    console.log('    ✅ Error caught gracefully:', err.message);
  }

  // 4. Test error handling — missing table (simulate by querying non-existent table)
  console.log('\n[4] Testing error handling (bad query) …');
  try {
    await pool.query('SELECT * FROM non_existent_table');
    console.log('    ⚠️  No error thrown');
  } catch (err) {
    console.log('    ✅ Error caught gracefully:', err.message);
  }

  console.log('\n=== Test complete ===');
  await pool.end();
}

run();
