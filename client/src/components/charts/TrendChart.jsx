import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const formatTime = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTooltipLabel = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">{formatTooltipLabel(label)}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="tooltip-item">
            <span className="tooltip-color" style={{ backgroundColor: entry.color }}></span>
            <span className="tooltip-name">{entry.name}</span>
            <span className="tooltip-value">
              {Number(entry.value).toFixed(2)}
              {unit && <span className="tooltip-unit">{unit}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function TrendChart({ title, data, xKey = 'recorded_at', lines, yDomain, unit, height = 220, hideTitle = false, onExpand, children }) {
  const isEmpty = !data || data.length === 0;
  const [hiddenSeries, setHiddenSeries] = useState({});

  const toggleSeries = (dataKey) => {
    setHiddenSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  return (
    <div className="card chart-card">
      {!hideTitle && (
        <div className="chart-header">
          <h3>{title}</h3>
          {onExpand && (
            <button className="expand-btn" onClick={onExpand} title="Expand Chart">
              ⛶
            </button>
          )}
        </div>
      )}
      {children}
      {isEmpty ? (
        <div className="chart-empty">NO DATA FOR THIS PERIOD</div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey={xKey}
              tickFormatter={formatTime}
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickMargin={10}
              interval="preserveStartEnd"
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              domain={yDomain || ['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748B' }}
              width={45}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} />}
              cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />
            {lines.length > 1 && (
              <Legend 
                iconSize={8} 
                iconType="circle"
                wrapperStyle={{ fontSize: 11, color: '#334155', cursor: 'pointer', paddingTop: '10px' }}
                onClick={(e) => toggleSeries(e.dataKey)}
                formatter={(value, entry) => (
                  <span style={{ color: hiddenSeries[entry.dataKey] ? '#94A3B8' : '#111827', transition: 'color 0.2s' }}>
                    {value}
                  </span>
                )}
              />
            )}
            {lines.map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label || line.key}
                stroke={line.color}
                strokeWidth={hiddenSeries[line.key] ? 0 : 2}
                dot={false}
                activeDot={hiddenSeries[line.key] ? false : { r: 4, strokeWidth: 0, fill: line.color }}
                isAnimationActive={true}
                animationDuration={500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
