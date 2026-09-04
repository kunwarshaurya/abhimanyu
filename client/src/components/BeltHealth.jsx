import React from 'react';

const statusConfig = {
  Healthy:  { color: '#10b981', bg: '#ecfdf5' },
  Warning:  { color: '#f59e0b', bg: '#fffbeb' },
  Critical: { color: '#ef4444', bg: '#fef2f2' },
};

export default function BeltHealth({ health }) {
  const h = health || {};
  const score = h.score ?? null;
  const confidence = h.confidence ?? null;
  const status = h.status || 'Unknown';
  const cfg = statusConfig[status] || { color: '#6b7280', bg: '#f3f4f6' };

  // Score bar width (0-100)
  const barWidth = score != null ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <div className="card belt-health" style={{ borderLeft: `4px solid ${cfg.color}` }}>
      <h3>Belt Health</h3>

      <div className="health-score-section">
        <div className="health-score-header">
          <span className="label">Health Score</span>
          <span className="health-score-value" style={{ color: cfg.color }}>
            {score != null ? score : '—'}
          </span>
        </div>
        <div className="health-bar-track">
          <div
            className="health-bar-fill"
            style={{ width: `${barWidth}%`, background: cfg.color }}
          />
        </div>
      </div>

      <div className="status-row">
        <span className="label">Status</span>
        <span className="badge" style={{ background: cfg.color, color: '#fff' }}>
          {status}
        </span>
      </div>

      <div className="status-row">
        <span className="label">AI Confidence</span>
        <span className="value">
          {confidence != null ? `${(confidence * 100).toFixed(1)}%` : '—'}
        </span>
      </div>
    </div>
  );
}
