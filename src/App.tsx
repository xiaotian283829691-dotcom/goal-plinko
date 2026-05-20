import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlinkoBoard } from './components/PlinkoBoard';
import { Controls } from './components/Controls';
import { MatchTicker } from './components/MatchTicker';
import { TeamSelector } from './components/TeamSelector';
import { GoalRush } from './components/GoalRush';
import { initMatchData, stopMatchPolling } from './services/footballApi';
import { useMatchStore } from './store/matchStore';

function App() {
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const selectedTeam = useMatchStore((s) => s.selectedTeam);

  useEffect(() => {
    initMatchData();
    return () => stopMatchPolling();
  }, []);

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Header />
        <MatchTicker />
        <div style={styles.teamBar}>
          <button
            style={styles.teamBtn}
            onClick={() => setShowTeamSelector(true)}
          >
            {selectedTeam
              ? `${useMatchStore.getState().selectedTeam ? '⚽' : ''} Change Team`
              : '⚽ Pick Your Team'}
          </button>
        </div>
        <PlinkoBoard />
        <Controls />
      </div>
      <GoalRush />
      {showTeamSelector && (
        <TeamSelector onClose={() => setShowTeamSelector(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
  },
  teamBar: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 12px',
  },
  teamBtn: {
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: 6,
    color: '#d4a853',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 12px',
    cursor: 'pointer',
  },
};

export default App;
