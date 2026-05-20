import { useGameStore } from '../store/gameStore';
import { getMultiplierColor } from '../config/multipliers';

export function ResultHistory() {
  const history = useGameStore((s) => s.history);
  const recent = history.slice(0, 8);

  if (recent.length === 0) return null;

  return (
    <div style={styles.container}>
      {recent.map((entry, i) => (
        <div
          key={entry.timestamp + i}
          style={{
            ...styles.tag,
            background: getMultiplierColor(entry.multiplier),
            opacity: 1 - i * 0.08,
          }}
        >
          {entry.multiplier}x
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    right: 6,
    top: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    zIndex: 10,
  },
  tag: {
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    textAlign: 'center',
    minWidth: 36,
  },
};
