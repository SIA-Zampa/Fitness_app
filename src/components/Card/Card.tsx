import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  tone?: 'default' | 'quiet' | 'accent';
};

export function Card({ children, tone = 'default' }: CardProps) {
  return <section className={`card card-${tone}`}>{children}</section>;
}
