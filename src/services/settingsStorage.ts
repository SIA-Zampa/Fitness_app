import type { AppRole, ThemePreference } from '../models/settings';

const roleStorageKey = 'fitness-app:selected-role';
const themeStorageKey = 'fitness-app:theme';

export function readStoredRole(): AppRole | null {
  const storedRole = window.localStorage.getItem(roleStorageKey);
  return storedRole === 'trainer' || storedRole === 'client' ? storedRole : null;
}

export function saveStoredRole(role: AppRole | null) {
  if (role) {
    window.localStorage.setItem(roleStorageKey, role);
    return;
  }

  window.localStorage.removeItem(roleStorageKey);
}

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
