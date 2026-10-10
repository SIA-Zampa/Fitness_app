import { useEffect, useState } from 'react';
import { bootstrapDatabase, getLocalSettings, saveLocalSettings } from '../database/bootstrap';
import type { AppRole, AppSettings, ThemePreference } from '../models/settings';
import { readStoredRole, readStoredTheme, saveStoredRole, saveStoredTheme } from '../services/settingsStorage';

type SettingsStatus = 'loading' | 'ready' | 'error';

type UseAppSettingsResult = {
  settings: AppSettings;
  status: SettingsStatus;
  setRole: (role: AppRole | undefined) => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
};

const fallbackSettings: AppSettings = {
  id: 'local',
  theme: readStoredTheme(),
  selectedRole: readStoredRole() ?? undefined,
};

export function useAppSettings(): UseAppSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [status, setStatus] = useState<SettingsStatus>('loading');

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        await bootstrapDatabase();
        const databaseSettings = await getLocalSettings();
        const mergedSettings: AppSettings = {
          ...databaseSettings,
          selectedRole: databaseSettings.selectedRole ?? fallbackSettings.selectedRole,
          theme: databaseSettings.theme ?? fallbackSettings.theme,
        };

        if (isMounted) {
          setSettings(mergedSettings);
          setStatus('ready');
        }

        await saveLocalSettings(mergedSettings);
        saveStoredRole(mergedSettings.selectedRole ?? null);
        saveStoredTheme(mergedSettings.theme);
      } catch (error) {
        console.error('Unable to initialize local database', error);
        if (isMounted) {
          setStatus('error');
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updateSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
    saveStoredRole(nextSettings.selectedRole ?? null);
    saveStoredTheme(nextSettings.theme);

    try {
      await saveLocalSettings(nextSettings);
    } catch (error) {
      console.error('Unable to save local settings', error);
      setStatus('error');
    }
  }

  async function setRole(role: AppRole | undefined) {
    await updateSettings({ ...settings, selectedRole: role });
  }

  async function setTheme(theme: ThemePreference) {
    await updateSettings({ ...settings, theme });
  }

  return {
    settings,
    status,
    setRole,
    setTheme,
  };
}
