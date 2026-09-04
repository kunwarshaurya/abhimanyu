import React, { useState } from 'react';
import useSocket from './hooks/useSocket';
import ConveyorVisualization from './components/ConveyorVisualization';
import SystemStatus from './components/SystemStatus';
import SensorData from './components/SensorData';
import VibrationMonitor from './components/VibrationMonitor';
import BeltHealth from './components/BeltHealth';
import DetectionStatus from './components/DetectionStatus';
import AlertsPanel from './components/AlertsPanel';
import HistoryView from './components/HistoryView';
import './App.css';

export default function App() {
  const { data, connected, lastUpdate } = useSocket();
  const [tab, setTab] = useState('live');

  // Waiting state — no data received yet
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
          <ConveyorVisualization data={data} />
          <div className="dashboard-grid">
            <SystemStatus
              connected={connected}
              lastUpdate={lastUpdate}
              health={data.health}
            />
            <BeltHealth health={data.health} />
            <DetectionStatus detection={data.detection} />
            <SensorData sensorData={data.sensorData} />
            <VibrationMonitor vibration={data.vibration} />
            <AlertsPanel alerts={data.alerts} />
          </div>
        </>
      ) : (
        <HistoryView />
      )}
    </div>
  );
}
