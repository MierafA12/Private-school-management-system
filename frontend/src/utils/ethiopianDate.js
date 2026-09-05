/**
 * ethiopianDate.js
 * Comprehensive Gregorian <-> Ethiopian (Ge'ez) Calendar utility
 * Accurately calculated via Julian Day Number (JDN) offset.
 */

export const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas',
  'Tir', 'Yakatit', 'Magabit', 'Miyazya',
  'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

export const AMHARIC_MONTHS = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ',
  'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ',
  'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጷጉሜን'
];

/**
 * Converts a Gregorian Date into an Ethiopian Date.
 * @param {Date|string|number} dateInput
 * @returns {object|null} { year, month, day, monthName, monthNameAm, formatted, formattedAm, formattedShort }
 */
export function toEthiopian(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  // Convert Gregorian Date to Julian Day Number (JDN)
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // Ethiopian epoch in Julian Day Number (August 29, 8 CE Julian = 1723856 JDN)
  const jdnEth = 1723856;
  const r = (jdn - jdnEth) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const ethYear = 4 * Math.floor((jdn - jdnEth) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const monthName = ETHIOPIAN_MONTHS[ethMonth - 1] || '';
  const monthNameAm = AMHARIC_MONTHS[ethMonth - 1] || '';

  const shortMonth = monthName.slice(0, 3);

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthName,
    monthNameAm,
    formatted: `${monthName} ${ethDay}, ${ethYear} E.C.`,
    formattedAm: `${monthNameAm} ${ethDay} ቀን ${ethYear} ዓ.ም.`,
    formattedShort: `${ethDay}/${ethMonth}/${ethYear} E.C.`,
    formattedCompact: `${ethDay} ${shortMonth} '${String(ethYear).slice(-2)}`,
    formattedCompactAm: `${ethDay} ${monthNameAm}`,
  };
}

/**
 * Returns formatted Ethiopian date string.
 * e.g. "Meskerem 1, 2019 E.C."
 */
export function formatEthDate(dateInput) {
  const eth = toEthiopian(dateInput);
  return eth ? eth.formatted : '—';
}

/**
 * Returns dual Gregorian + Ethiopian date representation.
 * e.g. "Sep 11, 2026 (Meskerem 1, 2019 E.C.)"
 */
export function formatDualDate(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  const greg = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const eth = toEthiopian(d);
  if (!eth) return greg;
  return `${greg} · ${eth.formatted}`;
}

/**
 * Returns today's Ethiopian date object.
 */
export function getTodayEthiopian() {
  return toEthiopian(new Date());
}

/**
 * Returns the number of days in an Ethiopian month.
 * Months 1-12 have 30 days. Pagume (month 13) has 6 days in leap years, 5 otherwise.
 */
export function getEthiopianDaysInMonth(ethYear, ethMonth) {
  const m = parseInt(ethMonth, 10);
  const y = parseInt(ethYear, 10);
  if (m < 13) return 30;
  return (y % 4 === 3) ? 6 : 5;
}

/**
 * Converts an Ethiopian Date into a Gregorian Date object and ISO string (YYYY-MM-DD).
 * @param {number|string} ethYear
 * @param {number|string} ethMonth (1-13)
 * @param {number|string} ethDay (1-30)
 * @returns {{ year: number, month: number, day: number, date: Date, iso: string }|null}
 */
export function toGregorian(ethYear, ethMonth, ethDay) {
  const y = parseInt(ethYear, 10);
  const m = parseInt(ethMonth, 10);
  const d = parseInt(ethDay, 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  // JDN calculation matching toEthiopian
  const jdn = 1723856 + 365 * y + Math.floor(y / 4) + (m - 1) * 30 + d - 1;
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gregDay = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gregMonth = j + 2 - 12 * l4;
  const gregYear = 100 * (n - 49) + i + l4;

  const iso = `${gregYear}-${String(gregMonth).padStart(2, '0')}-${String(gregDay).padStart(2, '0')}`;
  const date = new Date(gregYear, gregMonth - 1, gregDay);

  return { year: gregYear, month: gregMonth, day: gregDay, date, iso };
}

/**
 * Converts Gregorian time ("HH:MM" or "HH:MM:SS") to Ethiopian time.
 * Day runs from 06:00 G.C. (12:00 ጥዋት) to 17:59 G.C. (11:59 ከሰዓት).
 * Night runs from 18:00 G.C. (12:00 ምሽት) to 05:59 G.C. (11:59 ሌሊት).
 * @param {string|Date} timeInput - "HH:MM" or Date object
 * @returns {{ ethHour: number, minute: number, period: 'day'|'night', periodLabel: string, formatted: string, formattedDual: string }}
 */
export function toEthiopianTime(timeInput) {
  if (!timeInput) return null;
  let gregHour = 0;
  let min = 0;

  if (timeInput instanceof Date) {
    gregHour = timeInput.getHours();
    min = timeInput.getMinutes();
  } else if (typeof timeInput === 'string') {
    const parts = timeInput.split(':').map(n => parseInt(n, 10));
    if (isNaN(parts[0])) return null;
    gregHour = parts[0];
    min = isNaN(parts[1]) ? 0 : parts[1];
  } else {
    return null;
  }

  let period = 'day';
  let ethHour = 0;
  let periodLabel = '';

  if (gregHour >= 6 && gregHour < 18) {
    period = 'day';
    ethHour = gregHour - 6;
    if (ethHour === 0) ethHour = 12;

    if (gregHour < 12) periodLabel = 'ጥዋት';
    else if (gregHour === 12) periodLabel = 'እኩለ ቀን';
    else periodLabel = 'ከሰዓት';
  } else {
    period = 'night';
    ethHour = (gregHour + 6) % 12;
    if (ethHour === 0) ethHour = 12;

    if (gregHour >= 18 && gregHour < 24) periodLabel = 'ማታ';
    else periodLabel = 'ሌሊት';
  }

  const minStr = String(min).padStart(2, '0');
  const greg12H = gregHour > 12 ? gregHour - 12 : (gregHour === 0 ? 12 : gregHour);
  const gregAmPm = gregHour >= 12 ? 'PM' : 'AM';

  return {
    ethHour,
    minute: min,
    period,
    periodLabel,
    formatted: `${ethHour}:${minStr} ${periodLabel}`,
    formattedDual: `${ethHour}:${minStr} ${periodLabel} (${greg12H}:${minStr} ${gregAmPm})`,
  };
}

/**
 * Converts Ethiopian time (ethHour, minute, period) to Gregorian time string ("HH:MM").
 * @param {number|string} ethHour - 1 to 12
 * @param {number|string} minute - 0 to 59
 * @param {'day'|'night'} period - 'day' (ጥዋት/ከሰዓት) or 'night' (ማታ/ሌሊት)
 * @returns {{ gregHour: number, minute: number, timeStr: string }}
 */
export function toGregorianTime(ethHour, minute = 0, period = 'day') {
  const h = parseInt(ethHour, 10) || 12;
  const m = parseInt(minute, 10) || 0;

  let gregHour = 0;
  if (period === 'day') {
    gregHour = (h % 12) + 6;
  } else {
    gregHour = ((h % 12) + 18) % 24;
  }

  const timeStr = `${String(gregHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { gregHour, minute: m, timeStr };
}

/**
 * Formats a Gregorian time string into Ethiopian time.
 * e.g. "08:00" -> "2:00 ጥዋት"
 */
export function formatEthTime(timeInput) {
  const t = toEthiopianTime(timeInput);
  return t ? t.formatted : (timeInput || '—');
}

/**
 * Formats a Gregorian time string into Dual Ethiopian + Gregorian time.
 * e.g. "08:00" -> "2:00 ጥዋት (8:00 AM)"
 */
export function formatDualTime(timeInput) {
  const t = toEthiopianTime(timeInput);
  return t ? t.formattedDual : (timeInput || '—');
}

