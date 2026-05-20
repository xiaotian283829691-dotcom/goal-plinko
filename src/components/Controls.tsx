import { useGameStore } from '../store/gameStore';
import { ROW_OPTIONS, RISK_LEVELS, type RiskLevel, type RowCount } from '../config/multipliers';
import { CREDIT_BET_OPTIONS } from '../config/game';

export function Controls() {
  const betAmount = useGameStore((s) => s.betAmount);
  const riskLevel = useGameStore((s) => s.riskLevel);
  const rows = useGameStore((s) => s.rows);
  const mode = useGameStore((s) => s.mode);
  const autoCount = useGameStore((s) => s.autoCount);
  const autoRunning = useGameStore((s) => s.autoRunning);
  const autoRemaining = useGameStore((s) => s.autoRemaining);
  const balance = useGameStore((s) => s.balance);
  const resetBalance = useGameStore((s) => s.resetBalance);

  const setBetAmount = useGameStore((s) => s.setBetAmount);
  const setRiskLevel = useGameStore((s) => s.setRiskLevel);
  const setRows = useGameStore((s) => s.setRows);
  const setMode = useGameStore((s) => s.setMode);
  const setAutoCount = useGameStore((s) => s.setAutoCount);
  const startAuto = useGameStore((s) => s.startAuto);
  const stopAuto = useGameStore((s) => s.stopAuto);

  const handleDropBall = () => {
    if (mode === 'auto') {
      if (autoRunning) {
        stopAuto();
      } else {
        startAuto();
      }
      return;
    }
    // Manual mode: dispatch event that PlinkoBoard handles
    window.dispatchEvent(new CustomEvent('plinko-drop'));
  };

  const canBet = balance >= betAmount;
  const outOfCredits = balance < CREDIT_BET_OPTIONS[0];

  return (
    <div style={styles.container}>
      {/* Bet Amount */}
      <div style={styles.row}>
        <span style={styles.label}>Bet</span>
        <div style={styles.chipRow}>
          {CREDIT_BET_OPTIONS.map((amt) => (
            <button
              key={amt}
              onClick={() => setBetAmount(amt)}
              style={{
                ...styles.chip,
                ...(betAmount === amt ? styles.chipActive : {}),
              }}
            >
              {amt}
            </button>
          ))}
        </div>
      </div>

      {/* Risk + Rows on same row */}
      <div style={styles.row}>
        <span style={styles.label}>Risk</span>
        <div style={styles.chipRow}>
          {RISK_LEVELS.map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskLevel(risk as RiskLevel)}
              style={{
                ...styles.chip,
                ...(riskLevel === risk ? styles.chipActive : {}),
              }}
            >
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ ...styles.label, marginLeft: 6 }}>Rows</span>
        <div style={styles.chipRow}>
          {ROW_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRows(r as RowCount)}
              style={{
                ...styles.chip,
                ...(rows === r ? styles.chipActive : {}),
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Toggle + Auto Count + Drop Button on same row */}
      <div style={styles.bottomRow}>
        <div style={styles.modeGroup}>
          <button
            onClick={() => setMode('manual')}
            style={{
              ...styles.modeChip,
              ...(mode === 'manual' ? styles.chipActive : {}),
            }}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('auto')}
            style={{
              ...styles.modeChip,
              ...(mode === 'auto' ? styles.chipActive : {}),
            }}
          >
            Auto
          </button>
          {mode === 'auto' && (
            <input
              type="number"
              value={autoRunning ? autoRemaining : autoCount}
              onChange={(e) => setAutoCount(parseInt(e.target.value) || 1)}
              disabled={autoRunning}
              style={styles.autoInput}
              min={1}
              max={100}
            />
          )}
        </div>

        {/* Drop Button or Refill Button */}
        {outOfCredits && !autoRunning ? (
          <button onClick={resetBalance} style={styles.refillButton}>
            +30 Credits
          </button>
        ) : (
          <button
            onClick={handleDropBall}
            disabled={!canBet && !autoRunning}
            style={{
              ...styles.dropButton,
              opacity: canBet || autoRunning ? 1 : 0.4,
              background: autoRunning ? '#cc3333' : '#d4a853',
            }}
          >
            {autoRunning
              ? `STOP (${autoRemaining})`
              : mode === 'auto'
                ? 'START'
                : 'DROP BALL'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '10px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 11,
    color: '#888',
    width: 32,
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ccc',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    background: '#d4a853',
    color: '#000',
    borderColor: '#d4a853',
  },
  modeGroup: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    flexShrink: 0,
  },
  modeChip: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ccc',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  autoInput: {
    width: 40,
    padding: '4px 6px',
    borderRadius: 5,
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: 10,
    textAlign: 'center' as const,
  },
  dropButton: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    border: 'none',
    background: '#d4a853',
    color: '#000',
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    transition: 'all 0.15s',
  },
  refillButton: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 10,
    border: '2px solid #44cc44',
    background: 'rgba(68, 204, 68, 0.1)',
    color: '#44cc44',
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 1,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
