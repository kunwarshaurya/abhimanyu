import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSocket from './hooks/useSocket';
import useAlarm from './hooks/useAlarm';
import ConveyorVisualization from './components/ConveyorVisualization';
import SystemStatus from './components/SystemStatus';
import SensorData from './components/SensorData';
import VibrationMonitor from './components/VibrationMonitor';
import BeltHealth from './components/BeltHealth';
import DetectionStatus from './components/DetectionStatus';
import NotificationCenter from './components/NotificationCenter';
import CriticalBanner from './components/CriticalBanner';
import HistoryView from './components/HistoryView';
import './App.css';

const MAX_NOTIFICATIONS = 100;

export default function App() {
  const { data, connected, lastUpdate } = useSocket();
  const [tab, setTab] = useState('live');

  // ── Simulation state (independent of AI health state) ──
  const [simulationRunning, setSimulationRunning] = useState(true);

  // ── Dashboard freeze state ──
  const [dashboardFrozen, setDashboardFrozen] = useState(false);
  const [frozenSnapshot, setFrozenSnapshot] = useState(null);
  const [frozenAt, setFrozenAt] = useState(null);

  // ── Alarm state ──
  const [alarmMuted, setAlarmMuted] = useState(false);
  useAlarm(dashboardFrozen, alarmMuted);

  // ── Notification history (deduplicated, session-only) ──
  const [notifications, setNotifications] = useState([]);
  const seenAlertsRef = useRef(new Set());

  // ── Track previous health status for transition detection ──
  const prevHealthRef = useRef(null);

  // ── Critical auto-stop + dashboard freeze: trigger ONLY on transition INTO Critical ──
  useEffect(() => {
    if (!data?.health?.status) return;
    const currentStatus = data.health.status;
    const prevStatus = prevHealthRef.current;

    if (currentStatus === 'Critical' && prevStatus !== 'Critical') {
      setFrozenSnapshot(JSON.parse(JSON.stringify(data)));
      setFrozenAt(new Date());
      setDashboardFrozen(true);
      setSimulationRunning(false);
    }

    prevHealthRef.current = currentStatus;
  }, [data?.health?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Accumulate deduplicated notifications from incoming alerts ──
  useEffect(() => {
    if (!data?.alerts || !Array.isArray(data.alerts) || data.alerts.length === 0) return;

    const newAlerts = [];
    for (const alert of data.alerts) {
      const key = `${alert.id}-${alert.time}-${alert.message}-${alert.damageSeverity}`;
      if (!seenAlertsRef.current.has(key)) {
        seenAlertsRef.current.add(key);
        newAlerts.push({ ...alert, _key: key });
      }
    }

    if (newAlerts.length > 0) {
      setNotifications(prev => {
        const merged = [...newAlerts, ...prev];
        return merged.slice(0, MAX_NOTIFICATIONS);
      });
    }
  }, [data?.alerts]);

  // ── Manual START handler ──
  const handleStartConveyor = useCallback(() => {
    setSimulationRunning(true);
    setDashboardFrozen(false);
    setFrozenSnapshot(null);
    setFrozenAt(null);
    setAlarmMuted(false);
  }, []);

  // ── Determine what to display ──
  const displayData = dashboardFrozen && frozenSnapshot ? frozenSnapshot : data;

  // Use LIVE data to check if Critical is still active
  const liveHealthStatus = data?.health?.status;
  const faultCleared = dashboardFrozen && liveHealthStatus !== 'Critical';

  // Waiting state
  if (!data) {
    return (
      <div className="dashboard">
        <div className="waiting">
          <h2>Abhimanyu — Conveyor Health Monitor</h2>
          <p>
            <span className={`pulse ${connected ? 'green' : 'gray'}`} />
            {connected
              ? 'Connected — waiting for sensor data…'
              : 'Connecting to backend…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Abhimanyu — Conveyor Health Monitor</h1>
            <p className="subtitle">Real-time belt monitoring dashboard</p>
          </div>
          <div className="tab-bar">
            <button
              className={`tab-btn ${tab === 'live' ? 'active' : ''}`}
              onClick={() => setTab('live')}
            >
              ● Live
            </button>
            <button
              className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
              onClick={() => setTab('history')}
            >
              📊 History
            </button>
          </div>
        </div>

        {tab === 'live' ? (
          <>
            <ConveyorVisualization
              data={displayData}
              simulationRunning={simulationRunning}
            />
            <div className="dashboard-grid">
              <div className="grid-area-system">
                <SystemStatus connected={connected} lastUpdate={dashboardFrozen ? null : lastUpdate} health={displayData.health} />
              </div>
              <div className="grid-area-health">
                <BeltHealth health={displayData.health} />
              </div>
              <div className="grid-area-sensors">
                <SensorData sensorData={displayData.sensorData} />
              </div>
              <div className="grid-area-vibe">
                <VibrationMonitor vibration={displayData.vibration} />
              </div>
              <div className="grid-area-crack">
                <DetectionStatus detection={displayData.detection} />
              </div>
              <div className="grid-area-alerts">
                <NotificationCenter
                  notifications={notifications}
                  liveAlerts={displayData.alerts}
                />
              </div>
            </div>
          </>
        ) : (
          <HistoryView />
        )}
      </div>

      {/* Critical Fault Overlay — viewport-level, above everything including Three.js labels */}
      {dashboardFrozen && (
        <CriticalBanner
          frozenSnapshot={frozenSnapshot}
          frozenAt={frozenAt}
          faultCleared={faultCleared}
          liveHealthStatus={liveHealthStatus}
          onStartConveyor={handleStartConveyor}
          alarmMuted={alarmMuted}
          onToggleMute={() => setAlarmMuted(m => !m)}
        />
      )}
    </>
  );
}

