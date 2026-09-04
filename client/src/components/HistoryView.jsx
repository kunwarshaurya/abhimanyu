import React, { useState, useEffect, useCallback } from 'react';
import TimeRangeSelector from './TimeRangeSelector';
import TrendChart from './charts/TrendChart';
import AlertHistory from './charts/AlertHistory';
import DetectionHistory from './charts/DetectionHistory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function fetchHistory(type, range) {
  const res = await fetch(`${API_URL}/api/v1/history/${type}?range=${range}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Unknown error');
  return json;
}

export default function HistoryView() {
  const [range, setRange] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sensors, setSensors] = useState([]);
  const [vibration, setVibration] = useState([]);
  const [health, setHealth] = useState([]);
  const [detections, setDetections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [meta, setMeta] = useState(null);

  const loadAll = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    try {
      const [s, v, h, d, a] = await Promise.all([
        fetchHistory('sensors', r),
        fetchHistory('vibration', r),
        fetchHistory('health', r),
        fetchHistory('detections', r),
        fetchHistory('alerts', r),
      ]);
      setSensors(s.data);
      setVibration(v.data);
      setHealth(h.data);
      setDetections(d.data);
      setAlerts(a.data);
      setMeta({ range: s.range, counts: { sensors: s.count, vibration: v.count, health: h.count, detections: d.count, alerts: a.count } });
    } catch (err) {
      console.error('[History] Load error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and when range changes
  useEffect(() => {
    loadAll(range);
  }, [range, loadAll]);

  const handleRangeChange = (r) => setRange(r);
  const handleRefresh = () => loadAll(range);

  return (
    <div className="history-view">
      <div className="history-header">
        <div>
          <h2 className="history-title">Historical Analytics</h2>
          {meta && (
            <p className="history-meta">
              {meta.counts.sensors} sensor records · {meta.counts.alerts} alerts
            </p>
          )}
        </div>
        <TimeRangeSelector
          range={range}
          onChange={handleRangeChange}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>

      {error && (
        <div className="history-error">
          ⚠ Failed to load data: {error}
        </div>
      )}

      <div className="charts-grid">
        <TrendChart
          title="Temperature"
          data={sensors}
          lines={[{ key: 'temperature', color: '#f97316', label: 'Temp' }]}
          unit="°C"
        />
        <TrendChart
          title="Motor Speed"
          data={sensors}
          lines={[{ key: 'motor_speed', color: '#3b82f6', label: 'Speed' }]}
          unit="RPM"
        />
        <TrendChart
          title="Health Score"
          data={health}
          lines={[
            { key: 'score', color: '#10b981', label: 'Score' },
            { key: 'confidence', color: '#8b5cf6', label: 'Confidence %' },
          ]}
          yDomain={[0, 100]}
        />
        <TrendChart
          title="Vibration — Accelerometer"
          data={vibration}
          lines={[
            { key: 'acc_x', color: '#ef4444', label: 'X' },
            { key: 'acc_y', color: '#10b981', label: 'Y' },
            { key: 'acc_z', color: '#3b82f6', label: 'Z' },
          ]}
          unit="g"
        />
        <TrendChart
          title="Vibration — Gyroscope"
          data={vibration}
          lines={[
            { key: 'gyro_x', color: '#f59e0b', label: 'X' },
            { key: 'gyro_y', color: '#06b6d4', label: 'Y' },
            { key: 'gyro_z', color: '#a855f7', label: 'Z' },
          ]}
          unit="°/s"
        />
        <TrendChart
          title="Power & Voltage"
          data={sensors}
          lines={[
            { key: 'power', color: '#ec4899', label: 'Power (W)' },
            { key: 'voltage', color: '#eab308', label: 'Voltage (V)' },
          ]}
        />
      </div>

      <div className="history-tables">
        <AlertHistory data={alerts} />
        <DetectionHistory data={detections} />
      </div>
    </div>
  );
}
