import React from 'react';

const statusColor = {
  Healthy: '#10b981',
  Warning: '#f59e0b',
  Critical: '#ef4444',
};

export default function SystemStatus({ connected, lastUpdate, health }) {
  const status = health?.status || 'Unknown';
  const color = statusColor[status] || '#64748b';

  return (
    <div className="card system-status">
      <h3>System Status</h3>

      <div className="status-row" style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
        <span className="label" style={{ fontWeight: '600' }}>Connection</span>
        <span style={{ 
          fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '2px', 
          background: connected ? '#ecfdf5' : '#fef2f2',
          color: connected ? '#059669' : '#dc2626' 
        }}>
          {connected ? '● CONNECTED' : '○ DISCONNECTED'}
        </span>
      </div>

      <div className="status-row" style={{ padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
        <span className="label" style={{ fontWeight: '600' }}>Machine State</span>
        <span style={{ 
          fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.5rem', borderRadius: '2px',
          background: color, color: '#fff', textTransform: 'uppercase'
        }}>
          {status}
        </span>
      </div>

      <div className="status-row" style={{ padding: '0.5rem 0', marginTop: 'auto' }}>
        <span className="label" style={{ fontWeight: '600' }}>Last Update</span>
        <span style={{ 
          fontSize: '0.85rem', fontWeight: '700', color: '#334155',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        }}>
          {lastUpdate ? lastUpdate.toLocaleTimeString() : '—'}
        </span>
      </div>
    </div>
  );
}
