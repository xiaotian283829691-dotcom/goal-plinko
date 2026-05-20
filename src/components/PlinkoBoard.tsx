import { useEffect, useRef, useCallback } from 'react';
import { PlinkoEngine } from '../engine/physics';
import { useGameStore } from '../store/gameStore';
import { useMatchStore, TEAM_INFO } from '../store/matchStore';
import { ResultHistory } from './ResultHistory';
import { useTelegram } from '../hooks/useTelegram';

export function PlinkoBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PlinkoEngine | null>(null);
  const autoTimerRef = useRef<number>(0);

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
    if (!canvas) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.min(390, window.innerWidth - 2);
    const displayHeight = 520;

    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Virtual canvas at display resolution for Matter.js engine
    const virtualCanvas = document.createElement('canvas');
    virtualCanvas.width = displayWidth;
    virtualCanvas.height = displayHeight;

    const engine = new PlinkoEngine(virtualCanvas);
    engine.setOnBallLand((result) => {
      onResult(result.multiplier);

      // Haptic feedback based on result
      if (result.multiplier >= 2) {
        haptic.success();
      } else if (result.multiplier < 0.5) {
        haptic.error();
      }
    });

    // Hook into pin collision for haptic
    engine.setOnPinHit(() => {
      haptic.medium();
    });

    engine.start();
    engineRef.current = engine;

    // Render loop: copy virtual canvas to real HiDPI canvas
    let animId = 0;
    const renderToReal = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.drawImage(virtualCanvas, 0, 0);
      animId = requestAnimationFrame(renderToReal);
    };
    renderToReal();

    return () => {
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
    <div style={styles.wrapper}>
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
  },
  canvas: {
    display: 'block',
    cursor: 'pointer',
    background: '#0a1a0f',
    borderRadius: 8,
  },
};
