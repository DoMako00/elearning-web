import { Settings } from "../../../features/settings";

export function SettingsPage() {
  return (
    <section
      className="student-page student-page--settings w-full h-full min-h-0"
      aria-label="Settings"
    >
      <Settings />
    </section>
  );
}

export default SettingsPage;
