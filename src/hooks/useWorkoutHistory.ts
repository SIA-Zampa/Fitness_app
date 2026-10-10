import { useEffect, useMemo, useState } from 'react';
import {
  db,
  type Exercise,
  type SessionSet,
  type WorkoutDay,
  type WorkoutExercise,
  type WorkoutPlan,
  type WorkoutSession,
} from '../database/db';

type HistorySet = SessionSet & {
  exerciseName: string;
  muscleGroup: string;
};

type HistorySession = WorkoutSession & {
  planName: string;
  dayName: string;
  sets: HistorySet[];
};

export function useWorkoutHistory() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [sessionSets, setSessionSets] = useState<SessionSet[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  async function reload() {
    const [
      storedSessions,
      storedSessionSets,
      storedPlans,
      storedDays,
      storedWorkoutExercises,
      storedExercises,
    ] = await Promise.all([
      db.workoutSessions.orderBy('startedAt').reverse().toArray(),
      db.sessionSets.toArray(),
      db.workoutPlans.toArray(),
      db.workoutDays.toArray(),
      db.workoutExercises.toArray(),
      db.exercises.toArray(),
    ]);

    setSessions(storedSessions);
    setSessionSets(storedSessionSets);
    setPlans(storedPlans);
    setDays(storedDays);
    setWorkoutExercises(storedWorkoutExercises);
    setExercises(storedExercises);
  }

  useEffect(() => {
    void reload();
  }, []);

  const history = useMemo<HistorySession[]>(() => {
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const dayById = new Map(days.map((day) => [day.id, day]));
    const workoutExerciseById = new Map(workoutExercises.map((exercise) => [exercise.id, exercise]));
    const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));

    return sessions.map((session) => ({
      ...session,
      planName: planById.get(session.planId)?.name ?? 'Scheda non trovata',
      dayName: dayById.get(session.workoutDayId)?.name ?? 'Giorno non trovato',
      sets: sessionSets
        .filter((set) => set.sessionId === session.id)
        .map((set) => {
          const workoutExercise = workoutExerciseById.get(set.workoutExerciseId);
          const exercise = workoutExercise ? exerciseById.get(workoutExercise.exerciseId) : undefined;

          return {
            ...set,
            exerciseName: exercise?.name ?? 'Esercizio non trovato',
            muscleGroup: exercise?.muscleGroup ?? 'N/D',
          };
        }),
    }));
  }, [days, exercises, plans, sessionSets, sessions, workoutExercises]);

  return {
    history,
    reload,
  };
}
