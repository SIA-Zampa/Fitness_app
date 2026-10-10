import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell/AppShell';
import { Button } from '../components/Button/Button';
import { ThemeSelector } from '../components/ThemeSelector/ThemeSelector';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTheme } from '../hooks/useTheme';
import { ClientHome } from '../pages/Client/ClientHome';
import { SettingsHome } from '../pages/Settings/SettingsHome';
import { TrainerHome } from '../pages/Trainer/TrainerHome';
import { Welcome } from '../pages/Welcome/Welcome';

type AppView = 'home' | 'settings';

export function App() {
  const [view, setView] = useState<AppView>('home');
  const appSettings = useAppSettings();
  const role = appSettings.settings.selectedRole ?? null;
  const theme = useTheme(appSettings.settings.theme, appSettings.setTheme);

  const title = useMemo(() => {
    if (role === 'trainer') return 'Area Personal Trainer';
    if (role === 'client') return 'Area Cliente';
    return 'Benvenuto in Fitness App';
  }, [role]);

  if (!role) {
    return (
      <AppShell title={title} actions={<ThemeSelector theme={theme} />}>
        {appSettings.status === 'error' && (
          <div className="status-banner">
            Non riesco ad accedere al database locale. Le preferenze restano temporaneamente nel browser.
          </div>
        )}
        <Welcome onSelectRole={(nextRole) => void appSettings.setRole(nextRole)} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={title}
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
        <SettingsHome
          currentRole={role}
          theme={theme}
          onBack={() => setView('home')}
          onChangeRole={() => void appSettings.setRole(undefined)}
        />
      ) : role === 'trainer' ? (
        <TrainerHome />
      ) : (
        <ClientHome />
      )}
    </AppShell>
  );
}
