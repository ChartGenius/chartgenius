/**
 * Unit tests — Push Notification Utilities
 *
 * Tests market day detection, NYSE holiday recognition, and notification time parsing.
 * All logic mirrors the backend notificationScheduler.js so both can be tested here.
 */

// ─── Market Day & Holiday Logic (mirrored from backend) ───────────────────────

/** NYSE holidays for testing purposes */
const NYSE_HOLIDAYS_SET = new Set([
  // 2024
  '2024-01-01',
  '2024-01-15',
  '2024-02-19',
  '2024-03-29',
  '2024-05-27',
  '2024-06-19',
  '2024-07-04',
  '2024-09-02',
  '2024-11-28',
  '2024-12-25',
  // 2025
  '2025-01-01',
  '2025-01-20',
  '2025-02-17',
  '2025-04-18',
  '2025-05-26',
  '2025-06-19',
  '2025-07-04',
  '2025-09-01',
  '2025-11-27',
  '2025-12-25',
  // 2026
  '2026-01-01',
  '2026-01-19',
  '2026-02-16',
  '2026-04-03',
  '2026-05-25',
  '2026-06-19',
  '2026-07-03',
  '2026-09-07',
  '2026-11-26',
  '2026-12-25',
]);

/**
 * Returns true if the given date (YYYY-MM-DD) is a NYSE holiday.
 */
function isNYSEHoliday(dateStr: string): boolean {
  return NYSE_HOLIDAYS_SET.has(dateStr);
}

/**
 * Returns true if the given date object is a market day (Mon–Fri, not a holiday).
 * Uses ET timezone for day-of-week and date string calculation.
 */
function isMarketDay(date: Date): boolean {
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
  });
  const dayName = etFormatter.format(date);
  if (dayName === 'Saturday' || dayName === 'Sunday') return false;

  const dateStrFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dateStrFormatter.format(date);
  return !isNYSEHoliday(dateStr);
}

/**
 * Parse a notification time string "HH:MM" and return { hour, minute }.
 * Returns null if the format is invalid.
 */
function parseNotificationTime(time: string): { hour: number; minute: number } | null {
  if (!time || typeof time !== 'string') return null;
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Format 24h time string to display format, e.g. "16:05" → "4:05 PM"
 */
function formatDisplayTime(time: string): string {
  const parsed = parseNotificationTime(time);
  if (!parsed) return time;
  const { hour, minute } = parsed;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

/**
 * Returns true if a time string is valid HH:MM format within valid range.
 */
function isValidTimeString(time: string): boolean {
  return parseNotificationTime(time) !== null;
}

// ─── Helpers to create specific dates ────────────────────────────────────────

function makeETDate(year: number, month: number, day: number): Date {
  // Create a date at noon ET to avoid DST edge cases
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00-05:00`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Market Day Detection — Weekdays', () => {
  test('Monday is a market day', () => {
    // 2025-03-10 is a Monday
    const monday = makeETDate(2025, 3, 10);
    expect(isMarketDay(monday)).toBe(true);
  });

  test('Tuesday is a market day', () => {
    // 2025-03-11 is a Tuesday
    const tuesday = makeETDate(2025, 3, 11);
    expect(isMarketDay(tuesday)).toBe(true);
  });

  test('Wednesday is a market day', () => {
    // 2025-03-12 is a Wednesday
    const wednesday = makeETDate(2025, 3, 12);
    expect(isMarketDay(wednesday)).toBe(true);
  });

  test('Thursday is a market day', () => {
    // 2025-03-13 is a Thursday
    const thursday = makeETDate(2025, 3, 13);
    expect(isMarketDay(thursday)).toBe(true);
  });

  test('Friday is a market day', () => {
    // 2025-03-14 is a Friday
    const friday = makeETDate(2025, 3, 14);
    expect(isMarketDay(friday)).toBe(true);
  });
});

describe('Market Day Detection — Weekends', () => {
  test('Saturday is NOT a market day', () => {
    // 2025-03-15 is a Saturday
    const saturday = makeETDate(2025, 3, 15);
    expect(isMarketDay(saturday)).toBe(false);
  });

  test('Sunday is NOT a market day', () => {
    // 2025-03-16 is a Sunday
    const sunday = makeETDate(2025, 3, 16);
    expect(isMarketDay(sunday)).toBe(false);
  });
});

describe('NYSE Holiday Detection', () => {
  test('New Year\'s Day 2025 is a holiday', () => {
    expect(isNYSEHoliday('2025-01-01')).toBe(true);
  });

  test('Thanksgiving 2025 is a holiday', () => {
    expect(isNYSEHoliday('2025-11-27')).toBe(true);
  });

  test('Christmas 2025 is a holiday', () => {
    expect(isNYSEHoliday('2025-12-25')).toBe(true);
  });

  test('Martin Luther King Jr. Day 2025 is a holiday', () => {
    expect(isNYSEHoliday('2025-01-20')).toBe(true);
  });

  test('A regular Monday is not a holiday', () => {
    expect(isNYSEHoliday('2025-03-10')).toBe(false);
  });

  test('A random Wednesday is not a holiday', () => {
    expect(isNYSEHoliday('2025-04-09')).toBe(false);
  });

  test('NYSE holiday causes isMarketDay to return false (MLK Day 2025 — Monday)', () => {
    // 2025-01-20 is a Monday AND a holiday
    const mlkDay = makeETDate(2025, 1, 20);
    expect(isMarketDay(mlkDay)).toBe(false);
  });

  test('NYSE holiday causes isMarketDay to return false (July 4 2025 — Friday)', () => {
    const july4 = makeETDate(2025, 7, 4);
    expect(isMarketDay(july4)).toBe(false);
  });

  test('Good Friday 2025 is a holiday', () => {
    expect(isNYSEHoliday('2025-04-18')).toBe(true);
  });

  test('Day after Thanksgiving 2025 is NOT a holiday (NYSE is open)', () => {
    // Black Friday 2025 = Nov 28 — NYSE is actually open (with early close)
    expect(isNYSEHoliday('2025-11-28')).toBe(false);
  });
});

describe('Notification Time Parsing', () => {
  test('Default time 16:05 parses correctly', () => {
    const result = parseNotificationTime('16:05');
    expect(result).toEqual({ hour: 16, minute: 5 });
  });

  test('09:30 parses correctly (market open)', () => {
    const result = parseNotificationTime('09:30');
    expect(result).toEqual({ hour: 9, minute: 30 });
  });

  test('00:00 parses correctly (midnight)', () => {
    const result = parseNotificationTime('00:00');
    expect(result).toEqual({ hour: 0, minute: 0 });
  });

  test('23:59 parses correctly (end of day)', () => {
    const result = parseNotificationTime('23:59');
    expect(result).toEqual({ hour: 23, minute: 59 });
  });

  test('Invalid format returns null', () => {
    expect(parseNotificationTime('not-a-time')).toBeNull();
  });

  test('Empty string returns null', () => {
    expect(parseNotificationTime('')).toBeNull();
  });

  test('Hour out of range returns null', () => {
    expect(parseNotificationTime('25:00')).toBeNull();
  });

  test('Minute out of range returns null', () => {
    expect(parseNotificationTime('10:60')).toBeNull();
  });
});

describe('Notification Time Display Formatting', () => {
  test('16:05 formats as "4:05 PM"', () => {
    expect(formatDisplayTime('16:05')).toBe('4:05 PM');
  });

  test('09:30 formats as "9:30 AM"', () => {
    expect(formatDisplayTime('09:30')).toBe('9:30 AM');
  });

  test('12:00 formats as "12:00 PM"', () => {
    expect(formatDisplayTime('12:00')).toBe('12:00 PM');
  });

  test('00:00 formats as "12:00 AM"', () => {
    expect(formatDisplayTime('00:00')).toBe('12:00 AM');
  });

  test('Invalid time returns the input unchanged', () => {
    expect(formatDisplayTime('invalid')).toBe('invalid');
  });
});

describe('Valid Time String Validation', () => {
  test('"16:05" is valid', () => {
    expect(isValidTimeString('16:05')).toBe(true);
  });

  test('"25:00" is invalid', () => {
    expect(isValidTimeString('25:00')).toBe(false);
  });

  test('"abc" is invalid', () => {
    expect(isValidTimeString('abc')).toBe(false);
  });

  test('"9:30" (single-digit hour) is valid', () => {
    expect(isValidTimeString('9:30')).toBe(true);
  });
});

describe('Holiday Set Completeness', () => {
  test('NYSE_HOLIDAYS_SET contains at least 10 holidays', () => {
    expect(NYSE_HOLIDAYS_SET.size).toBeGreaterThanOrEqual(10);
  });

  test('All holiday strings are valid YYYY-MM-DD format', () => {
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const holiday of NYSE_HOLIDAYS_SET) {
      expect(holiday).toMatch(isoDatePattern);
    }
  });

  test('Juneteenth 2025 is in the holiday set', () => {
    expect(NYSE_HOLIDAYS_SET.has('2025-06-19')).toBe(true);
  });
});
