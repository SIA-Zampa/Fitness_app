import type { Exercise } from './db';

const catalog: Record<string, string[]> = {
  Petto: ['Panca inclinata bilanciere', 'Panca piana manubri', 'Panca inclinata manubri', 'Chest press', 'Chest press inclinata', 'Croci ai cavi', 'Croci manubri', 'Pec deck', 'Push-up', 'Dip petto', 'Pullover manubrio'],
  Dorso: ['Lat machine presa larga', 'Lat machine presa stretta', 'Trazioni alla sbarra', 'Pulley basso', 'Rematore bilanciere', 'Rematore manubrio', 'Rematore T-bar', 'Row machine', 'Pulldown braccia tese', 'Trazioni presa neutra', 'Iperestensioni lombari'],
  Spalle: ['Military press', 'Lento avanti manubri', 'Alzate laterali', 'Alzate frontali', 'Reverse fly', 'Face pull', 'Arnold press', 'Alzate laterali ai cavi', 'Scrollate trapezi'],
  Bicipiti: ['Curl bilanciere', 'Curl manubri alternato', 'Curl martello', 'Curl panca Scott', 'Curl ai cavi', 'Curl concentrato'],
  Tricipiti: ['French press', 'Estensioni sopra la testa', 'Dip tricipiti', 'Pushdown corda', 'Pushdown barra', 'Kickback manubrio'],
  Quadricipiti: ['Front squat', 'Hack squat', 'Leg press', 'Leg extension', 'Affondi in camminata', 'Bulgarian split squat', 'Step-up', 'Goblet squat'],
  Femorali: ['Stacco rumeno', 'Leg curl seduto', 'Leg curl sdraiato', 'Good morning', 'Nordic curl', 'Stacco gambe tese'],
  Glutei: ['Glute bridge', 'Abduzioni macchina', 'Abduzioni cavo', 'Kickback cavo', 'Squat sumo', 'Affondi indietro', 'Frog pump', 'Clamshell'],
  Polpacci: ['Calf raise in piedi', 'Calf raise seduto', 'Calf raise alla pressa', 'Calf raise monopodalico'],
  Addominali: ['Crunch', 'Crunch inverso', 'Leg raise', 'Hanging knee raise', 'Side plank', 'Dead bug', 'Russian twist', 'Ab wheel', 'Pallof press'],
  Cardio: ['Cyclette', 'Ellittica', 'Vogatore', 'Assault bike', 'Salto corda', 'Camminata inclinata'],
  'Mobilita articolare': [],
  'Mobilita spalle e braccia': ['Circonduzioni spalle'],
  'Mobilita colonna e torace': ['Mobilita toracica', 'Cat-cow'],
  'Mobilita anche': ['Rotazioni anca', 'Stretching dinamico flessori anca'],
  'Mobilita caviglie': ['Mobilita caviglia'],
  'Mobilita globale': ['World greatest stretch'],
  'Core e stabilita': ['Bird dog', 'Hollow hold', 'Farmer walk', 'Suitcase carry', 'Plank con tocco spalle'],
  'Full Body e funzionale': ['Kettlebell swing', 'Burpee', 'Thruster', 'Clean kettlebell', 'Battle rope', 'Sled push'],
  'Attivazione glutei': ['Monster walk', 'Lateral band walk', 'Ponte glutei con miniband', 'Abduzione quadrupedia', 'Single leg glute bridge'],
  'Propriocezione ed equilibrio': ['Equilibrio monopodalico', 'Equilibrio su bosu', 'Affondo su superficie instabile', 'Reach monopodalico'],
};

export const expandedMuscleGroups = Object.keys(catalog);
export const mobilityGroups = expandedMuscleGroups.filter((group) => group.startsWith('Mobilita '));

const timestamp = '2026-01-01T00:00:00.000Z';

export const expandedExercises: Exercise[] = Object.entries(catalog).flatMap(([muscleGroup, names]) =>
  names.map((name) => ({
    id: `builtin-${mobilityGroups.includes(muscleGroup) ? 'Mobilita articolare' : muscleGroup}-${name}`.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    muscleGroup,
    isCustom: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })),
);
