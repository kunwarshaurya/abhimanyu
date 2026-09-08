import React from 'react';

const severityColor = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export default function AlertsPanel({ alerts }) {
  const list = Array.isArray(alerts) ? alerts : [];
  const topAlerts = list.slice(0, 5);
  const hasHighAlert = list.some(a => a.damageSeverity === 'High' || a.damageSeverity === 'Critical');
  const hasMediumAlert = list.some(a => a.damageSeverity === 'Medium');

  const borderColor = hasHighAlert ? '#ef4444' : hasMediumAlert ? '#f59e0b' : '#94a3b8';

  return (
    <div className="card alerts-panel" style={{ borderTop: `4px solid ${borderColor}` }}>
      <h3>Alerts <span className="alert-count" style={{ background: hasHighAlert ? '#fef2f2' : hasMediumAlert ? '#fffbeb' : '#cbd5e1', color: hasHighAlert ? '#ef4444' : hasMediumAlert ? '#f59e0b' : '#0f172a', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: '700' }}>{list.length}</span></h3>

      {list.length === 0 ? (
        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>No active alerts</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
          {topAlerts.map((alert, idx) => {
            const isHigh = alert.damageSeverity === 'High';
            const color = severityColor[alert.damageSeverity] || '#64748b';
            return (
              <div key={alert.id ?? idx} style={{ borderLeft: `${isHigh ? '6px' : '4px'} solid ${color}`, paddingLeft: '0.75rem', background: isHigh ? '#fef2f2' : '#f8fafc', padding: '0.75rem', borderRadius: '0 2px 2px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ color: color, fontWeight: '800', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {alert.damageSeverity || 'Unknown'}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b',
                    fontVariantNumeric: 'tabular-nums',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                  }}>
                    {alert.time ? new Date(alert.time).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', fontWeight: '600', lineHeight: '1.4' }}>
                  {alert.message || '—'}
                </p>
              </div>
            );
          })}
          {list.length > 5 && (
            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', paddingTop: '0.5rem', fontWeight: '600' }}>
              + {list.length - 5} more in History
            </div>
          )}
        </div>
      )}
    </div>
  );
}
