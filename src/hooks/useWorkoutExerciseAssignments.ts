import { useEffect, useMemo, useState } from 'react';
import { db, type Exercise, type WorkoutDay, type WorkoutExercise, type WorkoutPlan } from '../database/db';
import { createId } from '../services/id';

type AssignedExercise = WorkoutExercise & {
  exerciseName: string;
  muscleGroup: string;
};

type UseWorkoutExerciseAssignmentsResult = {
  plans: WorkoutPlan[];
  days: WorkoutDay[];
  exercises: Exercise[];
  assignedExercises: AssignedExercise[];
  selectedPlanId: string;
  selectedDayId: string;
  selectedMuscleGroup: string;
  selectedExerciseId: string;
  muscleGroups: string[];
  filteredExercises: Exercise[];
  sets: number;
  repetitions: string;
  restSeconds: number;
  notes: string;
  status: string | null;
  setSelectedPlanId: (planId: string) => void;
  setSelectedDayId: (dayId: string) => void;
  setSelectedMuscleGroup: (muscleGroup: string) => void;
  setSelectedExerciseId: (exerciseId: string) => void;
  setSets: (sets: number) => void;
  setRepetitions: (repetitions: string) => void;
  setRestSeconds: (seconds: number) => void;
  setNotes: (notes: string) => void;
  addExercise: () => Promise<void>;
  removeExercise: (assignmentId: string) => Promise<void>;
};

export function useWorkoutExerciseAssignments(): UseWorkoutExerciseAssignmentsResult {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [allDays, setAllDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assignments, setAssignments] = useState<WorkoutExercise[]>([]);
  const [selectedPlanId, setSelectedPlanIdState] = useState('');
  const [selectedDayId, setSelectedDayIdState] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroupState] = useState('Tutti');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [sets, setSets] = useState(3);
  const [repetitions, setRepetitions] = useState('10');
  const [restSeconds, setRestSeconds] = useState(60);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function loadData() {
    const [storedPlans, storedDays, storedExercises, storedAssignments] = await Promise.all([
      db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
      db.workoutDays.orderBy('order').toArray(),
      db.exercises.orderBy('name').toArray(),
      db.workoutExercises.orderBy('order').toArray(),
    ]);

    setPlans(storedPlans);
    setAllDays(storedDays);
    setExercises(storedExercises);
    setAssignments(storedAssignments);

    if (!selectedPlanId && storedPlans[0]) {
      setSelectedPlanIdState(storedPlans[0].id);
      const firstDay = storedDays.find((day) => day.planId === storedPlans[0].id);
      setSelectedDayIdState(firstDay?.id ?? '');
    }

    if (!selectedExerciseId && storedExercises[0]) {
      setSelectedExerciseId(storedExercises[0].id);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const days = useMemo(() => {
    return allDays.filter((day) => day.planId === selectedPlanId);
  }, [allDays, selectedPlanId]);

  const exerciseById = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const muscleGroups = useMemo(() => {
    return ['Tutti', ...Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup)))];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    if (selectedMuscleGroup === 'Tutti') {
      return exercises;
    }

    return exercises.filter((exercise) => exercise.muscleGroup === selectedMuscleGroup);
  }, [exercises, selectedMuscleGroup]);

  const assignedExercises = useMemo(() => {
    return assignments
      .filter((assignment) => assignment.workoutDayId === selectedDayId)
      .map((assignment) => {
        const exercise = exerciseById.get(assignment.exerciseId);
        return {
          ...assignment,
          exerciseName: exercise?.name ?? 'Esercizio non trovato',
          muscleGroup: exercise?.muscleGroup ?? 'N/D',
        };
      });
  }, [assignments, exerciseById, selectedDayId]);

  function setSelectedPlanId(planId: string) {
    setSelectedPlanIdState(planId);
    const firstDay = allDays.find((day) => day.planId === planId);
    setSelectedDayIdState(firstDay?.id ?? '');
    setStatus(null);
  }

  function setSelectedDayId(dayId: string) {
    setSelectedDayIdState(dayId);
    setStatus(null);
  }

  function setSelectedMuscleGroup(muscleGroup: string) {
    setSelectedMuscleGroupState(muscleGroup);
    const firstExercise =
      muscleGroup === 'Tutti'
        ? exercises[0]
        : exercises.find((exercise) => exercise.muscleGroup === muscleGroup);
    setSelectedExerciseId(firstExercise?.id ?? '');
    setStatus(null);
  }

  async function addExercise() {
    if (!selectedPlanId || !selectedDayId || !selectedExerciseId) {
      setStatus('Seleziona scheda, giorno ed esercizio.');
      return;
    }

    if (sets < 1 || restSeconds < 0 || !repetitions.trim()) {
      setStatus('Controlla serie, ripetizioni e recupero.');
      return;
    }

    const nextOrder = assignedExercises.length + 1;
    await db.workoutExercises.add({
      id: createId('assignment'),
      workoutDayId: selectedDayId,
      exerciseId: selectedExerciseId,
      sets,
      repetitions: repetitions.trim(),
      restSeconds,
      notes: notes.trim() || undefined,
      order: nextOrder,
    });

    setNotes('');
    setStatus('Esercizio aggiunto al giorno.');
    await loadData();
  }

  async function removeExercise(assignmentId: string) {
    await db.workoutExercises.delete(assignmentId);
    setStatus('Esercizio rimosso.');
    await loadData();
  }

  return {
    plans,
    days,
    exercises,
    assignedExercises,
    selectedPlanId,
    selectedDayId,
    selectedMuscleGroup,
    selectedExerciseId,
    muscleGroups,
    filteredExercises,
    sets,
    repetitions,
    restSeconds,
    notes,
    status,
    setSelectedPlanId,
    setSelectedDayId,
    setSelectedMuscleGroup,
    setSelectedExerciseId,
    setSets,
    setRepetitions,
    setRestSeconds,
    setNotes,
    addExercise,
    removeExercise,
  };
}
