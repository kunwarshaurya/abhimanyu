/**
 * Mock AI/ML Sender
 *
 * Simulates the AI/ML system by sending one JSON payload per second
 * to POST /api/v1/conveyor-data.
 *
 * Usage:
 *   node mock/aiSender.js              — random scenario mode (default)
 *   node mock/aiSender.js --demo       — deterministic demo sequence
 *
 * This file is DEVELOPMENT ONLY and must not be imported by production code.
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';
const ENDPOINT = `${API_URL}/api/v1/conveyor-data`;
const INTERVAL_MS = 1000;

const DEMO_MODE = process.argv.includes('--demo');

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

// ── Demo Scenario Sequence ──────────────────────────────────
//
// A fixed, predictable sequence for demonstrations.
// Each entry defines the scenario for a range of ticks.
//
// HEALTHY → WARNING → CRITICAL+CRACK → RECOVERY → HEALTHY
//
const DEMO_SEQUENCE = [
  // Ticks 1–15:  Healthy baseline
  { until: 15, scenario: 'normal',   crack: false },
  // Ticks 16–25: Warning
  { until: 25, scenario: 'warning',  crack: false },
  // Ticks 26–40: Critical
  { until: 35, scenario: 'critical', crack: false },
  // Ticks 36–45: Critical + Crack Detected
  { until: 45, scenario: 'critical', crack: true  },
  // Ticks 46–55: Recovery — Warning, crack clears
  { until: 55, scenario: 'warning',  crack: false },
  // Ticks 56+:  Healthy again (loops back to tick 1 at tick 71)
  { until: 70, scenario: 'normal',   crack: false },
];

const DEMO_CYCLE_LENGTH = 70;

function getDemoScenario(tick) {
  const cycleTick = ((tick - 1) % DEMO_CYCLE_LENGTH) + 1;
  for (const entry of DEMO_SEQUENCE) {
    if (cycleTick <= entry.until) {
      return { scenario: entry.scenario, forceCrack: entry.crack };
    }
  }
  return { scenario: 'normal', forceCrack: false };
}

// ── Payload Generator ───────────────────────────────────────

function generatePayload() {
  tickCount++;

  const now = new Date().toISOString();

  // Decide scenario
  let scenario, forceCrack;

  if (DEMO_MODE) {
    const demo = getDemoScenario(tickCount);
    scenario = demo.scenario;
    forceCrack = demo.forceCrack;
  } else {
    // Random mode: ~80% normal, ~12% warning, ~8% critical
    const roll = Math.random();
    if (roll > 0.92) scenario = 'critical';
    else if (roll > 0.80) scenario = 'warning';
    else scenario = 'normal';
    forceCrack = undefined; // decided below
  }

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
  let crackDetected;
  if (forceCrack !== undefined) {
    crackDetected = forceCrack;
  } else {
    crackDetected = scenario === 'critical' && Math.random() > 0.4;
  }
  const detection = { crackDetected };

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
  if (scenario === 'warning') {
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
  } else if (scenario === 'critical') {
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
  // NOTE: In 'normal' scenario, alerts array is empty (no fake "no active alerts" entry)

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
  const label = `[Tick ${tickCount}] ${payload.health.status}${payload.detection.crackDetected ? ' +CRACK' : ''}`;

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
const modeLabel = DEMO_MODE ? 'DEMO SEQUENCE' : 'RANDOM';
console.log(`[MockAI] Mode: ${modeLabel}`);
console.log(`[MockAI] Sending to ${ENDPOINT} every ${INTERVAL_MS}ms`);
if (DEMO_MODE) {
  console.log('[MockAI] Sequence: HEALTHY(15s) → WARNING(10s) → CRITICAL(10s) → CRACK(10s) → RECOVERY(10s) → HEALTHY(15s) → repeat');
}
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
