import { useGameStore } from '../store/gameStore';

export function Header() {
  const balance = useGameStore((s) => s.balance);
  const totalProfit = useGameStore((s) => s.totalProfit);
  const resetBalance = useGameStore((s) => s.resetBalance);

  const showRefill = balance < 1;

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <img src="/images/logo.png" alt="Goal Plinko" style={styles.logo} />
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
            +30 Credits
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: '#111111',
    borderBottom: '1px solid #222',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    height: 36,
    objectFit: 'contain',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  creditIcon: {
    fontSize: 12,
  },
  profitBox: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 6px',
    borderRadius: 4,
    background: '#1a1a1a',
  },
  refillBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #44cc44',
    background: 'rgba(68, 204, 68, 0.1)',
    color: '#44cc44',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};
