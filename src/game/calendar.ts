export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_ABBREVIATIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTHS_PER_YEAR = 12;
// Below this age, the game still progresses one full year at a time.
export const MONTHLY_MODE_MIN_AGE = 5;

// `month` is 0-11, counting months since the character's last birthday.
export function currentMonthName(birthMonth: number, month: number): string {
  return MONTH_NAMES[(birthMonth - 1 + month) % 12];
}

export function currentMonthAbbrev(birthMonth: number, month: number): string {
  return MONTH_ABBREVIATIONS[(birthMonth - 1 + month) % 12];
}

// 1-12, the actual calendar month `month` (months since the character's
// last birthday) currently lands on.
export function currentCalendarMonth(birthMonth: number, month: number): number {
  return ((birthMonth - 1 + month) % 12) + 1;
}

// The calendar year `age`/`month` (relative to the character's birthday)
// lands on, accounting for the wrap past December.
export function calendarYearAt(birthYear: number, birthMonth: number, age: number, month: number): number {
  return birthYear + age + Math.floor((birthMonth - 1 + month) / 12);
}

export function monthsUntilNewAge(month: number): number {
  return MONTHS_PER_YEAR - month;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(month: number, year: number): number {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1];
}

export function randomBirthYear(): number {
  return 2000 + Math.floor(Math.random() * 27); // 2000-2026 inclusive
}

export function randomBirthDate(year: number): { month: number; day: number } {
  const month = 1 + Math.floor(Math.random() * 12);
  const day = 1 + Math.floor(Math.random() * daysInMonth(month, year));
  return { month, day };
}

export function formatDate(year: number, month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}
