import React from 'react';

function Axis({ label, value }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value != null ? value.toFixed(4) : '—'}</span>
    </div>
  );
}

export default function VibrationMonitor({ vibration }) {
  const v = vibration || {};

  return (
    <div className="card">
      <h3>Vibration Monitor</h3>
      <div className="vibration-section">
        <h4>Accelerometer (g)</h4>
        <div className="metric-grid cols-3">
          <Axis label="X" value={v.accX} />
          <Axis label="Y" value={v.accY} />
          <Axis label="Z" value={v.accZ} />
        </div>
      </div>
      <div className="vibration-section">
        <h4>Gyroscope (°/s)</h4>
        <div className="metric-grid cols-3">
          <Axis label="X" value={v.gyroX} />
          <Axis label="Y" value={v.gyroY} />
          <Axis label="Z" value={v.gyroZ} />
        </div>
      </div>
    </div>
  );
}
