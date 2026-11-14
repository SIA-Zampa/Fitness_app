import { useEffect, useState } from 'react';
import { db, type WorkoutDay, type WorkoutPlan } from '../database/db';
import { createId } from '../services/id';

type PlanWithDays = WorkoutPlan & { days: WorkoutDay[] };

export function useWorkoutPlans() {
  const [plans, setPlans] = useState<PlanWithDays[]>([]);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'F' | 'M' | ''>('');
  const [dayNames, setDayNames] = useState(['Giorno 1']);
  const [status, setStatus] = useState<string | null>(null);

  async function loadData() {
    const [storedPlans, storedDays] = await Promise.all([
      db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
      db.workoutDays.orderBy('order').toArray(),
    ]);
    setPlans(storedPlans.map((plan) => ({
      ...plan,
      days: storedDays.filter((day) => day.planId === plan.id),
    })));
  }

  useEffect(() => { void loadData(); }, []);

  function setDayName(index: number, value: string) {
    setDayNames((currentDays) => currentDays.map((dayName, currentIndex) =>
      currentIndex === index ? value : dayName));
  }

  function addDay() {
    setDayNames((currentDays) => [...currentDays, `Giorno ${currentDays.length + 1}`]);
  }

  function removeDay(index: number) {
    setDayNames((currentDays) => currentDays.length === 1
      ? currentDays : currentDays.filter((_, currentIndex) => currentIndex !== index));
  }

  async function createPlan() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setStatus('Inserisci il titolo della scheda.');
      return;
    }
    if (!sex) {
      setStatus('Seleziona se la scheda è maschile o femminile.');
      return;
    }
    const normalizedDays = dayNames.map((dayName) => dayName.trim()).filter(Boolean);
    if (normalizedDays.length === 0) {
      setStatus('Inserisci almeno un giorno di allenamento.');
      return;
    }

    const now = new Date().toISOString();
    const planId = createId('plan');
    await db.transaction('rw', db.workoutPlans, db.workoutDays, async () => {
      await db.workoutPlans.add({
        id: planId, name: normalizedName, sex, version: 1, createdAt: now, updatedAt: now,
      });
      await db.workoutDays.bulkAdd(normalizedDays.map((dayName, index) => ({
        id: createId('day'), planId, name: dayName, order: index + 1,
      })));
    });
    setName('');
    setSex('');
    setDayNames(['Giorno 1']);
    setStatus('Scheda salvata.');
    await loadData();
  }

  async function duplicatePlan(planId: string) {
    const plan = await db.workoutPlans.get(planId);
    if (!plan) return;
    const days = await db.workoutDays.where('planId').equals(planId).sortBy('order');
    const assignments = days.length > 0
      ? await db.workoutExercises.where('workoutDayId').anyOf(days.map((day) => day.id)).toArray()
      : [];
    const visibleAssignments = assignments.filter((assignment) =>
      plan.sex === 'F' || assignment.section !== 'activation');
    const now = new Date().toISOString();
    const nextPlanId = createId('plan');
    const nextDayIds = new Map(days.map((day) => [day.id, createId('day')]));
    await db.transaction('rw', db.workoutPlans, db.workoutDays, db.workoutExercises, async () => {
      // A copy is standalone even when the original is a legacy client plan.
      await db.workoutPlans.add({
        id: nextPlanId, name: `${plan.name} copia`, sex: plan.sex, version: 1, createdAt: now, updatedAt: now,
      });
      await db.workoutDays.bulkAdd(days.map((day) => ({
        ...day, id: nextDayIds.get(day.id)!, planId: nextPlanId,
      })));
      if (visibleAssignments.length > 0) {
        await db.workoutExercises.bulkAdd(visibleAssignments.map((assignment) => ({
          ...assignment,
          id: createId('assignment'),
          workoutDayId: nextDayIds.get(assignment.workoutDayId)!,
        })));
      }
    });
    setStatus('Scheda duplicata.');
    await loadData();
  }

  async function updateSex(planId: string, value: 'F' | 'M' | '') {
    const plan = await db.workoutPlans.get(planId);
    if (!plan || (plan.sex ?? '') === value) return;
    await db.workoutPlans.update(planId, {
      sex: value,
      version: plan.version + 1,
      updatedAt: new Date().toISOString(),
    });
    setStatus('Tipo di scheda aggiornato.');
    await loadData();
  }

  async function deletePlan(planId: string) {
    if (!window.confirm('Eliminare definitivamente questa scheda?')) return;
    await db.transaction('rw', db.workoutPlans, db.workoutDays, db.workoutExercises, async () => {
      const days = await db.workoutDays.where('planId').equals(planId).toArray();
      if (days.length > 0) {
        await db.workoutExercises.where('workoutDayId').anyOf(days.map((day) => day.id)).delete();
      }
      await db.workoutDays.where('planId').equals(planId).delete();
      await db.workoutPlans.delete(planId);
    });
    setStatus('Scheda eliminata.');
    await loadData();
  }

  return {
    plans, name, sex, dayNames, status,
    setName, setSex, setDayName, addDay, removeDay,
    createPlan, duplicatePlan, updateSex, deletePlan,
  };
}
