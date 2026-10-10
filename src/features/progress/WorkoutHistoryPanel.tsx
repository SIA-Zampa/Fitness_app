import { Button } from '../../components/Button/Button';
import { useWorkoutHistory } from '../../hooks/useWorkoutHistory';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function WorkoutHistoryPanel() {
  const history = useWorkoutHistory();

  return (
    <section className="manager-panel" aria-label="Storico allenamenti">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Storico</p>
          <h2>Allenamenti salvati</h2>
        </div>
        <span>{history.history.length} sessioni</span>
      </div>

      <Button variant="ghost" onClick={() => void history.reload()}>
        Aggiorna storico
      </Button>

      <div className="entity-list">
        {history.history.length === 0 ? (
          <p className="empty-copy">Nessun allenamento registrato.</p>
        ) : (
          history.history.map((session) => (
            <article key={session.id} className="history-card">
              <div className="section-title-row compact">
                <div>
                  <strong>{session.planName}</strong>
                  <p>
                    {session.dayName} · {formatDate(session.startedAt)}
                  </p>
                </div>
                <span>{session.sets.filter((set) => set.completed).length} serie</span>
              </div>

              <div className="history-group-list">
                {Array.from(new Set(session.sets.map((set) => set.muscleGroup))).map((muscleGroup) => {
                  const groupSets = session.sets.filter((set) => set.muscleGroup === muscleGroup);

                  return (
                    <section key={muscleGroup} className="history-muscle-group">
                      <div className="history-group-heading">
                        <strong>{muscleGroup}</strong>
                        <span>{groupSets.filter((set) => set.completed).length} serie completate</span>
                      </div>

                      {Array.from(new Set(groupSets.map((set) => set.exerciseName))).map((exerciseName) => {
                        const exerciseSets = groupSets.filter((set) => set.exerciseName === exerciseName);

                        return (
                          <div key={exerciseName} className="history-exercise-block">
                            <strong>{exerciseName}</strong>
                            <div className="history-set-list">
                              {exerciseSets.map((set) => (
                                <div key={set.id} className="history-set-row">
                                  <span>Serie {set.setNumber}</span>
                                  <strong>
                                    {set.repetitions ?? '-'} rep · {set.weight ?? '-'} kg
                                  </strong>
                                  <em>{set.completed ? 'Completata' : 'Non completata'}</em>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </section>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
