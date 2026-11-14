import { useEffect, useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type Client, type WorkoutPlan } from '../../database/db';
import { downloadWorkoutPlanExcel } from '../../services/workoutPlanExcel';

export function WorkoutPlanExportPanel() {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      const [storedPlans, storedClients] = await Promise.all([
        db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
        db.clients.orderBy('name').toArray(),
      ]);
      setPlans(storedPlans);
      setClients(storedClients);
      setSelectedPlanId((currentPlanId) => currentPlanId || storedPlans[0]?.id || '');
      setSelectedClientId(storedPlans[0]?.clientId ?? '');
    }

    void loadPlans();
  }, []);

  async function exportPlan(planId: string) {
    if (!planId) {
      setStatus('Seleziona una scheda da esportare.');
      return;
    }

    try {
      await downloadWorkoutPlanExcel(planId,
        clients.some((client) => client.id === selectedClientId) ? selectedClientId : undefined);
      setStatus('File esportato.');
    } catch (error) {
      console.error('Unable to export workout plan', error);
      setStatus(error instanceof Error ? error.message : 'Non sono riuscito a esportare la scheda.');
    }
  }

  const filteredPlans = plans.filter((plan) => plan.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
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
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Titolo scheda" />
          </label>
          <label className="full-field">
            <span>Scheda</span>
            <select value={visiblePlanId} onChange={(event) => {
              const planId = event.target.value;
              setSelectedPlanId(planId);
              setSelectedClientId(plans.find((plan) => plan.id === planId)?.clientId ?? '');
            }} disabled={filteredPlans.length === 0}>
              {filteredPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full-field">
            <span>Cliente da riportare nell’Excel (facoltativo)</span>
            <select value={clients.some((client) => client.id === selectedClientId) ? selectedClientId : ''}
              onChange={(event) => setSelectedClientId(event.target.value)}>
              <option value="">Nessun cliente: lascia i campi vuoti</option>
              {clients.map((client) => <option key={client.id} value={client.id}>
                {client.name}{client.archived ? ' (archiviato)' : ''}
              </option>)}
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
