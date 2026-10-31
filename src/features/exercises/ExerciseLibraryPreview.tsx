import { useExercises } from '../../hooks/useExercises';
import { CustomExerciseForm } from './CustomExerciseForm';
import { CatalogOptionsManager } from './CatalogOptionsManager';
import { useMemo } from 'react';
import { Button } from '../../components/Button/Button';

export function ExerciseLibraryPreview() {
  const exercises = useExercises();
  const groups = useMemo(() => {
    const grouped = new Map<string, typeof exercises.exercises>();
    for (const exercise of exercises.exercises) {
      grouped.set(exercise.muscleGroup, [...(grouped.get(exercise.muscleGroup) ?? []), exercise]);
    }
    return Array.from(grouped, ([name, items]) => ({ name, items }));
  }, [exercises.exercises]);

  return (
    <section className="exercise-library-preview" aria-label="Anteprima libreria esercizi">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">IndexedDB</p>
          <h2>Libreria esercizi</h2>
        </div>
        <span>{exercises.exercises.length} esercizi</span>
      </div>

      <div className="form-grid">
        <label>
          <span>Gruppo muscolare</span>
          <select
            value={exercises.selectedMuscleGroup}
            onChange={(event) => exercises.setSelectedMuscleGroup(event.target.value)}
          >
            {exercises.muscleGroups.map((muscleGroup) => (
              <option key={muscleGroup} value={muscleGroup}>
                {muscleGroup}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Ricerca</span>
          <input
            type="search"
            value={exercises.search}
            onChange={(event) => exercises.setSearch(event.target.value)}
            placeholder="Nome esercizio"
          />
        </label>
      </div>

      <div className="exercise-list">
        {groups.length === 0 && <p className="empty-copy">Nessun esercizio trovato.</p>}
        {groups.map((group) => (
          <details key={`${group.name}-${exercises.search}-${exercises.selectedMuscleGroup}`} className="exercise-group" open={Boolean(exercises.search.trim()) || exercises.selectedMuscleGroup === group.name}>
            <summary><strong>{group.name}</strong><span>{group.items.length} esercizi</span></summary>
            <div className="exercise-group-items">
              {group.items.map((exercise) => (
                <article key={exercise.id} className="exercise-row">
                  <div><strong>{exercise.name}</strong>{exercise.description && <p>{exercise.description}</p>}</div>
                  <Button variant="ghost" onClick={() => void exercises.deleteExercise(exercise.id)} aria-label={`Elimina ${exercise.name}`}>Elimina</Button>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="inline-divider" />
      <CustomExerciseForm
        onSaved={(muscleGroup) => {
          exercises.setSearch('');
          exercises.setSelectedMuscleGroup(muscleGroup);
          void exercises.reload();
        }}
      />
      <div className="inline-divider" />
      <CatalogOptionsManager />
    </section>
  );
}
