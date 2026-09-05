import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getTodayEthiopian } from '../../utils/ethiopianDate';

export default function EthiopianDateBadge({ showGregorian = true }) {
  const [ethDate, setEthDate] = useState(() => getTodayEthiopian());
  const [showAmharic, setShowAmharic] = useState(false);

  useEffect(() => {
    // Update daily or on mount
    setEthDate(getTodayEthiopian());
  }, []);

  if (!ethDate) return null;

  return (
    <div
      onClick={() => setShowAmharic(prev => !prev)}
      title="Click to toggle Amharic / English (Ethiopian Calendar)"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.35rem 0.65rem',
        borderRadius: '9999px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        color: '#059669',
        fontSize: '0.78rem',
        fontWeight: 600,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'; }}
    >
      <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>🇪🇹</span>
      <Calendar size={13} style={{ opacity: 0.8 }} />
      <span>{showAmharic ? ethDate.formattedAm : ethDate.formatted}</span>
    </div>
  );
}
