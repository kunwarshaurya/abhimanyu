import React from 'react';
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

/**
 * Reusable trend line chart.
 *
 * Props:
 *   title   — card title
 *   data    — array of row objects
 *   xKey    — key for x-axis (default 'recorded_at')
 *   lines   — [{ key, color, label }]
 *   yDomain — [min, max] or 'auto'
 *   unit    — string for tooltip suffix (°C, RPM, etc.)
 */

// Format timestamp for X axis (defined outside component to avoid re-creation)
const formatTime = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format tooltip timestamp
const formatTooltipLabel = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

export default function TrendChart({ title, data, xKey = 'recorded_at', lines, yDomain, unit }) {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="card chart-card">
      <h3>{title}</h3>
      {isEmpty ? (
        <div className="chart-empty">No data for this time range</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey={xKey}
              tickFormatter={formatTime}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain || ['auto', 'auto']}
              tick={{ fontSize: 11 }}
              width={45}
            />
            <Tooltip
              labelFormatter={formatTooltipLabel}
              formatter={(value) => [
                `${Number(value).toFixed(2)}${unit ? ' ' + unit : ''}`,
              ]}
            />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            {lines.map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label || line.key}
                stroke={line.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
