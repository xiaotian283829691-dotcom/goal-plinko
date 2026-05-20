import { useGameStore } from '../store/gameStore';
import { useMatchStore, TEAM_INFO } from '../store/matchStore';
import { TipButton } from './TipButton';

interface HeaderProps {
  onLogoClick: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  const balance = useGameStore((s) => s.balance);
  const totalProfit = useGameStore((s) => s.totalProfit);
  const resetBalance = useGameStore((s) => s.resetBalance);
  const selectedTeam = useMatchStore((s) => s.selectedTeam);

  const showRefill = balance < 1;

  return (
    <div style={styles.container}>
      <div style={styles.left} onClick={onLogoClick}>
        <img src="/images/logo.png" alt="Goal Plinko" style={styles.logo} />
        {selectedTeam && (
          <span style={styles.teamFlag}>
            {TEAM_INFO[selectedTeam].flag}
          </span>
        )}
      </div>
      <div style={styles.right}>
        <div style={styles.balanceBox}>
          <span style={styles.balanceLabel}>Credits</span>
          <span style={styles.balanceValue}>
            <span style={styles.creditIcon}>🪙</span>
            {balance.toFixed(0)}
          </span>
        </div>
        <div style={{
          ...styles.profitBox,
          color: totalProfit >= 0 ? '#44cc44' : '#ff4444',
        }}>
          {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)}
        </div>
        {showRefill && (
          <button onClick={resetBalance} style={styles.refillBtn}>
            +30
          </button>
        )}
        <TipButton />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    background: '#111111',
    borderBottom: '1px solid #222',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  logo: {
    height: 28,
    objectFit: 'contain',
  },
  teamFlag: {
    fontSize: 14,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  balanceBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 9,
    color: '#888',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  creditIcon: {
    fontSize: 11,
  },
  profitBox: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 5px',
    borderRadius: 4,
    background: '#1a1a1a',
  },
  refillBtn: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #44cc44',
    background: 'rgba(68, 204, 68, 0.1)',
    color: '#44cc44',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};
