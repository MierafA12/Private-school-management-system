import React, { useState, useEffect, useMemo } from 'react';
import { toEthiopianTime, toGregorianTime } from '../../utils/ethiopianDate';

/**
 * Ethiopian Time Picker Component
 * Provides Hour (1-12), Minute, and Period (Day / Night) dropdowns.
 * Converts to and from standard Gregorian "HH:MM" 24-hour time strings.
 */
export default function EthiopianTimePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  id,
  className = '',
}) {
  // Parse incoming Gregorian time string ("HH:MM")
  const parsed = useMemo(() => {
    if (value) {
      return toEthiopianTime(value);
    }
    return null;
  }, [value]);

  const [ethHour, setEthHour] = useState(() => parsed?.ethHour || 2); // Default to 2:00 (08:00 AM)
  const [minute,  setMinute]  = useState(() => parsed ? Math.floor(parsed.minute / 5) * 5 : 0);
  const [period,  setPeriod]  = useState(() => parsed?.period || 'day');

  useEffect(() => {
    if (parsed) {
      setEthHour(parsed.ethHour);
      setMinute(Math.floor(parsed.minute / 5) * 5);
      setPeriod(parsed.period);
    }
  }, [parsed]);

  const emit = (h, m, p) => {
    const { timeStr } = toGregorianTime(h, m, p);
    if (onChange) {
      onChange(timeStr);
    }
  };

  const handleHourChange = (e) => {
    const h = parseInt(e.target.value, 10);
    setEthHour(h);
    emit(h, minute, period);
  };

  const handleMinuteChange = (e) => {
    const m = parseInt(e.target.value, 10);
    setMinute(m);
    emit(ethHour, m, period);
  };

  const handlePeriodChange = (e) => {
    const p = e.target.value;
    setPeriod(p);
    emit(ethHour, minute, p);
  };

  // Convert current state to Gregorian preview
  const currentGreg = useMemo(() => {
    return toGregorianTime(ethHour, minute, period);
  }, [ethHour, minute, period]);

  const previewEth = useMemo(() => {
    return toEthiopianTime(currentGreg.timeStr);
  }, [currentGreg]);

  return (
    <div className={`eth-time-picker ${className}`} style={{ width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.3fr', gap: '0.35rem', alignItems: 'center' }}>
        {/* Hour Dropdown */}
        <select
          id={id ? `${id}-hour` : undefined}
          className="pf-select"
          value={ethHour}
          onChange={handleHourChange}
          disabled={disabled}
          required={required}
          title="Ethiopian Hour"
          style={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.45rem' }}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
            const gregH = period === 'day' ? (h % 12) + 6 : ((h % 12) + 18) % 24;
            const greg12 = gregH > 12 ? gregH - 12 : (gregH === 0 ? 12 : gregH);
            const ampm = gregH >= 12 ? 'PM' : 'AM';
            return (
              <option key={h} value={h}>
                {h}:00 ({greg12} {ampm})
              </option>
            );
          })}
        </select>

        {/* Minute Dropdown (00, 05, 10, ... 55) */}
        <select
          id={id ? `${id}-minute` : undefined}
          className="pf-select"
          value={minute}
          onChange={handleMinuteChange}
          disabled={disabled}
          required={required}
          title="Minute"
          style={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.45rem' }}
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
            <option key={m} value={m}>
              :{String(m).padStart(2, '0')}
            </option>
          ))}
        </select>

        {/* Period Dropdown (Day / Night) */}
        <select
          id={id ? `${id}-period` : undefined}
          className="pf-select"
          value={period}
          onChange={handlePeriodChange}
          disabled={disabled}
          required={required}
          title="Period (Day / Night)"
          style={{ height: '36px', fontSize: '0.78rem', padding: '0.35rem 0.35rem' }}
        >
          <option value="day">ጥዋት/ቀን (Day)</option>
          <option value="night">ማታ (Night)</option>
        </select>
      </div>

      {/* Preview Chip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.3rem',
          padding: '0.2rem 0.45rem',
          background: 'var(--bg-subtle, #f8fafc)',
          borderRadius: '4px',
          fontSize: '0.72rem',
          color: 'var(--text-muted, #64748b)',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <span>
          🇪🇹 <strong>{previewEth?.formatted || `${ethHour}:${String(minute).padStart(2, '0')}`}</strong>
        </span>
        <span style={{ opacity: 0.85 }}>
          (G.C. {currentGreg.timeStr})
        </span>
      </div>
    </div>
  );
}
