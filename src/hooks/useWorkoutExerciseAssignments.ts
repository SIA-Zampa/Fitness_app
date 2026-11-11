import { useEffect, useMemo, useState } from 'react';
import { db, type Exercise, type WorkoutDay, type WorkoutExercise, type WorkoutPlan } from '../database/db';
import { createId } from '../services/id';
import { mobilityGroups } from '../database/exerciseCatalog';

type AssignedExercise = WorkoutExercise & {
  exerciseName: string;
  muscleGroup: string;
};

type UseWorkoutExerciseAssignmentsResult = {
  plans: WorkoutPlan[];
  days: WorkoutDay[];
  exercises: Exercise[];
  assignedExercises: AssignedExercise[];
  selectedDay?: WorkoutDay;
  selectedPlan?: WorkoutPlan;
  canUseActivation: boolean;
  customMovements: string[];
  customTechniques: string[];
  hiddenMovements: string[];
  hiddenTechniques: string[];
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
  section: 'mobility' | 'activation' | 'main';
  movementType: string;
  effort: string;
  load: string;
  intensityTechnique: string;
  progression: string;
  increment: string;
  status: string | null;
  editingAssignmentId: string | null;
  setSelectedPlanId: (planId: string) => void;
  setSelectedDayId: (dayId: string) => void;
  setSelectedMuscleGroup: (muscleGroup: string) => void;
  setSelectedExerciseId: (exerciseId: string) => void;
  setSets: (sets: number) => void;
  setRepetitions: (repetitions: string) => void;
  setRestSeconds: (seconds: number) => void;
  setNotes: (notes: string) => void;
  setSection: (value: 'mobility' | 'activation' | 'main') => void;
  setMovementType: (value: string) => void;
  setEffort: (value: string) => void;
  setLoad: (value: string) => void;
  setIntensityTechnique: (value: string) => void;
  setProgression: (value: string) => void;
  setIncrement: (value: string) => void;
  updateDay: (changes: Partial<WorkoutDay>) => Promise<void>;
  addExercise: () => Promise<void>;
  editExercise: (assignmentId: string) => void;
  cancelEdit: () => void;
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
  const [section, setSection] = useState<'mobility' | 'activation' | 'main'>('main');
  const [movementType, setMovementType] = useState('');
  const [effort, setEffort] = useState('');
  const [load, setLoad] = useState('');
  const [intensityTechnique, setIntensityTechnique] = useState('');
  const [progression, setProgression] = useState('');
  const [increment, setIncrement] = useState('');
  const [canUseActivation, setCanUseActivation] = useState(false);
  const [customMovements, setCustomMovements] = useState<string[]>([]);
  const [customTechniques, setCustomTechniques] = useState<string[]>([]);
  const [hiddenMovements, setHiddenMovements] = useState<string[]>([]);
  const [hiddenTechniques, setHiddenTechniques] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  async function loadData() {
    const [storedPlans, storedDays, storedExercises, storedAssignments, options] = await Promise.all([
      db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
      db.workoutDays.orderBy('order').toArray(),
      db.exercises.orderBy('name').toArray(),
      db.workoutExercises.orderBy('order').toArray(),
      db.catalogOptions.toArray(),
    ]);

    setPlans(storedPlans);
    setAllDays(storedDays);
    setExercises(storedExercises);
    setAssignments(storedAssignments);
    setCustomMovements(options.filter((item) => item.kind === 'movement' && !item.hidden).map((item) => item.name));
    setCustomTechniques(options.filter((item) => item.kind === 'technique' && !item.hidden).map((item) => item.name));
    setHiddenMovements(options.filter((item) => item.kind === 'movement' && item.hidden).map((item) => item.name));
    setHiddenTechniques(options.filter((item) => item.kind === 'technique' && item.hidden).map((item) => item.name));
    const plan = storedPlans.find((item) => item.id === (selectedPlanId || storedPlans[0]?.id));
    const client = plan?.clientId ? await db.clients.get(plan.clientId) : undefined;
    setCanUseActivation((client?.sex ?? plan?.sex) === 'F');

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
  const selectedDay = days.find((day) => day.id === selectedDayId);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  async function updateDay(changes: Partial<WorkoutDay>) {
    if (!selectedDayId) return;
    await db.workoutDays.update(selectedDayId, changes);
    setAllDays((current) => current.map((day) => day.id === selectedDayId ? { ...day, ...changes } : day));
  }

  const exerciseById = useMemo(() => {
    return new Map(exercises.map((exercise) => [exercise.id, exercise]));
  }, [exercises]);

  const sectionExercises = useMemo(() => exercises.filter((exercise) => {
    if (exercise.archived) return false;
    if (section === 'mobility') return mobilityGroups.includes(exercise.muscleGroup);
    if (section === 'activation') return ['Attivazione glutei', 'Propriocezione ed equilibrio'].includes(exercise.muscleGroup);
    return !mobilityGroups.includes(exercise.muscleGroup) && !['Attivazione glutei', 'Propriocezione ed equilibrio'].includes(exercise.muscleGroup);
  }), [exercises, section]);

  const muscleGroups = useMemo(() => {
    const groups = Array.from(new Set(sectionExercises.map((exercise) => exercise.muscleGroup)));
    return ['Tutti', ...groups];
  }, [sectionExercises, section]);

  const activeMuscleGroup = muscleGroups.includes(selectedMuscleGroup)
    ? selectedMuscleGroup : muscleGroups[0] ?? '';

  const filteredExercises = useMemo(() => {
    const visible = activeMuscleGroup === 'Tutti'
      ? sectionExercises
      : sectionExercises.filter((exercise) => exercise.muscleGroup === activeMuscleGroup);
    const editingExercise = exercises.find((exercise) => exercise.id === selectedExerciseId);
    return editingAssignmentId && editingExercise && !visible.some((exercise) => exercise.id === editingExercise.id)
      ? [...visible, editingExercise]
      : visible;
  }, [sectionExercises, activeMuscleGroup, exercises, editingAssignmentId, selectedExerciseId]);

  const activeExerciseId = filteredExercises.some((exercise) => exercise.id === selectedExerciseId)
    ? selectedExerciseId : filteredExercises[0]?.id ?? '';

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
    setEditingAssignmentId(null);
    setSelectedPlanIdState(planId);
    const firstDay = allDays.find((day) => day.planId === planId);
    setSelectedDayIdState(firstDay?.id ?? '');
    const plan = plans.find((item) => item.id === planId);
    void (plan?.clientId ? db.clients.get(plan.clientId) : Promise.resolve(undefined)).then((client) => {
      setCanUseActivation((client?.sex ?? plan?.sex) === 'F');
    });
    setStatus(null);
  }

  function setSelectedDayId(dayId: string) {
    setEditingAssignmentId(null);
    setSelectedDayIdState(dayId);
    setStatus(null);
  }

  function setSelectedMuscleGroup(muscleGroup: string) {
    setSelectedMuscleGroupState(muscleGroup);
    const firstExercise =
      muscleGroup === 'Tutti'
        ? sectionExercises[0]
        : sectionExercises.find((exercise) => exercise.muscleGroup === muscleGroup);
    setSelectedExerciseId(firstExercise?.id ?? '');
    setStatus(null);
  }

  function changeSection(nextSection: 'mobility' | 'activation' | 'main') {
    setSection(nextSection);
    setSelectedMuscleGroupState('Tutti');
    setSelectedExerciseId('');
    setStatus(null);
  }

  function resetEditor() {
    setEditingAssignmentId(null);
    setSelectedMuscleGroupState('Tutti');
    setSelectedExerciseId('');
    setSets(3);
    setRepetitions('10');
    setRestSeconds(60);
    setNotes('');
    setSection('main');
    setMovementType('');
    setEffort('');
    setLoad('');
    setIntensityTechnique('');
    setProgression('');
    setIncrement('');
  }

  function editExercise(assignmentId: string) {
    const assignment = assignments.find((item) => item.id === assignmentId && item.workoutDayId === selectedDayId);
    if (!assignment) return;
    const exercise = exerciseById.get(assignment.exerciseId);
    setEditingAssignmentId(assignment.id);
    setSection(assignment.section ?? 'main');
    setSelectedMuscleGroupState(exercise?.muscleGroup ?? 'Tutti');
    setSelectedExerciseId(assignment.exerciseId);
    setSets(assignment.sets);
    setRepetitions(assignment.repetitions);
    setRestSeconds(assignment.restSeconds);
    setNotes(assignment.notes ?? '');
    setMovementType(assignment.movementType ?? '');
    setEffort(assignment.effort ?? '');
    setLoad(assignment.load ?? '');
    setIntensityTechnique(assignment.intensityTechnique ?? '');
    setProgression(assignment.progression ?? '');
    setIncrement(assignment.increment ?? '');
    setStatus(null);
  }

  function cancelEdit() {
    resetEditor();
    setStatus(null);
  }

  async function addExercise() {
    if (!selectedPlanId || !selectedDayId || !activeExerciseId) {
      setStatus('Seleziona scheda, giorno ed esercizio.');
      return;
    }

    if (sets < 1 || restSeconds < 0 || !Number.isInteger(Number(repetitions)) || Number(repetitions) < 1 ||
        (load !== '' && (!Number.isFinite(Number(load)) || Number(load) < 0))) {
      setStatus('Controlla serie, ripetizioni, recupero e carico.');
      return;
    }
    const effortValue = Number(effort);
    const isRpe = selectedPlan?.effortScale === 'RPE';
    if (effort !== '' && (!Number.isInteger(effortValue) || effortValue < (isRpe ? 1 : 0) || effortValue > (isRpe ? 10 : 5))) {
      setStatus(`Inserisci un valore ${isRpe ? 'RPE da 1 a 10' : 'RIR da 0 a 5'}.`);
      return;
    }
    if (section === 'activation' && !canUseActivation) {
      setStatus('La propriocezione glutei e disponibile solo per clienti di sesso femminile.');
      return;
    }

    const values = {
      exerciseId: activeExerciseId,
      sets,
      repetitions: repetitions.trim(),
      restSeconds,
      notes: notes.trim() || undefined,
      section,
      movementType: movementType.trim() || undefined,
      effort: effort.trim() || undefined,
      load: load.trim() || undefined,
      intensityTechnique: intensityTechnique.trim() || undefined,
      progression: progression.trim() || undefined,
      increment: increment.trim() || undefined,
    };

    if (editingAssignmentId) {
      const assignment = await db.workoutExercises.get(editingAssignmentId);
      if (!assignment || assignment.workoutDayId !== selectedDayId) {
        setStatus('Esercizio della scheda non trovato.');
        return;
      }
      await db.workoutExercises.update(editingAssignmentId, values);
    } else {
      await db.workoutExercises.add({
        id: createId('assignment'),
        workoutDayId: selectedDayId,
        order: assignedExercises.length + 1,
        ...values,
      });
    }

    setStatus(editingAssignmentId ? 'Esercizio modificato.' : 'Esercizio aggiunto al giorno.');
    resetEditor();
    await loadData();
  }

  async function removeExercise(assignmentId: string) {
    await db.workoutExercises.delete(assignmentId);
    if (editingAssignmentId === assignmentId) resetEditor();
    setStatus('Esercizio rimosso.');
    await loadData();
  }

  return {
    plans,
    days,
    exercises,
    assignedExercises,
    selectedDay, selectedPlan, canUseActivation, customMovements, customTechniques, hiddenMovements, hiddenTechniques,
    selectedPlanId,
    selectedDayId,
    selectedMuscleGroup: activeMuscleGroup,
    selectedExerciseId: activeExerciseId,
    muscleGroups,
    filteredExercises,
    sets,
    repetitions,
    restSeconds,
    notes,
    section, movementType, effort, load, intensityTechnique, progression, increment,
    status, editingAssignmentId,
    setSelectedPlanId,
    setSelectedDayId,
    setSelectedMuscleGroup,
    setSelectedExerciseId,
    setSets,
    setRepetitions,
    setRestSeconds,
    setNotes,
    setSection: changeSection, setMovementType, setEffort, setLoad, setIntensityTechnique, setProgression, setIncrement, updateDay,
    addExercise,
    editExercise,
    cancelEdit,
    removeExercise,
  };
}
