import { useEffect, useMemo, useState } from 'react';
import { db, type Exercise, type WorkoutDay, type WorkoutExercise, type WorkoutPlan } from '../database/db';

type ImportedExercise = WorkoutExercise & {
  exerciseName: string;
  muscleGroup: string;
};

type ImportedDay = WorkoutDay & {
  exercises: ImportedExercise[];
};

type ImportedPlan = WorkoutPlan & {
  days: ImportedDay[];
};

export function useImportedWorkoutPlans() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [assignments, setAssignments] = useState<WorkoutExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');

  async function reload() {
    const [storedPlans, storedDays, storedAssignments, storedExercises] = await Promise.all([
      db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
      db.workoutDays.orderBy('order').toArray(),
      db.workoutExercises.orderBy('order').toArray(),
      db.exercises.toArray(),
    ]);

    setPlans(storedPlans);
    setDays(storedDays);
    setAssignments(storedAssignments);
    setExercises(storedExercises);

    const nextPlanId = selectedPlanId || storedPlans[0]?.id || '';
    const nextDayId = selectedDayId || storedDays.find((day) => day.planId === nextPlanId)?.id || '';

    setSelectedPlanId(nextPlanId);
    setSelectedDayId(nextDayId);
  }

  useEffect(() => {
    void reload();
  }, []);

  const exerciseById = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const importedPlans = useMemo<ImportedPlan[]>(() => {
    return plans.map((plan) => ({
      ...plan,
      days: days
        .filter((day) => day.planId === plan.id)
        .map((day) => ({
          ...day,
          exercises: assignments
            .filter((assignment) => assignment.workoutDayId === day.id)
            .map((assignment) => {
              const exercise = exerciseById.get(assignment.exerciseId);
              return {
                ...assignment,
                exerciseName: exercise?.name ?? 'Esercizio non trovato',
                muscleGroup: exercise?.muscleGroup ?? 'N/D',
              };
            }),
        })),
    }));
  }, [assignments, days, exerciseById, plans]);

  const selectedPlan = importedPlans.find((plan) => plan.id === selectedPlanId);
  const selectedDay = selectedPlan?.days.find((day) => day.id === selectedDayId);

  function changePlan(planId: string) {
    setSelectedPlanId(planId);
    setSelectedDayId(days.find((day) => day.planId === planId)?.id ?? '');
  }

  return {
    plans: importedPlans,
    selectedPlan,
    selectedDay,
    selectedPlanId,
    selectedDayId,
    setSelectedPlanId: changePlan,
    setSelectedDayId,
    reload,
  };
}
