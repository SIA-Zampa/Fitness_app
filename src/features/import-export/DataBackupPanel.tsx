import { useState } from 'react';
import { Button } from '../../components/Button/Button';
import {
  backupRecordCount,
  createFitnessBackup,
  downloadFitnessBackup,
  readFitnessBackup,
  restoreFitnessBackup,
} from '../../services/fitnessBackup';

export function DataBackupPanel() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function exportBackup() {
    setBusy(true);
    setStatus('');
    try {
      downloadFitnessBackup(await createFitnessBackup());
      setStatus('Backup scaricato.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Esportazione non riuscita.');
    } finally {
      setBusy(false);
    }
  }

  async function importBackup(file: File | undefined, input: HTMLInputElement) {
    if (!file) return;
    setBusy(true);
    setStatus('');
    try {
      const backup = await readFitnessBackup(file);
      const confirmed = window.confirm(
        `Ripristinare il backup del ${new Date(backup.exportedAt).toLocaleString('it-IT')}?\n` +
        `Contiene ${backup.tables.clients.length} clienti, ${backup.tables.workoutPlans.length} schede e ` +
        `${backup.tables.exercises.length} esercizi (${backupRecordCount(backup)} record totali).\n` +
        'Tutti i dati attualmente salvati su questo dispositivo saranno sostituiti.'
      );
      if (!confirmed) return;
      await restoreFitnessBackup(backup);
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Ripristino non riuscito.');
    } finally {
      input.value = '';
      setBusy(false);
    }
  }

  return (
    <div className="data-backup-panel">
      <p>Scarica clienti, misure, esercizi, schede, sessioni e impostazioni in un unico file. Potrai caricarlo su un altro dispositivo.</p>
      <Button onClick={() => void exportBackup()} disabled={busy}>Esporta tutti i dati</Button>
      <label className="file-picker">
        <span>{busy ? 'Attendi...' : 'Importa backup'}</span>
        <input type="file" accept=".fitnessbackup,application/json" disabled={busy}
          onChange={(event) => void importBackup(event.currentTarget.files?.[0], event.currentTarget)} />
      </label>
      {status && <p className="form-status" role="status">{status}</p>}
    </div>
  );
}
