import { useState } from 'react';
import { TIP_OPTIONS, getTipUrl } from '../config/wallet';

export function TipButton() {
  const [open, setOpen] = useState(false);

  const handleTip = (amount: number) => {
    const urls = getTipUrl(amount);
    const nativeLink = document.createElement('a');
    nativeLink.href = urls.native;
    nativeLink.click();
    setTimeout(() => {
      window.open(urls.tonkeeper, '_blank');
    }, 800);
    setOpen(false);
  };

  return (
    <>
      <button
        style={styles.trigger}
        onClick={() => setOpen(true)}
      >
        <span style={styles.diamond}>💎</span> Tip
      </button>

      {open && (
        <div style={styles.backdrop} onClick={() => setOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalGlow} />
            <div style={styles.header}>
              <span style={styles.headerIcon}>💎</span>
              <span style={styles.headerTitle}>Support the Creator</span>
            </div>
            <p style={styles.desc}>
              Enjoying Goal Plinko? Buy the developer a coffee with TON.
            </p>
            <div style={styles.options}>
              {TIP_OPTIONS.map((opt) => (
                <button
                  key={opt.amount}
                  style={styles.optionBtn}
                  onClick={() => handleTip(opt.amount)}
                >
                  <span style={styles.optAmount}>{opt.amount}</span>
                  <span style={styles.optUnit}>TON</span>
                </button>
              ))}
            </div>
            <button style={styles.closeBtn} onClick={() => setOpen(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  trigger: {
    background: 'transparent',
    border: '1px solid #3a3520',
    borderRadius: 6,
    color: '#d4a853',
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'border-color 0.2s',
  },
  diamond: {
    fontSize: 10,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    animation: 'tipFadeIn 0.2s ease-out',
  },
  modal: {
    position: 'relative',
    width: '85%',
    maxWidth: 320,
    background: 'linear-gradient(145deg, #1c1c1e 0%, #111113 100%)',
    border: '1px solid rgba(212, 168, 83, 0.25)',
    borderRadius: 20,
    padding: '28px 24px 20px',
    overflow: 'hidden',
  },
  modalGlow: {
    position: 'absolute',
    top: -40,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 200,
    height: 80,
    background: 'radial-gradient(ellipse, rgba(212, 168, 83, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '0 0 20px',
  },
  options: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  optionBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '14px 0',
    borderRadius: 14,
    border: '1px solid rgba(212, 168, 83, 0.3)',
    background: 'rgba(212, 168, 83, 0.06)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  optAmount: {
    fontSize: 22,
    fontWeight: 800,
    color: '#d4a853',
  },
  optUnit: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8a7440',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  closeBtn: {
    display: 'block',
    width: '100%',
    marginTop: 16,
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    color: '#555',
    fontSize: 13,
    cursor: 'pointer',
  },
};
