import {
  format,
  addWeeks,
  addMonths,
  addDays,
  isWithinInterval,
  parseISO,
  isBefore,
  isAfter,
} from 'date-fns';

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
}

export function formatDateInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

export function getUpcomingOccurrences(
  startDate: Date,
  repeat: string,
  endDate: Date | null,
  fromDate: Date,
  toDate: Date
): Date[] {
  const occurrences: Date[] = [];
  let current = new Date(startDate);

  // If first occurrence is after toDate, nothing to show
  if (isAfter(current, toDate)) return occurrences;

  // Fast-forward to fromDate range
  while (isBefore(current, fromDate)) {
    if (repeat === 'none') return occurrences;
    current = advanceDate(current, repeat);
  }

  while (!isAfter(current, toDate)) {
    if (endDate && isAfter(current, endDate)) break;
    occurrences.push(new Date(current));
    if (repeat === 'none') break;
    current = advanceDate(current, repeat);
  }

  return occurrences;
}

function advanceDate(date: Date, repeat: string): Date {
  if (repeat === 'daily') return addDays(date, 1);
  if (repeat === 'weekly') return addWeeks(date, 1);
  if (repeat === 'monthly') return addMonths(date, 1);
  return addDays(date, 9999); // effectively "never"
}

export function getUpcomingRefills(
  refillOn: Date,
  schedule: string,
  fromDate: Date,
  toDate: Date
): Date[] {
  return getUpcomingOccurrences(refillOn, schedule, null, fromDate, toDate);
}

export function isWithin7Days(date: Date): boolean {
  const now = new Date();
  const in7 = addDays(now, 7);
  return isWithinInterval(date, { start: now, end: in7 });
}
