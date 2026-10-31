import { useState } from 'react';
import { AppShell } from '../components/AppShell/AppShell';
import { Button } from '../components/Button/Button';
import { TrainerAccessGate } from '../components/TrainerAccessGate/TrainerAccessGate';
import { ThemeSelector } from '../components/ThemeSelector/ThemeSelector';
import { configuredTrainerPasswordHash } from '../config/security';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTheme } from '../hooks/useTheme';
import { SettingsHome } from '../pages/Settings/SettingsHome';
import { TrainerHome } from '../pages/Trainer/TrainerHome';

type AppView = 'home' | 'settings';

export function App() {
  const [view, setView] = useState<AppView>('home');
  const [isTrainerUnlocked, setIsTrainerUnlocked] = useState(false);
  const appSettings = useAppSettings();
  const theme = useTheme(appSettings.settings.theme, appSettings.setTheme);

  if (!isTrainerUnlocked) {
    return (
      <AppShell
        title="Accesso Personal Trainer"
        actions={<ThemeSelector theme={theme} />}
      >
        <TrainerAccessGate
          passwordHash={configuredTrainerPasswordHash}
          onUnlocked={() => setIsTrainerUnlocked(true)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Area Personal Trainer"
      actions={
        <>
          <ThemeSelector theme={theme} />
          <Button variant="ghost" onClick={() => setView(view === 'settings' ? 'home' : 'settings')}>
            {view === 'settings' ? 'Dashboard' : 'Impostazioni'}
          </Button>
        </>
      }
    >
      {appSettings.status === 'loading' && (
        <div className="status-banner">Preparazione del database locale...</div>
      )}
      {appSettings.status === 'error' && (
        <div className="status-banner">
          Database locale non disponibile. Alcune funzioni offline potrebbero essere limitate.
        </div>
      )}
      {view === 'settings' ? (
        <SettingsHome theme={theme} onBack={() => setView('home')} />
      ) : (
        <TrainerHome />
      )}
    </AppShell>
  );
}
