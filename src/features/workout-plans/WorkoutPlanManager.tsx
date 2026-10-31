import { Button } from '../../components/Button/Button';
import { useWorkoutPlans } from '../../hooks/useWorkoutPlans';
import { goals, levels } from '../../models/workoutOptions';

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
        <label><span>Obiettivo</span><select value={plans.goal} onChange={(event) => plans.setGoal(event.target.value)}><option value="">Seleziona</option>{goals.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Livello</span><select value={plans.level} onChange={(event) => plans.setLevel(event.target.value)}><option value="">Seleziona</option>{levels.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Settimane</span><input type="number" min="1" value={plans.weeks} onChange={(event) => plans.setWeeks(Number(event.target.value))} /></label>
        <label><span>Trainer</span><input value={plans.trainer} onChange={(event) => plans.setTrainer(event.target.value)} /></label>
        <label><span>Scala sforzo</span><select value={plans.effortScale} onChange={(event) => plans.setEffortScale(event.target.value as 'RIR' | 'RPE')}><option>RIR</option><option>RPE</option></select></label>
        {!plans.clientId && <label><span>Sesso</span><select value={plans.sex} onChange={(event) => plans.setSex(event.target.value as 'F' | 'M' | '')}><option value="">Non indicato</option><option value="F">Femminile</option><option value="M">Maschile</option></select></label>}
      </div>

      <div className="form-grid">
        <label>
          <span>Nome scheda</span>
          <input
            value={plans.name}
            onChange={(event) => plans.setName(event.target.value)}
            placeholder="Es. Ipertrofia Marco"
          />
        </label>

        <label>
          <span>Cliente associato</span>
          <select value={plans.clientId} onChange={(event) => plans.setClientId(event.target.value)}>
            <option value="">Nessun cliente</option>
            {plans.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="full-field">
        <span>Descrizione</span>
        <textarea
          value={plans.description}
          onChange={(event) => plans.setDescription(event.target.value)}
          placeholder="Obiettivo, note generali o indicazioni per il cliente"
          rows={3}
        />
      </label>

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
                  {plan.clientName} · v{plan.version} · {plan.days.length} giorni
                </p>
                <small>{plan.days.map((day) => day.name).join(', ')}</small>
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
