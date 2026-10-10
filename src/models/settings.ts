export type AppRole = 'trainer' | 'client';

export type ThemePreference = 'light' | 'dark' | 'system';

export type AppSettings = {
  id: 'local';
  selectedRole?: AppRole;
  theme: ThemePreference;
  trainerPasswordHash?: string;
};
