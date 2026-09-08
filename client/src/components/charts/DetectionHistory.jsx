import React from 'react';

export default function DetectionHistory({ data }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="card history-table-card">
      <h3>CRACK DETECTION HISTORY</h3>
      {isEmpty ? (
        <div className="chart-empty">No detections for this time range</div>
      ) : (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Crack Status</th>
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
                      className="det-badge"
                      style={{
                        background: row.crack_detected ? '#EF4444' : '#10B981',
                        color: '#FFFFFF'
                      }}
                    >
                      {row.crack_detected ? 'Crack Detected' : 'Crack Clear'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
