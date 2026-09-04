/**
 * Socket.IO Test Client
 *
 * Connects to the backend and listens for 'conveyor:update' events.
 * Used to verify the real-time pipeline without a full React dashboard.
 *
 * Usage:  node mock/socketTestClient.js
 */

const { io } = require('socket.io-client');

const SERVER_URL = process.env.API_URL || 'http://localhost:4000';

const socket = io(SERVER_URL);

let eventCount = 0;

socket.on('connect', () => {
  console.log(`[TestClient] Connected to ${SERVER_URL} (id: ${socket.id})`);
  console.log('[TestClient] Listening for "conveyor:update" events…\n');
});

socket.on('conveyor:update', (data) => {
  eventCount++;
  const status = data.health?.status || '???';
  const score = data.health?.score ?? '???';
  const temp = data.sensorData?.temperature ?? '???';
  const motor = data.sensorData?.motorSpeed ?? '???';
  const crack = data.detection?.crackDetected ? '🔴 YES' : '✅ no';
  const alerts = data.alerts?.length ?? 0;

  console.log(
    `[Event #${eventCount}] ` +
    `Status: ${status} | Score: ${score} | Temp: ${temp}°C | ` +
    `Motor: ${motor} | Crack: ${crack} | Alerts: ${alerts}`
  );
});

socket.on('disconnect', (reason) => {
  console.log(`\n[TestClient] Disconnected: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.error(`[TestClient] Connection error: ${err.message}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[TestClient] Received ${eventCount} events total. Exiting.`);
  socket.disconnect();
  process.exit(0);
});
