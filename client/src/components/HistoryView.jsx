import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Comparison options that use existing data
const COMPARE_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'temperature', label: 'Temperature', source: 'sensors', dataKey: 'temperature', color: '#334155', unit: '°C' },
  { key: 'motor_speed', label: 'Motor Speed', source: 'sensors', dataKey: 'motor_speed', color: '#64748B', unit: 'RPM' },
];

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

  const [vibTab, setVibTab] = useState('ACCELEROMETER');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareWith, setCompareWith] = useState('none');

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

  useEffect(() => {
    loadAll(range);
  }, [range, loadAll]);

  // Derived Summary Metrics
  const summary = useMemo(() => {
    if (loading || !meta) return null;

    const calcAvg = (arr, key) => {
      if (!arr || arr.length === 0) return '--';
      let sum = 0;
      let count = 0;
      for (const item of arr) {
        const val = parseFloat(item[key]);
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      }
      return count > 0 ? (sum / count) : '--';
    };

    let avgHealth = calcAvg(health, 'score');
    if (avgHealth !== '--') avgHealth = avgHealth.toFixed(1);

    let avgTemp = calcAvg(sensors, 'temperature');
    if (avgTemp !== '--') avgTemp = avgTemp.toFixed(1);

    let avgSpeed = calcAvg(sensors, 'motor_speed');
    if (avgSpeed !== '--') avgSpeed = avgSpeed.toFixed(0);

    const totalAlerts = alerts.length;
    const totalCracks = detections.filter(d => d.crack_detected).length;

    return { avgHealth, avgTemp, avgSpeed, totalAlerts, totalCracks };
  }, [health, sensors, alerts, detections, loading, meta]);

  // Merge health + comparison data by timestamp
  const healthChartData = useMemo(() => {
    if (compareWith === 'none' || !health.length) return health;

    const option = COMPARE_OPTIONS.find(o => o.key === compareWith);
    if (!option) return health;

    const sourceData = option.source === 'sensors' ? sensors : [];
    if (!sourceData.length) return health;

    // Build a lookup from sensor timestamps → values
    const lookup = {};
    sourceData.forEach(row => {
      const key = new Date(row.recorded_at).getTime();
      lookup[key] = row[option.dataKey];
    });

    // For each health row, find the nearest sensor reading
    return health.map(h => {
      const ts = new Date(h.recorded_at).getTime();
      // Exact match first
      if (lookup[ts] !== undefined) {
        return { ...h, [option.dataKey]: lookup[ts] };
      }
      // Find nearest within 30s window
      const keys = Object.keys(lookup).map(Number);
      let nearest = null;
      let minDist = Infinity;
      for (const k of keys) {
        const dist = Math.abs(k - ts);
        if (dist < minDist && dist < 30000) {
          minDist = dist;
          nearest = k;
        }
      }
      return { ...h, [option.dataKey]: nearest !== null ? lookup[nearest] : null };
    });
  }, [health, sensors, compareWith]);

  // Build the lines array for the health chart
  const healthLines = useMemo(() => {
    const lines = [
      { key: 'score', color: '#F97316', label: 'Health Score' },
      { key: 'confidence', color: '#CBD5E1', label: 'Confidence %' },
    ];
    if (compareWith !== 'none') {
      const option = COMPARE_OPTIONS.find(o => o.key === compareWith);
      if (option) {
        lines.push({ key: option.dataKey, color: option.color, label: option.label });
      }
    }
    return lines;
  }, [compareWith]);

  const isEmpty = !loading && !error && sensors.length === 0 && health.length === 0;

  return (
    <div className="history-view">
      <div className="history-header">
        <div className="history-header-left">
          <h2 className="history-title">HISTORY &amp; ANALYTICS</h2>
          <p className="history-subtitle">Conveyor health and operating trends</p>
        </div>
        <div className="history-header-right">
          <div className="history-machine-id">CONV-01</div>
          <TimeRangeSelector range={range} onChange={setRange} onRefresh={() => loadAll(range)} loading={loading} />
        </div>
      </div>

      {error && (
        <div className="history-error">
          <div><strong>Unable to load historical data.</strong></div>
          <div>{error}</div>
          <button onClick={() => loadAll(range)}>Retry</button>
        </div>
      )}

      {loading && !summary && !error && (
        <div className="history-loading">
          <div className="history-loading-spinner"></div>
          Loading historical data...
        </div>
      )}

      {isEmpty && (
        <div className="history-empty">
          <h3 style={{ color: '#111827', margin: '0 0 0.5rem 0' }}>NO HISTORICAL DATA</h3>
          <p style={{ margin: 0 }}>No records available for the selected time range.</p>
        </div>
      )}

      {!isEmpty && !error && summary && (
        <div className={`history-content ${loading ? 'loading-overlay' : ''}`}>

          {/* Summary Strip */}
          <div className="history-summary-grid">
            <div className="history-summary-card">
              <div className="summary-label">Avg Health Score</div>
              <div className="summary-value">{summary.avgHealth}</div>
            </div>
            <div className="history-summary-card">
              <div className="summary-label">Avg Temperature</div>
              <div className="summary-value">{summary.avgTemp} <span className="summary-unit">°C</span></div>
            </div>
            <div className="history-summary-card">
              <div className="summary-label">Avg Motor Speed</div>
              <div className="summary-value">{summary.avgSpeed} <span className="summary-unit">RPM</span></div>
            </div>
            <div className="history-summary-card">
              <div className="summary-label">Total Alerts</div>
              <div className="summary-value highlight-orange">{summary.totalAlerts}</div>
            </div>
            <div className="history-summary-card">
              <div className="summary-label">Crack Detections</div>
              <div className="summary-value highlight-orange">{summary.totalCracks}</div>
            </div>
          </div>

          {/* Primary Health Chart */}
          <div className="history-primary-chart">
            <TrendChart
              title="BELT HEALTH TREND"
              data={healthChartData}
              lines={healthLines}
              yDomain={compareWith === 'none' ? [0, 100] : undefined}
              height={300}
              onExpand={() => setIsFullscreen(true)}
            >
              <div className="compare-selector">
                <label className="compare-label">Compare with</label>
                <select
                  className="compare-select"
                  value={compareWith}
                  onChange={e => setCompareWith(e.target.value)}
                >
                  {COMPARE_OPTIONS.map(o => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
            </TrendChart>
          </div>

          {/* Fullscreen Modal */}
          {isFullscreen && (
            <div className="chart-fullscreen-modal" onClick={() => setIsFullscreen(false)}>
              <div className="chart-fullscreen-content" onClick={e => e.stopPropagation()}>
                <div className="fullscreen-header">
                  <h2>BELT HEALTH TREND</h2>
                  <div className="fullscreen-controls">
                    <div className="compare-selector">
                      <label className="compare-label">Compare</label>
                      <select
                        className="compare-select"
                        value={compareWith}
                        onChange={e => setCompareWith(e.target.value)}
                      >
                        {COMPARE_OPTIONS.map(o => (
                          <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <button className="close-btn" onClick={() => setIsFullscreen(false)}>✕</button>
                  </div>
                </div>
                <TrendChart
                  hideTitle={true}
                  data={healthChartData}
                  lines={healthLines}
                  yDomain={compareWith === 'none' ? [0, 100] : undefined}
                  height={500}
                />
              </div>
            </div>
          )}

          {/* Secondary Charts */}
          <div className="history-charts-grid">
            <TrendChart
              title="TEMPERATURE TREND"
              data={sensors}
              lines={[{ key: 'temperature', color: '#334155', label: 'Temperature' }]}
              unit="°C"
            />
            <TrendChart
              title="MOTOR SPEED"
              data={sensors}
              lines={[{ key: 'motor_speed', color: '#334155', label: 'Speed' }]}
              unit="RPM"
            />

            {/* Vibration Analytics with Tabs */}
            <div className="vibration-analytics-card">
              <div className="vibration-header">
                <h3>VIBRATION ANALYTICS</h3>
                <div className="vibration-tabs">
                  <button className={vibTab === 'ACCELEROMETER' ? 'active' : ''} onClick={() => setVibTab('ACCELEROMETER')}>ACCELEROMETER</button>
                  <button className={vibTab === 'GYROSCOPE' ? 'active' : ''} onClick={() => setVibTab('GYROSCOPE')}>GYROSCOPE</button>
                </div>
              </div>
              <div className="vibration-body">
                {vibTab === 'ACCELEROMETER' ? (
                  <TrendChart
                    hideTitle={true}
                    data={vibration}
                    lines={[
                      { key: 'acc_x', color: '#334155', label: 'Acc X' },
                      { key: 'acc_y', color: '#64748B', label: 'Acc Y' },
                      { key: 'acc_z', color: '#CBD5E1', label: 'Acc Z' },
                    ]}
                    unit="g"
                    height={200}
                  />
                ) : (
                  <TrendChart
                    hideTitle={true}
                    data={vibration}
                    lines={[
                      { key: 'gyro_x', color: '#334155', label: 'Gyro X' },
                      { key: 'gyro_y', color: '#64748B', label: 'Gyro Y' },
                      { key: 'gyro_z', color: '#CBD5E1', label: 'Gyro Z' },
                    ]}
                    unit="°/s"
                    height={200}
                  />
                )}
              </div>
            </div>

            {/* Power & Voltage */}
            <TrendChart
              title="POWER & VOLTAGE"
              data={sensors}
              lines={[
                { key: 'power', color: '#334155', label: 'Power (W)' },
                { key: 'voltage', color: '#64748B', label: 'Voltage (V)' },
              ]}
            />
          </div>

          <div className="history-tables-grid">
            <AlertHistory data={alerts} />
            <DetectionHistory data={detections} />
          </div>
        </div>
      )}
    </div>
  );
}
