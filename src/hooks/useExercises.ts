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
};

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('Tutti');
  const [search, setSearch] = useState('');

  async function loadExercises() {
    const storedExercises = await db.exercises.orderBy('muscleGroup').toArray();
    setExercises(storedExercises);
  }

  useEffect(() => {
    void loadExercises();
  }, []);

  const muscleGroups = useMemo(() => {
    return ['Tutti', ...Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup)))];
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return exercises.filter((exercise) => {
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
  };
}
