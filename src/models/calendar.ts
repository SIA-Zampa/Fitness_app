export function formatCalendarDate(isoDate?: string) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  const date = new Date(`${isoDate}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function formatCalendarMonth(isoMonth?: string) {
  if (!isoMonth || !/^\d{4}-\d{2}$/.test(isoMonth)) return '';
  const date = new Date(`${isoMonth}-01T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('it-IT', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function calendarWeekLabel(startDate: string | undefined, week: number) {
  const bounds = calendarWeekBounds(startDate, week);
  if (!bounds) return 'Data da impostare';
  const from = formatCalendarDate(bounds.from);
  const to = formatCalendarDate(bounds.to);
  return `${from} – ${to}`;
}

export function calendarWeekBounds(startDate: string | undefined, week: number) {
  if (!startDate || !Number.isInteger(week) || week < 1) return undefined;
  const start = new Date(`${startDate}T12:00:00Z`);
  if (Number.isNaN(start.getTime())) return undefined;
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function weightForCalendarWeek(history: Array<{ date: string; weightKg: number }> | undefined, startDate: string | undefined, week: number) {
  const bounds = calendarWeekBounds(startDate, week);
  if (!bounds) return undefined;
  return [...(history ?? [])].filter((entry) => entry.date >= bounds.from && entry.date <= bounds.to)
    .sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg;
}
