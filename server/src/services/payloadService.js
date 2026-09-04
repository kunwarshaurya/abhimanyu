/**
 * payloadService.js — Orchestrates persisting a full AI/ML payload.
 *
 * Accepts a validated payload object matching the AI/ML JSON contract,
 * splits it into the appropriate tables, and inserts all records.
 *
 * This service is the single entry-point that route handlers (future)
 * will call — it keeps DB logic out of Express controllers.
 */

const repo = require('../db/repositories');

const DEFAULT_CONVEYOR_ID = 'CONV-01';

/**
 * Save an entire AI/ML payload to the database.
 *
 * @param {object} payload - The validated AI/ML JSON payload.
 * @returns {object} Summary of inserted record IDs.
 */
async function savePayload(payload) {
  const conveyorId = payload.conveyorId || DEFAULT_CONVEYOR_ID;
  const recordedAt = new Date(payload.timestamp);

  // Build an array of all insert promises
  const insertions = [];

  // 1. Sensor readings
  if (payload.sensorData) {
    insertions.push(
      repo.insertSensorReading(conveyorId, recordedAt, payload.sensorData)
    );
  }

  // 2. Vibration readings
  if (payload.vibration) {
    insertions.push(
      repo.insertVibrationReading(conveyorId, recordedAt, payload.vibration)
    );
  }

  // 3. Detection results
  if (payload.detection) {
    insertions.push(
      repo.insertDetection(conveyorId, recordedAt, payload.detection)
    );
  }

  // 4. Health assessment
  if (payload.health) {
    insertions.push(
      repo.insertHealthAssessment(conveyorId, recordedAt, payload.health)
    );
  }

  // 5. Alerts (array — one row per alert)
  if (Array.isArray(payload.alerts)) {
    for (const alert of payload.alerts) {
      insertions.push(
        repo.insertAlert(conveyorId, recordedAt, alert)
      );
    }
  }

  // Execute all inserts concurrently
  const results = await Promise.all(insertions);

  return {
    conveyorId,
    recordedAt,
    rowsInserted: results.reduce((sum, r) => sum + (r.affectedRows || 0), 0),
  };
}

module.exports = { savePayload };
