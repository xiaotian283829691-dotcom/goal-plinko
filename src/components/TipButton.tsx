import { useState, useRef, useEffect } from 'react';
import { TIP_OPTIONS, getTipUrl } from '../config/wallet';

export function TipButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleTip = (amount: number) => {
    const urls = getTipUrl(amount);
    // Try native ton:// first — if browser can't handle it, fall back to Tonkeeper web
    const nativeLink = document.createElement('a');
    nativeLink.href = urls.native;
    nativeLink.click();
    // Fallback: open Tonkeeper after a short delay if native didn't work
    setTimeout(() => {
      window.open(urls.tonkeeper, '_blank');
    }, 800);
    setOpen(false);
  };

  return (
    <div ref={ref} style={styles.wrapper}>
      <button
        style={styles.button}
        onClick={() => setOpen((v) => !v)}
        title="Tip the developer"
      >
        💎 Tip
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownTitle}>Tip the developer</div>
          {TIP_OPTIONS.map((opt) => (
            <button
              key={opt.amount}
              style={styles.option}
              onClick={() => handleTip(opt.amount)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
  },
  button: {
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: 8,
    padding: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    zIndex: 100,
    minWidth: 130,
  },
  dropdownTitle: {
    fontSize: 10,
    color: '#888',
    padding: '2px 6px',
    whiteSpace: 'nowrap',
  },
  option: {
    background: 'rgba(212, 168, 83, 0.08)',
    border: '1px solid #3a3520',
    borderRadius: 5,
    color: '#d4a853',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.15s',
  },
};
