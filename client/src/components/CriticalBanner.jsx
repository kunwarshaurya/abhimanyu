import React, { useState } from 'react';
import { Volume2, VolumeX, ChevronDown, ChevronRight, Play } from 'lucide-react';

export default function CriticalBanner({ frozenSnapshot, frozenAt, faultCleared, liveHealthStatus, onStartConveyor, alarmMuted, onToggleMute }) {
  const [expanded, setExpanded] = useState(false);

  const health = frozenSnapshot?.health || {};
  const detection = frozenSnapshot?.detection || {};
  const alerts = Array.isArray(frozenSnapshot?.alerts) ? frozenSnapshot.alerts : [];
  const sensors = frozenSnapshot?.sensorData || {};
  const vibration = frozenSnapshot?.vibration || {};

  const highAlert = alerts.find(a => a.damageSeverity === 'High' || a.damageSeverity === 'Critical') || alerts[0];
  const canStart = liveHealthStatus !== 'Critical';

  return (
    <div className="fault-overlay">
      <div className={`fault-card ${faultCleared ? 'fault-cleared' : ''}`}>

        {/* ── Icon + Header ── */}
        <div className="fault-card-header">
          <div className={`fault-icon ${faultCleared ? '' : 'pulse'}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="fault-header-text">
            <div className="fault-title">
              {faultCleared ? 'Fault Cleared' : 'Critical Fault'}
            </div>
            <div className="fault-status-line">
              {faultCleared ? 'Conveyor remains stopped' : 'Conveyor stopped'}
            </div>
            <div className="fault-subtitle">
              {faultCleared
                ? 'Condition normalized — operator restart required'
                : 'Critical condition active — operator intervention required'}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fault-divider" />

        {/* ── Compact Triage ── */}
        <div className="fault-triage">
          <div className="fault-triage-item">
            <span className="fault-triage-label">Health Score</span>
            <span className="fault-triage-value" style={{ color: '#EF4444' }}>
              {health.score != null ? parseFloat(health.score).toFixed(1) : '—'}
            </span>
          </div>
          <div className="fault-triage-item">
            <span className="fault-triage-label">Crack Detection</span>
            <span className="fault-triage-value" style={{ color: detection.crackDetected ? '#EF4444' : '#10B981' }}>
              {detection.crackDetected ? 'DETECTED' : 'CLEAR'}
            </span>
          </div>
          <div className="fault-triage-item fault-triage-full">
            <span className="fault-triage-label">Primary Fault</span>
            <span className="fault-triage-value fault-triage-msg">
              {highAlert?.message || 'Critical condition detected'}
            </span>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="fault-actions">
          <button className="fault-more-btn" onClick={() => setExpanded(!expanded)}>
            {expanded
              ? <><ChevronDown size={12} strokeWidth={2.5} /> Less Info</>
              : <><ChevronRight size={12} strokeWidth={2.5} /> More Info</>}
          </button>
          <button
            className={`fault-mute-btn ${alarmMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={alarmMuted ? 'Unmute alarm' : 'Mute alarm'}
          >
            {alarmMuted
              ? <><VolumeX size={13} strokeWidth={2} /> Unmute</>
              : <><Volume2 size={13} strokeWidth={2} /> Mute</>}
          </button>
          <button
            className={`start-conveyor-btn ${!canStart ? 'disabled' : ''}`}
            onClick={canStart ? onStartConveyor : undefined}
            disabled={!canStart}
            title={!canStart ? 'Cannot start while Critical condition is active' : 'Resume conveyor simulation'}
          >
            <Play size={12} strokeWidth={2.5} fill="currentColor" /> Start Conveyor
          </button>
        </div>

        {/* ── Status Message ── */}
        {!canStart && (
          <div className="fault-status-msg warning">
            Critical condition active — start disabled
          </div>
        )}
        {canStart && faultCleared && (
          <div className="fault-status-msg cleared">
            Fault cleared — press Start to resume operations
          </div>
        )}

        {/* ── Expanded Detail Panel (inside card) ── */}
        {expanded && (
          <div className="fault-detail">
            <div className="fault-divider" />
            <div className="fault-detail-heading">Diagnostic Snapshot</div>
            <div className="fault-detail-note">
              Values captured at {frozenAt ? frozenAt.toLocaleTimeString() : '—'}
            </div>

            {/* Fault / Alert */}
            {highAlert && (
              <div className="fault-detail-section">
                <div className="fault-detail-section-title">Fault / Alert</div>
                <div className="fault-detail-grid cols-3">
                  <div className="fault-detail-item">
                    <span className="fault-detail-label">Message</span>
                    <span className="fault-detail-value">{highAlert.message || '—'}</span>
                  </div>
                  <div className="fault-detail-item">
                    <span className="fault-detail-label">Severity</span>
                    <span className="fault-detail-value" style={{ color: '#EF4444' }}>{highAlert.damageSeverity || '—'}</span>
                  </div>
                  <div className="fault-detail-item">
                    <span className="fault-detail-label">Timestamp</span>
                    <span className="fault-detail-value">{highAlert.time ? new Date(highAlert.time).toLocaleString() : '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Health */}
            <div className="fault-detail-section">
              <div className="fault-detail-section-title">Health Assessment</div>
              <div className="fault-detail-grid cols-3">
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Score</span>
                  <span className="fault-detail-value" style={{ color: '#EF4444' }}>{health.score != null ? parseFloat(health.score).toFixed(1) : '—'}</span>
                </div>
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Confidence</span>
                  <span className="fault-detail-value">{health.confidence != null ? `${(parseFloat(health.confidence) * 100).toFixed(1)}%` : '—'}</span>
                </div>
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Status</span>
                  <span className="fault-detail-value" style={{ color: '#EF4444' }}>{health.status || '—'}</span>
                </div>
              </div>
            </div>

            {/* Detection */}
            <div className="fault-detail-section">
              <div className="fault-detail-section-title">Detection</div>
              <div className="fault-detail-grid cols-3">
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Crack Detected</span>
                  <span className="fault-detail-value" style={{ color: detection.crackDetected ? '#EF4444' : '#10B981' }}>
                    {detection.crackDetected ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sensors */}
            <div className="fault-detail-section">
              <div className="fault-detail-section-title">Sensor Snapshot</div>
              <div className="fault-detail-grid cols-3">
                {[
                  ['Temperature', sensors.temperature, '°C'],
                  ['Voltage', sensors.voltage, 'V'],
                  ['Current', sensors.current, 'A'],
                  ['Power', sensors.power, 'W'],
                  ['Distance', sensors.distance, 'm'],
                  ['Motor Speed', sensors.motorSpeed, 'RPM'],
                ].map(([label, val, unit]) => (
                  <div className="fault-detail-item" key={label}>
                    <span className="fault-detail-label">{label}</span>
                    <span className="fault-detail-value">
                      {val != null ? `${parseFloat(val).toFixed(2)} ${unit}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vibration */}
            <div className="fault-detail-section">
              <div className="fault-detail-section-title">Vibration Snapshot</div>
              <div className="fault-detail-grid cols-3">
                {[
                  ['Accel X', vibration.accX],
                  ['Accel Y', vibration.accY],
                  ['Accel Z', vibration.accZ],
                  ['Gyro X', vibration.gyroX],
                  ['Gyro Y', vibration.gyroY],
                  ['Gyro Z', vibration.gyroZ],
                ].map(([label, val]) => (
                  <div className="fault-detail-item" key={label}>
                    <span className="fault-detail-label">{label}</span>
                    <span className="fault-detail-value">{val != null ? parseFloat(val).toFixed(4) : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Machine State */}
            <div className="fault-detail-section">
              <div className="fault-detail-section-title">Machine State</div>
              <div className="fault-detail-grid cols-3">
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Simulation</span>
                  <span className="fault-detail-value" style={{ color: '#EF4444' }}>STOPPED</span>
                </div>
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Stopped At</span>
                  <span className="fault-detail-value">{frozenAt ? frozenAt.toLocaleTimeString() : '—'}</span>
                </div>
                <div className="fault-detail-item">
                  <span className="fault-detail-label">Reason</span>
                  <span className="fault-detail-value">Automatic stop</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
