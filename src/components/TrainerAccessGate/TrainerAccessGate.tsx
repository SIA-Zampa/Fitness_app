import { useState } from 'react';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { verifyPassword } from '../../services/password';

type TrainerAccessGateProps = {
  passwordHash: string;
  onUnlocked: () => void;
};

export function TrainerAccessGate({
  passwordHash,
  onUnlocked,
}: TrainerAccessGateProps) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function submitPassword() {
    if (!passwordHash) {
      setStatus('Password trainer non configurata.');
      return;
    }

    if (!password.trim()) {
      setStatus('Inserisci una password.');
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      const isValid = await verifyPassword(password, passwordHash);
      if (!isValid) {
        setStatus('Password non corretta.');
        return;
      }

      onUnlocked();
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="access-gate">
      <Card tone="accent">
        <p className="eyebrow">Area riservata</p>
        <h2>Accesso Personal Trainer</h2>
        <p>
          Inserisci la password fornita dal proprietario dell app per accedere all area Personal
          Trainer.
        </p>

        <label className="full-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>

        {status && <p className="form-status">{status}</p>}
        <Button onClick={() => void submitPassword()} disabled={isBusy}>
          {isBusy ? 'Attendere...' : 'Entra'}
        </Button>
      </Card>
    </section>
  );
}
