import React from 'react';

function Metric({ label, value, unit }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">
        {value != null ? value : '—'}
        {value != null && unit && <span className="metric-unit"> {unit}</span>}
      </span>
    </div>
  );
}

export default function SensorData({ sensorData }) {
  const d = sensorData || {};

  return (
    <div className="card">
      <h3>Sensor Telemetry</h3>
      <div className="metric-grid">
        <Metric label="Temperature" value={d.temperature} unit="°C" />
        <Metric label="Voltage" value={d.voltage} unit="V" />
        <Metric label="Current" value={d.current} unit="A" />
        <Metric label="Power" value={d.power} unit="W" />
        <Metric label="Distance" value={d.distance} unit="m" />
        <Metric label="Motor Speed" value={d.motorSpeed} unit="RPM" />
      </div>
    </div>
  );
}
