import { useEffect, useMemo, useState } from 'react';
import { db, type Exercise } from '../database/db';

type UseExercisesResult = {
  exercises: Exercise[];
  muscleGroups: string[];
  selectedMuscleGroup: string;
  setSelectedMuscleGroup: (muscleGroup: string) => void;
  search: string;
  setSearch: (search: string) => void;
  reload: () => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
};

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Tutti');
  const [search, setSearch] = useState('');

  async function loadExercises() {
    const storedExercises = await db.exercises.orderBy('muscleGroup').toArray();
    setExercises(storedExercises);
    setSelectedMuscleGroup((current) => current === 'Tutti' || storedExercises.some((exercise) => !exercise.archived && exercise.muscleGroup === current) ? current : 'Tutti');
  }

  async function deleteExercise(id: string) {
    const exercise = await db.exercises.get(id);
    if (!exercise) return;
    const confirmed = window.confirm(`Eliminare "${exercise.name}" dalla libreria? Le schede gia create resteranno invariate.`);
    if (!confirmed) return;
    await db.exercises.update(id, { archived: true });
    await loadExercises();
  }

  useEffect(() => {
    void loadExercises();
  }, []);

  const muscleGroups = useMemo(() => {
    return ['Tutti', ...Array.from(new Set(exercises.filter((exercise) => !exercise.archived).map((exercise) => exercise.muscleGroup)))];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (exercise.archived) return false;
      const matchesGroup =
        selectedMuscleGroup === 'Tutti' || exercise.muscleGroup === selectedMuscleGroup;
      const matchesSearch =
        normalizedSearch.length === 0 || exercise.name.toLowerCase().includes(normalizedSearch);

      return matchesGroup && matchesSearch;
    });
  }, [exercises, search, selectedMuscleGroup]);

  return {
    exercises: filteredExercises,
    muscleGroups,
    selectedMuscleGroup,
    setSelectedMuscleGroup,
    search,
    setSearch,
    reload: loadExercises,
    deleteExercise,
  };
}
