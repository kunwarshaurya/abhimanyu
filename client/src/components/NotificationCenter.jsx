import React, { useState } from 'react';

const SEVERITY_ORDER = { High: 0, Critical: 0, Medium: 1, Low: 2 };
const SEVERITY_COLOR = { High: '#ef4444', Critical: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const FILTER_TABS = ['ALL', 'CRITICAL', 'WARNING', 'LOW'];

function mapSeverityToFilter(sev) {
  if (sev === 'High' || sev === 'Critical') return 'CRITICAL';
  if (sev === 'Medium') return 'WARNING';
  return 'LOW';
}

export default function NotificationCenter({ notifications, liveAlerts }) {
  const [filter, setFilter] = useState('ALL');

  // Merge live alerts at top (if not already in history)
  const liveIds = new Set((liveAlerts || []).map(a => `${a.id}-${a.time}-${a.message}`));

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true;
    return mapSeverityToFilter(n.damageSeverity) === filter;
  });

  // Counts per category
  const counts = { ALL: notifications.length, CRITICAL: 0, WARNING: 0, LOW: 0 };
  notifications.forEach(n => {
    const cat = mapSeverityToFilter(n.damageSeverity);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return (
    <div className="card notification-center">
      <h3>
        Notifications
        <span className="notification-count">{notifications.length}</span>
      </h3>

      {/* Filter Tabs */}
      <div className="notification-filters">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`notification-filter-btn ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab}
            {counts[tab] > 0 && <span className="filter-count">{counts[tab]}</span>}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="notification-list">
        {filtered.length === 0 ? (
          <div className="notification-empty">
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} notifications
          </div>
        ) : (
          filtered.map((n, idx) => {
            const color = SEVERITY_COLOR[n.damageSeverity] || '#64748b';
            const isHigh = n.damageSeverity === 'High' || n.damageSeverity === 'Critical';
            return (
              <div
                key={n._key || idx}
                className={`notification-item ${isHigh ? 'high' : ''}`}
                style={{ borderLeftColor: color }}
              >
                <div className="notification-item-header">
                  <span className="notification-severity" style={{ color }}>
                    {n.damageSeverity || 'Unknown'}
                  </span>
                  <span className="notification-time">
                    {n.time ? new Date(n.time).toLocaleTimeString() : '—'}
                  </span>
                </div>
                <p className="notification-msg">{n.message || '—'}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
