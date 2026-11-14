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
const accessKey = 'fitness-app-trainer-access';

function hasTrainerAccess() {
  try {
    return Boolean(configuredTrainerPasswordHash) && sessionStorage.getItem(accessKey) === configuredTrainerPasswordHash;
  } catch {
    return false;
  }
}

export function App() {
  const [view, setView] = useState<AppView>('home');
  const [isTrainerUnlocked, setIsTrainerUnlocked] = useState(hasTrainerAccess);

  function unlockTrainer() {
    try {
      sessionStorage.setItem(accessKey, configuredTrainerPasswordHash);
    } catch {
      // Access remains available until this page is closed if storage is unavailable.
    }
    setIsTrainerUnlocked(true);
  }

  function logoutTrainer() {
    try {
      sessionStorage.removeItem(accessKey);
    } catch {
      // The in-memory session is cleared even when browser storage is unavailable.
    }
    setView('home');
    setIsTrainerUnlocked(false);
  }
  const appSettings = useAppSettings();
  const theme = useTheme(appSettings.settings.theme, appSettings.setTheme);

  if (!isTrainerUnlocked) {
    return (
      <AppShell
        title="Accesso Personal Trainer"
        actions={<ThemeSelector theme={theme} />}
        accessLayout
      >
        <TrainerAccessGate
          passwordHash={configuredTrainerPasswordHash}
          onUnlocked={unlockTrainer}
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
          <Button variant="ghost" onClick={logoutTrainer}>Esci</Button>
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
