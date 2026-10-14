import { Check, ChevronRight, CircleUserRound, GraduationCap, ShieldCheck, Smartphone } from "lucide-react";
import type { AuthProgressStep, AuthStepId } from "../types/authOnboarding.types";

const authProgressSteps: AuthProgressStep[] = [
  { id: "sign-in", label: "Sign in" },
  { id: "verify-otp", label: "Verify OTP" },
  { id: "complete-profile", label: "Complete Profile" },
  { id: "choose-brand", label: "Choose Brand & Access" },
  { id: "access-granted", label: "You’re all set!" },
];

const stepIcons = [CircleUserRound, Smartphone, GraduationCap, ShieldCheck, Check];

interface AuthProgressBarProps {
  currentStep: AuthStepId;
  pending?: boolean;
}

export function AuthProgressBar({ currentStep, pending = false }: AuthProgressBarProps) {
  const currentIndex = authProgressSteps.findIndex((step) => step.id === currentStep);

  return (
    <nav className="auth-progress" aria-label="Onboarding progress">
      <ol>
        {authProgressSteps.map((step, index) => {
          const Icon = stepIcons[index];
          const isCurrent = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <li key={step.id} className={isCurrent ? "is-current" : isComplete ? "is-complete" : undefined}>
              <span className="auth-progress__step" aria-current={isCurrent ? "step" : undefined}>
                <span className="auth-progress__icon"><Icon aria-hidden="true" /></span>
                <span>{step.label}{pending && step.id === "choose-brand" ? " — Pending" : ""}</span>
              </span>
              {index < authProgressSteps.length - 1 && <ChevronRight className="auth-progress__arrow" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
