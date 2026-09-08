import React from 'react';

export default function DetectionStatus({ detection }) {
  const d = detection || {};
  const isCrack = d.crackDetected === true;

  return (
    <div className="card" style={{ borderTop: isCrack ? '4px solid #ef4444' : '4px solid #10b981' }}>
      <h3>Crack Detection</h3>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.25rem' }} className={isCrack ? 'pulse-red' : ''}>
          {isCrack ? '🔴' : '🟢'}
        </div>
        <div style={{ 
          fontSize: '1.3rem', 
          fontWeight: '800', 
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          color: isCrack ? '#ef4444' : '#10b981' 
        }}>
          {isCrack ? 'Crack Detected' : 'Crack Clear'}
        </div>
      </div>
    </div>
  );
}
