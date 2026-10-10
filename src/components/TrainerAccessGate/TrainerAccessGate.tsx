import { useState } from 'react';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';
import { hashPassword, verifyPassword } from '../../services/password';

type TrainerAccessGateProps = {
  passwordHash?: string;
  onPasswordCreated: (passwordHash: string) => Promise<void>;
  onUnlocked: () => void;
};

export function TrainerAccessGate({
  passwordHash,
  onPasswordCreated,
  onUnlocked,
}: TrainerAccessGateProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const needsSetup = !passwordHash;

  async function submitPassword() {
    if (!password.trim()) {
      setStatus('Inserisci una password.');
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      if (needsSetup) {
        if (password.length < 4) {
          setStatus('Usa almeno 4 caratteri.');
          return;
        }

        if (password !== confirmPassword) {
          setStatus('Le password non coincidono.');
          return;
        }

        await onPasswordCreated(await hashPassword(password));
        onUnlocked();
        return;
      }

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
        <h2>{needsSetup ? 'Crea password trainer' : 'Accesso Personal Trainer'}</h2>
        <p>
          Questa protezione e locale al dispositivo. Serve a evitare accessi casuali all area
          Personal Trainer.
        </p>

        <label className="full-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={needsSetup ? 'new-password' : 'current-password'}
          />
        </label>

        {needsSetup && (
          <label className="full-field">
            <span>Conferma password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </label>
        )}

        {status && <p className="form-status">{status}</p>}
        <Button onClick={() => void submitPassword()} disabled={isBusy}>
          {isBusy ? 'Attendere...' : needsSetup ? 'Crea password' : 'Entra'}
        </Button>
      </Card>
    </section>
  );
}
