import React, { useState, useEffect } from 'react';

const CLOUDINARY_URL = 'https://res.cloudinary.com/mvwoh0km/image/upload/v1788598947/rpi_capture.jpg';
const REFRESH_INTERVAL_MS = 2000;

export default function LiveInspectionImage() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [error, setError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const imageUrl = `${CLOUDINARY_URL}?t=${timestamp}`;

  return (
    <div className="card" style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '-1rem -1rem 1rem -1rem', padding: '0.5rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <span>LIVE INSPECTION</span>
        <span style={{ color: '#F97316', fontSize: '0.65rem' }}>● LIVE</span>
      </h3>
      
      <div style={{ 
        flexGrow: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#08111F',
        borderRadius: '2px', 
        overflow: 'hidden',
        position: 'relative',
        minHeight: '220px'
      }}>
        {error ? (
          <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>Camera feed unavailable</div>
        ) : (
          <img 
            src={imageUrl} 
            alt="Live Conveyor Feed" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={() => setError(true)}
            onLoad={() => setError(false)}
          />
        )}
      </div>
      
      <div style={{ 
        marginTop: '0.75rem', 
        fontSize: '0.7rem', 
        color: '#64748b', 
        textAlign: 'right',
        fontWeight: '500'
      }}>
        Updated just now
      </div>
    </div>
  );
}
