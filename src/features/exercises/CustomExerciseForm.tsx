import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db } from '../../database/db';
import { createId } from '../../services/id';

const muscleGroups = [
  'Petto',
  'Dorso',
  'Spalle',
  'Bicipiti',
  'Tricipiti',
  'Quadricipiti',
  'Femorali',
  'Glutei',
  'Polpacci',
  'Addominali',
  'Cardio',
];

type CustomExerciseFormProps = {
  onSaved: (muscleGroup: string) => void;
};

export function CustomExerciseForm({ onSaved }: CustomExerciseFormProps) {
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(muscleGroups[0]);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function saveExercise() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setStatus('Inserisci il nome dell esercizio.');
      return;
    }

    setIsSaving(true);
    setStatus(null);

    try {
      const now = new Date().toISOString();
      await db.exercises.add({
        id: createId('exercise'),
        name: normalizedName,
        muscleGroup,
        description: description.trim() || undefined,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      });

      setName('');
      setDescription('');
      setStatus('Esercizio salvato.');
      onSaved(muscleGroup);
    } catch (error) {
      console.error('Unable to save custom exercise', error);
      setStatus('Non sono riuscito a salvare l esercizio. Riprova.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="custom-exercise-form">
      <div className="form-grid">
        <label>
          <span>Nome esercizio</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Es. Chest press convergente"
          />
        </label>

        <label>
          <span>Gruppo muscolare</span>
          <select value={muscleGroup} onChange={(event) => setMuscleGroup(event.target.value)}>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="full-field">
        <span>Note descrittive</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Indicazioni tecniche o varianti"
          rows={3}
        />
      </label>

      {status && <p className="form-status">{status}</p>}
      <Button onClick={() => void saveExercise()} disabled={isSaving}>
        {isSaving ? 'Salvataggio...' : 'Salva esercizio'}
      </Button>
    </div>
  );
}
