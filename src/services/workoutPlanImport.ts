import { db } from '../database/db';
import { workoutPlanExportFormatVersion, type WorkoutPlanExportFile } from '../features/import-export/format';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidWorkoutPlanExport(value: unknown): value is WorkoutPlanExportFile {
  if (!isRecord(value)) return false;
  if (value.formatVersion !== workoutPlanExportFormatVersion) return false;
  if (typeof value.planId !== 'string') return false;
  if (typeof value.planVersion !== 'number') return false;
  if (typeof value.planName !== 'string') return false;
  if (!Array.isArray(value.days)) return false;
  if (!Array.isArray(value.customExercises)) return false;

  return value.days.every((day) => {
    if (!isRecord(day)) return false;
    if (typeof day.id !== 'string') return false;
    if (typeof day.name !== 'string') return false;
    if (typeof day.order !== 'number') return false;
    if (!Array.isArray(day.exercises)) return false;

    return day.exercises.every((exercise) => {
      if (!isRecord(exercise)) return false;
      return (
        typeof exercise.id === 'string' &&
        typeof exercise.exerciseId === 'string' &&
        typeof exercise.name === 'string' &&
        typeof exercise.muscleGroup === 'string' &&
        typeof exercise.sets === 'number' &&
        typeof exercise.repetitions === 'string' &&
        typeof exercise.restSeconds === 'number' &&
        typeof exercise.order === 'number'
      );
    });
  });
}

export async function readWorkoutPlanFile(file: File): Promise<WorkoutPlanExportFile> {
  const text = await file.text();
  const parsedFile: unknown = JSON.parse(text);

  if (!isValidWorkoutPlanExport(parsedFile)) {
    throw new Error('Formato scheda non valido o non supportato.');
  }

  return parsedFile;
}

export async function importWorkoutPlan(exportedPlan: WorkoutPlanExportFile) {
  const now = new Date().toISOString();
  const existingPlan = await db.workoutPlans.get(exportedPlan.planId);

  if (existingPlan && existingPlan.version >= exportedPlan.planVersion) {
    throw new Error('Questa scheda e gia presente oppure non e piu recente.');
  }

  await db.transaction('rw', db.workoutPlans, db.workoutDays, db.workoutExercises, db.exercises, async () => {
    for (const customExercise of exportedPlan.customExercises) {
      const existingExercise = await db.exercises.get(customExercise.id);
      if (!existingExercise) {
        await db.exercises.add({
          id: customExercise.id,
          name: customExercise.name,
          muscleGroup: customExercise.muscleGroup,
          description: customExercise.description,
          isCustom: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (existingPlan) {
      const existingDays = await db.workoutDays.where('planId').equals(exportedPlan.planId).toArray();
      await db.workoutExercises
        .where('workoutDayId')
        .anyOf(existingDays.map((day) => day.id))
        .delete();
      await db.workoutDays.where('planId').equals(exportedPlan.planId).delete();
    }

    await db.workoutPlans.put({
      id: exportedPlan.planId,
      name: exportedPlan.planName,
      description: exportedPlan.clientDisplayName
        ? `Scheda importata per ${exportedPlan.clientDisplayName}`
        : 'Scheda importata',
      version: exportedPlan.planVersion,
      createdAt: existingPlan?.createdAt ?? now,
      updatedAt: now,
    });

    await db.workoutDays.bulkPut(
      exportedPlan.days.map((day) => ({
        id: day.id,
        planId: exportedPlan.planId,
        name: day.name,
        order: day.order,
      })),
    );

    await db.workoutExercises.bulkPut(
      exportedPlan.days.flatMap((day) =>
        day.exercises.map((exercise) => ({
          id: exercise.id,
          workoutDayId: day.id,
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
          order: exercise.order,
        })),
      ),
    );
  });
}
