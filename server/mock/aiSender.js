/**
 * Mock AI/ML Sender
 *
 * Simulates the AI/ML system by sending one JSON payload per second
 * to POST /api/v1/conveyor-data.
 *
 * Usage:  node mock/aiSender.js
 *
 * This file is DEVELOPMENT ONLY and must not be imported by production code.
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const ENDPOINT = `${API_URL}/api/v1/conveyor-data`;
const INTERVAL_MS = 1000;

// ── Helpers ─────────────────────────────────────────────────

let tickCount = 0;
let alertIdCounter = 1;

/** Random float between min and max, rounded to dp decimal places. */
function rand(min, max, dp = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}

/** Pick a random item from an array. */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Payload Generator ───────────────────────────────────────

function generatePayload() {
  tickCount++;

  const now = new Date().toISOString();

  // Decide scenario: ~80% normal, ~12% warning, ~8% critical
  const roll = Math.random();
  let scenario = 'normal';
  if (roll > 0.92) scenario = 'critical';
  else if (roll > 0.80) scenario = 'warning';

  // --- Sensor data ---
  let temperature, motorSpeed, voltage, current, power;

  if (scenario === 'normal') {
    temperature = rand(28, 40);
    motorSpeed = rand(60, 80);
    voltage = rand(11.5, 12.5);
    current = rand(0.6, 1.0, 3);
  } else if (scenario === 'warning') {
    temperature = rand(45, 60);
    motorSpeed = rand(40, 60);
    voltage = rand(10.5, 11.5);
    current = rand(1.0, 1.5, 3);
  } else {
    temperature = rand(65, 85);
    motorSpeed = rand(10, 35);
    voltage = rand(9.0, 10.5);
    current = rand(1.5, 2.5, 3);
  }

  power = parseFloat((voltage * current).toFixed(2));

  const sensorData = {
    temperature,
    voltage,
    current,
    power,
    distance: rand(0, 5),
    motorSpeed,
  };

  // --- Vibration data ---
  const vibBase = scenario === 'normal' ? 0.1 : scenario === 'warning' ? 0.5 : 1.5;
  const vibration = {
    accX: rand(-vibBase, vibBase, 4),
    accY: rand(-vibBase, vibBase, 4),
    accZ: rand(9.5, 10.1, 4),
    gyroX: rand(-vibBase * 3, vibBase * 3, 4),
    gyroY: rand(-vibBase * 3, vibBase * 3, 4),
    gyroZ: rand(-vibBase * 3, vibBase * 3, 4),
  };

  // --- Detection ---
  const crackDetected = scenario === 'critical' && Math.random() > 0.4;
  const jointDetected = Math.random() > 0.85;
  const detection = { crackDetected, jointDetected };

  // --- Health ---
  let score, confidence, status;
  if (scenario === 'normal') {
    score = rand(85, 100);
    confidence = rand(0.90, 0.99, 3);
    status = 'Healthy';
  } else if (scenario === 'warning') {
    score = rand(50, 84);
    confidence = rand(0.75, 0.92, 3);
    status = 'Warning';
  } else {
    score = rand(10, 49);
    confidence = rand(0.60, 0.85, 3);
    status = 'Critical';
  }
  const health = { score, confidence, status };

  // --- Alerts ---
  const alerts = [];
  if (scenario === 'normal') {
    alerts.push({
      id: alertIdCounter++,
      time: now,
      message: 'No active alerts',
      damageSeverity: 'Low',
    });
  } else if (scenario === 'warning') {
    alerts.push({
      id: alertIdCounter++,
      time: now,
      message: pick([
        'Elevated temperature detected',
        'Unusual vibration pattern',
        'Motor speed below optimal range',
      ]),
      damageSeverity: 'Medium',
    });
  } else {
    alerts.push({
      id: alertIdCounter++,
      time: now,
      message: pick([
        'Belt crack detected — inspection required',
        'Critical vibration level — stop conveyor',
        'Overheating — immediate attention needed',
      ]),
      damageSeverity: 'High',
    });
    if (crackDetected) {
      alerts.push({
        id: alertIdCounter++,
        time: now,
        message: 'Visual crack confirmed by camera',
        damageSeverity: 'High',
      });
    }
  }

  return {
    timestamp: now,
    sensorData,
    vibration,
    detection,
    health,
    alerts,
  };
}

// ── Sender Loop ─────────────────────────────────────────────

async function sendPayload() {
  const payload = generatePayload();
  const label = `[Tick ${tickCount}] ${payload.health.status}`;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      console.log(`${label} → ${res.status} (${data.data.rowsInserted} rows)`);
    } else {
      console.warn(`${label} → ${res.status}:`, data.error, data.details || '');
    }
  } catch (err) {
    console.error(`${label} → SEND FAILED:`, err.message);
  }
}

// Start
console.log(`[MockAI] Sending to ${ENDPOINT} every ${INTERVAL_MS}ms`);
console.log('[MockAI] Press Ctrl+C to stop\n');

// Send first payload immediately, then every INTERVAL_MS
sendPayload();
const timer = setInterval(sendPayload, INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(timer);
  console.log('\n[MockAI] Stopped');
  process.exit(0);
});
