import { db } from '../database/db';
import { workoutPlanExportFormatVersion, type WorkoutPlanExportFile } from '../features/import-export/format';

function toFileSafeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function buildWorkoutPlanExport(planId: string): Promise<WorkoutPlanExportFile> {
  const plan = await db.workoutPlans.get(planId);
  if (!plan) {
    throw new Error('Scheda non trovata.');
  }

  const [client, days, assignments, exercises] = await Promise.all([
    plan.clientId ? db.clients.get(plan.clientId) : undefined,
    db.workoutDays.where('planId').equals(planId).sortBy('order'),
    db.workoutExercises.toArray(),
    db.exercises.toArray(),
  ]);

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const customExerciseIds = new Set<string>();

  const exportDays = days.map((day) => {
    const dayAssignments = assignments
      .filter((assignment) => assignment.workoutDayId === day.id)
      .sort((a, b) => a.order - b.order);

    return {
      id: day.id,
      name: day.name,
      order: day.order,
      exercises: dayAssignments.map((assignment) => {
        const exercise = exerciseById.get(assignment.exerciseId);
        if (exercise?.isCustom) {
          customExerciseIds.add(exercise.id);
        }

        return {
          id: assignment.id,
          exerciseId: assignment.exerciseId,
          name: exercise?.name ?? 'Esercizio non trovato',
          muscleGroup: exercise?.muscleGroup ?? 'N/D',
          sets: assignment.sets,
          repetitions: assignment.repetitions,
          restSeconds: assignment.restSeconds,
          notes: assignment.notes,
          order: assignment.order,
        };
      }),
    };
  });

  return {
    formatVersion: workoutPlanExportFormatVersion,
    planId: plan.id,
    planVersion: plan.version,
    planName: plan.name,
    clientDisplayName: client?.name,
    exportedAt: new Date().toISOString(),
    days: exportDays,
    customExercises: exercises
      .filter((exercise) => customExerciseIds.has(exercise.id))
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        description: exercise.description,
      })),
  };
}

export function downloadWorkoutPlanExport(plan: WorkoutPlanExportFile) {
  const serializedPlan = JSON.stringify(plan, null, 2);
  const blob = new Blob([serializedPlan], { type: 'application/json' });
  const fileName = `${toFileSafeName(plan.planName || 'scheda')}_v${plan.planVersion}.fitscheda`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
