import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { WorkoutPlanImportPanel } from '../../features/import-export/WorkoutPlanImportPanel';
import { WorkoutHistoryPanel } from '../../features/progress/WorkoutHistoryPanel';
import { WorkoutSessionRecorder } from '../../features/workout-sessions/WorkoutSessionRecorder';
import { useImportedWorkoutPlans } from '../../hooks/useImportedWorkoutPlans';
import { useState } from 'react';

type ClientSection = 'plan' | 'workout' | 'history' | 'import';

const clientSections: Array<{ id: ClientSection; label: string }> = [
  { id: 'plan', label: 'La mia scheda' },
  { id: 'workout', label: 'Allenamento' },
  { id: 'history', label: 'Storico' },
  { id: 'import', label: 'Importa' },
];

export function ClientHome() {
  const importedPlans = useImportedWorkoutPlans();
  const [activeSection, setActiveSection] = useState<ClientSection>('plan');

  if (importedPlans.plans.length === 0) {
    return (
      <section className="client-empty-state">
        <Card tone="accent">
          <p className="eyebrow">Prima apertura</p>
          <h2>Benvenuto!</h2>
          <p>Importa la scheda ricevuta dal tuo personal trainer per iniziare.</p>
        </Card>
        <WorkoutPlanImportPanel onImported={() => void importedPlans.reload()} />
      </section>
    );
  }

  return (
    <>
      <section className="module-tabs" aria-label="Sezioni cliente">
        {clientSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'secondary' : 'ghost'}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </section>

      {activeSection === 'import' && (
        <WorkoutPlanImportPanel onImported={() => void importedPlans.reload()} />
      )}

      {activeSection === 'plan' && (
        <section className="manager-panel" aria-label="La mia scheda">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">La mia scheda</p>
              <h2>{importedPlans.selectedPlan?.name}</h2>
            </div>
            <span>v{importedPlans.selectedPlan?.version}</span>
          </div>

          <div className="form-grid">
            <label>
              <span>Scheda</span>
              <select
                value={importedPlans.selectedPlanId}
                onChange={(event) => importedPlans.setSelectedPlanId(event.target.value)}
              >
                {importedPlans.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Giorno</span>
              <select
                value={importedPlans.selectedDayId}
                onChange={(event) => importedPlans.setSelectedDayId(event.target.value)}
              >
                {importedPlans.selectedPlan?.days.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="entity-list">
            {importedPlans.selectedDay?.exercises.length === 0 ? (
              <p className="empty-copy">Nessun esercizio previsto per questo giorno.</p>
            ) : (
              importedPlans.selectedDay?.exercises.map((exercise) => (
                <article key={exercise.id} className="entity-row">
                  <div>
                    <strong>
                      {exercise.order}. {exercise.exerciseName}
                    </strong>
                    <p>
                      {exercise.muscleGroup} · {exercise.sets} serie x {exercise.repetitions} ·{' '}
                      {exercise.restSeconds}s recupero
                    </p>
                    {exercise.notes && <small>{exercise.notes}</small>}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeSection === 'workout' && (
        <WorkoutSessionRecorder
          planId={importedPlans.selectedPlan?.id}
          workoutDayId={importedPlans.selectedDay?.id}
          exercises={importedPlans.selectedDay?.exercises ?? []}
        />
      )}

      {activeSection === 'history' && <WorkoutHistoryPanel />}
    </>
  );
}
