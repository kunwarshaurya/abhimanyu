import React from 'react';

const severityColor = {
  Low: '#10B981',
  Medium: '#F59E0B',
  High: '#EF4444',
  Critical: '#EF4444',
};

export default function AlertHistory({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="card history-table-card">
      <h3>ALERT HISTORY</h3>
      {isEmpty ? (
        <div className="chart-empty">No alerts for this time range</div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="td-time">
                    {new Date(row.recorded_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td>
                    <span
                      className="severity-badge"
                      style={{
                        background: severityColor[row.damage_severity] || '#64748B',
                        color: '#FFFFFF',
                      }}
                    >
                      {row.damage_severity || '—'}
                    </span>
                  </td>
                  <td>{row.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
