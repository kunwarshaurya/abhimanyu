import React from 'react';

const severityColor = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export default function AlertsPanel({ alerts }) {
  const list = Array.isArray(alerts) ? alerts : [];

  return (
    <div className="card alerts-panel">
      <h3>Alerts <span className="alert-count">{list.length}</span></h3>

      {list.length === 0 ? (
        <p className="no-alerts">No alerts</p>
      ) : (
        <div className="alert-list">
          {list.map((alert, idx) => {
            const color = severityColor[alert.damageSeverity] || '#6b7280';
            return (
              <div key={alert.id ?? idx} className="alert-item">
                <div className="alert-header">
                  <span
                    className="alert-severity"
                    style={{ background: color, color: '#fff' }}
                  >
                    {alert.damageSeverity || 'Unknown'}
                  </span>
                  <span className="alert-time">
                    {alert.time
                      ? new Date(alert.time).toLocaleTimeString()
                      : '—'}
                  </span>
                </div>
                <p className="alert-message">{alert.message || '—'}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
