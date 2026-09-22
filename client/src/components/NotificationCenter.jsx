import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Thermometer, Gauge, Zap, Activity, Lightbulb, Ruler,
  AlertTriangle, CheckCircle, X, Clock, BarChart2,
} from 'lucide-react';

const SEVERITY_COLOR = { High: '#ef4444', Critical: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const FILTER_TABS = ['ALL', 'CRITICAL', 'WARNING', 'LOW'];

function mapSeverityToFilter(sev) {
  if (sev === 'High' || sev === 'Critical') return 'CRITICAL';
  if (sev === 'Medium') return 'WARNING';
  return 'LOW';
}

function SectionTitle({ children }) {
  return <div className="adm-section-title">{children}</div>;
}

// ── Health Gauge ──────────────────────────────────────────────
function HealthGauge({ score, status }) {
  const color = status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#10b981';
  const gaugeData = [{ name: 'Health', value: score ?? 0, fill: color }];
  return (
    <div className="adm-gauge-wrap">
      <ResponsiveContainer width="100%" height={130}>
        <RadialBarChart
          innerRadius="60%"
          outerRadius="100%"
          data={gaugeData}
          startAngle={200}
          endAngle={-20}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar background={{ fill: '#E2E8F0' }} dataKey="value" angleAxisId={0} cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="adm-gauge-label">
        <span className="adm-gauge-score" style={{ color }}>{score ?? '—'}</span>
        <span className="adm-gauge-sub" style={{ color }}>{status}</span>
        <span className="adm-gauge-caption">Health Score</span>
      </div>
    </div>
  );
}

// ── Sensor Numbers Grid ───────────────────────────────────────
function SensorNumberGrid({ sensorData }) {
  const items = [
    { label: 'Temperature', value: sensorData?.temperature, unit: '°C',  color: '#f97316', Icon: Thermometer },
    { label: 'Motor Speed',  value: sensorData?.motorSpeed,  unit: 'RPM', color: '#3b82f6', Icon: Gauge       },
    { label: 'Voltage',      value: sensorData?.voltage,     unit: 'V',   color: '#8b5cf6', Icon: Zap         },
    { label: 'Current',      value: sensorData?.current,     unit: 'A',   color: '#ec4899', Icon: Activity    },
    { label: 'Power',        value: sensorData?.power,       unit: 'W',   color: '#14b8a6', Icon: Lightbulb   },
    { label: 'Distance',     value: sensorData?.distance,    unit: 'm',   color: '#64748b', Icon: Ruler       },
  ];
  return (
    <div className="adm-sensor-grid">
      {items.map(({ label, value, unit, color, Icon }) => (
        <div className="adm-sensor-card" key={label} style={{ borderTop: `3px solid ${color}` }}>
          <Icon size={16} color={color} strokeWidth={2} />
          <span className="adm-sensor-label">{label}</span>
          <span className="adm-sensor-value" style={{ color }}>
            {value ?? '—'}
            <span className="adm-sensor-unit"> {unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Vibration Bar Chart (with Cell — correct coloring) ─────────
function VibrationBarChart({ vibration }) {
  const data = [
    { name: 'accX',  value: parseFloat(Math.abs(vibration?.accX  ?? 0).toFixed(3)), color: '#ef4444', unit: 'm/s²' },
    { name: 'accY',  value: parseFloat(Math.abs(vibration?.accY  ?? 0).toFixed(3)), color: '#f97316', unit: 'm/s²' },
    { name: 'accZ',  value: parseFloat(Math.abs(vibration?.accZ  ?? 0).toFixed(3)), color: '#f59e0b', unit: 'm/s²' },
    { name: 'gyroX', value: parseFloat(Math.abs(vibration?.gyroX ?? 0).toFixed(3)), color: '#8b5cf6', unit: '°/s'  },
    { name: 'gyroY', value: parseFloat(Math.abs(vibration?.gyroY ?? 0).toFixed(3)), color: '#3b82f6', unit: '°/s'  },
    { name: 'gyroZ', value: parseFloat(Math.abs(vibration?.gyroZ ?? 0).toFixed(3)), color: '#06b6d4', unit: '°/s'  },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="adm-tooltip">
        <span className="adm-tooltip-name">{d.name}</span>
        <span className="adm-tooltip-val">{d.value} {d.unit}</span>
      </div>
    );
  };

  return (
    <>
      {/* What is vibration snapshot — short explanation */}
      <p className="adm-vib-explain">
        Readings from the belt's 3-axis accelerometer (accX/Y/Z) and gyroscope (gyroX/Y/Z),
        captured at the exact second the alert fired. Higher values indicate abnormal shaking,
        vibration, or mechanical misalignment.
      </p>
      {/* Two groups side by side */}
      <div className="adm-vib-groups">
        <div className="adm-vib-group">
          <div className="adm-vib-group-label">Accelerometer (m/s²)</div>
          <div className="adm-vib-group-bars">
            {data.slice(0, 3).map(d => (
              <div className="adm-vib-row" key={d.name}>
                <span className="adm-vib-axis">{d.name}</span>
                <div className="adm-vib-track">
                  <div
                    className="adm-vib-fill"
                    style={{
                      width: `${Math.min((d.value / 12) * 100, 100)}%`,
                      background: d.color,
                    }}
                  />
                </div>
                <span className="adm-vib-num" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="adm-vib-group">
          <div className="adm-vib-group-label">Gyroscope (°/s)</div>
          <div className="adm-vib-group-bars">
            {data.slice(3).map(d => (
              <div className="adm-vib-row" key={d.name}>
                <span className="adm-vib-axis">{d.name}</span>
                <div className="adm-vib-track">
                  <div
                    className="adm-vib-fill"
                    style={{
                      width: `${Math.min((d.value / 5) * 100, 100)}%`,
                      background: d.color,
                    }}
                  />
                </div>
                <span className="adm-vib-num" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Trend Area Chart ──────────────────────────────────────────
function TrendChart({ history }) {
  const [metric, setMetric] = useState('healthScore');

  const METRICS = [
    { key: 'healthScore', label: 'Health',   color: '#10b981', unit: ''    },
    { key: 'temperature', label: 'Temp',     color: '#f97316', unit: '°C'  },
    { key: 'motorSpeed',  label: 'Speed',    color: '#3b82f6', unit: 'RPM' },
    { key: 'voltage',     label: 'Voltage',  color: '#8b5cf6', unit: 'V'   },
    { key: 'current',     label: 'Current',  color: '#ec4899', unit: 'A'   },
  ];

  const selected = METRICS.find(m => m.key === metric);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="adm-tooltip">
        <span className="adm-tooltip-time">{label}</span>
        <span className="adm-tooltip-val">{payload[0].value?.toFixed(2)} {selected.unit}</span>
      </div>
    );
  };

  if (!history || history.length < 2) {
    return <div className="adm-chart-empty">Not enough history — wait for a few more ticks</div>;
  }

  return (
    <div>
      <div className="adm-metric-pills">
        {METRICS.map(m => (
          <button
            key={m.key}
            className={`adm-pill ${metric === m.key ? 'active' : ''}`}
            style={metric === m.key ? { background: m.color, borderColor: m.color, color: '#fff' } : {}}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={history} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={selected.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={selected.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={34} />
          <CartesianGrid stroke="#F1F5F9" vertical={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={metric}
            stroke={selected.color}
            strokeWidth={2}
            fill={`url(#grad-${metric})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Alert Detail Modal ────────────────────────────────────────
function AlertDetailModal({ notification, onClose }) {
  const s = notification._snapshot;
  const color = SEVERITY_COLOR[notification.damageSeverity] || '#64748b';
  const alertTime = notification.time ? new Date(notification.time).toLocaleString() : '—';

  return (
    <div className="alert-detail-overlay" onClick={onClose}>
      <div className="alert-detail-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="alert-detail-header" style={{ borderBottom: `3px solid ${color}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="alert-detail-severity" style={{ color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={13} strokeWidth={2.5} />
              {notification.damageSeverity || 'Unknown'} Alert
            </span>
            <p className="alert-detail-msg">{notification.message || '—'}</p>
            <span className="alert-detail-time" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={11} strokeWidth={2} />
              {alertTime}
            </span>
          </div>
          <button className="alert-detail-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {!s ? (
          <div className="alert-detail-no-snapshot">No snapshot data available.</div>
        ) : (
          <div className="alert-detail-body">

            {/* ── Section 1: Gauge + quick stats ── */}
            <div className="adm-row-gauge">
              <HealthGauge score={s.health?.score} status={s.health?.status} />
              <div className="adm-stat-stack">
                <SectionTitle>At-a-Glance</SectionTitle>
                <div className="adm-stat-grid">
                  <div className="adm-stat-item">
                    <span className="adm-stat-label">Confidence</span>
                    <span className="adm-stat-value">
                      {s.health?.confidence != null ? `${(s.health.confidence * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="adm-stat-item">
                    <span className="adm-stat-label">Crack</span>
                    <span className="adm-stat-value" style={{ color: s.detection?.crackDetected ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {s.detection?.crackDetected
                        ? <><AlertTriangle size={13} strokeWidth={2.5} /> YES</>
                        : <><CheckCircle   size={13} strokeWidth={2.5} /> No</>}
                    </span>
                  </div>
                  <div className="adm-stat-item">
                    <span className="adm-stat-label">Distance</span>
                    <span className="adm-stat-value">{s.sensorData?.distance ?? '—'} m</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-divider" />

            {/* ── Section 2: Sensor numbers ── */}
            <SectionTitle>Sensor Readings at Alert Time</SectionTitle>
            <SensorNumberGrid sensorData={s.sensorData} />

            <div className="adm-divider" />

            {/* ── Section 3: Vibration ── */}
            <SectionTitle>Vibration Snapshot — Accelerometer &amp; Gyroscope</SectionTitle>
            <VibrationBarChart vibration={s.vibration} />

            <div className="adm-divider" />

            {/* ── Section 4: Trend ── */}
            <SectionTitle>Trend — Last {s.history?.length ?? 0} Ticks Before Alert</SectionTitle>
            <TrendChart history={s.history} />

          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function NotificationCenter({ notifications, liveAlerts }) {
  const [filter, setFilter] = useState('ALL');
  const [selectedNotification, setSelectedNotification] = useState(null);

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true;
    return mapSeverityToFilter(n.damageSeverity) === filter;
  });

  const counts = { ALL: notifications.length, CRITICAL: 0, WARNING: 0, LOW: 0 };
  notifications.forEach(n => {
    const cat = mapSeverityToFilter(n.damageSeverity);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return (
    <>
      <div className="card notification-center">
        <h3>
          Notifications
          <span className="notification-count">{notifications.length}</span>
        </h3>

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

        <div className="notification-list">
          {filtered.length === 0 ? (
            <div className="notification-empty">
              No {filter !== 'ALL' ? filter.toLowerCase() : ''} notifications
            </div>
          ) : (
            filtered.map((n, idx) => {
              const color = SEVERITY_COLOR[n.damageSeverity] || '#64748b';
              const isHigh = n.damageSeverity === 'High' || n.damageSeverity === 'Critical';
              const hasSnapshot = !!n._snapshot;
              return (
                <div
                  key={n._key || idx}
                  className={`notification-item ${isHigh ? 'high' : ''} ${hasSnapshot ? 'clickable' : ''}`}
                  style={{ borderLeftColor: color, cursor: hasSnapshot ? 'pointer' : 'default' }}
                  onClick={() => hasSnapshot && setSelectedNotification(n)}
                  title={hasSnapshot ? 'Click to view analytics' : undefined}
                >
                  <div className="notification-item-header">
                    <span className="notification-severity" style={{ color }}>
                      {n.damageSeverity || 'Unknown'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {hasSnapshot && (
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <BarChart2 size={11} strokeWidth={2} /> analytics
                        </span>
                      )}
                      <span className="notification-time">
                        {n.time ? new Date(n.time).toLocaleTimeString() : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="notification-msg">{n.message || '—'}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedNotification && createPortal(
        <AlertDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />,
        document.body
      )}
    </>
  );
}
