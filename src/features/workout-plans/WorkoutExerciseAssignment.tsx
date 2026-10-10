import { Button } from '../../components/Button/Button';
import { useWorkoutExerciseAssignments } from '../../hooks/useWorkoutExerciseAssignments';

export function WorkoutExerciseAssignment() {
  const assignments = useWorkoutExerciseAssignments();

  return (
    <section className="manager-panel" aria-label="Esercizi della scheda">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Scheda</p>
          <h2>Esercizi per giorno</h2>
        </div>
        <span>{assignments.assignedExercises.length} esercizi</span>
      </div>

      {assignments.plans.length === 0 ? (
        <p className="empty-copy">Crea prima una scheda per assegnare gli esercizi.</p>
      ) : (
        <>
          <div className="form-grid">
            <label>
              <span>Scheda</span>
              <select
                value={assignments.selectedPlanId}
                onChange={(event) => assignments.setSelectedPlanId(event.target.value)}
              >
                {assignments.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Giorno</span>
              <select
                value={assignments.selectedDayId}
                onChange={(event) => assignments.setSelectedDayId(event.target.value)}
              >
                {assignments.days.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Gruppo muscolare</span>
              <select
                value={assignments.selectedMuscleGroup}
                onChange={(event) => assignments.setSelectedMuscleGroup(event.target.value)}
              >
                {assignments.muscleGroups.map((muscleGroup) => (
                  <option key={muscleGroup} value={muscleGroup}>
                    {muscleGroup}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Esercizio disponibile</span>
              <select
                value={assignments.selectedExerciseId}
                onChange={(event) => assignments.setSelectedExerciseId(event.target.value)}
              >
                {assignments.filteredExercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Ripetizioni</span>
              <input
                value={assignments.repetitions}
                onChange={(event) => assignments.setRepetitions(event.target.value)}
                placeholder="Es. 8-10"
              />
            </label>
          </div>

          <div className="form-grid compact-fields">
            <label>
              <span>Serie</span>
              <input
                type="number"
                min="1"
                value={assignments.sets}
                onChange={(event) => assignments.setSets(Number(event.target.value))}
              />
            </label>

            <label>
              <span>Recupero secondi</span>
              <input
                type="number"
                min="0"
                step="5"
                value={assignments.restSeconds}
                onChange={(event) => assignments.setRestSeconds(Number(event.target.value))}
              />
            </label>
          </div>

          <label className="full-field">
            <span>Note esercizio</span>
            <textarea
              value={assignments.notes}
              onChange={(event) => assignments.setNotes(event.target.value)}
              placeholder="Indicazioni tecniche, varianti o carico iniziale"
              rows={3}
            />
          </label>

          {assignments.status && <p className="form-status">{assignments.status}</p>}
          <Button onClick={() => void assignments.addExercise()}>Aggiungi esercizio</Button>

          <div className="entity-list">
            {assignments.assignedExercises.length === 0 ? (
              <p className="empty-copy">Nessun esercizio assegnato a questo giorno.</p>
            ) : (
              assignments.assignedExercises.map((assignment) => (
                <article key={assignment.id} className="entity-row">
                  <div>
                    <strong>
                      {assignment.order}. {assignment.exerciseName}
                    </strong>
                    <p>
                      {assignment.muscleGroup} · {assignment.sets} serie x {assignment.repetitions} ·{' '}
                      {assignment.restSeconds}s recupero
                    </p>
                    {assignment.notes && <small>{assignment.notes}</small>}
                  </div>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => void assignments.removeExercise(assignment.id)}>
                      Rimuovi
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
