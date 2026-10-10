import { useEffect, useMemo, useState } from 'react';
import type { ThemePreference } from '../models/settings';
import { readStoredTheme, saveStoredTheme } from '../services/settingsStorage';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export type UseThemeResult = {
  preference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
};

export function useTheme(
  controlledPreference?: ThemePreference,
  onPreferenceChange?: (preference: ThemePreference) => void,
): UseThemeResult {
  const [localPreference, setLocalPreference] = useState<ThemePreference>(readStoredTheme);
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme);
  const preference = controlledPreference ?? localPreference;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemTheme(getSystemTheme());

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    saveStoredTheme(preference);
  }, [preference]);

  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = preference;
  }, [preference, resolvedTheme]);

  return useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference: (nextPreference: ThemePreference) => {
        setLocalPreference(nextPreference);
        onPreferenceChange?.(nextPreference);
      },
    }),
    [onPreferenceChange, preference, resolvedTheme],
  );
}
