import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// ── Error Boundary for WebGL Fallback ─────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    console.error("3D Canvas Error:", error);
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '310px', background: '#08111F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: 'monospace', padding: '1rem', textAlign: 'center' }}>
          <div>
             <div>[ 3D Visualization Crashed ]</div>
             <div style={{ fontSize: '10px', marginTop: '0.5rem', color: '#94A3B8' }}>See console for details.</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Color Config ──────────────────────────────────────────────
const statusConfig = {
  Healthy:  { color: '#18C29C' },
  Warning:  { color: '#F5B942' },
  Critical: { color: '#EF4444' },
  Unknown:  { color: '#38BDF8' },
};

// ── 3D Components ─────────────────────────────────────────────

const BeltSurface = ({ speed, isRunning }) => {
  const canvasTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d');
    
    // Base belt color - lightened for visibility
    ctx.fillStyle = '#1A2C42';
    ctx.fillRect(0, 0, 512, 256);
    
    // Industrial grip stripes
    ctx.fillStyle = '#101D2D';
    for(let i=0; i<512; i+=16) {
      ctx.fillRect(i, 0, 4, 256); 
    }
    
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    return tex;
  }, []);

  useFrame((state, delta) => {
    // FIX: Mutate texture directly. Previously `texRef.current.offset` crashed 
    // because texRef was pointing to the Material, not the Texture.
    if (isRunning && canvasTex) {
      canvasTex.offset.x -= (speed / 100) * delta * 1.5;
    }
  });

  return (
    <group>
      {/* Top belt */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[11.5, 0.02, 2.9]} />
        <meshStandardMaterial map={canvasTex} roughness={0.9} color="#94A3B8" />
      </mesh>
      {/* Bottom belt */}
      <mesh position={[0, -0.45, 0]}>
        <boxGeometry args={[11.5, 0.02, 2.9]} />
        <meshStandardMaterial map={canvasTex} roughness={0.9} color="#64748B" />
      </mesh>
    </group>
  );
};

const Rollers = ({ speed, isRunning }) => {
  const leftRef = useRef();
  const rightRef = useRef();

  useFrame((state, delta) => {
    if (isRunning) {
      const rot = (speed / 100) * delta * 5;
      // FIX: Rotate around Y axis because cylinder is rotated Math.PI/2 around X to align with Z axis
      if (leftRef.current) leftRef.current.rotation.y -= rot;
      if (rightRef.current) rightRef.current.rotation.y -= rot;
    }
  });

  return (
    <group>
      <mesh ref={leftRef} position={[-5.75, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 3, 32]} />
        <meshStandardMaterial color="#34465A" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh ref={rightRef} position={[5.75, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 3, 32]} />
        <meshStandardMaterial color="#34465A" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
};

const Frame = ({ healthStatus }) => {
  const color = statusConfig[healthStatus]?.color || '#38BDF8';
  const isWarning = healthStatus === 'Warning';
  const isCritical = healthStatus === 'Critical';

  const glowIntensity = isCritical ? 3 : (isWarning ? 2 : 1);

  return (
    <group>
      {[-1.6, 1.6].map((z, idx) => (
        <group key={idx} position={[0, 0, z]}>
          {/* Main side rail - brightened slightly for contrast */}
          <mesh>
            <boxGeometry args={[12.5, 0.3, 0.15]} />
            <meshStandardMaterial color="#1A2F4C" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* Top guard rail */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[12.5, 0.05, 0.1]} />
            <meshStandardMaterial color="#34465A" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Vertical struts */}
          {[-5, -2.5, 0, 2.5, 5].map(x => (
            <mesh key={x} position={[x, -0.6, 0]}>
              <boxGeometry args={[0.15, 1.2, 0.15]} />
              <meshStandardMaterial color="#142338" metalness={0.6} />
            </mesh>
          ))}
          {/* Bearing blocks for rollers */}
          {[-5.75, 5.75].map(x => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.3, 0.5, 0.3]} />
              <meshStandardMaterial color="#24364D" metalness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Health Glow Under-lighting */}
      <pointLight position={[0, -0.5, 0]} color={color} intensity={glowIntensity} distance={12} />
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[11, 0.1, 2.8]} />
        <meshBasicMaterial color={color} transparent opacity={isCritical ? 0.3 : (isWarning ? 0.2 : 0.05)} />
      </mesh>
    </group>
  );
};

const Sensor = ({ position, label, value }) => (
  <group position={position}>
    <mesh position={[0, 0, 0.1]}>
      <boxGeometry args={[0.25, 0.25, 0.15]} />
      <meshStandardMaterial color="#0F1B2D" metalness={0.6} />
    </mesh>
    <mesh position={[0, 0, 0.2]}>
      <cylinderGeometry args={[0.04, 0.04, 0.08]} rotation={[Math.PI/2, 0, 0]} />
      <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.5} />
    </mesh>
    <Html center position={[0, 0.3, 0.1]} style={{ pointerEvents: 'none' }}>
      <div style={{ 
        background: 'rgba(15,27,45,0.85)', border: '1px solid #24364D', borderRadius: '2px',
        padding: '2px 4px', color: '#38BDF8', fontSize: '8px', fontFamily: 'monospace', whiteSpace: 'nowrap'
      }}>
        {label} <span style={{ color: '#E6EDF5' }}>{value}</span>
      </div>
    </Html>
  </group>
);

const CameraObj = () => (
  <group position={[-6.2, -0.8, 2.5]} rotation={[0.4, -0.4, 0]}>
    {/* Body */}
    <mesh>
      <boxGeometry args={[0.4, 0.4, 0.6]} />
      <meshStandardMaterial color="#0F1B2D" />
    </mesh>
    {/* Lens */}
    <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.15, 0.15, 0.2]} />
      <meshStandardMaterial color="#08111F" roughness={0.1} />
    </mesh>
    {/* Mount bracket */}
    <mesh position={[0, -0.3, 0]}>
      <boxGeometry args={[0.1, 0.3, 0.1]} />
      <meshStandardMaterial color="#34465A" />
    </mesh>
    <Html center position={[0, 0.4, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ color: '#94A3B8', fontSize: '9px', fontFamily: 'monospace' }}>CAM</div>
    </Html>
  </group>
);

const Motor = ({ speed, isRunning }) => {
  const shaftRef = useRef();
  useFrame((state, delta) => {
    if (isRunning && shaftRef.current) {
      shaftRef.current.rotation.y -= (speed / 100) * delta * 5;
    }
  });

  return (
    <group position={[5.75, 0, -2.2]}>
      {/* Motor body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.2, 16]} />
        <meshStandardMaterial color="#142338" metalness={0.4} />
      </mesh>
      {/* Cooling fins (visual depth) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.52, 0.52, 0.8, 16]} />
        <meshStandardMaterial color="#0F1B2D" wireframe />
      </mesh>
      {/* Drive Shaft connecting to roller */}
      <mesh ref={shaftRef} position={[0, 0, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} />
      </mesh>
      <Html center position={[0, 0.8, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#38BDF8', fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold' }}>DRIVE</div>
      </Html>
    </group>
  );
};

const AirKnife = () => (
  <group position={[-6.2, -0.2, 2.5]} rotation={[0, 0, Math.PI / 4]}>
    {/* Main pipe */}
    <mesh>
      <cylinderGeometry args={[0.04, 0.04, 0.5]} />
      <meshStandardMaterial color="#64748B" metalness={0.7} />
    </mesh>
    {/* Airflow nozzle */}
    <mesh position={[0, -0.25, 0]}>
      <boxGeometry args={[0.1, 0.1, 0.2]} />
      <meshStandardMaterial color="#34465A" metalness={0.6} />
    </mesh>
    {/* Subtle Airflow Cone clearing the lens */}
    <mesh position={[0, -0.6, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.15, 0.5, 8]} />
      <meshBasicMaterial color="#38BDF8" transparent opacity={0.15} depthWrite={false} />
    </mesh>
    <Html center position={[0.2, 0.3, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ color: '#94A3B8', fontSize: '8px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>AIR KNIFE</div>
    </Html>
  </group>
);

const ReflectiveTape = ({ speed, isRunning }) => {
  const tapeRef = useRef();
  useFrame((state, delta) => {
    if (isRunning && tapeRef.current) {
      let x = tapeRef.current.position.x;
      x -= (speed / 100) * delta * 1.5;
      if (x < -5.75) x = 5.75;
      tapeRef.current.position.x = x;
    }
  });

  return (
    <group ref={tapeRef} position={[0, 0.46, 0]}>
      <mesh>
        {/* Full width transverse strip perpendicular to travel */}
        <boxGeometry args={[0.2, 0.02, 2.85]} />
        <meshBasicMaterial color="#E6EDF5" />
      </mesh>
      <Html center position={[0, 0.3, 1.4]} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#94A3B8', fontSize: '8px', fontFamily: 'monospace' }}>REF</div>
      </Html>
    </group>
  );
};

const CrackMarker = ({ active }) => {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (active && ref.current) {
      const pulse = (Math.sin(clock.elapsedTime * 4) + 1) / 2;
      ref.current.material.opacity = 0.5 + pulse * 0.5;
      ref.current.position.y = 0.7 + pulse * 0.15;
    }
  });

  if (!active) return null;

  return (
    <group position={[1.5, 0, 0]}>
      {/* Damage overlay on belt */}
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 2.8]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      
      {/* Floating Marker */}
      <mesh ref={ref} position={[0, 0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.15, 0.3, 4]} />
        <meshBasicMaterial color="#EF4444" transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

const Ore = ({ speed, isRunning }) => {
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (isRunning && groupRef.current) {
      groupRef.current.children.forEach(child => {
        child.position.x -= (speed / 100) * delta * 1.5;
        if (child.position.x < -5.75) {
          child.position.x = 5.75 + Math.random();
          child.position.z = (Math.random() - 0.5) * 2.2;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[5.75 - i * 1.8, 0.52, (Math.random() - 0.5) * 2.2]}>
          <dodecahedronGeometry args={[0.1 + Math.random() * 0.08]} />
          <meshStandardMaterial color="#64748B" roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
};

const ConveyorScene = ({ speed, isRunning, healthStatus, crackDetected, sensorData }) => {
  return (
    <group position={[0, -0.2, 0]}>
      <BeltSurface speed={speed} isRunning={isRunning} />
      <Rollers speed={speed} isRunning={isRunning} />
      <Frame healthStatus={healthStatus} />
      
      {/* Sensors attached closely to the front rail */}
      <Sensor position={[-3, 0.3, 1.6]} label="TEMP" value={sensorData?.temperature ? `${sensorData.temperature.toFixed(1)}°C` : '—'} />
      <Sensor position={[-1, 0.3, 1.6]} label="LOAD" value="OK" />
      <Sensor position={[1, 0.3, 1.6]} label="MPU" value="ACTV" />
      <Sensor position={[3, 0.3, 1.6]} label="IR" value="OK" />

      <CameraObj />
      <AirKnife />
      <Motor speed={speed} isRunning={isRunning} />
      <ReflectiveTape speed={speed} isRunning={isRunning} />
      <Ore speed={speed} isRunning={isRunning} />
      
      <CrackMarker active={crackDetected} />
    </group>
  );
};

// ── Main Export ───────────────────────────────────────────────
export default function ConveyorVisualization({ data, simulationRunning = true }) {
  const motorSpeed = data?.sensorData?.motorSpeed ?? 0;
  const healthStatus = data?.health?.status ?? 'Unknown';
  const crackDetected = data?.detection?.crackDetected ?? false;
  const temperature = data?.sensorData?.temperature ?? 0;
  const isRunning = simulationRunning && motorSpeed > 0;
  
  const statusColor = statusConfig[healthStatus]?.color || '#38BDF8';

  // Determine simulation display state
  let simLabel, simColor;
  if (!simulationRunning) {
    simLabel = '⛔ STOPPED';
    simColor = '#EF4444';
  } else if (motorSpeed > 0) {
    simLabel = '▶ RUNNING';
    simColor = '#94A3B8';
  } else {
    simLabel = '■ IDLE';
    simColor = '#94A3B8';
  }

  return (
    <div style={{ position: 'relative', height: '310px', width: '100%', background: '#08111F', borderRadius: '2px', overflow: 'hidden' }}>
      <ErrorBoundary>
        <Canvas camera={{ position: [-2, 4, 10], fov: 45 }}>
          <color attach="background" args={['#08111F']} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={2.5} />
          <directionalLight position={[-5, 5, -5]} intensity={1.5} />
          
          <OrbitControls 
            target={[0, 0, 0]}
            enablePan={false} 
            minDistance={4} 
            maxDistance={15} 
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
          
          <ConveyorScene 
            speed={motorSpeed} 
            isRunning={isRunning} 
            healthStatus={healthStatus} 
            crackDetected={crackDetected} 
            sensorData={data?.sensorData}
          />
        </Canvas>
      </ErrorBoundary>
      
      {/* ── Status Bar Overlay ── */}
      <div style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        background: 'rgba(15, 27, 45, 0.92)', 
        borderTop: `2px solid ${statusColor}`, 
        padding: '0 1rem', 
        height: '32px', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', 
        fontSize: '11px', color: '#94A3B8' 
      }}>
        <div style={{ color: statusColor, fontWeight: 'bold' }}>
          ● {healthStatus.toUpperCase()}
        </div>
        <div>
          SPEED: {motorSpeed.toFixed(0)} RPM │ <span style={{ color: simColor }}>{simLabel}</span> │ TEMP: {temperature.toFixed(1)}°C
        </div>
        <div style={{ color: '#475569' }}>CONV-01</div>
      </div>
    </div>
  );
}

