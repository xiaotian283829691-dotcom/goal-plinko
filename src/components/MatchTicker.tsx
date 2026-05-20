import { useEffect } from 'react';
import { useMatchStore } from '../store/matchStore';

export function MatchTicker() {
  const match = useMatchStore((s) => s.trackedMatch);
  const goalRushActive = useMatchStore((s) => s.goalRushActive);
  const tickGoalRush = useMatchStore((s) => s.tickGoalRush);

  useEffect(() => {
    const id = setInterval(tickGoalRush, 1000);
    return () => clearInterval(id);
  }, [tickGoalRush]);

  if (!match) return null;

  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED';

  return (
    <div style={styles.container}>
      <div style={styles.inner}>
        {isLive && <span style={styles.liveDot} />}
        <span style={styles.status}>
          {isLive ? `${match.minute}'` : isFinished ? 'FT' : 'PRE'}
        </span>
        <span style={styles.team}>{match.homeTeam}</span>
        <span style={styles.score}>
          {match.homeScore} - {match.awayScore}
        </span>
        <span style={styles.team}>{match.awayTeam}</span>
        {goalRushActive && (
          <span style={styles.rushBadge}>GOAL RUSH 2x</span>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'linear-gradient(90deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
    padding: '3px 8px',
    borderBottom: '1px solid #333',
    overflow: 'hidden',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    color: '#fff',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ff3333',
    animation: 'pulse 1.5s ease-in-out infinite',
    flexShrink: 0,
  },
  status: {
    color: '#aaa',
    fontSize: 10,
    minWidth: 24,
  },
  team: {
    maxWidth: 80,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  score: {
    fontSize: 12,
    fontWeight: 800,
    color: '#d4a853',
    padding: '0 3px',
  },
  rushBadge: {
    background: 'linear-gradient(135deg, #ff4d00, #ff003f)',
    color: '#fff',
    fontSize: 9,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 3,
    marginLeft: 4,
    animation: 'pulse 0.8s ease-in-out infinite',
  },
};
