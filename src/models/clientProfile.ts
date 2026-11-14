import type { Client, ClientMeasurement, MonthlyClientMeasurements, WeeklyClientMeasurements } from '../database/db';

export const clientMeasurements: ReadonlyArray<{ key: ClientMeasurement; label: string }> = [
  { key: 'height', label: 'Altezza' },
  { key: 'shoulders', label: 'Spalle' },
  { key: 'chest', label: 'Torace' },
  { key: 'arm', label: 'Braccio' },
  { key: 'forearm', label: 'Avambraccio' },
  { key: 'waist', label: 'Vita' },
  { key: 'hips', label: 'Fianchi / glutei' },
  { key: 'thigh', label: 'Coscia' },
  { key: 'calf', label: 'Polpaccio' },
];

export function monthlyMeasurements(client: Pick<Client, 'measurementsCm' | 'measurementsByWeek' | 'measurementsByMonth'>): MonthlyClientMeasurements[] {
  if (client.measurementsByMonth) {
    return [...client.measurementsByMonth].sort((a, b) =>
      a.calendarMonth && b.calendarMonth ? a.calendarMonth.localeCompare(b.calendarMonth) : a.month - b.month);
  }
  const initial = !client.measurementsByWeek ? client.measurementsCm : undefined;
  return initial && Object.keys(initial).length > 0 ? [{ month: 1, measurementsCm: initial }] : [];
}

export function historicalWeeklyMeasurements(client: Pick<Client, 'measurementsByWeek'>): WeeklyClientMeasurements[] {
  return [...(client.measurementsByWeek ?? [])].sort((a, b) => a.week - b.week);
}

export function monthlyWeight(client: Pick<Client, 'weightHistory'>, period: MonthlyClientMeasurements) {
  if (period.weightKg !== undefined) return period.weightKg;
  if (!period.calendarMonth) return undefined;
  return [...(client.weightHistory ?? [])].filter((entry) => entry.date.startsWith(period.calendarMonth!))
    .sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.weightKg;
}

export function measurementChange(periods: Array<{ measurementsCm: Partial<Record<ClientMeasurement, number>> }>, key: ClientMeasurement) {
  const values = periods.map((item) => item.measurementsCm[key]).filter((value): value is number => value !== undefined);
  return values.length > 1 ? values[values.length - 1] - values[values.length - 2] : undefined;
}

export function localDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function clientAge(client: Pick<Client, 'birthDate' | 'age'>) {
  if (!client.birthDate) return client.age;
  const today = localDate();
  const years = Number(today.slice(0, 4)) - Number(client.birthDate.slice(0, 4));
  return years - Number(today.slice(5) < client.birthDate.slice(5));
}

export const clientSexLabels = { F: 'Femminile', M: 'Maschile', '': 'Non indicato' };
