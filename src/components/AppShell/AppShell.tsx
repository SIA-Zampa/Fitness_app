import type { ReactNode } from 'react';

type AppShellProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  accessLayout?: boolean;
};

export function AppShell({ title, actions, children, accessLayout = false }: AppShellProps) {
  if (accessLayout) {
    return (
      <div className="app-shell app-shell-access">
        <header className="access-header">{actions}</header>
        <main className="app-main access-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-heading">
          <img className="brand-logo" src="./images/brand-logo.png" alt="ADL Personal Trainer Coaching Online" />
          <div>
            <p className="eyebrow">Fitness App</p>
            <h1>{title}</h1>
          </div>
        </div>
        <div className="header-actions">{actions}</div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
