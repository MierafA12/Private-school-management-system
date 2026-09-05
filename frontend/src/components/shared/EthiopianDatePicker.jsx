import React, { useState, useEffect, useMemo } from 'react';
import {
  ETHIOPIAN_MONTHS,
  AMHARIC_MONTHS,
  toEthiopian,
  toGregorian,
  getEthiopianDaysInMonth,
  getTodayEthiopian,
} from '../../utils/ethiopianDate';

/**
 * Ethiopian Date Picker Component with Day, Month, Year dropdowns.
 * Accepts and emits standard Gregorian ISO date string (YYYY-MM-DD)
 * for 100% backend compatibility.
 */
export default function EthiopianDatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  id,
  className = '',
  yearRangeBefore = 5,
  yearRangeAfter = 5,
}) {
  const todayEth = useMemo(() => getTodayEthiopian(), []);

  // Parse existing Gregorian date or default to today
  const currentEth = useMemo(() => {
    if (value) {
      const parsed = toEthiopian(value);
      if (parsed) return parsed;
    }
    return null;
  }, [value]);

  const [ethYear, setEthYear] = useState(() => currentEth?.year || todayEth.year);
  const [ethMonth, setEthMonth] = useState(() => currentEth?.month || todayEth.month);
  const [ethDay, setEthDay] = useState(() => currentEth?.day || todayEth.day);

  // Sync internal state when value prop changes externally
  useEffect(() => {
    if (currentEth) {
      setEthYear(currentEth.year);
      setEthMonth(currentEth.month);
      setEthDay(currentEth.day);
    }
  }, [currentEth]);

  // Available days in selected Ethiopian month
  const maxDays = useMemo(() => {
    return getEthiopianDaysInMonth(ethYear, ethMonth);
  }, [ethYear, ethMonth]);

  // Generate Year options around current/selected year
  const yearOptions = useMemo(() => {
    const baseYear = todayEth.year;
    const start = baseYear - yearRangeBefore;
    const end = baseYear + yearRangeAfter;
    const years = [];
    for (let y = start; y <= end; y++) {
      years.push(y);
    }
    return years;
  }, [todayEth.year, yearRangeBefore, yearRangeAfter]);

  // Adjust day if selected day exceeds month limit (e.g. Pagume has 5 or 6 days)
  useEffect(() => {
    if (ethDay > maxDays) {
      setEthDay(maxDays);
      emitChange(ethYear, ethMonth, maxDays);
    }
  }, [maxDays]);

  const emitChange = (y, m, d) => {
    const greg = toGregorian(y, m, d);
    if (greg && onChange) {
      onChange(greg.iso);
    }
  };

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value, 10);
    setEthYear(y);
    const validDay = Math.min(ethDay, getEthiopianDaysInMonth(y, ethMonth));
    setEthDay(validDay);
    emitChange(y, ethMonth, validDay);
  };

  const handleMonthChange = (e) => {
    const m = parseInt(e.target.value, 10);
    setEthMonth(m);
    const validDay = Math.min(ethDay, getEthiopianDaysInMonth(ethYear, m));
    setEthDay(validDay);
    emitChange(ethYear, m, validDay);
  };

  const handleDayChange = (e) => {
    const d = parseInt(e.target.value, 10);
    setEthDay(d);
    emitChange(ethYear, ethMonth, d);
  };

  // Current Gregorian converted representation for preview
  const currentGreg = useMemo(() => {
    return toGregorian(ethYear, ethMonth, ethDay);
  }, [ethYear, ethMonth, ethDay]);

  const monthLabel = ETHIOPIAN_MONTHS[ethMonth - 1] || '';
  const amharicMonthLabel = AMHARIC_MONTHS[ethMonth - 1] || '';

  return (
    <div className={`eth-date-picker ${className}`} style={{ width: '100%' }}>
      {/* 3 Dropdowns for Day, Month, Year */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr', gap: '0.35rem', alignItems: 'center' }}>
        {/* Month Dropdown */}
        <select
          id={id ? `${id}-month` : undefined}
          className="pf-select"
          value={ethMonth}
          onChange={handleMonthChange}
          disabled={disabled}
          required={required}
          title="Ethiopian Month"
          style={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.45rem' }}
        >
          {ETHIOPIAN_MONTHS.map((name, idx) => (
            <option key={idx + 1} value={idx + 1}>
              {idx + 1}. {name} ({AMHARIC_MONTHS[idx]})
            </option>
          ))}
        </select>

        {/* Day Dropdown */}
        <select
          id={id ? `${id}-day` : undefined}
          className="pf-select"
          value={ethDay}
          onChange={handleDayChange}
          disabled={disabled}
          required={required}
          title="Ethiopian Day"
          style={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.45rem' }}
        >
          {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              Day {d}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select
          id={id ? `${id}-year` : undefined}
          className="pf-select"
          value={ethYear}
          onChange={handleYearChange}
          disabled={disabled}
          required={required}
          title="Ethiopian Year"
          style={{ height: '36px', fontSize: '0.8rem', padding: '0.35rem 0.45rem' }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y} E.C.
            </option>
          ))}
        </select>
      </div>

      {/* Subtle preview info badge showing both Ethiopian and Gregorian equivalence */}
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
          🇪🇹 <strong>{monthLabel} ({amharicMonthLabel}) {ethDay}, {ethYear} ዓ.ም.</strong>
        </span>
        {currentGreg && (
          <span style={{ opacity: 0.85 }}>
            (G.C. {currentGreg.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
          </span>
        )}
      </div>
    </div>
  );
}
