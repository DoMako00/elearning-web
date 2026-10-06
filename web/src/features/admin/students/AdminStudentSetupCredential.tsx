import { useState } from "react";

export interface StudentSetupCredential {
  readonly platformEmail?: string;
  readonly accountIdentifier: string;
  readonly setupCode: string;
  readonly setupExpiresAt?: string;
}

interface AdminStudentSetupCredentialProps {
  readonly credential: StudentSetupCredential;
  readonly onDone: () => void;
}

function formatExpiry(value?: string): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AdminStudentSetupCredential({
  credential,
  onDone,
}: AdminStudentSetupCredentialProps) {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyDetails() {
    const details = [
      credential.platformEmail
        ? `Platform email: ${credential.platformEmail}`
        : undefined,
      `Account identifier: ${credential.accountIdentifier}`,
      `One-time setup code: ${credential.setupCode}`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");

    try {
      await navigator.clipboard.writeText(details);
      setCopyMessage("Setup details copied. Store them securely and share them with the student.");
    } catch {
      setCopyMessage("Clipboard access is unavailable. Select the setup details to copy them manually.");
    }
  }

  return (
    <section className="admin-student-setup-credential" role="status">
      <header>
        <h3>Student account provisioned</h3>
        <p>
          The setup code is shown once. It is not a sign-in password; the
          student uses it to claim the account and link a verified email.
        </p>
      </header>

      <dl>
        {credential.platformEmail && (
          <div>
            <dt>Platform email</dt>
            <dd>{credential.platformEmail}</dd>
          </div>
        )}
        <div>
          <dt>Account identifier</dt>
          <dd>{credential.accountIdentifier}</dd>
        </div>
        <div>
          <dt>One-time setup code</dt>
          <dd>
            <code>{credential.setupCode}</code>
          </dd>
        </div>
        <div>
          <dt>Expires</dt>
          <dd>{formatExpiry(credential.setupExpiresAt)}</dd>
        </div>
      </dl>

      {copyMessage && <p aria-live="polite">{copyMessage}</p>}

      <footer>
        <button type="button" onClick={copyDetails}>
          Copy setup details
        </button>
        <button type="button" onClick={onDone}>
          Done
        </button>
      </footer>
    </section>
  );
}
