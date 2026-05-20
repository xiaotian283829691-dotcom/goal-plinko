import { useEffect, useState } from 'react';
import { useMatchStore } from '../store/matchStore';

export function GoalRush() {
  const goalRushActive = useMatchStore((s) => s.goalRushActive);
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (goalRushActive) {
      setVisible(true);
      setFadeOut(false);
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 500);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [goalRushActive]);

  if (!visible) return null;

  return (
    <div
      style={{
        ...styles.overlay,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <img
        src="/images/goal-rush.png"
        alt="GOAL RUSH"
        style={styles.image}
      />
      <div style={styles.boostText}>
        ALL MULTIPLIERS 2x FOR 5 MIN
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(255,77,0,0.15) 0%, rgba(0,0,0,0.6) 100%)',
  },
  image: {
    width: '80%',
    maxWidth: 320,
    height: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 30px rgba(255, 77, 0, 0.8))',
    animation: 'goalRushPulse 0.6s ease-in-out infinite alternate',
  },
  boostText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    textShadow: '0 0 10px rgba(255, 77, 0, 0.8), 0 0 20px rgba(255, 0, 63, 0.5)',
  },
};
