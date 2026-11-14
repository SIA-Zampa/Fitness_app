import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type Client, type Exercise, type MonthlyStrengthProgress, type WeeklyExerciseProgression, type WorkoutExercise, type WorkoutPlan } from '../../database/db';
import { calendarWeekLabel, weightForCalendarWeek } from '../../models/calendar';
import { progressWeekCount } from '../../models/workoutOptions';

type Assigned = WorkoutExercise & { plan: WorkoutPlan; exerciseName: string };

export function ClientProgressPanel({ client, onSaved }: { client: Client; onSaved: () => Promise<void> }) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [assigned, setAssigned] = useState<Assigned[]>([]);
  const [exerciseId, setExerciseId] = useState('');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [assignmentQuery, setAssignmentQuery] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      const [allExercises, plans, days, assignments] = await Promise.all([
        db.exercises.toArray(),
        db.workoutPlans.where('clientId').equals(client.id).toArray(),
        db.workoutDays.toArray(),
        db.workoutExercises.toArray(),
      ]);
      if (!active) return;
      const planByDay = new Map(days.flatMap((day) => {
        const plan = plans.find((item) => item.id === day.planId);
        return plan ? [[day.id, plan] as const] : [];
      }));
      const exerciseById = new Map(allExercises.map((exercise) => [exercise.id, exercise]));
      const items = assignments.flatMap((entry) => {
        const plan = planByDay.get(entry.workoutDayId);
        return plan ? [{ ...entry, plan, exerciseName: exerciseById.get(entry.exerciseId)?.name ?? 'Esercizio non trovato' }] : [];
      });
      setExercises(allExercises.sort((a, b) => a.name.localeCompare(b.name)));
      setAssigned(items);
      setExerciseId((current) => current || allExercises[0]?.id || '');
      setAssignmentId((current) => current || items[0]?.id || '');
    })();
    return () => { active = false; };
  }, [client.id]);

  const filteredExercises = useMemo(() => exercises.filter((item) =>
    `${item.name} ${item.muscleGroup}`.toLocaleLowerCase('it-IT').includes(exerciseQuery.trim().toLocaleLowerCase('it-IT'))), [exercises, exerciseQuery]);
  const selectedExerciseId = filteredExercises.some((item) => item.id === exerciseId) ? exerciseId : filteredExercises[0]?.id ?? '';
  const filteredAssignments = useMemo(() => assigned.filter((item) =>
    `${item.exerciseName} ${item.plan.name}`.toLocaleLowerCase('it-IT').includes(assignmentQuery.trim().toLocaleLowerCase('it-IT'))), [assigned, assignmentQuery]);
  const selectedAssignment = filteredAssignments.find((item) => item.id === assignmentId) ?? filteredAssignments[0];
  const monthly = useMemo(() => [...(client.monthlyStrength ?? [])]
    .filter((item) => item.exerciseId === selectedExerciseId)
    .sort((a, b) => a.month.localeCompare(b.month)), [client.monthlyStrength, selectedExerciseId]);
  const weekly = useMemo(() => [...(client.weeklyProgressions ?? [])]
    .filter((item) => item.workoutExerciseId === selectedAssignment?.id)
    .sort((a, b) => a.week - b.week), [client.weeklyProgressions, selectedAssignment?.id]);
  const visibleWeeks = selectedAssignment?.weeklyInstructions?.some((value) => value.trim())
    ? Array.from({ length: progressWeekCount }, (_, index) => index + 1)
    : weekly.map((item) => item.week);
  const periodLabel = (week: number) => selectedAssignment?.plan.startDate
    ? calendarWeekLabel(selectedAssignment.plan.startDate, week)
    : `Progressione ${week}`;

  async function saveMonthly(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const month = String(data.get('month') ?? '');
    const weightKg = Number(data.get('weightKg'));
    const repetitions = Number(data.get('repetitions'));
    if (!selectedExerciseId || !/^\d{4}-\d{2}$/.test(month) || weightKg < 0 || repetitions < 1) return;
    const row: MonthlyStrengthProgress = { exerciseId: selectedExerciseId, month, weightKg, repetitions, notes: String(data.get('notes') ?? '').trim() || undefined };
    const remaining = (client.monthlyStrength ?? []).filter((item) => item.exerciseId !== row.exerciseId || item.month !== row.month);
    await db.clients.update(client.id, { monthlyStrength: [...remaining, row] });
    await onSaved();
    setStatus('Progressione mensile salvata.');
  }

  async function saveWeekly(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAssignment) return;
    const data = new FormData(event.currentTarget);
    const week = Number(data.get('week'));
    if (!Number.isInteger(week) || week < 1 || week > Math.max(1, selectedAssignment.plan.weeks ?? 8)) return;
    const optionalNumber = (key: string) => String(data.get(key) ?? '') === '' ? undefined : Number(data.get(key));
    const row: WeeklyExerciseProgression = {
      workoutExerciseId: selectedAssignment.id,
      week,
      repetitions: optionalNumber('repetitions'),
      loadPercent: optionalNumber('loadPercent'),
      weightKg: optionalNumber('weightKg'),
      notes: String(data.get('notes') ?? '').trim() || undefined,
    };
    const remaining = (client.weeklyProgressions ?? []).filter((item) => item.workoutExerciseId !== row.workoutExerciseId || item.week !== row.week);
    await db.clients.update(client.id, { weeklyProgressions: [...remaining, row] });
    await onSaved();
    setStatus('Progressione settimanale salvata.');
  }

  const weightValues = monthly.map((item) => item.weightKg);
  const high = Math.max(1, ...weightValues);
  const chartWidth = Math.max(640, monthly.length * 82 + 92);
  const points = monthly.map((item, index) => {
    const x = monthly.length === 1 ? chartWidth / 2 : 62 + index * (chartWidth - 92) / (monthly.length - 1);
    const y = 200 - item.weightKg / high * 170;
    return { x, y, item };
  });

  return <div className="client-progress-panel">
    <h4>Progressi mensili negli esercizi fondamentali</h4>
    <label className="full-field"><span>Cerca esercizio</span><input type="search" value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Digita nome o gruppo muscolare" /></label>
    <label className="full-field"><span>Esercizio da monitorare</span><select value={selectedExerciseId} onChange={(event) => setExerciseId(event.target.value)}>
      {filteredExercises.map((item) => <option key={item.id} value={item.id}>{item.name}{item.archived ? ' (archiviato)' : ''}</option>)}
    </select></label>
    {filteredExercises.length === 0 && <p>Nessun esercizio corrisponde alla ricerca.</p>}
    {monthly.length > 0 ? <>
      {monthly.length > 1 && monthly[monthly.length - 1].weightKg <= monthly[monthly.length - 2].weightKg &&
        monthly[monthly.length - 1].repetitions <= monthly[monthly.length - 2].repetitions &&
        <p className="form-status">Ultima rilevazione senza aumento di carico o ripetizioni: verifica un possibile stallo.</p>}
      <div className="chart-scroll"><svg className="strength-chart" style={{ width: chartWidth }} viewBox={`0 0 ${chartWidth} 260`} role="img" aria-label="Grafico dei carichi mensili in chilogrammi">
        <line x1="62" y1="30" x2="62" y2="200" />
        <line x1="62" y1="200" x2={chartWidth - 30} y2="200" />
        {[0, high / 2, high].map((value) => <g key={value}>
          <line className="chart-tick" x1="57" y1={200 - value / high * 170} x2="62" y2={200 - value / high * 170} />
          <text x="51" y={204 - value / high * 170} textAnchor="end">{Number(value.toFixed(1)).toLocaleString('it-IT')}</text>
        </g>)}
        <polyline points={points.map(({ x, y }) => `${x},${y}`).join(' ')} />
        {points.map(({ x, y, item }) => <g key={item.month}>
          <circle cx={x} cy={y} r="5"><title>{item.month}: {item.weightKg} kg, {item.repetitions} ripetizioni</title></circle>
          <text x={x} y="218" textAnchor="middle">{item.month}</text>
        </g>)}
        <text className="chart-axis-title" x={chartWidth / 2} y="246" textAnchor="middle">Mese</text>
        <text className="chart-axis-title" x="16" y="115" textAnchor="middle" transform="rotate(-90 16 115)">Carico (kg)</text>
      </svg></div>
      <div className="measurement-progress-scroll"><table><thead><tr><th>Mese</th><th>Carico</th><th>Ripetizioni</th><th>Note</th></tr></thead><tbody>
        {monthly.map((item) => <tr key={item.month}><td>{item.month}</td><td>{item.weightKg} kg</td><td>{item.repetitions}</td><td>{item.notes || '—'}</td></tr>)}
      </tbody></table></div>
    </> : <p>Nessuna rilevazione mensile per questo esercizio.</p>}
    {selectedExerciseId && <form onSubmit={(event) => void saveMonthly(event)} className="progress-form">
      <div className="form-grid compact-fields">
        <label><span>Mese</span><input type="month" name="month" required /></label>
        <label><span>Carico (kg)</span><input type="number" name="weightKg" min="0" step="0.5" required /></label>
        <label><span>Ripetizioni</span><input type="number" name="repetitions" min="1" step="1" required /></label>
        <label><span>Note</span><input name="notes" placeholder="Es. stallo o miglioramento" /></label>
      </div>
      <Button type="submit" variant="secondary">Salva mese</Button>
    </form>}

    {assigned.length > 0 && <>
      <label className="full-field"><span>Cerca esercizio della scheda</span><input type="search" value={assignmentQuery} onChange={(event) => setAssignmentQuery(event.target.value)} placeholder="Digita esercizio o scheda" /></label>
      <label className="full-field"><span>Esercizio della scheda</span><select value={selectedAssignment?.id ?? ''} onChange={(event) => setAssignmentId(event.target.value)}>
        {filteredAssignments.map((item) => <option key={item.id} value={item.id}>{item.plan.name} · {item.exerciseName}</option>)}
      </select></label>
      {filteredAssignments.length === 0 && <p>Nessun esercizio corrisponde alla ricerca.</p>}
      {selectedAssignment && <>
      <p>Durata scheda: {selectedAssignment.plan.weeks ?? 8} settimane</p>
      {visibleWeeks.length > 0 && <div className="measurement-progress-scroll"><table><thead><tr><th>Periodo calendario</th><th>Programmazione</th><th>Peso corporeo</th><th>Ripetizioni</th><th>% carico</th><th>Carico esercizio</th><th>Note</th></tr></thead><tbody>
        {visibleWeeks.map((week) => {
          const item = weekly.find((entry) => entry.week === week);
          const bodyWeight = weightForCalendarWeek(client.weightHistory, selectedAssignment.plan.startDate, week);
          return <tr key={week}><td>{periodLabel(week)}</td><td>{selectedAssignment.weeklyInstructions?.[week - 1] || '—'}</td><td>{bodyWeight === undefined ? '—' : `${bodyWeight} kg`}</td><td>{item?.repetitions ?? '—'}</td><td>{item?.loadPercent === undefined ? '—' : `${item.loadPercent}%`}</td><td>{item?.weightKg === undefined ? '—' : `${item.weightKg} kg`}</td><td>{item?.notes || '—'}</td></tr>;
        })}
      </tbody></table></div>}
      <form onSubmit={(event) => void saveWeekly(event)} className="progress-form">
        <div className="form-grid compact-fields">
          <label><span>Periodo calendario</span><select name="week" required>
            {Array.from({ length: Math.max(1, selectedAssignment.plan.weeks ?? 8) }, (_, index) => <option key={index} value={index + 1}>{periodLabel(index + 1)}</option>)}
          </select></label>
          <label><span>Ripetizioni</span><input type="number" name="repetitions" min="1" step="1" /></label>
          <label><span>% carico</span><input type="number" name="loadPercent" min="0" max="200" step="0.5" /></label>
          <label><span>Carico esercizio (kg)</span><input type="number" name="weightKg" min="0" step="0.5" /></label>
          <label><span>Note</span><input name="notes" /></label>
        </div>
        <Button type="submit" variant="secondary">Salva settimana</Button>
      </form>
      </>}
    </>}
    {status && <p className="form-status" role="status">{status}</p>}
  </div>;
}
