import { useEffect, useMemo, useState } from 'react';
import { db, type Client, type WorkoutDay, type WorkoutPlan } from '../database/db';
import { createId } from '../services/id';

type PlanWithClient = WorkoutPlan & {
  clientName: string;
  days: WorkoutDay[];
};

type UseWorkoutPlansResult = {
  plans: PlanWithClient[];
  clients: Client[];
  name: string;
  description: string;
  clientId: string;
  dayNames: string[];
  status: string | null;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setClientId: (clientId: string) => void;
  setDayName: (index: number, name: string) => void;
  addDay: () => void;
  removeDay: (index: number) => void;
  createPlan: () => Promise<void>;
  duplicatePlan: (planId: string) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
};

export function useWorkoutPlans(): UseWorkoutPlansResult {
  const [plans, setPlans] = useState<PlanWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [dayNames, setDayNames] = useState(['Giorno 1']);
  const [status, setStatus] = useState<string | null>(null);

  const clientNameById = useMemo(() => {
    return new Map(clients.map((client) => [client.id, client.name]));
  }, [clients]);

  async function loadData() {
    const [storedClients, storedPlans, storedDays] = await Promise.all([
      db.clients.filter((client) => !client.archived).toArray(),
      db.workoutPlans.orderBy('updatedAt').reverse().toArray(),
      db.workoutDays.orderBy('order').toArray(),
    ]);

    setClients(storedClients);
    setPlans(
      storedPlans.map((plan) => ({
        ...plan,
        clientName: plan.clientId ? clientNameById.get(plan.clientId) ?? 'Cliente non trovato' : 'Nessun cliente',
        days: storedDays.filter((day) => day.planId === plan.id),
      })),
    );
  }

  useEffect(() => {
    void loadData();
  }, [clientNameById]);

  function setDayName(index: number, value: string) {
    setDayNames((currentDays) =>
      currentDays.map((dayName, currentIndex) => (currentIndex === index ? value : dayName)),
    );
  }

  function addDay() {
    setDayNames((currentDays) => [...currentDays, `Giorno ${currentDays.length + 1}`]);
  }

  function removeDay(index: number) {
    setDayNames((currentDays) => {
      if (currentDays.length === 1) return currentDays;
      return currentDays.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function createPlan() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setStatus('Inserisci il nome della scheda.');
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
        id: planId,
        clientId: clientId || undefined,
        name: normalizedName,
        description: description.trim() || undefined,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      await db.workoutDays.bulkAdd(
        normalizedDays.map((dayName, index) => ({
          id: createId('day'),
          planId,
          name: dayName,
          order: index + 1,
        })),
      );
    });

    setName('');
    setDescription('');
    setClientId('');
    setDayNames(['Giorno 1']);
    setStatus('Scheda salvata.');
    await loadData();
  }

  async function duplicatePlan(planId: string) {
    const plan = await db.workoutPlans.get(planId);
    if (!plan) return;

    const days = await db.workoutDays.where('planId').equals(planId).sortBy('order');
    const now = new Date().toISOString();
    const nextPlanId = createId('plan');

    await db.transaction('rw', db.workoutPlans, db.workoutDays, async () => {
      await db.workoutPlans.add({
        ...plan,
        id: nextPlanId,
        name: `${plan.name} copia`,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      await db.workoutDays.bulkAdd(
        days.map((day) => ({
          ...day,
          id: createId('day'),
          planId: nextPlanId,
        })),
      );
    });

    setStatus('Scheda duplicata.');
    await loadData();
  }

  async function deletePlan(planId: string) {
    const confirmed = window.confirm('Eliminare definitivamente questa scheda?');
    if (!confirmed) return;

    await db.transaction('rw', db.workoutPlans, db.workoutDays, db.workoutExercises, async () => {
      const days = await db.workoutDays.where('planId').equals(planId).toArray();
      await db.workoutExercises
        .where('workoutDayId')
        .anyOf(days.map((day) => day.id))
        .delete();
      await db.workoutDays.where('planId').equals(planId).delete();
      await db.workoutPlans.delete(planId);
    });

    setStatus('Scheda eliminata.');
    await loadData();
  }

  return {
    plans,
    clients,
    name,
    description,
    clientId,
    dayNames,
    status,
    setName,
    setDescription,
    setClientId,
    setDayName,
    addDay,
    removeDay,
    createPlan,
    duplicatePlan,
    deletePlan,
  };
}
