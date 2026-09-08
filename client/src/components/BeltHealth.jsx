import React from 'react';

const statusConfig = {
  Healthy:  { color: '#10b981', bg: '#ecfdf5' },
  Warning:  { color: '#f59e0b', bg: '#fffbeb' },
  Critical: { color: '#ef4444', bg: '#fef2f2' },
};

export default function BeltHealth({ health }) {
  const h = health || {};
  const score = h.score ?? null;
  const confidence = h.confidence ?? null;
  const status = h.status || 'Unknown';
  const cfg = statusConfig[status] || { color: '#64748b', bg: '#f1f5f9' };

  const barWidth = score != null ? Math.max(0, Math.min(100, score)) : 0;

  return (
    <div className="card belt-health" style={{ borderTop: `4px solid ${cfg.color}` }}>
      <h3>Belt Health</h3>
      
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem 0' }}>
        <div style={{ 
            fontSize: '4.5rem', 
            fontWeight: '900', 
            lineHeight: '1', 
            color: cfg.color,
            fontVariantNumeric: 'tabular-nums',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }}>
          {score != null ? score.toFixed(1) : '—'}
        </div>
        
        <div style={{
          marginTop: '0.75rem',
          padding: '0.35rem 1.25rem',
          background: cfg.bg,
          color: cfg.color,
          fontWeight: '800',
          borderRadius: '2px',
          fontSize: '1.2rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {status}
        </div>
      </div>

      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '1px', overflow: 'hidden', margin: '1rem 0' }}>
        <div style={{ width: `${barWidth}%`, height: '100%', background: cfg.color, transition: 'width 0.5s ease' }} />
      </div>

      <div className="status-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: 'auto' }}>
        <span className="label" style={{ fontWeight: '600' }}>AI Confidence</span>
        <span style={{ 
          fontWeight: '700', 
          color: '#334155',
          fontSize: '1rem',
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        }}>
          {confidence != null ? `${(confidence * 100).toFixed(1)}%` : '—'}
        </span>
      </div>
    </div>
  );
}
