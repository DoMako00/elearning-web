import type { ClipboardEvent, KeyboardEvent } from "react";

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const focusInput = (index: number) => {
    document.getElementById(`otp-${index}`)?.focus();
  };

  const updateDigit = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < value.length - 1) focusInput(index + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !value[index] && index > 0) focusInput(index - 1);
    if (event.key === "ArrowLeft" && index > 0) focusInput(index - 1);
    if (event.key === "ArrowRight" && index < value.length - 1) focusInput(index + 1);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    onChange(next);
    focusInput(Math.min(pasted.length, 5));
  };

  return (
    <div className="auth-otp-group" onPaste={handlePaste}>
      <div className="auth-otp" role="group" aria-label="Six digit verification code" aria-describedby={error ? "otp-error" : undefined}>
        {value.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Verification code digit ${index + 1}`}
            aria-invalid={Boolean(error)}
            maxLength={1}
          />
        ))}
      </div>
      {error && <span id="otp-error" className="auth-field__error" role="alert">{error}</span>}
    </div>
  );
}
