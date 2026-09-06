import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

interface AuthTextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  trailing?: ReactNode;
}

export function AuthTextField({ label, error, trailing, id, ...inputProps }: AuthTextFieldProps) {
  const fieldId = id ?? inputProps.name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className={`auth-field${error ? " has-error" : ""}`}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-field__control">
        <input id={fieldId} aria-invalid={Boolean(error)} aria-describedby={errorId} {...inputProps} />
        {trailing}
      </div>
      {error && <span id={errorId} className="auth-field__error" role="alert">{error}</span>}
    </div>
  );
}

interface AuthSelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: ReactNode;
}

export function AuthSelectField({ label, error, children, id, ...selectProps }: AuthSelectFieldProps) {
  const fieldId = id ?? selectProps.name;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className={`auth-field${error ? " has-error" : ""}`}>
      <label htmlFor={fieldId}>{label}</label>
      <select id={fieldId} aria-invalid={Boolean(error)} aria-describedby={errorId} {...selectProps}>{children}</select>
      {error && <span id={errorId} className="auth-field__error" role="alert">{error}</span>}
    </div>
  );
}

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet";
}

export function AuthButton({ variant = "primary", className = "", ...buttonProps }: AuthButtonProps) {
  return <button className={`auth-button auth-button--${variant} ${className}`.trim()} {...buttonProps} />;
}
