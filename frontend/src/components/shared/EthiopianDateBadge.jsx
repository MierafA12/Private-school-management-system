import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { getTodayEthiopian } from '../../utils/ethiopianDate';

export default function EthiopianDateBadge() {
  const [ethDate, setEthDate] = useState(() => getTodayEthiopian());
  const [showAmharic, setShowAmharic] = useState(false);

  useEffect(() => {
    setEthDate(getTodayEthiopian());
  }, []);

  if (!ethDate) return null;

  return (
    <button
      type="button"
      className="sl-eth-badge"
      onClick={() => setShowAmharic(prev => !prev)}
      title="Ethiopian Calendar (Click to toggle English / Amharic)"
      aria-label="Ethiopian Calendar date"
    >
      <span className="sl-eth-badge-flag">🇪🇹</span>
      <Calendar size={13} className="sl-eth-badge-icon" />
      <span className="sl-eth-badge-text sl-eth-badge-text--full">
        {showAmharic ? ethDate.formattedAm : ethDate.formatted}
      </span>
      <span className="sl-eth-badge-text sl-eth-badge-text--compact">
        {showAmharic ? ethDate.formattedCompactAm : ethDate.formattedCompact}
      </span>
    </button>
  );
}
