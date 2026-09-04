/**
 * conveyorData.js — POST /api/v1/conveyor-data
 *
 * Receives AI/ML JSON payloads, validates, persists to MySQL,
 * and broadcasts the latest state via Socket.IO.
 */

const express = require('express');
const router = express.Router();
const { validatePayload } = require('../middleware/validatePayload');
const { savePayload } = require('../services/payloadService');

router.post('/', async (req, res) => {
  // 1. Validate
  const errors = validatePayload(req.body);
  if (errors.length > 0) {
    console.warn('[ConveyorData] Validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Payload validation failed',
      details: errors,
    });
  }

  // 2. Persist
  try {
    const result = await savePayload(req.body);
    console.log('[ConveyorData] Payload saved:', result);

    // 3. Broadcast via Socket.IO and update latest state
    const io = req.app.get('io');
    const setConveyorState = req.app.get('setConveyorState');
    if (io) {
      io.emit('conveyor:update', req.body);
    }
    if (setConveyorState) {
      setConveyorState(req.body);
    }

    // 4. Success response
    return res.status(201).json({
      success: true,
      message: 'Conveyor data received and stored',
      data: result,
    });
  } catch (err) {
    console.error('[ConveyorData] Database error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

module.exports = router;

