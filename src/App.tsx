import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PlinkoBoard } from './components/PlinkoBoard';
import { Controls } from './components/Controls';
import { MatchTicker } from './components/MatchTicker';
import { TeamSelector } from './components/TeamSelector';
import { GoalRush } from './components/GoalRush';
import { RedCardFlash } from './components/RedCardFlash';
import { WinCelebration } from './components/WinCelebration';
import { initMatchData, stopMatchPolling } from './services/footballApi';

function App() {
  const [showTeamSelector, setShowTeamSelector] = useState(false);

  useEffect(() => {
    initMatchData();
    return () => stopMatchPolling();
  }, []);

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Header onLogoClick={() => setShowTeamSelector(true)} />
        <MatchTicker />
        <PlinkoBoard />
        <Controls />
      </div>
      <GoalRush />
      <RedCardFlash />
      <WinCelebration />
      {showTeamSelector && (
        <TeamSelector onClose={() => setShowTeamSelector(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    height: '100dvh',
    background: '#0a0a0a',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    overflow: 'hidden',
  },
};

export default App;
