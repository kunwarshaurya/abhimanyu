import { useEffect, useRef } from 'react';

/**
 * ConveyorVisualization — Refined canvas animation of a mining conveyor.
 *
 * Architecture (unchanged from Phase 6):
 *  - requestAnimationFrame loop runs continuously
 *  - incoming data updates a ref (no React re-render)
 *  - draw loop reads the ref every frame
 *
 * Phase 6 refinements:
 *  - More realistic conveyor with thicker belt, bearing housings
 *  - Camera repositioned to side/base angle
 *  - Air knife component added
 *  - Reflective tape loop marker on belt
 *  - Improved motor/encoder visual with drive shaft
 *  - Sensor mounts integrated into frame structure
 *  - Joint detection indicator (distinct from crack)
 *  - Better health-state color transitions with glow
 */

// ── Health-dependent color palettes ───────────────────────
const THEME = {
  Healthy:  { belt: '#3f4f5f', beltEdge: '#5a6a7a', glow: '#10b981', glowRGB: '16,185,129', label: '#10b981' },
  Warning:  { belt: '#7c5a20', beltEdge: '#a67c34', glow: '#f59e0b', glowRGB: '245,158,11', label: '#f59e0b' },
  Critical: { belt: '#7f1d1d', beltEdge: '#a33030', glow: '#ef4444', glowRGB: '239,68,68',  label: '#ef4444' },
  Unknown:  { belt: '#3f4f5f', beltEdge: '#5a6a7a', glow: '#6b7280', glowRGB: '107,114,128', label: '#6b7280' },
};

const CANVAS_H = 310;

export default function ConveyorVisualization({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Live state — updated on new data, read by draw loop (no re-render)
  const stateRef = useRef({
    motorSpeed: 0,
    healthStatus: 'Unknown',
    crackDetected: false,
    jointDetected: false,
    temperature: 0,
    beltOffset: 0,
    rollerAngle: 0,
  });

  // Sync incoming data → ref
  useEffect(() => {
    if (!data) return;
    const s = stateRef.current;
    s.motorSpeed = data.sensorData?.motorSpeed ?? 0;
    s.healthStatus = data.health?.status ?? 'Unknown';
    s.crackDetected = data.detection?.crackDetected ?? false;
    s.jointDetected = data.detection?.jointDetected ?? false;
    s.temperature = data.sensorData?.temperature ?? 0;
  }, [data]);

  // ── Animation loop (runs once, loops via rAF) ──────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = CANVAS_H * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = CANVAS_H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ────────────────────────────────────────────────────
    // DRAWING HELPERS
    // ────────────────────────────────────────────────────

    function getTheme() {
      return THEME[stateRef.current.healthStatus] || THEME.Unknown;
    }

    // ── Background ──
    function drawBackground(w, h) {
      // Dark gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0c1322');
      grad.addColorStop(1, '#111827');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }

    // ── Support frame ──
    function drawFrame(L, lx, rx, ty, by) {
      const legBot = by + 55;
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';

      // Legs
      const legs = [lx + 25, lx + L * 0.35, lx + L * 0.65, rx - 25];
      legs.forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, by + 10); ctx.lineTo(x, legBot); ctx.stroke();
        // Foot plate
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 10, legBot); ctx.lineTo(x + 10, legBot); ctx.stroke();
        ctx.lineWidth = 5;
      });

      // Cross brace
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(legs[0], by + 35);
      ctx.lineTo(legs[legs.length - 1], by + 35);
      ctx.stroke();

      // Side rails (frame edges along belt)
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx - 6, ty - 8);
      ctx.lineTo(rx + 6, ty - 8);
      ctx.stroke();

      ctx.lineCap = 'butt';
    }

    // ── Roller with bearing housing ──
    function drawRoller(cx, cy, r, angle, isDrive) {
      // Bearing housing (rectangular block behind roller)
      ctx.fillStyle = '#374151';
      const bw = 14, bh = r * 2 + 10;
      ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);

      // Roller body
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const rGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      rGrad.addColorStop(0, '#9ca3af');
      rGrad.addColorStop(1, '#4b5563');
      ctx.fillStyle = rGrad;
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Spokes (rotating)
      ctx.strokeStyle = 'rgba(55,65,81,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = angle + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
        ctx.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
        ctx.stroke();
      }

      // Center hub
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#1f2937';
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ── Belt surface ──
    function drawBelt(lx, rx, ty, by, rR, theme, offset) {
      const beltH = 14;
      const centerY = (ty + by) / 2;

      // Belt wraps — left arc
      ctx.lineWidth = beltH;
      ctx.strokeStyle = theme.belt;
      ctx.beginPath();
      ctx.arc(lx, centerY, rR, -Math.PI / 2, Math.PI / 2, true);
      ctx.stroke();

      // Belt wraps — right arc
      ctx.beginPath();
      ctx.arc(rx, centerY, rR, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();

      // ── Top belt (carry side) ──
      ctx.fillStyle = theme.belt;
      ctx.fillRect(lx, ty - beltH / 2, rx - lx, beltH);
      // Edge highlight
      ctx.fillStyle = theme.beltEdge;
      ctx.fillRect(lx, ty - beltH / 2, rx - lx, 2);

      // Moving segment marks (chevron-style dashes)
      const seg = 32;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      const s = lx - (offset % seg);
      for (let x = s; x <= rx; x += seg) {
        if (x >= lx && x <= rx) {
          ctx.beginPath();
          ctx.moveTo(x, ty - beltH / 2 + 2);
          ctx.lineTo(x + 4, ty);
          ctx.lineTo(x, ty + beltH / 2 - 2);
          ctx.stroke();
        }
      }

      // ── Bottom return belt ──
      ctx.fillStyle = theme.belt;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(lx, by - 4, rx - lx, 8);
      // Return marks (opposite direction)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      const rs = lx - ((-offset) % seg + seg) % seg;
      for (let x = rs; x <= rx; x += seg) {
        if (x >= lx && x <= rx) {
          ctx.beginPath();
          ctx.moveTo(x, by - 3);
          ctx.lineTo(x, by + 3);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // ── Reflective tape marker ──
    function drawReflectiveTape(lx, rx, ty, offset) {
      const beltLen = rx - lx;
      const tapeSpacing = beltLen * 1.6; // one tape per ~1.6x visible belt
      const tapeX = lx + ((tapeSpacing - (offset % tapeSpacing)) % tapeSpacing);

      if (tapeX >= lx + 5 && tapeX <= rx - 5) {
        // Bright reflective strip
        ctx.fillStyle = '#e0e7ff';
        ctx.shadowColor = '#818cf8';
        ctx.shadowBlur = 6;
        ctx.fillRect(tapeX - 2, ty - 6, 4, 12);
        ctx.shadowBlur = 0;

        // Small label above (only when near center)
        if (tapeX > lx + beltLen * 0.2 && tapeX < lx + beltLen * 0.8) {
          ctx.font = '8px monospace';
          ctx.fillStyle = '#a5b4fc';
          ctx.textAlign = 'center';
          ctx.fillText('REF', tapeX, ty - 12);
        }
      }
    }

    // ── Ore / material on belt ──
    function drawOre(lx, rx, ty, offset) {
      const sp = 48;
      const startX = lx + 15 - (offset % sp);

      for (let x = startX; x <= rx - 15; x += sp) {
        if (x < lx + 8 || x > rx - 8) continue;
        const seed = Math.sin(x * 0.37) * 10000;
        const w = 10 + (seed % 6);
        const h = 5 + ((seed * 0.7) % 3);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(x + 1, ty - 7, w / 2, h / 2 - 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rock
        ctx.fillStyle = `hsl(30, ${8 + (seed % 10)}%, ${35 + (seed % 15)}%)`;
        ctx.beginPath();
        ctx.ellipse(x, ty - 9, w / 2, h / 2, 0.1 * (seed % 5), 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.ellipse(x - 1, ty - 11, w / 4, h / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Motor / encoder ──
    function drawMotor(cx, cy, r, angle, speed) {
      const mx = cx + r + 8;
      const mw = 32, mh = 38;
      const my = cy - mh / 2;

      // Motor body
      const mGrad = ctx.createLinearGradient(mx, my, mx + mw, my);
      mGrad.addColorStop(0, '#374151');
      mGrad.addColorStop(0.5, '#4b5563');
      mGrad.addColorStop(1, '#374151');
      ctx.fillStyle = mGrad;
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, mw, mh);

      // Cooling fins
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const fy = my + 8 + i * 7;
        ctx.beginPath(); ctx.moveTo(mx + 2, fy); ctx.lineTo(mx + mw - 2, fy); ctx.stroke();
      }

      // Drive shaft connection (circle at junction)
      ctx.beginPath();
      ctx.arc(cx + r + 4, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1f2937';
      ctx.fill();
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Labels
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#9ca3af';
      ctx.textAlign = 'center';
      ctx.fillText('MOTOR', mx + mw / 2, my - 4);

      ctx.font = '9px monospace';
      ctx.fillStyle = speed > 0 ? '#10b981' : '#ef4444';
      ctx.fillText(speed > 0 ? `${speed.toFixed(0)} RPM` : 'STOP', mx + mw / 2, my + mh + 12);
    }

    // ── Air knife ──
    function drawAirKnife(x, ty) {
      const aky = ty - 26;
      const akw = 50, akh = 10;

      // Mounting bracket
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, aky + akh + 2);
      ctx.lineTo(x, ty - 10);
      ctx.stroke();

      // Body
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - akw / 2, aky, akw, akh);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - akw / 2, aky, akw, akh);

      // Slot (air outlet)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - akw / 2 + 4, aky + akh - 3, akw - 8, 2);

      // Air flow lines
      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 3]);
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 10, aky + akh + 1);
        ctx.lineTo(x + i * 10, ty - 10);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('AIR KNIFE', x, aky - 5);
    }

    // ── Camera (side/base mount, angled toward belt) ──
    function drawCamera(x, by) {
      const camY = by + 42;

      // Mounting bracket (angled)
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, by + 10);
      ctx.lineTo(x - 10, camY - 8);
      ctx.stroke();

      // Camera body (angled)
      ctx.save();
      ctx.translate(x - 10, camY);
      ctx.rotate(-0.4); // tilted upward toward belt

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-14, -8, 28, 16);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(-14, -8, 28, 16);

      // Lens
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      const lensGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 5);
      lensGrad.addColorStop(0, '#60a5fa');
      lensGrad.addColorStop(1, '#1e3a5f');
      ctx.fillStyle = lensGrad;
      ctx.fill();

      // Lens ring
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // LED indicator
      ctx.beginPath();
      ctx.arc(10, -4, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();

      ctx.restore();

      // Field-of-view lines (pointing up toward belt)
      ctx.strokeStyle = 'rgba(96,165,250,0.15)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(x - 10, camY - 4);
      ctx.lineTo(x - 25, by + 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 10, camY - 4);
      ctx.lineTo(x + 5, by + 8);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('CAMERA', x - 10, camY + 18);
    }

    // ── Sensor mounts ──
    function drawSensors(lx, rx, ty, by, theme) {
      const beltLen = rx - lx;
      const sensors = [
        { label: 'TEMP',     pos: 0.12, color: '#f97316' },
        { label: 'LOAD',     pos: 0.32, color: '#8b5cf6' },
        { label: 'MPU6050',  pos: 0.52, color: '#06b6d4' },
        { label: 'IR',       pos: 0.78, color: '#ef4444' },
      ];

      sensors.forEach(s => {
        const x = lx + beltLen * s.pos;

        // Mounting bracket (solid line from frame rail to sensor)
        ctx.strokeStyle = '#4b5563';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, by + 6);
        ctx.lineTo(x, by + 22);
        ctx.stroke();

        // Sensor housing (small box)
        const bw = 22, bh = 12;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - bw / 2, by + 22, bw, bh);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - bw / 2, by + 22, bw, bh);

        // Active LED
        ctx.beginPath();
        ctx.arc(x + bw / 2 - 4, by + 26, 2, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();

        // Label
        ctx.font = '8px monospace';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, x, by + 46);
      });
    }

    // ── Direction arrow ──
    function drawArrow(lx, ty) {
      const ay = ty - 22;
      const sx = lx + 20, ex = sx + 55;

      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, ay); ctx.lineTo(ex, ay);
      ctx.moveTo(ex, ay); ctx.lineTo(ex - 7, ay - 4);
      ctx.moveTo(ex, ay); ctx.lineTo(ex - 7, ay + 4);
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'left';
      ctx.fillText('BELT DIRECTION', sx, ay - 7);
    }

    // ── Crack detection overlay ──
    function drawCrack(lx, rx, ty, time) {
      const cX = lx + (rx - lx) * 0.58;
      const flash = Math.sin(time * 8) > 0;
      const beltH = 14;

      // Damage zone glow
      ctx.fillStyle = `rgba(239,68,68,${flash ? 0.15 : 0.06})`;
      ctx.fillRect(cX - 30, ty - beltH / 2 - 2, 60, beltH + 4);

      // Crack lines on belt surface
      ctx.strokeStyle = flash ? '#ef4444' : '#f87171';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cX - 12, ty - 5);
      ctx.lineTo(cX - 4, ty + 1);
      ctx.lineTo(cX + 2, ty - 3);
      ctx.lineTo(cX + 8, ty + 4);
      ctx.lineTo(cX + 14, ty - 1);
      ctx.stroke();

      // Secondary crack
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cX - 2, ty - 6);
      ctx.lineTo(cX + 3, ty + 3);
      ctx.stroke();

      // Warning bubble
      ctx.beginPath();
      ctx.arc(cX, ty - 24, 12, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#dc2626' : 'rgba(220,38,38,0.6)';
      ctx.fill();
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('!', cX, ty - 20);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText('CRACK DETECTED', cX, ty - 40);
    }

    // ── Joint detection indicator ──
    function drawJoint(lx, rx, ty, offset) {
      const beltLen = rx - lx;
      const jointSpacing = beltLen * 1.3;
      const jX = lx + ((jointSpacing - (offset % jointSpacing)) % jointSpacing);

      if (jX < lx + 8 || jX > rx - 8) return;

      // Joint splice mark (thicker line across belt)
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(jX, ty - 7);
      ctx.lineTo(jX, ty + 7);
      ctx.stroke();

      // Cross-hatch (splice pattern)
      ctx.strokeStyle = 'rgba(251,191,36,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(jX - 3, ty - 5); ctx.lineTo(jX + 3, ty + 5);
      ctx.moveTo(jX + 3, ty - 5); ctx.lineTo(jX - 3, ty + 5);
      ctx.stroke();

      // Label
      ctx.font = '8px monospace';
      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'center';
      ctx.fillText('JOINT', jX, ty - 14);
    }

    // ── Health glow effect on belt ──
    function drawHealthGlow(lx, rx, ty, by, theme, time) {
      const centerY = (ty + by) / 2;
      const status = stateRef.current.healthStatus;

      if (status === 'Healthy') return; // no extra glow when healthy

      const pulse = 0.3 + Math.sin(time * (status === 'Critical' ? 4 : 2)) * 0.15;

      // Glow around the belt perimeter
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = status === 'Critical' ? 18 : 10;
      ctx.strokeStyle = `rgba(${theme.glowRGB},${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, ty - 8);
      ctx.lineTo(rx, ty - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, by + 5);
      ctx.lineTo(rx, by + 5);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // ── Status bar ──
    function drawStatusBar(w, h, state, theme) {
      const barY = h - 32;

      // Background
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(0, barY, w, 32);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, barY); ctx.lineTo(w, barY); ctx.stroke();

      const isRunning = state.motorSpeed > 0;

      // Left: health status
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = theme.label;
      ctx.textAlign = 'left';
      ctx.fillText(`● ${state.healthStatus.toUpperCase()}`, 16, barY + 21);

      // Center: speed + running state
      ctx.font = '11px monospace';
      ctx.fillStyle = '#94a3b8';
      const centerText =
        `SPEED: ${state.motorSpeed.toFixed(0)} RPM  │  ` +
        `${isRunning ? '▶ RUNNING' : '■ STOPPED'}  │  ` +
        `TEMP: ${state.temperature.toFixed(1)}°C`;
      ctx.fillText(centerText, 200, barY + 21);

      // Right: machine ID
      ctx.textAlign = 'right';
      ctx.fillStyle = '#475569';
      ctx.fillText('CONV-01', w - 16, barY + 21);

      // Top glow bar
      ctx.fillStyle = theme.glow;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(0, 0, w, 2);
      ctx.globalAlpha = 1.0;
    }

    // ────────────────────────────────────────────────────
    // MAIN DRAW LOOP
    // ────────────────────────────────────────────────────

    function draw(timestamp) {
      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
      lastTime = timestamp;

      const state = stateRef.current;
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = CANVAS_H;
      const theme = getTheme();
      const time = timestamp / 1000;

      // Update continuous animation
      const speedNorm = state.motorSpeed / 80;
      state.beltOffset += speedNorm * 110 * dt;
      state.rollerAngle += speedNorm * 3.5 * dt;

      // Layout geometry
      const padL = 70, padR = 110; // extra right padding for motor
      const rollerR = 26;
      const centerY = h * 0.42;
      const lx = padL;
      const rx = w - padR;
      const ty = centerY - rollerR;
      const by = centerY + rollerR;
      const beltLen = rx - lx;

      // 1. Background
      drawBackground(w, h);

      // 2. Health glow
      drawHealthGlow(lx, rx, ty, by, theme, time);

      // 3. Frame / supports
      drawFrame(beltLen, lx, rx, ty, by);

      // 4. Belt
      drawBelt(lx, rx, ty, by, rollerR, theme, state.beltOffset);

      // 5. Reflective tape
      drawReflectiveTape(lx, rx, ty, state.beltOffset);

      // 6. Ore
      drawOre(lx, rx, ty, state.beltOffset);

      // 7. Rollers
      drawRoller(lx, centerY, rollerR, state.rollerAngle, false);
      drawRoller(rx, centerY, rollerR, -state.rollerAngle, true);

      // 8. Motor / encoder
      drawMotor(rx, centerY, rollerR, state.rollerAngle, state.motorSpeed);

      // 9. Air knife (positioned near discharge end)
      drawAirKnife(lx + beltLen * 0.82, ty);

      // 10. Direction arrow
      drawArrow(lx, ty);

      // 11. Camera (side/base mount, angled toward belt/bearing)
      drawCamera(lx + beltLen * 0.18, by);

      // 12. Sensor mounts
      drawSensors(lx, rx, ty, by, theme);

      // 13. Joint detection
      if (state.jointDetected) {
        drawJoint(lx, rx, ty, state.beltOffset);
      }

      // 14. Crack detection (drawn last for visibility)
      if (state.crackDetected) {
        drawCrack(lx, rx, ty, time);
      }

      // 15. Status bar
      drawStatusBar(w, h, state, theme);

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="conveyor-container" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
