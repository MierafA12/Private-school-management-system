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
