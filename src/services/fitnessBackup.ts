import { db } from '../database/db';

const backupFormat = 'fitness-app-backup';
const backupVersion = 1;
const tableNames = [
  'settings',
  'clients',
  'exercises',
  'workoutPlans',
  'workoutDays',
  'workoutExercises',
  'workoutSessions',
  'sessionSets',
  'catalogOptions',
] as const;

type TableName = typeof tableNames[number];
type BackupRow = Record<string, unknown>;
type BackupTables = Record<TableName, BackupRow[]>;

const requiredStrings: Record<TableName, string[]> = {
  settings: ['id', 'theme'],
  clients: ['id', 'name', 'createdAt'],
  exercises: ['id', 'name', 'muscleGroup', 'createdAt', 'updatedAt'],
  workoutPlans: ['id', 'name', 'createdAt', 'updatedAt'],
  workoutDays: ['id', 'planId', 'name'],
  workoutExercises: ['id', 'workoutDayId', 'exerciseId', 'repetitions'],
  workoutSessions: ['id', 'planId', 'workoutDayId', 'startedAt'],
  sessionSets: ['id', 'sessionId', 'workoutExerciseId'],
  catalogOptions: ['id', 'kind', 'name'],
};

const requiredNumbers: Partial<Record<TableName, string[]>> = {
  workoutPlans: ['version'],
  workoutDays: ['order'],
  workoutExercises: ['sets', 'restSeconds', 'order'],
  sessionSets: ['setNumber'],
};

export type FitnessBackup = {
  format: typeof backupFormat;
  version: typeof backupVersion;
  exportedAt: string;
  tables: BackupTables;
};

function isRecord(value: unknown): value is BackupRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateBackup(value: unknown): FitnessBackup {
  if (!isRecord(value) || value.format !== backupFormat || value.version !== backupVersion ||
      typeof value.exportedAt !== 'string' || Number.isNaN(Date.parse(value.exportedAt)) ||
      !isRecord(value.tables)) {
    throw new Error('Il file non è un backup compatibile di Fitness App.');
  }

  const tables = value.tables;
  if (Object.keys(tables).length !== tableNames.length ||
      tableNames.some((name) => !Array.isArray(tables[name]))) {
    throw new Error('Il backup non contiene tutte le sezioni richieste.');
  }

  for (const name of tableNames) {
    const ids = new Set<string>();
    for (const row of tables[name] as unknown[]) {
      if (!isRecord(row) || typeof row.id !== 'string' || !row.id.trim() || ids.has(row.id) ||
          requiredStrings[name].some((field) => typeof row[field] !== 'string') ||
          requiredNumbers[name]?.some((field) => typeof row[field] !== 'number' || !Number.isFinite(row[field]))) {
        throw new Error(`I dati della sezione "${name}" non sono validi.`);
      }
      ids.add(row.id);
    }
  }

  const settings = tables.settings as BackupRow[];
  if (settings.length !== 1 || settings[0].id !== 'local' ||
      !['light', 'dark', 'system'].includes(String(settings[0].theme))) {
    throw new Error('Le impostazioni del backup non sono valide.');
  }

  return value as FitnessBackup;
}

export async function createFitnessBackup(): Promise<FitnessBackup> {
  const tables = await db.transaction('r', tableNames.map((name) => db.table(name)), async () => {
    const rows = await Promise.all(tableNames.map((name) => db.table(name).toArray()));
    return Object.fromEntries(tableNames.map((name, index) => [name, rows[index]])) as BackupTables;
  });

  return {
    format: backupFormat,
    version: backupVersion,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function downloadFitnessBackup(backup: FitnessBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fitness-backup-${backup.exportedAt.slice(0, 19).replace(/[:T]/g, '-')}.fitnessbackup`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function readFitnessBackup(file: File): Promise<FitnessBackup> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('Il file selezionato non contiene un JSON valido.');
  }
  return validateBackup(parsed);
}

export async function restoreFitnessBackup(backup: FitnessBackup) {
  validateBackup(backup);
  await db.transaction('rw', tableNames.map((name) => db.table(name)), async () => {
    for (const name of tableNames) {
      await db.table(name).clear();
    }
    for (const name of tableNames) {
      if (backup.tables[name].length) {
        await db.table(name).bulkPut(backup.tables[name]);
      }
    }
  });
}

export function backupRecordCount(backup: FitnessBackup) {
  return tableNames.reduce((count, name) => count + backup.tables[name].length, 0);
}
