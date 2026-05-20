import { useMatchStore, TEAM_INFO, type TeamId } from '../store/matchStore';

const TEAMS = Object.entries(TEAM_INFO) as [Exclude<TeamId, null>, typeof TEAM_INFO[keyof typeof TEAM_INFO]][];

export function TeamSelector({ onClose }: { onClose: () => void }) {
  const selectedTeam = useMatchStore((s) => s.selectedTeam);
  const setSelectedTeam = useMatchStore((s) => s.setSelectedTeam);

  const handleSelect = (team: TeamId) => {
    setSelectedTeam(team === selectedTeam ? null : team);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Choose Your Team</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.subtitle}>
          Your ball changes to team colors. Pick your side!
        </p>
        <div style={styles.grid}>
          {TEAMS.map(([id, info]) => (
            <button
              key={id}
              style={{
                ...styles.teamBtn,
                ...(selectedTeam === id ? styles.teamBtnActive : {}),
              }}
              onClick={() => handleSelect(id)}
            >
              <img
                src={info.ballImg}
                alt={info.name}
                style={styles.ballImg}
              />
              <span style={styles.flag}>{info.flag}</span>
              <span style={styles.teamName}>{info.name}</span>
            </button>
          ))}
        </div>
        {selectedTeam && (
          <div style={styles.selected}>
            Playing as {TEAM_INFO[selectedTeam].flag} {TEAM_INFO[selectedTeam].name}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  modal: {
    background: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    border: '1px solid #333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#d4a853',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    margin: '0 0 16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  teamBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    background: '#222',
    border: '2px solid transparent',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  teamBtnActive: {
    borderColor: '#d4a853',
    background: '#2a2a1a',
  },
  ballImg: {
    width: 40,
    height: 40,
    objectFit: 'contain',
  },
  flag: {
    fontSize: 16,
  },
  teamName: {
    fontSize: 9,
    color: '#ccc',
    fontWeight: 600,
  },
  selected: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 600,
    color: '#d4a853',
  },
};
