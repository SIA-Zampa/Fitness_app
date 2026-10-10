import { useMemo, useState } from 'react';
import { db, type SessionSet, type WorkoutExercise } from '../database/db';
import { createId } from '../services/id';

type SetDraft = {
  weight: string;
  repetitions: string;
  completed: boolean;
};

type ExerciseDraft = {
  workoutExerciseId: string;
  sets: SetDraft[];
};

export function useWorkoutSession(planId?: string, workoutDayId?: string, exercises: WorkoutExercise[] = []) {
  const [drafts, setDrafts] = useState<ExerciseDraft[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const normalizedDrafts = useMemo(() => {
    return exercises.map((exercise) => {
      const existingDraft = drafts.find((draft) => draft.workoutExerciseId === exercise.id);
      if (existingDraft && existingDraft.sets.length === exercise.sets) {
        return existingDraft;
      }

      return {
        workoutExerciseId: exercise.id,
        sets: Array.from({ length: exercise.sets }, () => ({
          weight: '',
          repetitions: '',
          completed: false,
        })),
      };
    });
  }, [drafts, exercises]);

  function updateSet(
    workoutExerciseId: string,
    setIndex: number,
    field: keyof SetDraft,
    value: string | boolean,
  ) {
    setDrafts((currentDrafts) => {
      const baseDrafts = normalizedDrafts;
      return baseDrafts.map((draft) => {
        if (draft.workoutExerciseId !== workoutExerciseId) return draft;

        return {
          ...draft,
          sets: draft.sets.map((set, index) =>
            index === setIndex
              ? {
                  ...set,
                  [field]: value,
                }
              : set,
          ),
        };
      });
    });
  }

  async function saveSession() {
    if (!planId || !workoutDayId) {
      setStatus('Seleziona una scheda e un giorno.');
      return;
    }

    if (exercises.length === 0) {
      setStatus('Nessun esercizio da registrare.');
      return;
    }

    const now = new Date().toISOString();
    const sessionId = createId('session');
    const sessionSets: SessionSet[] = normalizedDrafts.flatMap((draft) =>
      draft.sets.map((set, index) => ({
        id: createId('set'),
        sessionId,
        workoutExerciseId: draft.workoutExerciseId,
        setNumber: index + 1,
        weight: set.weight ? Number(set.weight) : undefined,
        repetitions: set.repetitions ? Number(set.repetitions) : undefined,
        completed: set.completed,
      })),
    );

    await db.transaction('rw', db.workoutSessions, db.sessionSets, async () => {
      await db.workoutSessions.add({
        id: sessionId,
        planId,
        workoutDayId,
        startedAt: now,
        completedAt: now,
      });
      await db.sessionSets.bulkAdd(sessionSets);
    });

    setStatus('Allenamento salvato nello storico.');
  }

  return {
    drafts: normalizedDrafts,
    status,
    updateSet,
    saveSession,
  };
}
