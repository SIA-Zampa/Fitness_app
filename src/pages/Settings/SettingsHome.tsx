import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { ThemeSelector } from '../../components/ThemeSelector/ThemeSelector';
import type { UseThemeResult } from '../../hooks/useTheme';
import type { AppRole } from '../../models/settings';

type SettingsHomeProps = {
  currentRole: AppRole;
  theme: UseThemeResult;
  onBack: () => void;
  onChangeRole: () => void;
};

export function SettingsHome({
  currentRole,
  theme,
  onBack,
  onChangeRole,
}: SettingsHomeProps) {
  const roleLabel = currentRole === 'trainer' ? 'Personal Trainer' : 'Cliente';

  return (
    <section className="settings-view" aria-label="Impostazioni">
      <Card tone="accent">
        <p className="eyebrow">Modalita attiva</p>
        <h2>{roleLabel}</h2>
        <p>
          La modalita e una preferenza locale del dispositivo. Cambiarla non elimina clienti,
          schede o progressi salvati.
        </p>
        <Button variant="secondary" onClick={onChangeRole}>
          Cambia modalita
        </Button>
      </Card>

      <Card>
        <p className="eyebrow">Tema grafico</p>
        <h2>Aspetto</h2>
        <p>
          Il tema automatico segue le impostazioni del dispositivo e reagisce alle modifiche del
          sistema operativo.
        </p>
        <ThemeSelector theme={theme} />
      </Card>

      <Card tone="quiet">
        <h2>Dati locali</h2>
        <p>
          In questa fase i dati restano sul dispositivo. Nelle prossime fasi aggiungeremo backup,
          importazione, esportazione e database IndexedDB per schede e progressi.
        </p>
        <Button variant="ghost" onClick={onBack}>
          Torna alla dashboard
        </Button>
      </Card>
    </section>
  );
}
