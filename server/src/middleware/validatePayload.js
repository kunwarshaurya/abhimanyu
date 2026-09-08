/**
 * validatePayload.js — Validates incoming AI/ML JSON payloads.
 *
 * Returns an array of error strings. Empty array = valid payload.
 * No external validation library — simple, readable, hackathon-friendly.
 */

/**
 * Validate a full AI/ML conveyor-data payload.
 * @param {any} body - The parsed JSON body from the request.
 * @returns {string[]} Array of validation error messages (empty = valid).
 */
function validatePayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Request body must be a JSON object'];
  }

  // --- timestamp ---
  if (!body.timestamp) {
    errors.push('Missing required field: timestamp');
  } else if (typeof body.timestamp !== 'string' || isNaN(Date.parse(body.timestamp))) {
    errors.push('timestamp must be a valid ISO 8601 date string');
  }

  // --- sensorData ---
  if (!body.sensorData) {
    errors.push('Missing required field: sensorData');
  } else if (typeof body.sensorData !== 'object') {
    errors.push('sensorData must be an object');
  } else {
    const sensorFields = ['temperature', 'voltage', 'current', 'power', 'distance', 'motorSpeed'];
    for (const field of sensorFields) {
      if (body.sensorData[field] === undefined || body.sensorData[field] === null) {
        errors.push(`sensorData.${field} is required`);
      } else if (typeof body.sensorData[field] !== 'number') {
        errors.push(`sensorData.${field} must be a number`);
      }
    }
  }

  // --- vibration ---
  if (!body.vibration) {
    errors.push('Missing required field: vibration');
  } else if (typeof body.vibration !== 'object') {
    errors.push('vibration must be an object');
  } else {
    const vibFields = ['accX', 'accY', 'accZ', 'gyroX', 'gyroY', 'gyroZ'];
    for (const field of vibFields) {
      if (body.vibration[field] === undefined || body.vibration[field] === null) {
        errors.push(`vibration.${field} is required`);
      } else if (typeof body.vibration[field] !== 'number') {
        errors.push(`vibration.${field} must be a number`);
      }
    }
  }

  // --- detection ---
  if (!body.detection) {
    errors.push('Missing required field: detection');
  } else if (typeof body.detection !== 'object') {
    errors.push('detection must be an object');
  } else {
    if (typeof body.detection.crackDetected !== 'boolean') {
      errors.push('detection.crackDetected must be a boolean');
    }
  }

  // --- health ---
  if (!body.health) {
    errors.push('Missing required field: health');
  } else if (typeof body.health !== 'object') {
    errors.push('health must be an object');
  } else {
    if (typeof body.health.score !== 'number') {
      errors.push('health.score must be a number');
    }
    if (typeof body.health.confidence !== 'number') {
      errors.push('health.confidence must be a number');
    }
    if (typeof body.health.status !== 'string' || body.health.status.trim() === '') {
      errors.push('health.status must be a non-empty string');
    }
  }

  // --- alerts ---
  if (!body.alerts) {
    errors.push('Missing required field: alerts');
  } else if (!Array.isArray(body.alerts)) {
    errors.push('alerts must be an array');
  } else {
    body.alerts.forEach((alert, i) => {
      if (typeof alert !== 'object' || alert === null) {
        errors.push(`alerts[${i}] must be an object`);
        return;
      }
      if (typeof alert.id !== 'number') {
        errors.push(`alerts[${i}].id must be a number`);
      }
      if (typeof alert.time !== 'string') {
        errors.push(`alerts[${i}].time must be a string`);
      }
      if (typeof alert.message !== 'string') {
        errors.push(`alerts[${i}].message must be a string`);
      }
      if (typeof alert.damageSeverity !== 'string') {
        errors.push(`alerts[${i}].damageSeverity must be a string`);
      }
    });
  }

  return errors;
}

module.exports = { validatePayload };
