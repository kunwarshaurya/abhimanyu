import React from 'react';

function Indicator({ label, detected }) {
  const isDetected = detected === true;
  return (
    <div className={`detection-indicator ${isDetected ? 'detected' : 'clear'}`}>
      <span className="detection-icon">{isDetected ? '⚠' : '✓'}</span>
      <span className="detection-label">{label}</span>
      <span className="detection-status">
        {isDetected ? 'DETECTED' : 'Clear'}
      </span>
    </div>
  );
}

export default function DetectionStatus({ detection }) {
  const d = detection || {};

  return (
    <div className="card">
      <h3>Detection Status</h3>
      <div className="detection-grid">
        <Indicator label="Belt Crack" detected={d.crackDetected} />
        <Indicator label="Belt Joint" detected={d.jointDetected} />
      </div>
    </div>
  );
}
