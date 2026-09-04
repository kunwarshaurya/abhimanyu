/**
 * repositories.js — Data-access functions for all conveyor tables.
 *
 * Each function accepts pre-parsed parameters, executes a single INSERT,
 * and returns the mysql2 result object.
 *
 * These functions are called by payloadService — they should NOT contain
 * any Express/HTTP/Socket logic.
 */

const { pool } = require('../config/db');

// ── Sensor Readings ──────────────────────────────────────────

async function insertSensorReading(conveyorId, recordedAt, data) {
  const sql = `
    INSERT INTO sensor_readings
      (conveyor_id, recorded_at, temperature, voltage, current, power, distance, motor_speed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    conveyorId,
    recordedAt,
    data.temperature ?? null,
    data.voltage ?? null,
    data.current ?? null,
    data.power ?? null,
    data.distance ?? null,
    data.motorSpeed ?? null,
  ];
  const [result] = await pool.execute(sql, params);
  return result;
}

// ── Vibration Readings ───────────────────────────────────────

async function insertVibrationReading(conveyorId, recordedAt, data) {
  const sql = `
    INSERT INTO vibration_readings
      (conveyor_id, recorded_at, acc_x, acc_y, acc_z, gyro_x, gyro_y, gyro_z)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    conveyorId,
    recordedAt,
    data.accX ?? null,
    data.accY ?? null,
    data.accZ ?? null,
    data.gyroX ?? null,
    data.gyroY ?? null,
    data.gyroZ ?? null,
  ];
  const [result] = await pool.execute(sql, params);
  return result;
}

// ── Detection Results ────────────────────────────────────────

async function insertDetection(conveyorId, recordedAt, data) {
  const sql = `
    INSERT INTO detections
      (conveyor_id, recorded_at, crack_detected, joint_detected)
    VALUES (?, ?, ?, ?)
  `;
  const params = [
    conveyorId,
    recordedAt,
    data.crackDetected ? 1 : 0,
    data.jointDetected ? 1 : 0,
  ];
  const [result] = await pool.execute(sql, params);
  return result;
}

// ── Health Assessments ───────────────────────────────────────

async function insertHealthAssessment(conveyorId, recordedAt, data) {
  const sql = `
    INSERT INTO health_assessments
      (conveyor_id, recorded_at, score, confidence, status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    conveyorId,
    recordedAt,
    data.score ?? null,
    data.confidence ?? null,
    data.status ?? null,
  ];
  const [result] = await pool.execute(sql, params);
  return result;
}

// ── Alerts ───────────────────────────────────────────────────

async function insertAlert(conveyorId, recordedAt, alert) {
  const sql = `
    INSERT INTO alerts
      (conveyor_id, recorded_at, alert_id, alert_time, message, damage_severity)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    conveyorId,
    recordedAt,
    alert.id ?? null,
    alert.time ? new Date(alert.time) : null,
    alert.message ?? null,
    alert.damageSeverity ?? null,
  ];
  const [result] = await pool.execute(sql, params);
  return result;
}

module.exports = {
  insertSensorReading,
  insertVibrationReading,
  insertDetection,
  insertHealthAssessment,
  insertAlert,
};
