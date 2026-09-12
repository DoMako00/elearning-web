import type { ReactNode } from "react";

interface AccessStateCardProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "pending" | "success";
}

export function AccessStateCard({ icon, title, description, actions, tone = "neutral" }: AccessStateCardProps) {
  return (
    <section className={`auth-access-state auth-access-state--${tone}`} aria-labelledby="access-state-title">
      <span className="auth-access-state__icon" aria-hidden="true">{icon}</span>
      <div className="auth-access-state__copy">
        <h2 id="access-state-title">{title}</h2>
        <div>{description}</div>
        {actions && <div className="auth-access-state__actions">{actions}</div>}
      </div>
    </section>
  );
}
