import type { ReactNode } from 'react';

type AppShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, actions, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Fitness App</p>
          <h1>{title}</h1>
        </div>
        <div className="header-actions">{actions}</div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
