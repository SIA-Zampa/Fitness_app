import { db, defaultSettings, initialExercises } from './db';

export async function bootstrapDatabase() {
  await db.transaction('rw', db.settings, db.exercises, async () => {
    const settings = await db.settings.get('local');
    if (!settings) {
      await db.settings.put(defaultSettings);
    }

    const exerciseCount = await db.exercises.count();
    if (exerciseCount === 0) {
      await db.exercises.bulkPut(initialExercises);
    }
  });
}

export async function getLocalSettings() {
  const settings = await db.settings.get('local');
  return settings ?? defaultSettings;
}

export async function saveLocalSettings(settings: typeof defaultSettings) {
  await db.settings.put(settings);
}
