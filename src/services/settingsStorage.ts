import type { ThemePreference } from '../models/settings';

const themeStorageKey = 'fitness-app:theme';

export function readStoredTheme(): ThemePreference {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
    return storedTheme;
  }

  return 'system';
}

export function saveStoredTheme(theme: ThemePreference) {
  window.localStorage.setItem(themeStorageKey, theme);
}
