import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import type { Client, ClientMeasurement, MonthlyClientMeasurements } from '../../database/db';
import { useClients, type ClientProfile } from '../../hooks/useClients';
import { clientAge, clientMeasurements, clientSexLabels, historicalWeeklyMeasurements, localDate, measurementChange, monthlyMeasurements } from '../../models/clientProfile';
import { levels } from '../../models/workoutOptions';
import { downloadClientExcel } from '../../services/clientExcel';

function ClientForm({ client, busy, onSave, onCancel }: {
  client?: Client;
  busy: boolean;
  onSave: (profile: ClientProfile) => void;
  onCancel: () => void;
}) {
  const [birthDate, setBirthDate] = useState(client?.birthDate ?? '');
  const existingMonths = monthlyMeasurements(client ?? {});
  const [months, setMonths] = useState(() => [...new Set([1, ...existingMonths.map((item) => item.month)])].sort((a, b) => a - b));
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (client) nameInput.current?.focus();
  }, [client]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? '').trim();
    const number = (key: string) => {
      const value = read(key);
      return value === '' ? undefined : Number(value);
    };
    const measurementsByMonth: MonthlyClientMeasurements[] = months.map((month) => {
      const measurementsCm: Partial<Record<ClientMeasurement, number>> = {};
      for (const { key } of clientMeasurements) {
        const value = number(`month-${month}-${key}`);
        if (value !== undefined) measurementsCm[key] = value;
      }
      return { month, measurementsCm };
    }).filter((item) => Object.keys(item.measurementsCm).length > 0);
    onSave({
      name: read('name'),
      level: read('level') || undefined,
      criticalities: read('criticalities') || undefined,
      notes: read('notes') || undefined,
      sex: read('sex') as ClientProfile['sex'],
      birthDate: birthDate || undefined,
      age: birthDate ? undefined : number('age'),
      weightKg: number('weightKg'),
      measurementsByMonth,
    });
  }

  return (
    <form onSubmit={submit}>
      <h3>{client ? `Modifica anagrafica di ${client.name}` : 'Nuovo cliente'}</h3>
      <div className="form-grid">
        <label>
          <span>Nome visualizzato</span>
          <input ref={nameInput} name="name" defaultValue={client?.name} placeholder="Es. Marco" required />
        </label>
        <label>
          <span>Sesso</span>
          <select name="sex" defaultValue={client?.sex ?? ''}>
            <option value="">Non indicato</option>
            <option value="F">Femminile</option>
            <option value="M">Maschile</option>
          </select>
        </label>
        <label>
          <span>Data di nascita</span>
          <input type="date" name="birthDate" min="0001-01-01" max={localDate()} value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)} />
        </label>
        <label>
          <span>{birthDate ? 'Età calcolata (anni)' : 'Età (anni)'}</span>
          {birthDate ? (
            <input key="calculated-age" value={clientAge({ birthDate }) ?? ''} readOnly />
          ) : (
            <input key="manual-age" type="number" name="age" min="0" step="1" defaultValue={client?.age} />
          )}
        </label>
        <label>
          <span>Peso (kg)</span>
          <input type="number" name="weightKg" min="0.01" step="any" defaultValue={client?.weightKg} />
        </label>
        <label>
          <span>Livello</span>
          <select name="level" defaultValue={client?.level ?? ''}>
            <option value="">Seleziona</option>
            {levels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
      </div>

      <h3>Criticità e ulteriori note</h3>
      <label className="full-field">
        <span>Eventuali criticità</span>
        <textarea name="criticalities" defaultValue={client?.criticalities} placeholder="Limitazioni o aspetti da considerare" />
      </label>
      <label className="full-field">
        <span>Ulteriori note</span>
        <textarea name="notes" defaultValue={client?.notes} placeholder="Obiettivi, preferenze o altre informazioni" />
      </label>

      <h3>Circonferenze per mese (cm)</h3>
      <div className="monthly-measurements">
        {months.map((month) => {
          const saved = existingMonths.find((item) => item.month === month);
          return (
            <section className="monthly-measurement" key={month} aria-label={`Misure mese ${month}`}>
              <div className="section-title-row">
                <h4>Mese {month}</h4>
                {month !== 1 && <Button type="button" variant="ghost" disabled={busy}
                  onClick={() => setMonths((current) => current.filter((item) => item !== month))}>
                  Rimuovi mese
                </Button>}
              </div>
              <div className="form-grid compact-fields">
                {clientMeasurements.map(({ key, label }) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input type="number" name={`month-${month}-${key}`} min="0.01" step="any"
                      defaultValue={saved?.measurementsCm[key]} />
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <Button type="button" variant="secondary" disabled={busy}
        onClick={() => setMonths((current) => [...current, Math.max(...current) + 1])}>
        Aggiungi mese
      </Button>

      <div className="row-actions">
        <Button type="submit" disabled={busy}>{client ? 'Salva modifiche' : 'Aggiungi cliente'}</Button>
        {client && <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Annulla</Button>}
      </div>
    </form>
  );
}

function MeasurementTable({ title, periods, unit, showChange }: {
  title: string;
  periods: Array<{ index: number; measurementsCm: Partial<Record<ClientMeasurement, number>> }>;
  unit: string;
  showChange: boolean;
}) {
  return (
    <details className="measurement-progress">
      <summary>{title}</summary>
      <div className="measurement-progress-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Misura</th>
              {periods.map((item) => <th scope="col" key={item.index}>{unit} {item.index}</th>)}
              {showChange && <th scope="col">Variazione mensile</th>}
            </tr>
          </thead>
          <tbody>
            {clientMeasurements.map(({ key, label }) => {
              const change = measurementChange(periods, key);
              return (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {periods.map((item) => <td key={item.index}>{item.measurementsCm[key]?.toLocaleString('it-IT') ?? '—'}</td>)}
                  {showChange && <td>{change === undefined ? '—' : `${change > 0 ? '+' : ''}${change.toLocaleString('it-IT')} cm`}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showChange && <small>Variazione tra le ultime due misure mensili registrate per ciascuna circonferenza.</small>}
    </details>
  );
}

function MeasurementProgress({ client }: { client: Client }) {
  const months = monthlyMeasurements(client);
  const weeks = historicalWeeklyMeasurements(client);
  return (
    <>
      {months.length > 0 && <MeasurementTable title="Progressi mensili delle circonferenze"
        periods={months.map((item) => ({ index: item.month, measurementsCm: item.measurementsCm }))}
        unit="Mese" showChange />}
      {weeks.length > 0 && <MeasurementTable title="Storico delle rilevazioni settimanali precedenti"
        periods={weeks.map((item) => ({ index: item.week, measurementsCm: item.measurementsCm }))}
        unit="Sett." showChange={false} />}
    </>
  );
}

export function ClientManager() {
  const { clients, saveClient, archiveClient, deleteClient } = useClients();
  const [editing, setEditing] = useState<Client>();
  const [formVersion, setFormVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operazione non riuscita.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="manager-panel" aria-label="Gestione clienti">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">IndexedDB</p>
          <h2>Gestione clienti</h2>
        </div>
        <span>{clients.length} clienti</span>
      </div>

      <ClientForm
        key={formVersion}
        client={editing}
        busy={busy}
        onSave={(profile) => void run(async () => {
          await saveClient(profile, editing?.id);
          setEditing(undefined);
          setFormVersion((version) => version + 1);
        })}
        onCancel={() => {
          setEditing(undefined);
          setError('');
          setFormVersion((version) => version + 1);
        }}
      />
      {error && <p role="alert">{error}</p>}

      <div className="entity-list">
        {clients.length === 0 ? <p className="empty-copy">Nessun cliente salvato.</p> : clients.map((client) => {
          const age = clientAge(client);
          return (
            <article key={client.id} className="entity-row client-row">
              <div>
                <strong>{client.name}</strong>
                <p>
                  {clientSexLabels[client.sex ?? '']}
                  {age !== undefined && ` · ${age} anni`}
                  {client.weightKg !== undefined && ` · ${client.weightKg.toLocaleString('it-IT')} kg`}
                  {client.level && ` · ${client.level}`}
                </p>
                {client.criticalities && <p>Criticità: {client.criticalities}</p>}
                <p>{client.notes || 'Nessuna nota'}</p>
                <MeasurementProgress client={client} />
                <small>ID: {client.id}</small>
              </div>
              <div className="row-actions">
                <Button variant="ghost" disabled={busy} onClick={() => {
                  setEditing(client);
                  setError('');
                  setFormVersion((version) => version + 1);
                }}>
                  Modifica anagrafica
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => void run(() => downloadClientExcel(client.id))}>
                  Esporta anagrafica Excel
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => void run(() => archiveClient(client.id))}>
                  {client.archived ? 'Riattiva' : 'Archivia'}
                </Button>
                <Button variant="ghost" disabled={busy || editing?.id === client.id}
                  onClick={() => void run(() => deleteClient(client.id))}>
                  Elimina
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
