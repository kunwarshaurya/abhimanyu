import React from 'react';

const RANGES = [
  { key: '1h',  label: 'Last Hour' },
  { key: '24h', label: 'Last 24h' },
  { key: '7d',  label: 'Last 7 Days' },
];

export default function TimeRangeSelector({ range, onChange, onRefresh, loading }) {
  return (
    <div className="time-range-selector">
      <div className="range-buttons">
        {RANGES.map(r => (
          <button
            key={r.key}
            className={`range-btn ${range === r.key ? 'active' : ''}`}
            onClick={() => onChange(r.key)}
            disabled={loading}
          >
            {r.label}
          </button>
        ))}
      </div>
      <button className="range-btn refresh-btn" onClick={onRefresh} disabled={loading}>
        {loading ? '⟳ Loading…' : '↻ Refresh'}
      </button>
    </div>
  );
}
