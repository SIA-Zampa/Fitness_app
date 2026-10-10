import { Button } from '../../components/Button/Button';
import type { WorkoutExercise } from '../../database/db';
import { useWorkoutSession } from '../../hooks/useWorkoutSession';
import { RestTimer } from './RestTimer';

type VisibleExercise = WorkoutExercise & {
  exerciseName: string;
  muscleGroup: string;
};

type WorkoutSessionRecorderProps = {
  planId?: string;
  workoutDayId?: string;
  exercises: VisibleExercise[];
};

export function WorkoutSessionRecorder({ planId, workoutDayId, exercises }: WorkoutSessionRecorderProps) {
  const session = useWorkoutSession(planId, workoutDayId, exercises);

  if (exercises.length === 0) {
    return null;
  }

  return (
    <section className="manager-panel" aria-label="Registrazione allenamento">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Allenamento</p>
          <h2>Registra risultati</h2>
        </div>
        <span>{exercises.length} esercizi</span>
      </div>

      <div className="session-list">
        {exercises.map((exercise) => {
          const draft = session.drafts.find((item) => item.workoutExerciseId === exercise.id);

          return (
            <article key={exercise.id} className="session-exercise">
              <div>
                <strong>{exercise.exerciseName}</strong>
                <p>
                  Prescrizione: {exercise.sets} x {exercise.repetitions} · {exercise.restSeconds}s recupero
                </p>
              </div>

              <div className="set-grid">
                {draft?.sets.map((set, index) => (
                  <div className="set-row" key={`${exercise.id}-${index}`}>
                    <span>Serie {index + 1}</span>
                    <input
                      inputMode="decimal"
                      placeholder="Kg"
                      value={set.weight}
                      onChange={(event) =>
                        session.updateSet(exercise.id, index, 'weight', event.target.value)
                      }
                    />
                    <input
                      inputMode="numeric"
                      placeholder="Rep"
                      value={set.repetitions}
                      onChange={(event) =>
                        session.updateSet(exercise.id, index, 'repetitions', event.target.value)
                      }
                    />
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={set.completed}
                        onChange={(event) =>
                          session.updateSet(exercise.id, index, 'completed', event.target.checked)
                        }
                      />
                      <span>Fatta</span>
                    </label>
                  </div>
                ))}
              </div>

              <RestTimer defaultSeconds={exercise.restSeconds} />
            </article>
          );
        })}
      </div>

      {session.status && <p className="form-status">{session.status}</p>}
      <Button onClick={() => void session.saveSession()}>Salva allenamento</Button>
    </section>
  );
}
