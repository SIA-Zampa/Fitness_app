import { useExercises } from '../../hooks/useExercises';
import { CustomExerciseForm } from './CustomExerciseForm';

export function ExerciseLibraryPreview() {
  const exercises = useExercises();

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
        {exercises.exercises.map((exercise) => (
          <article key={exercise.id} className="exercise-row">
            <div>
              <strong>{exercise.name}</strong>
              <p>{exercise.description}</p>
            </div>
            <span>{exercise.muscleGroup}</span>
          </article>
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
    </section>
  );
}
