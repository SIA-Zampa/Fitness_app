import type { UseThemeResult } from '../../hooks/useTheme';
import { Button } from '../Button/Button';

export function ThemeSelector({ theme }: { theme: UseThemeResult }) {
  return (
    <div className="theme-selector" aria-label="Tema grafico">
      <Button
        variant={theme.preference === 'light' ? 'secondary' : 'ghost'}
        onClick={() => theme.setPreference('light')}
      >
        Chiaro
      </Button>
      <Button
        variant={theme.preference === 'dark' ? 'secondary' : 'ghost'}
        onClick={() => theme.setPreference('dark')}
      >
        Scuro
      </Button>
      <Button
        variant={theme.preference === 'system' ? 'secondary' : 'ghost'}
        onClick={() => theme.setPreference('system')}
      >
        Auto
      </Button>
    </div>
  );
}
