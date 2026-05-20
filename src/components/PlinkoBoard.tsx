import { useEffect, useRef, useCallback } from 'react';
import { PlinkoEngine } from '../engine/physics';
import { useGameStore } from '../store/gameStore';
import { useMatchStore, TEAM_INFO } from '../store/matchStore';
import { ResultHistory } from './ResultHistory';
import { useTelegram } from '../hooks/useTelegram';

export function PlinkoBoard() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PlinkoEngine | null>(null);
  const virtualCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoTimerRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const rows = useGameStore((s) => s.rows);
  const riskLevel = useGameStore((s) => s.riskLevel);
  const placeBet = useGameStore((s) => s.placeBet);
  const onResult = useGameStore((s) => s.onResult);
  const autoRunning = useGameStore((s) => s.autoRunning);
  const tickAuto = useGameStore((s) => s.tickAuto);
  const stopAuto = useGameStore((s) => s.stopAuto);
  const activeBalls = useGameStore((s) => s.activeBalls);

  const { haptic } = useTelegram({ activeBets: activeBalls });

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.min(420, wrapper.clientWidth);
    const displayHeight = wrapper.clientHeight;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = displayWidth;
    virtualCanvas.height = displayHeight;
    virtualCanvasRef.current = virtualCanvas;
    sizeRef.current = { w: displayWidth, h: displayHeight };

    const engine = new PlinkoEngine(virtualCanvas);
    engine.setOnBallLand((result) => {
      onResult(result.multiplier);
      if (result.multiplier >= 2) {
        haptic.success();
      } else if (result.multiplier < 0.5) {
        haptic.error();
      }
    });

    engine.setOnPinHit(() => {
      haptic.medium();
    });

    engine.start();
    engineRef.current = engine;

    let animId = 0;
    const renderToReal = () => {
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(virtualCanvas, 0, 0);
      animId = requestAnimationFrame(renderToReal);
    };
    renderToReal();

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const newW = Math.min(420, Math.floor(entry.contentRect.width));
      const newH = Math.floor(entry.contentRect.height);
      if (newW === sizeRef.current.w && newH === sizeRef.current.h) return;
      sizeRef.current = { w: newW, h: newH };
      canvas.style.width = newW + 'px';
      canvas.style.height = newH + 'px';
      canvas.width = newW * dpr;
      canvas.height = newH * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      virtualCanvas.width = newW;
      virtualCanvas.height = newH;
      engine.resize(newW, newH);
    });
    ro.observe(wrapper);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync rows
  useEffect(() => {
    engineRef.current?.setRows(rows);
  }, [rows]);

  // Sync risk
  useEffect(() => {
    engineRef.current?.setRisk(riskLevel);
  }, [riskLevel]);

  // Sync team ball skin
  const selectedTeam = useMatchStore((s) => s.selectedTeam);
  useEffect(() => {
    const src = selectedTeam ? TEAM_INFO[selectedTeam].ballImg : null;
    engineRef.current?.setTeamBall(src);
  }, [selectedTeam]);

  // Sync GOAL RUSH multiplier boost
  const multiplierBoost = useMatchStore((s) => s.multiplierBoost);
  useEffect(() => {
    engineRef.current?.setMultiplierBoost(multiplierBoost);
  }, [multiplierBoost]);

  // Drop a ball (deducts balance and tells engine to drop)
  const handleDrop = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const success = placeBet();
    if (success) {
      engine.dropBall(useGameStore.getState().betAmount);
      haptic.light(); // Haptic on ball drop
    }
  }, [placeBet, haptic]);

  // Listen for 'plinko-drop' custom event from Controls button
  useEffect(() => {
    const handler = () => handleDrop();
    window.addEventListener('plinko-drop', handler);
    return () => window.removeEventListener('plinko-drop', handler);
  }, [handleDrop]);

  // Auto-bet loop
  useEffect(() => {
    if (autoRunning) {
      const run = () => {
        const shouldContinue = tickAuto();
        if (shouldContinue) {
          handleDrop();
          autoTimerRef.current = window.setTimeout(run, 300);
        } else {
          stopAuto();
        }
      };
      run();
    } else {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = 0;
      }
    }

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = 0;
      }
    };
  }, [autoRunning, handleDrop, tickAuto, stopAuto]);

  // Tap canvas to drop in manual mode
  const handleCanvasClick = useCallback(() => {
    const mode = useGameStore.getState().mode;
    if (mode === 'manual') {
      handleDrop();
    }
  }, [handleDrop]);

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <ResultHistory />
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={styles.canvas}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    flex: '1 1 0',
    overflow: 'hidden',
    minHeight: 0,
    maxHeight: '62vh',
  },
  canvas: {
    display: 'block',
    cursor: 'pointer',
    background: '#0a1a0f',
    borderRadius: 8,
  },
};
