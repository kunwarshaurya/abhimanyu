/**
 * historyRepository.js — MySQL queries for historical data.
 *
 * All queries accept a time range { from, to } (Date objects)
 * and a conveyorId (defaults to 'CONV-01').
 * Results ordered by recorded_at ASC, limited to 1000 rows.
 */

const { pool } = require('../config/db');

const MAX_ROWS = 1000;

// ── Sensor readings ──
async function getSensorHistory(from, to, conveyorId = 'CONV-01') {
  const sql = `
    SELECT recorded_at, temperature, voltage, current, power, distance, motor_speed
    FROM sensor_readings
    WHERE conveyor_id = ? AND recorded_at >= ? AND recorded_at <= ?
    ORDER BY recorded_at ASC
    LIMIT ${MAX_ROWS}
  `;
  const [rows] = await pool.query(sql, [conveyorId, from, to]);
  return rows;
}

// ── Vibration readings ──
async function getVibrationHistory(from, to, conveyorId = 'CONV-01') {
  const sql = `
    SELECT recorded_at, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z
    FROM vibration_readings
    WHERE conveyor_id = ? AND recorded_at >= ? AND recorded_at <= ?
    ORDER BY recorded_at ASC
    LIMIT ${MAX_ROWS}
  `;
  const [rows] = await pool.query(sql, [conveyorId, from, to]);
  return rows;
}

// ── Health assessments ──
async function getHealthHistory(from, to, conveyorId = 'CONV-01') {
  const sql = `
    SELECT recorded_at, score, ROUND(confidence * 100, 1) AS confidence, status
    FROM health_assessments
    WHERE conveyor_id = ? AND recorded_at >= ? AND recorded_at <= ?
    ORDER BY recorded_at ASC
    LIMIT ${MAX_ROWS}
  `;
  const [rows] = await pool.query(sql, [conveyorId, from, to]);
  return rows;
}

// ── Detections ──
async function getDetectionHistory(from, to, conveyorId = 'CONV-01') {
  const sql = `
    SELECT recorded_at, crack_detected
    FROM detections
    WHERE conveyor_id = ? AND recorded_at >= ? AND recorded_at <= ?
    ORDER BY recorded_at ASC
    LIMIT ${MAX_ROWS}
  `;
  const [rows] = await pool.query(sql, [conveyorId, from, to]);
  return rows;
}

// ── Alerts ──
async function getAlertHistory(from, to, conveyorId = 'CONV-01') {
  const sql = `
    SELECT recorded_at, alert_id, alert_time, message, damage_severity
    FROM alerts
    WHERE conveyor_id = ? AND recorded_at >= ? AND recorded_at <= ?
    ORDER BY recorded_at DESC
    LIMIT ${MAX_ROWS}
  `;
  const [rows] = await pool.query(sql, [conveyorId, from, to]);
  return rows;
}

module.exports = {
  getSensorHistory,
  getVibrationHistory,
  getHealthHistory,
  getDetectionHistory,
  getAlertHistory,
};
