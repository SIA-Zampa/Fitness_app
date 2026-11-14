import { useExercises } from '../../hooks/useExercises';
import { CustomExerciseForm } from './CustomExerciseForm';
import { CatalogOptionsManager } from './CatalogOptionsManager';
import { Fragment, useMemo, useState } from 'react';
import { Button } from '../../components/Button/Button';
import type { Exercise } from '../../database/db';
import { exerciseMacrosectionForGroup, exerciseMacrosections } from '../../database/exerciseCatalog';

export function ExerciseLibraryPreview() {
  const exercises = useExercises();
  const [editing, setEditing] = useState<Exercise>();
  const macrosections = useMemo(() => {
    const grouped = new Map<string, typeof exercises.exercises>();
    for (const exercise of exercises.exercises) {
      grouped.set(exercise.muscleGroup, [...(grouped.get(exercise.muscleGroup) ?? []), exercise]);
    }
    const groups = Array.from(grouped, ([name, items]) => ({ name, items }));
    return exerciseMacrosections.map((macrosection) => {
      const sectionGroups = groups.filter((group) => exerciseMacrosectionForGroup(group.name) === macrosection.id);
      return {
        ...macrosection,
        groups: sectionGroups,
        count: sectionGroups.reduce((total, group) => total + group.items.length, 0),
      };
    }).filter((macrosection) => macrosection.count > 0);
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
          <span>Gruppo / area</span>
          <select
            value={exercises.selectedMuscleGroup}
            onChange={(event) => { setEditing(undefined); exercises.setSelectedMuscleGroup(event.target.value); }}
          >
            <option value="Tutti">Tutti</option>
            {exerciseMacrosections.map((macrosection) => {
              const groups = exercises.muscleGroups.filter((group) =>
                group !== 'Tutti' && exerciseMacrosectionForGroup(group) === macrosection.id);
              return groups.length > 0 && <optgroup key={macrosection.id} label={macrosection.label}>
                {groups.map((group) => <option key={group} value={group}>{group}</option>)}
              </optgroup>;
            })}
          </select>
        </label>

        <label>
          <span>Ricerca</span>
          <input
            type="search"
            value={exercises.search}
            onChange={(event) => { setEditing(undefined); exercises.setSearch(event.target.value); }}
            placeholder="Nome esercizio"
          />
        </label>
      </div>

      <div className="exercise-list">
        {macrosections.length === 0 && <p className="empty-copy">Nessun esercizio trovato.</p>}
        {macrosections.map((macrosection) => (
          <details key={`${macrosection.id}-${exercises.search}-${exercises.selectedMuscleGroup}`}
            className="exercise-macrosection"
            open={Boolean(exercises.search.trim()) || macrosection.id === 'main' ||
              (exercises.selectedMuscleGroup !== 'Tutti' && exerciseMacrosectionForGroup(exercises.selectedMuscleGroup) === macrosection.id)}>
            <summary><strong>{macrosection.label}</strong><span>{macrosection.count} esercizi</span></summary>
            <div className="exercise-macro-groups">
              {macrosection.groups.map((group) => (
                <details key={`${group.name}-${exercises.search}-${exercises.selectedMuscleGroup}`} className="exercise-group"
                  open={Boolean(exercises.search.trim()) || exercises.selectedMuscleGroup === group.name}>
                  <summary><strong>{group.name}</strong><span>{group.items.length} esercizi</span></summary>
                  <div className="exercise-group-items">
                    {group.items.map((exercise) => (
                      <Fragment key={exercise.id}>
                        <article className="exercise-row">
                          <div><strong>{exercise.name}</strong>{exercise.description && <p>{exercise.description}</p>}{exercise.videoUrl && <p><a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">Guarda il video</a></p>}</div>
                          <div className="row-actions">
                            <Button variant="ghost" onClick={() => setEditing(exercise)} aria-label={`Modifica ${exercise.name}`}>Modifica</Button>
                            <Button variant="ghost" onClick={() => void exercises.deleteExercise(exercise.id)} aria-label={`Elimina ${exercise.name}`}>Elimina</Button>
                          </div>
                        </article>
                        {editing?.id === exercise.id && <CustomExerciseForm key={exercise.id} exercise={exercise}
                          onCancel={() => setEditing(undefined)}
                          onSaved={(muscleGroup) => {
                            setEditing(undefined);
                            exercises.setSearch('');
                            exercises.setSelectedMuscleGroup(muscleGroup);
                            void exercises.reload();
                          }} />}
                      </Fragment>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>

      <div className="inline-divider" />
      {!editing && <CustomExerciseForm
        onSaved={(muscleGroup) => {
          exercises.setSearch('');
          exercises.setSelectedMuscleGroup(muscleGroup);
          void exercises.reload();
        }}
      />}
      <div className="inline-divider" />
      <CatalogOptionsManager />
    </section>
  );
}
