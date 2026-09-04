/**
 * history.js — GET /api/v1/history/:type
 *
 * Serves historical data for: sensors, vibration, health, detections, alerts.
 *
 * Query params:
 *   range  — '1h' | '24h' | '7d'  (shorthand)
 *   from   — ISO 8601 start (for custom range)
 *   to     — ISO 8601 end   (for custom range)
 *
 * Default: last 1 hour.
 */

const express = require('express');
const router = express.Router();
const {
  getSensorHistory,
  getVibrationHistory,
  getHealthHistory,
  getDetectionHistory,
  getAlertHistory,
} = require('../db/historyRepository');

// ── Resolve time range from query params ──
function resolveRange(query) {
  const now = new Date();

  // Custom range
  if (query.from && query.to) {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return { error: 'Invalid from/to date format. Use ISO 8601.' };
    }
    return { from, to };
  }

  // Shorthand range
  const range = query.range || '1h';
  const offsets = {
    '1h':  60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d':  7 * 24 * 60 * 60 * 1000,
  };

  const ms = offsets[range];
  if (!ms) {
    return { error: `Invalid range "${range}". Use: 1h, 24h, 7d, or from/to.` };
  }

  return { from: new Date(now.getTime() - ms), to: now };
}

// ── Map type → query function ──
const handlers = {
  sensors:    getSensorHistory,
  vibration:  getVibrationHistory,
  health:     getHealthHistory,
  detections: getDetectionHistory,
  alerts:     getAlertHistory,
};

router.get('/:type', async (req, res) => {
  const { type } = req.params;
  const queryFn = handlers[type];

  if (!queryFn) {
    return res.status(400).json({
      success: false,
      error: `Unknown history type "${type}". Use: ${Object.keys(handlers).join(', ')}`,
    });
  }

  const resolved = resolveRange(req.query);
  if (resolved.error) {
    return res.status(400).json({ success: false, error: resolved.error });
  }

  try {
    const rows = await queryFn(resolved.from, resolved.to);
    return res.json({
      success: true,
      count: rows.length,
      range: { from: resolved.from.toISOString(), to: resolved.to.toISOString() },
      data: rows,
    });
  } catch (err) {
    console.error(`[History] Error querying ${type}:`, err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
