import { useEffect, useState, useRef } from 'react';
import { useMatchStore } from '../store/matchStore';
import { soundManager } from '../engine/sound';

export function RedCardFlash() {
  const recentEvents = useMatchStore((s) => s.recentEvents);
  const [visible, setVisible] = useState(false);
  const lastRedCardTime = useRef(0);

  useEffect(() => {
    // Find the most recent red card event
    const latestRedCard = recentEvents.find((e) => e.type === 'redCard');
    if (!latestRedCard) return;

    // Only trigger if this is a new red card event
    if (latestRedCard.timestamp > lastRedCardTime.current) {
      lastRedCardTime.current = latestRedCard.timestamp;
      soundManager.playRedCard();
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [recentEvents]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <img src="/images/red-card.png" alt="Red Card" style={styles.cardImage} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 0, 0, 0.25)',
    zIndex: 150,
    pointerEvents: 'none',
    animation: 'redCardFlash 0.5s ease-out forwards',
  },
  cardImage: {
    width: 120,
    height: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.8))',
    animation: 'celebBounce 0.3s ease-out',
  },
};
