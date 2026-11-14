import { Button } from '../../components/Button/Button';
import { useWorkoutPlans } from '../../hooks/useWorkoutPlans';

export function WorkoutPlanManager() {
  const plans = useWorkoutPlans();

  return (
    <section className="manager-panel" aria-label="Creazione schede">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Schede</p>
          <h2>Creazione schede</h2>
        </div>
        <span>{plans.plans.length} schede</span>
      </div>

      <div className="form-grid">
        <label>
          <span>Titolo scheda</span>
          <input
            value={plans.name}
            onChange={(event) => plans.setName(event.target.value)}
            placeholder="Es. Ipertrofia base"
          />
        </label>
        <label>
          <span>Scheda per</span>
          <select value={plans.sex} onChange={(event) => plans.setSex(event.target.value as 'F' | 'M' | '')}>
            <option value="">Seleziona</option>
            <option value="M">Maschi</option>
            <option value="F">Femmine</option>
          </select>
        </label>
      </div>

      <div className="day-builder">
        <div className="section-title-row compact">
          <h3>Giorni di allenamento</h3>
          <Button variant="secondary" onClick={plans.addDay}>
            Aggiungi giorno
          </Button>
        </div>

        {plans.dayNames.map((dayName, index) => (
          <div className="day-row" key={`${index}-${dayName}`}>
            <label>
              <span>Giorno {index + 1}</span>
              <input
                value={dayName}
                onChange={(event) => plans.setDayName(index, event.target.value)}
                placeholder={`Giorno ${index + 1}`}
              />
            </label>
            <Button variant="ghost" onClick={() => plans.removeDay(index)}>
              Rimuovi
            </Button>
          </div>
        ))}
      </div>

      {plans.status && <p className="form-status">{plans.status}</p>}
      <Button onClick={() => void plans.createPlan()}>Salva scheda</Button>

      <div className="entity-list">
        {plans.plans.length === 0 ? (
          <p className="empty-copy">Nessuna scheda salvata.</p>
        ) : (
          plans.plans.map((plan) => (
            <article key={plan.id} className="entity-row">
              <div>
                <strong>{plan.name}</strong>
                <p>
                  {plan.days.length} giorni
                </p>
                <small>{plan.days.map((day) => day.name).join(', ')}</small>
                <label className="plan-sex"><span>Scheda per</span><select value={plan.sex ?? ''}
                  onChange={(event) => void plans.updateSex(plan.id, event.target.value as 'F' | 'M' | '')}
                  aria-label={`Sesso della scheda ${plan.name}`}>
                  <option value="">Non specificato</option>
                  <option value="M">Maschi</option>
                  <option value="F">Femmine</option>
                </select></label>
              </div>
              <div className="row-actions">
                <Button variant="ghost" onClick={() => void plans.duplicatePlan(plan.id)}>
                  Duplica
                </Button>
                <Button variant="ghost" onClick={() => void plans.deletePlan(plan.id)}>
                  Elimina
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
