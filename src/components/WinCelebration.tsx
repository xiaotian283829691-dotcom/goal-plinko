import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

type CelebType = 'big-win' | 'mega-win' | 'streak';

const CELEB_CONFIG: Record<CelebType, { src: string; glow: string; label: string }> = {
  'big-win': {
    src: '/images/big-win.png',
    glow: 'rgba(255, 200, 0, 0.8)',
    label: 'BIG WIN!',
  },
  'mega-win': {
    src: '/images/mega-win.png',
    glow: 'rgba(255, 0, 200, 0.8)',
    label: 'MEGA WIN!',
  },
  streak: {
    src: '/images/streak-fire.png',
    glow: 'rgba(255, 100, 0, 0.8)',
    label: '3x STREAK!',
  },
};

const COOLDOWN_MS = 5000;

export function WinCelebration() {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const [active, setActive] = useState<CelebType | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const lastTimestamp = useRef(0);
  const lastStreakShown = useRef(0);
  const lastShownAt = useRef(0);

  useEffect(() => {
    if (history.length === 0) return;
    const latest = history[0];
    if (latest.timestamp <= lastTimestamp.current) return;
    lastTimestamp.current = latest.timestamp;

    if (Date.now() - lastShownAt.current < COOLDOWN_MS) return;

    let type: CelebType | null = null;
    if (latest.multiplier >= 10) {
      type = 'mega-win';
    } else if (latest.multiplier >= 5) {
      type = 'big-win';
    }

    if (type) {
      lastShownAt.current = Date.now();
      setActive(type);
      setFadeOut(false);
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setActive(null), 250);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [history]);

  useEffect(() => {
    if (streak >= 3 && streak !== lastStreakShown.current) {
      lastStreakShown.current = streak;
      if (Date.now() - lastShownAt.current < COOLDOWN_MS) return;
      lastShownAt.current = Date.now();
      setActive('streak');
      setFadeOut(false);
      const t = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setActive(null), 250);
      }, 500);
      return () => clearTimeout(t);
    }
    if (streak === 0) {
      lastStreakShown.current = 0;
    }
  }, [streak]);

  if (!active) return null;

  const cfg = CELEB_CONFIG[active];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 180,
      pointerEvents: 'none',
      background: 'radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.25s ease-out',
    }}>
      <img
        src={cfg.src}
        alt={cfg.label}
        style={{
          width: active === 'streak' ? '35%' : '50%',
          maxWidth: active === 'streak' ? 140 : 220,
          height: 'auto',
          objectFit: 'contain',
          filter: `drop-shadow(0 0 16px ${cfg.glow})`,
          animation: 'celebBounce 0.4s ease-out',
        }}
      />
      <div style={{
        marginTop: 6,
        fontSize: 14,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: 3,
        textShadow: `0 0 8px ${cfg.glow}`,
      }}>
        {cfg.label}
      </div>
    </div>
  );
}
