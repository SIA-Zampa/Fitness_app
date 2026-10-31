import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type WorkoutPlan } from '../../database/db';
import { downloadWorkoutPlanExcel } from '../../services/workoutPlanExcel';

export function WorkoutPlanExportPanel() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      const [storedPlans, clients] = await Promise.all([db.workoutPlans.orderBy('updatedAt').reverse().toArray(), db.clients.toArray()]);
      setPlans(storedPlans);
      setClientNames(Object.fromEntries(clients.map((client) => [client.id, client.name])));
      setSelectedPlanId((currentPlanId) => currentPlanId || storedPlans[0]?.id || '');
    }

    void loadPlans();
  }, []);

  async function exportPlan(planId: string) {
    if (!planId) {
      setStatus('Seleziona una scheda da esportare.');
      return;
    }

    try {
      await downloadWorkoutPlanExcel(planId);
      setStatus('File esportato.');
    } catch (error) {
      console.error('Unable to export workout plan', error);
      setStatus('Non sono riuscito a esportare la scheda.');
    }
  }

  const filteredPlans = plans.filter((plan) => `${plan.name} ${clientNames[plan.clientId ?? ''] ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const visiblePlanId = filteredPlans.some((plan) => plan.id === selectedPlanId) ? selectedPlanId : filteredPlans[0]?.id ?? '';

  return (
    <section className="manager-panel" aria-label="Esportazione schede">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Excel</p>
          <h2>Esportazione schede</h2>
        </div>
        <span>.xlsx</span>
      </div>

      {plans.length === 0 ? (
        <p className="empty-copy">Crea prima una scheda da esportare.</p>
      ) : (
        <>
          <label className="full-field">
            <span>Cerca scheda</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome scheda o cliente" />
          </label>
          <label className="full-field">
            <span>Scheda</span>
            <select value={visiblePlanId} onChange={(event) => setSelectedPlanId(event.target.value)} disabled={filteredPlans.length === 0}>
              {filteredPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} v{plan.version}
                </option>
              ))}
            </select>
          </label>
          {filteredPlans.length === 0 && <p className="empty-copy">Nessuna scheda corrisponde alla ricerca.</p>}

          <p className="empty-copy">Un foglio Excel con tutti i giorni, gli esercizi e le indicazioni per il cliente.</p>

          {status && <p className="form-status">{status}</p>}
          <Button onClick={() => void exportPlan(visiblePlanId)} disabled={!visiblePlanId}>Esporta scheda</Button>
        </>
      )}
    </section>
  );
}
