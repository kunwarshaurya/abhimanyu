import React from 'react';

const statusColor = {
  Healthy: '#10b981',
  Warning: '#f59e0b',
  Critical: '#ef4444',
};

export default function SystemStatus({ connected, lastUpdate, health }) {
  const status = health?.status || 'Unknown';
  const color = statusColor[status] || '#6b7280';

  return (
    <div className="card system-status">
      <h3>System Status</h3>

      <div className="status-row">
        <span className="label">Connection</span>
        <span className={`badge ${connected ? 'badge-green' : 'badge-red'}`}>
          {connected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <div className="status-row">
        <span className="label">Machine State</span>
        <span className="badge" style={{ background: color, color: '#fff' }}>
          {status}
        </span>
      </div>

      <div className="status-row">
        <span className="label">Last Update</span>
        <span className="value">
          {lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}
        </span>
      </div>
    </div>
  );
}
