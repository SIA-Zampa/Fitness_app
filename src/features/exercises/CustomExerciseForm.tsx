import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { db, type Exercise } from '../../database/db';
import { createId } from '../../services/id';
import { expandedMuscleGroups } from '../../database/exerciseCatalog';

const muscleGroups = expandedMuscleGroups;

type CustomExerciseFormProps = {
  exercise?: Exercise;
  onSaved: (muscleGroup: string) => void;
  onCancel?: () => void;
};

export function CustomExerciseForm({ exercise, onSaved, onCancel }: CustomExerciseFormProps) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscleGroup ?? muscleGroups[0]);
  const [description, setDescription] = useState(exercise?.description ?? '');
  const availableGroups = muscleGroups.includes(muscleGroup) ? muscleGroups : [muscleGroup, ...muscleGroups];
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
      if (exercise) {
        const updated = await db.exercises.update(exercise.id, {
          name: normalizedName,
          muscleGroup,
          description: description.trim() || undefined,
          updatedAt: now,
        });
        if (!updated) throw new Error('Esercizio non trovato.');
      } else {
        await db.exercises.add({
          id: createId('exercise'),
          name: normalizedName,
          muscleGroup,
          description: description.trim() || undefined,
          isCustom: true,
          createdAt: now,
          updatedAt: now,
        });
      }

      setName('');
      setDescription('');
      setStatus(exercise ? 'Esercizio modificato.' : 'Esercizio salvato.');
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
      {exercise && <h3>Modifica {exercise.name}</h3>}
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
            {availableGroups.map((group) => (
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
        {isSaving ? 'Salvataggio...' : exercise ? 'Salva modifiche' : 'Salva esercizio'}
      </Button>
      {exercise && <Button variant="ghost" onClick={onCancel} disabled={isSaving}>Annulla</Button>}
    </div>
  );
}
