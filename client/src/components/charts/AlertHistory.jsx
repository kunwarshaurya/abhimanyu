import React from 'react';

const severityColor = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export default function AlertHistory({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="card history-table-card">
      <h3>Alert History</h3>
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
                        background: severityColor[row.damage_severity] || '#6b7280',
                        color: '#fff',
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
