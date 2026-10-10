import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import type { AppRole } from '../../models/settings';

type WelcomeProps = {
  onSelectRole: (role: AppRole) => void;
};

export function Welcome({ onSelectRole }: WelcomeProps) {
  return (
    <section className="welcome-view">
      <div className="hero-copy">
        <p className="eyebrow">Offline-first PWA</p>
        <h2>Come vuoi utilizzare l'applicazione?</h2>
        <p>
          Scegli una modalita per iniziare. La preferenza rimane sul dispositivo e potrai cambiarla
          dalle impostazioni senza cancellare i dati locali.
        </p>
      </div>

      <div className="role-grid">
        <Card tone="accent">
          <h3>Personal Trainer</h3>
          <p>Crea clienti, schede di allenamento, libreria esercizi ed esporta file JSON.</p>
          <Button onClick={() => onSelectRole('trainer')}>Sono un personal trainer</Button>
        </Card>

        <Card>
          <h3>Cliente</h3>
          <p>Importa la scheda ricevuta, consulta gli esercizi e registra gli allenamenti.</p>
          <Button variant="secondary" onClick={() => onSelectRole('client')}>
            Sono un cliente
          </Button>
        </Card>
      </div>
    </section>
  );
}
