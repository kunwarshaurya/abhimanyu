require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { testConnection } = require('./config/db');
const healthRouter = require('./routes/health');
const conveyorDataRouter = require('./routes/conveyorData');
const historyRouter = require('./routes/history');

// --- Express setup ---
const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Allow multiple origins — local + any device on the same subnet
const ALLOWED_ORIGINS = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://192.168.137.91:5173',
  'http://192.168.137.142:5173',
];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// --- Routes ---
app.use('/api/health', healthRouter);
app.use('/api/v1/conveyor-data', conveyorDataRouter);
app.use('/api/v1/history', historyRouter);

// --- Socket.IO setup ---
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

// Track the latest conveyor state so new clients get it immediately
let latestConveyorState = null;

io.on('connection', (socket) => {
  const clientCount = io.engine.clientsCount;
  console.log(`[Socket.IO] Client connected: ${socket.id} (${clientCount} total)`);

  // Send the last known state to the newly connected client
  if (latestConveyorState) {
    socket.emit('conveyor:update', latestConveyorState);
  }

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
  });
});

// Make io and state-update function accessible to routes
app.set('io', io);
app.set('setConveyorState', (state) => { latestConveyorState = state; });

// --- Start server ---
const PORT = parseInt(process.env.PORT, 10) || 4000;

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[Server] Listening on 0.0.0.0:${PORT}`);
  console.log(`[Server] CORS origin: ${CLIENT_URL}`);

  // Test database connection (non-blocking)
  await testConnection();

  console.log('[Server] Abhimanyu backend ready');
});

// --- Global error handlers ---
process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err.message || err);
});
