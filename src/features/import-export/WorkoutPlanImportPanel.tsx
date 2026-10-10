import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import { importWorkoutPlan, readWorkoutPlanFile } from '../../services/workoutPlanImport';

type WorkoutPlanImportPanelProps = {
  onImported: () => void;
};

export function WorkoutPlanImportPanel({ onImported }: WorkoutPlanImportPanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setIsImporting(true);
    setStatus(null);

    try {
      const exportedPlan = await readWorkoutPlanFile(file);
      await importWorkoutPlan(exportedPlan);
      setStatus('Scheda importata correttamente.');
      onImported();
    } catch (error) {
      console.error('Unable to import workout plan', error);
      setStatus(error instanceof Error ? error.message : 'Non sono riuscito a importare il file.');
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="manager-panel" aria-label="Importazione scheda">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Cliente</p>
          <h2>Importa scheda</h2>
        </div>
        <span>.fitscheda</span>
      </div>

      <label className="file-picker">
        <span>{isImporting ? 'Importazione...' : 'Importa scheda'}</span>
        <input
          type="file"
          accept=".fitscheda,application/json"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>

      {status && <p className="form-status">{status}</p>}
      <Button variant="ghost" onClick={onImported}>
        Aggiorna schede
      </Button>
    </section>
  );
}
