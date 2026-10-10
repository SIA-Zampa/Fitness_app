import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type WorkoutPlan } from '../../database/db';
import { buildWorkoutPlanExport, downloadWorkoutPlanExport } from '../../services/workoutPlanExport';

export function WorkoutPlanExportPanel() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      const storedPlans = await db.workoutPlans.orderBy('updatedAt').reverse().toArray();
      setPlans(storedPlans);
      setSelectedPlanId((currentPlanId) => currentPlanId || storedPlans[0]?.id || '');
    }

    void loadPlans();
  }, []);

  async function exportPlan() {
    if (!selectedPlanId) {
      setStatus('Seleziona una scheda da esportare.');
      return;
    }

    try {
      const exportedPlan = await buildWorkoutPlanExport(selectedPlanId);
      downloadWorkoutPlanExport(exportedPlan);
      setStatus('File esportato.');
    } catch (error) {
      console.error('Unable to export workout plan', error);
      setStatus('Non sono riuscito a esportare la scheda.');
    }
  }

  return (
    <section className="manager-panel" aria-label="Esportazione schede">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">JSON</p>
          <h2>Esportazione schede</h2>
        </div>
        <span>.fitscheda</span>
      </div>

      {plans.length === 0 ? (
        <p className="empty-copy">Crea prima una scheda da esportare.</p>
      ) : (
        <>
          <label className="full-field">
            <span>Scheda</span>
            <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} v{plan.version}
                </option>
              ))}
            </select>
          </label>

          <p className="empty-copy">
            Il file contiene solo i dati necessari a ricostruire la scheda: versione formato, giorni,
            esercizi, parametri e definizioni degli esercizi personalizzati usati.
          </p>

          {status && <p className="form-status">{status}</p>}
          <Button onClick={() => void exportPlan()}>Esporta scheda</Button>
        </>
      )}
    </section>
  );
}
