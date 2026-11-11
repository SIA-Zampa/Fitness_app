import { Button } from '../../components/Button/Button';
import { Card } from '../../components/Card/Card';
import { ThemeSelector } from '../../components/ThemeSelector/ThemeSelector';
import { DataBackupPanel } from '../../features/import-export/DataBackupPanel';
import type { UseThemeResult } from '../../hooks/useTheme';

type SettingsHomeProps = {
  theme: UseThemeResult;
  onBack: () => void;
};

export function SettingsHome({ theme, onBack }: SettingsHomeProps) {
  return (
    <section className="settings-view" aria-label="Impostazioni">
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
          Clienti, esercizi e schede restano salvati localmente su questo dispositivo.
        </p>
        <DataBackupPanel />
        <Button variant="ghost" onClick={onBack}>
          Torna alla dashboard
        </Button>
      </Card>
    </section>
  );
}
