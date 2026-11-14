import { useRef } from 'react';
import { Button } from '../../components/Button/Button';
import { useWorkoutExerciseAssignments } from '../../hooks/useWorkoutExerciseAssignments';
import { intensityTechniques, movementTypes, progressionTypes, progressWeekCount } from '../../models/workoutOptions';

export function WorkoutExerciseAssignment() {
  const assignments = useWorkoutExerciseAssignments();
  const managerRef = useRef<HTMLElement>(null);

  return (
    <section ref={managerRef} className="manager-panel" aria-label="Esercizi della scheda">
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
          {assignments.editingAssignmentId && <h3>Modifica esercizio assegnato</h3>}
          <div className="form-grid">
            <label>
              <span>Scheda</span>
              <select
                value={assignments.selectedPlanId}
                onChange={(event) => assignments.setSelectedPlanId(event.target.value)}
              >
                {assignments.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}{plan.sex === 'M' ? ' · maschi' : plan.sex === 'F' ? ' · femmine' : ''}
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

          {assignments.selectedDay && <div className="form-grid">
            <label><span>Focus del giorno</span><input key={`${assignments.selectedDayId}-focus`} defaultValue={assignments.selectedDay.focus ?? ''} onBlur={(event) => void assignments.updateDay({ focus: event.target.value })} /></label>
            <label><span>Note iniziali</span><input key={`${assignments.selectedDayId}-initial`} defaultValue={assignments.selectedDay.initialNotes ?? ''} onBlur={(event) => void assignments.updateDay({ initialNotes: event.target.value })} /></label>
            <label><span>Note e osservazioni</span><textarea key={`${assignments.selectedDayId}-observations`} defaultValue={assignments.selectedDay.observations ?? ''} onBlur={(event) => void assignments.updateDay({ observations: event.target.value })} /></label>
          </div>}

          <label className="full-field"><span>Sezione</span><select value={assignments.section} onChange={(event) => assignments.setSection(event.target.value as 'mobility' | 'activation' | 'main')}>
            <option value="mobility">Mobilita articolare</option>
            {assignments.canUseActivation && <option value="activation">Attivazione / propriocezione glutei</option>}
            <option value="main">Allenamento principale</option>
          </select></label>

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
                    {exercise.name}{exercise.archived ? ' (archiviato)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              <span>Ripetizioni</span>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={assignments.repetitions}
                onChange={(event) => assignments.setRepetitions(event.target.value)}
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
          <div className="form-grid">
            <label><span>Tipo movimento</span><select value={assignments.movementType} onChange={(event) => assignments.setMovementType(event.target.value)}><option value="">Seleziona</option>{[...movementTypes.filter((item) => !assignments.hiddenMovements.includes(item)), ...assignments.customMovements].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>{assignments.selectedPlan?.effortScale ?? 'RIR'}</span><input type="number" min={(assignments.selectedPlan?.effortScale ?? 'RIR') === 'RPE' ? 1 : 0} max={(assignments.selectedPlan?.effortScale ?? 'RIR') === 'RPE' ? 10 : 5} step="1" inputMode="numeric" value={assignments.effort} onChange={(event) => assignments.setEffort(event.target.value)} /></label>
            <label><span>Carico</span><span className="unit-input"><input type="number" min="0" step="0.5" inputMode="decimal" value={assignments.load} onChange={(event) => assignments.setLoad(event.target.value)} aria-label="Carico in kg" /><span>kg</span></span></label>
            <label><span>Tecnica intensita</span><select value={assignments.intensityTechnique} onChange={(event) => assignments.setIntensityTechnique(event.target.value)}><option value="">Seleziona</option>{[...intensityTechniques.filter((item) => !assignments.hiddenTechniques.includes(item)), ...assignments.customTechniques].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Progressione</span><select value={assignments.progression} onChange={(event) => assignments.setProgression(event.target.value)}><option value="">Seleziona</option>{progressionTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Incremento</span><input value={assignments.increment} onChange={(event) => assignments.setIncrement(event.target.value)} /></label>
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

          <section className="weekly-instructions" aria-label="Progressioni dei periodi">
            <h3>Progressioni per periodo</h3>
            <p>Scrivi le indicazioni da mostrare accanto all’esercizio nelle otto colonne del foglio Excel.</p>
            <div className="weekly-instructions-grid">
              {Array.from({ length: progressWeekCount }, (_, index) => <label key={index}>
                <span>Progressione {index + 1}</span>
                <textarea rows={2} value={assignments.weeklyInstructions[index] ?? ''}
                  onChange={(event) => assignments.setWeeklyInstruction(index, event.target.value)}
                  placeholder="Es. 3×8 al 70%, aumenta il carico se completi tutte le ripetizioni" />
              </label>)}
            </div>
          </section>

          {assignments.status && <p className="form-status">{assignments.status}</p>}
          <div className="row-actions">
            <Button onClick={() => void assignments.addExercise()}>
              {assignments.editingAssignmentId ? 'Salva modifiche' : 'Aggiungi esercizio'}
            </Button>
            {assignments.editingAssignmentId && <Button variant="ghost" onClick={assignments.cancelEdit}>Annulla</Button>}
          </div>

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
                      {assignment.section === 'mobility' ? 'Mobilita' : assignment.section === 'activation' ? 'Propriocezione glutei' : 'Principale'} · {assignment.muscleGroup} · {assignment.sets} serie x {assignment.repetitions} ·{' '}
                      {assignment.restSeconds}s recupero
                    </p>
                    {assignment.notes && <small>{assignment.notes}</small>}
                    {assignment.weeklyInstructions?.some((value) => value.trim()) && <div className="assignment-instructions">
                      {assignment.weeklyInstructions.map((value, index) => value.trim() ? <p key={index}>
                        <strong>Progressione {index + 1}:</strong> {value}
                      </p> : null)}
                    </div>}
                  </div>
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => {
                      assignments.editExercise(assignment.id);
                      managerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}>
                      Modifica
                    </Button>
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
