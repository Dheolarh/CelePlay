export const getFirstDayOfMonth = (year: number, month: number): number => {
  // Returns 0-6 (Sun-Sat)
  return new Date(year, month, 1).getDay();
};

export const getDaysInMonth = (year: number, month: number): number => {
  // Passing 0 as day returns the last day of the previous month.
  // So month + 1, day 0 gives the last day of the current month.
  return new Date(year, month + 1, 0).getDate();
};

export const monthNames = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
