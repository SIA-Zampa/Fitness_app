import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import type { Client, ClientMeasurement, MonthlyClientMeasurements } from '../../database/db';
import { useClients, type ClientProfile } from '../../hooks/useClients';
import { clientAge, clientMeasurements, clientSexLabels, historicalWeeklyMeasurements, localDate, measurementChange, monthlyMeasurements, monthlyWeight } from '../../models/clientProfile';
import { levels } from '../../models/workoutOptions';
import { downloadClientExcel } from '../../services/clientExcel';
import { ClientProgressPanel } from './ClientProgressPanel';
import { formatCalendarDate, formatCalendarMonth } from '../../models/calendar';

const weekDays = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

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
    nameInput.current?.focus();
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
      return {
        month,
        calendarMonth: read(`month-${month}-date`) || undefined,
        weightKg: number(`month-${month}-weightKg`),
        measurementsCm,
      };
    }).filter((item) => item.weightKg !== undefined || Object.keys(item.measurementsCm).length > 0);
    const latestMonthly = [...measurementsByMonth].filter((item) => item.weightKg !== undefined)
      .sort((a, b) => a.calendarMonth && b.calendarMonth ? a.calendarMonth.localeCompare(b.calendarMonth) : a.month - b.month).at(-1);
    const latestHistorical = [...(client?.weightHistory ?? [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    const currentWeight = latestMonthly && (!latestHistorical || (latestMonthly.calendarMonth && latestMonthly.calendarMonth >= latestHistorical.date.slice(0, 7)))
      ? latestMonthly.weightKg : latestHistorical?.weightKg ?? client?.weightKg;
    onSave({
      name: read('name'),
      level: read('level') || undefined,
      criticalities: read('criticalities') || undefined,
      notes: read('notes') || undefined,
      goals: read('goals') || undefined,
      sleepHours: number('sleepHours'),
      pathologies: read('pathologies') || undefined,
      lifestyle: read('lifestyle') || undefined,
      trainingDays: weekDays.flatMap((_, index) => data.has(`trainingDay-${index + 1}`) ? [index + 1] : []),
      sex: read('sex') as ClientProfile['sex'],
      birthDate: birthDate || undefined,
      age: birthDate ? undefined : number('age'),
      weightKg: currentWeight,
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
          <span>Livello</span>
          <select name="level" defaultValue={client?.level ?? ''}>
            <option value="">Seleziona</option>
            {levels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
      </div>

      <h3>Scheda personale e colloquio</h3>
      <label className="full-field">
        <span>Obiettivi personali</span>
        <textarea name="goals" defaultValue={client?.goals} placeholder="Obiettivi e motivazioni del cliente" />
      </label>
      <div className="form-grid">
        <label><span>Ore di sonno abituali</span><input type="number" name="sleepHours" min="0" max="24" step="0.5" defaultValue={client?.sleepHours} /></label>
      </div>
      <label className="full-field"><span>Patologie o problematiche dichiarate</span><textarea name="pathologies" defaultValue={client?.pathologies} /></label>
      <label className="full-field"><span>Stile di vita e abitudini</span><textarea name="lifestyle" defaultValue={client?.lifestyle} /></label>
      <h3>Giorni abituali di allenamento</h3>
      <div className="weekday-grid">
        {weekDays.map((day, index) => <label key={day} className="checkbox-field">
          <input type="checkbox" name={`trainingDay-${index + 1}`} defaultChecked={client?.trainingDays?.includes(index + 1)} />
          <span>{day}</span>
        </label>)}
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

      <h3>Misure mensili: peso e circonferenze</h3>
      {client?.weightKg !== undefined && !existingMonths.some((item) => item.weightKg !== undefined) &&
        <p className="empty-copy">Peso attuale: {client.weightKg.toLocaleString('it-IT')} kg. Assegna un peso a un mese per iniziare il confronto mensile.</p>}
      <div className="monthly-measurements">
        {months.map((month) => {
          const saved = existingMonths.find((item) => item.month === month);
          return (
            <section className="monthly-measurement" key={month} aria-label={`Misure e peso mese ${month}`}>
              <div className="section-title-row">
                <h4>{formatCalendarMonth(saved?.calendarMonth) || `Rilevazione mensile ${month}`}</h4>
                {month !== 1 && <Button type="button" variant="ghost" disabled={busy}
                  onClick={() => setMonths((current) => current.filter((item) => item !== month))}>
                  Rimuovi mese
                </Button>}
              </div>
              <div className="form-grid compact-fields">
                <label><span>Mese di calendario</span><input type="month" name={`month-${month}-date`} defaultValue={saved?.calendarMonth ?? (saved ? '' : localDate().slice(0, 7))} /></label>
                <label><span>Peso corporeo (kg)</span><input type="number" name={`month-${month}-weightKg`} min="0.01" step="0.1" defaultValue={saved?.weightKg} /></label>
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
        <Button type="button" variant="ghost" disabled={busy} onClick={onCancel}>Annulla</Button>
      </div>
    </form>
  );
}

function MeasurementTable({ title, periods, unit, showChange }: {
  title: string;
  periods: Array<{ key: number; label: string; weightKg?: number; measurementsCm: Partial<Record<ClientMeasurement, number>> }>;
  unit?: string;
  showChange: boolean;
}) {
  return (
    <details className="measurement-progress" open>
      <summary>{title}</summary>
      <div className="measurement-progress-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Misura</th>
              {periods.map((item) => <th scope="col" key={item.key}>{unit ? `${unit} ` : ''}{item.label}</th>)}
              {showChange && <th scope="col">Variazione mensile</th>}
            </tr>
          </thead>
          <tbody>
            {showChange && <tr>
              <th scope="row">Peso corporeo (kg)</th>
              {periods.map((item) => <td key={item.key}>{item.weightKg?.toLocaleString('it-IT') ?? '—'}</td>)}
              <td>{(() => {
                const weights = periods.map((item) => item.weightKg).filter((value): value is number => value !== undefined);
                if (weights.length < 2) return '—';
                const change = weights[weights.length - 1] - weights[weights.length - 2];
                return `${change > 0 ? '+' : ''}${change.toLocaleString('it-IT')} kg`;
              })()}</td>
            </tr>}
            {clientMeasurements.map(({ key, label }) => {
              const change = measurementChange(periods, key);
              return (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {periods.map((item) => <td key={item.key}>{item.measurementsCm[key]?.toLocaleString('it-IT') ?? '—'}</td>)}
                  {showChange && <td>{change === undefined ? '—' : `${change > 0 ? '+' : ''}${change.toLocaleString('it-IT')} cm`}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showChange && <small>Variazione tra le ultime due rilevazioni disponibili di peso o circonferenza.</small>}
    </details>
  );
}

function MeasurementProgress({ client }: { client: Client }) {
  const months = monthlyMeasurements(client);
  const weeks = historicalWeeklyMeasurements(client);
  return (
    <>
      {months.length > 0 && <MeasurementTable title="Progressi mensili di peso e circonferenze"
        periods={months.map((item) => ({ key: item.month, label: formatCalendarMonth(item.calendarMonth) || `Data da assegnare (${item.month})`, weightKg: monthlyWeight(client, item), measurementsCm: item.measurementsCm }))}
        showChange />}
      {weeks.length > 0 && <>
        <MeasurementTable title="Storico delle rilevazioni precedenti"
          periods={weeks.map((item) => ({ key: item.week, label: formatCalendarDate(item.date) || 'Data non disponibile', measurementsCm: item.measurementsCm }))}
          showChange={false} />
      </>}
    </>
  );
}

function WeightHistory({ client }: { client: Client }) {
  const history = [...(client.weightHistory ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  if (history.length === 0) return null;
  return <div className="weekly-weight-progress">
    <h3>Storico delle pesate precedenti</h3>
    <div className="measurement-progress-scroll"><table className="weight-progress-table">
      <thead><tr><th>Data</th><th>Peso corporeo</th><th>Variazione</th></tr></thead>
      <tbody>{history.map((entry, index) => {
        const change = index ? entry.weightKg - history[index - 1].weightKg : undefined;
        return <tr key={entry.date}><td>{formatCalendarDate(entry.date)}</td><td>{entry.weightKg.toLocaleString('it-IT')} kg</td><td>{change === undefined ? '—' : `${change > 0 ? '+' : ''}${change.toLocaleString('it-IT')} kg`}</td></tr>;
      })}</tbody>
    </table></div>
  </div>;
}

type ClientPage = { kind: 'list' } | { kind: 'new' } | { kind: 'detail' | 'edit'; id: string };

function currentClientPage(): ClientPage {
  const parts = window.location.hash.replace(/^#\//, '').split('/');
  if (parts[0] !== 'clients') return { kind: 'list' };
  if (parts[1] === 'new') return { kind: 'new' };
  if (parts[1]) {
    try {
      return { kind: parts[2] === 'edit' ? 'edit' : 'detail', id: decodeURIComponent(parts[1]) };
    } catch {
      return { kind: 'list' };
    }
  }
  return { kind: 'list' };
}

export function ClientManager() {
  const { clients, loading, saveClient, archiveClient, deleteClient, reloadClients } = useClients();
  const [page, setPage] = useState<ClientPage>(currentClientPage);
  const [formVersion, setFormVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const syncPage = () => setPage(currentClientPage());
    window.addEventListener('hashchange', syncPage);
    return () => window.removeEventListener('hashchange', syncPage);
  }, []);

  function navigate(next: ClientPage) {
    const path = next.kind === 'list' ? '#/clients' : next.kind === 'new' ? '#/clients/new' :
      `#/clients/${encodeURIComponent(next.id)}${next.kind === 'edit' ? '/edit' : ''}`;
    window.location.hash = path;
    setPage(next);
    setFormVersion((version) => version + 1);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  const selectedClient = page.kind === 'detail' || page.kind === 'edit' ? clients.find((client) => client.id === page.id) : undefined;
  const visibleClients = clients.filter((client) => client.name.toLocaleLowerCase('it-IT').includes(search.trim().toLocaleLowerCase('it-IT')));

  if (page.kind === 'new' || page.kind === 'edit') {
    return <section className="manager-panel client-page" aria-label={page.kind === 'new' ? 'Nuovo cliente' : 'Modifica cliente'}>
      <div className="client-page-toolbar"><Button variant="ghost" onClick={() => navigate(page.kind === 'edit' ? { kind: 'detail', id: page.id } : { kind: 'list' })}>← Indietro</Button></div>
      {page.kind === 'edit' && !selectedClient ? <p>{loading ? 'Caricamento cliente...' : 'Cliente non trovato.'}</p> :
        <ClientForm key={formVersion} client={selectedClient} busy={busy}
          onSave={(profile) => void run(async () => {
            const id = await saveClient(profile, selectedClient?.id);
            navigate({ kind: 'detail', id });
          })}
          onCancel={() => navigate(page.kind === 'edit' ? { kind: 'detail', id: page.id } : { kind: 'list' })} />}
      {error && <p role="alert">{error}</p>}
    </section>;
  }

  if (page.kind === 'detail') {
    return <section className="manager-panel client-page" aria-label="Profilo cliente">
      <div className="client-page-toolbar"><Button variant="ghost" onClick={() => navigate({ kind: 'list' })}>← Tutti i clienti</Button></div>
      {!selectedClient ? <p>{loading ? 'Caricamento cliente...' : 'Cliente non trovato.'}</p> : <>
        <div className="client-profile-header">
          <div>
            <p className="eyebrow">Profilo cliente</p>
            <h2>{selectedClient.name}</h2>
            <p>{clientSexLabels[selectedClient.sex ?? '']}{clientAge(selectedClient) !== undefined && ` · ${clientAge(selectedClient)} anni`}{selectedClient.level && ` · ${selectedClient.level}`}</p>
          </div>
          {selectedClient.archived && <span className="client-status">Archiviato</span>}
        </div>
        <div className="row-actions client-profile-actions">
          <Button onClick={() => navigate({ kind: 'edit', id: selectedClient.id })}>Modifica dati</Button>
          <Button variant="secondary" disabled={busy} onClick={() => void run(() => downloadClientExcel(selectedClient.id))}>Esporta anagrafica Excel</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void run(() => archiveClient(selectedClient.id))}>{selectedClient.archived ? 'Riattiva' : 'Archivia'}</Button>
          <Button variant="ghost" disabled={busy} onClick={() => void run(async () => {
            if (await deleteClient(selectedClient.id)) navigate({ kind: 'list' });
          })}>Elimina</Button>
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="client-profile-grid">
          <section className="client-profile-card">
            <h3>Anagrafica</h3>
            <dl>
              <div><dt>Data di nascita</dt><dd>{selectedClient.birthDate || '—'}</dd></div>
              <div><dt>Età</dt><dd>{clientAge(selectedClient) === undefined ? '—' : `${clientAge(selectedClient)} anni`}</dd></div>
              <div><dt>Peso</dt><dd>{selectedClient.weightKg === undefined ? '—' : `${selectedClient.weightKg} kg`}</dd></div>
              <div><dt>Livello</dt><dd>{selectedClient.level || '—'}</dd></div>
            </dl>
          </section>
          <section className="client-profile-card">
            <h3>Scheda personale</h3>
            <dl>
              <div><dt>Obiettivi</dt><dd>{selectedClient.goals || '—'}</dd></div>
              <div><dt>Sonno abituale</dt><dd>{selectedClient.sleepHours === undefined ? '—' : `${selectedClient.sleepHours} ore`}</dd></div>
              <div><dt>Patologie e problematiche</dt><dd>{selectedClient.pathologies || '—'}</dd></div>
              <div><dt>Stile di vita</dt><dd>{selectedClient.lifestyle || '—'}</dd></div>
              <div><dt>Criticità</dt><dd>{selectedClient.criticalities || '—'}</dd></div>
              <div><dt>Altre note</dt><dd>{selectedClient.notes || '—'}</dd></div>
            </dl>
          </section>
        </div>
        <section className="client-profile-card">
          <h3>Giorni di allenamento</h3>
          <div className="client-weekdays">{weekDays.map((day, index) => <span key={day} className={selectedClient.trainingDays?.includes(index + 1) ? 'selected' : ''}>{day}</span>)}</div>
        </section>
        <section className="client-profile-card">
          <div className="section-title-row"><h3>Misure corporee e peso</h3><Button variant="secondary" onClick={() => navigate({ kind: 'edit', id: selectedClient.id })}>Modifica misure mensili</Button></div>
          <MeasurementProgress client={selectedClient} />
          <WeightHistory client={selectedClient} />
          {monthlyMeasurements(selectedClient).length === 0 && historicalWeeklyMeasurements(selectedClient).length === 0 && !selectedClient.weightHistory?.length && <p>Nessuna misura registrata.</p>}
        </section>
        <section className="client-profile-card"><ClientProgressPanel client={selectedClient} onSaved={reloadClients} /></section>
      </>}
    </section>;
  }

  return <section className="manager-panel client-page" aria-label="Gestione clienti">
    <div className="section-title-row client-list-heading">
      <div><p className="eyebrow">Clienti</p><h2>Elenco clienti</h2><p>{clients.length} clienti salvati</p></div>
      <Button onClick={() => navigate({ kind: 'new' })}>+ Nuovo cliente</Button>
    </div>
    <label className="full-field client-search"><span>Cerca cliente</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digita un nome" /></label>
    <div className="client-list">
      {visibleClients.length === 0 ? <p className="empty-copy">{loading ? 'Caricamento clienti...' : clients.length === 0 ? 'Nessun cliente salvato.' : 'Nessun cliente trovato.'}</p> : visibleClients.map((client) => <button key={client.id} type="button" className="client-list-item" onClick={() => navigate({ kind: 'detail', id: client.id })}>
        <span><strong>{client.name}</strong><small>{client.level || 'Livello non indicato'}{clientAge(client) !== undefined && ` · ${clientAge(client)} anni`}{client.archived && ' · Archiviato'}</small></span>
        <span className="client-list-arrow" aria-hidden="true">→</span>
      </button>)}
    </div>
  </section>;
}
