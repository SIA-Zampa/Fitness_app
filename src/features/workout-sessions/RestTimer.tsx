import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button/Button';

type RestTimerProps = {
  defaultSeconds: number;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${remainingSeconds}`;
}

export function RestTimer({ defaultSeconds }: RestTimerProps) {
  const [duration, setDuration] = useState(defaultSeconds);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultSeconds);

  const isRunning = deadline !== null;

  useEffect(() => {
    setDuration(defaultSeconds);
    setRemainingSeconds(defaultSeconds);
    setDeadline(null);
  }, [defaultSeconds]);

  useEffect(() => {
    if (!deadline) return undefined;

    const intervalId = window.setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0) {
        setDeadline(null);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [deadline]);

  const progress = useMemo(() => {
    if (duration <= 0) return 0;
    return Math.max(0, Math.min(100, (remainingSeconds / duration) * 100));
  }, [duration, remainingSeconds]);

  function start() {
    const seconds = Math.max(0, duration);
    setRemainingSeconds(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }

  function pause() {
    setDeadline(null);
  }

  function resume() {
    setDeadline(Date.now() + remainingSeconds * 1000);
  }

  function reset() {
    setDeadline(null);
    setRemainingSeconds(duration);
  }

  return (
    <div className="rest-timer">
      <div className="timer-display">
        <span>{formatTime(remainingSeconds)}</span>
        <div className="timer-track" aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="timer-controls">
        <input
          type="number"
          min="0"
          step="5"
          value={duration}
          onChange={(event) => {
            const nextDuration = Number(event.target.value);
            setDuration(nextDuration);
            if (!isRunning) setRemainingSeconds(nextDuration);
          }}
          aria-label="Durata recupero in secondi"
        />
        {!isRunning && remainingSeconds === duration && (
          <Button variant="secondary" onClick={start}>
            Avvia
          </Button>
        )}
        {isRunning && (
          <Button variant="ghost" onClick={pause}>
            Pausa
          </Button>
        )}
        {!isRunning && remainingSeconds !== duration && remainingSeconds > 0 && (
          <Button variant="secondary" onClick={resume}>
            Riprendi
          </Button>
        )}
        <Button variant="ghost" onClick={reset}>
          Azzera
        </Button>
      </div>
    </div>
  );
}
