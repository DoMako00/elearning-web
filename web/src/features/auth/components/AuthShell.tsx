import type { PropsWithChildren, ReactNode } from "react";
import { Leaf } from "lucide-react";
import type { AuthStepId } from "../types/authOnboarding.types";
import { AuthProgressBar } from "./AuthProgressBar";
import "../styles/auth-onboarding.css";

interface AuthShellProps extends PropsWithChildren {
  step: AuthStepId;
  stepNumber: number;
  stepLabel: string;
  aside?: ReactNode;
  pending?: boolean;
  compact?: boolean;
}

export function AuthShell({ children, step, stepNumber, stepLabel, aside, pending, compact = false }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-page__blob auth-page__blob--one" aria-hidden="true" />
      <div className="auth-page__blob auth-page__blob--two" aria-hidden="true" />
      <main className={`auth-canvas${compact ? " auth-canvas--compact" : ""}`}>
        <section className="auth-card" aria-labelledby="auth-page-title">
          <header className="auth-card__header">
            <a className="auth-brand" href="/auth/sign-in" aria-label="GreenLearn sign in">
              <span className="auth-brand__mark"><Leaf aria-hidden="true" /></span>
              <span>GreenLearn</span>
            </a>
            <div className="auth-step-label" aria-label={`Step ${stepNumber}: ${stepLabel}`}>
              <span>{stepNumber}</span>
              <small>STEP {stepNumber}</small>
              <strong>{stepLabel}</strong>
            </div>
          </header>
          <div className={`auth-card__body${aside ? " auth-card__body--split" : ""}`}>
            <div className="auth-card__content">{children}</div>
            {aside && <aside className="auth-card__aside">{aside}</aside>}
          </div>
        </section>
        <AuthProgressBar currentStep={step} pending={pending} />
        <p className="auth-demo-note">Frontend preview only — no live authentication, payment, or access grant is performed.</p>
      </main>
    </div>
  );
}
