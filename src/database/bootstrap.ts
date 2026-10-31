import { db, defaultSettings, initialExercises } from './db';
import { expandedExercises } from './exerciseCatalog';

export async function bootstrapDatabase() {
  await db.transaction('rw', db.settings, db.exercises, async () => {
    const settings = await db.settings.get('local');
    if (!settings) {
      await db.settings.put(defaultSettings);
    }

    const builtins = [...initialExercises, ...expandedExercises];
    const existing = await db.exercises.bulkGet(builtins.map((exercise) => exercise.id));
    const missing = builtins.filter((_, index) => !existing[index]);
    if (missing.length) await db.exercises.bulkAdd(missing);
  });
}

export async function getLocalSettings() {
  const settings = await db.settings.get('local');
  return settings ?? defaultSettings;
}

export async function saveLocalSettings(settings: typeof defaultSettings) {
  await db.settings.put(settings);
}
