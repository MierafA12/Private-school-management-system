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
