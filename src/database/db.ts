import Dexie, { type Table } from 'dexie';
import type { AppSettings } from '../models/settings';

export type Client = {
  id: string;
  name: string;
  notes?: string;
  archived: boolean;
  createdAt: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutPlan = {
  id: string;
  clientId?: string;
  name: string;
  description?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutDay = {
  id: string;
  planId: string;
  name: string;
  order: number;
};

export type WorkoutExercise = {
  id: string;
  workoutDayId: string;
  exerciseId: string;
  sets: number;
  repetitions: string;
  restSeconds: number;
  notes?: string;
  order: number;
};

export type WorkoutSession = {
  id: string;
  planId: string;
  workoutDayId: string;
  startedAt: string;
  completedAt?: string;
};

export type SessionSet = {
  id: string;
  sessionId: string;
  workoutExerciseId: string;
  setNumber: number;
  weight?: number;
  repetitions?: number;
  completed: boolean;
};

export class FitnessDatabase extends Dexie {
  settings!: Table<AppSettings, string>;
  clients!: Table<Client, string>;
  exercises!: Table<Exercise, string>;
  workoutPlans!: Table<WorkoutPlan, string>;
  workoutDays!: Table<WorkoutDay, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  sessionSets!: Table<SessionSet, string>;

  constructor() {
    super('fitness-app');

    this.version(1).stores({
      settings: 'id',
      clients: 'id, name, archived, createdAt',
      exercises: 'id, name, muscleGroup, isCustom',
      workoutPlans: 'id, clientId, name, version, updatedAt',
      workoutDays: 'id, planId, order',
      workoutExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, planId, workoutDayId, startedAt, completedAt',
      sessionSets: 'id, sessionId, workoutExerciseId, setNumber, completed',
    });
  }
}

export const db = new FitnessDatabase();

export const defaultSettings: AppSettings = {
  id: 'local',
  theme: 'system',
};

export const initialExercises: Exercise[] = [
  {
    id: 'exercise-bench-press',
    name: 'Panca piana',
    muscleGroup: 'Petto',
    description: 'Spinta orizzontale con bilanciere su panca piana.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-incline-dumbbell-press',
    name: 'Spinte manubri inclinata',
    muscleGroup: 'Petto',
    description: 'Spinta su panca inclinata con manubri.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-lat-machine',
    name: 'Lat machine',
    muscleGroup: 'Dorso',
    description: 'Trazione verticale guidata per il dorso.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-row',
    name: 'Rematore',
    muscleGroup: 'Dorso',
    description: 'Trazione orizzontale con bilanciere, manubrio o macchina.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-shoulder-press',
    name: 'Shoulder press',
    muscleGroup: 'Spalle',
    description: 'Spinta verticale per deltoidi.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-biceps-curl',
    name: 'Curl bicipiti',
    muscleGroup: 'Bicipiti',
    description: 'Flessione del gomito con manubri, bilanciere o cavo.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-cable-pushdown',
    name: 'Pushdown cavo',
    muscleGroup: 'Tricipiti',
    description: 'Estensione del gomito al cavo alto.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-squat',
    name: 'Squat',
    muscleGroup: 'Quadricipiti',
    description: 'Accosciata con bilanciere o variante guidata.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-leg-curl',
    name: 'Leg curl',
    muscleGroup: 'Femorali',
    description: 'Flessione del ginocchio alla macchina.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-hip-thrust',
    name: 'Hip thrust',
    muscleGroup: 'Glutei',
    description: 'Estensione dellanca con appoggio su panca.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-calf-raise',
    name: 'Calf raise',
    muscleGroup: 'Polpacci',
    description: 'Estensione della caviglia in piedi o seduto.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-plank',
    name: 'Plank',
    muscleGroup: 'Addominali',
    description: 'Tenuta isometrica per core e stabilita.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'exercise-treadmill',
    name: 'Tapis roulant',
    muscleGroup: 'Cardio',
    description: 'Camminata o corsa su treadmill.',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];
