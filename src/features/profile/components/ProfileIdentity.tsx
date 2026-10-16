import { Settings2 } from "lucide-react";
import type { ProfileTabId } from "../types/profile.types";
import type { StudentProfileDto, StudentProgressSnapshotDto } from "../../student/api/studentLearningApi";

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "achievements", label: "Achievements" },
  { id: "saved", label: "Saved" },
  { id: "activity", label: "Activity" },
  { id: "settings", label: "Settings" },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S";
}

interface ProfileIdentityProps {
  profile: StudentProfileDto | undefined;
  progress: StudentProgressSnapshotDto | undefined;
  subjectCount: number;
  activeTab: ProfileTabId;
  onTabChange: (tab: ProfileTabId) => void;
  onEditClick: () => void;
}

export function ProfileIdentity({ profile, progress, subjectCount, activeTab, onTabChange, onEditClick }: ProfileIdentityProps) {
  const name = profile?.fullName?.trim() || "Student";
  const context = profile
    ? [profile.brand.name, profile.institution.name, profile.level.title, profile.semester.title].filter(Boolean)
    : [];

  return (
    <header className="pf-identity">
      <div className="pf-identity__main">
        <span className="pf-avatar" aria-hidden="true">{initials(name)}</span>
        <div className="pf-identity__copy">
          <p className="pf-identity__eyebrow">Student profile</p>
          <h1>{name}</h1>
          {context.length ? (
            <ul className="pf-identity__context" aria-label="Academic placement">
              {context.map((item) => <li key={item}>{item}</li>)}
              {profile?.studentCode ? <li>ID {profile.studentCode}</li> : null}
            </ul>
          ) : (
            <p className="pf-identity__missing">Academic details are unavailable right now.</p>
          )}
        </div>
        <button type="button" className="pf-edit" onClick={onEditClick}>
          <Settings2 aria-hidden="true" />Account settings
        </button>
      </div>
      <dl className="pf-identity__stats">
        <div><dt>Overall progress</dt><dd>{progress ? `${Math.round(progress.completionPercent)}%` : "—"}</dd></div>
        <div><dt>Lessons completed</dt><dd>{progress?.totalCompletedLessons ?? "—"}</dd></div>
        <div><dt>Subjects</dt><dd>{subjectCount}</dd></div>
        <div><dt>Current streak</dt><dd>{progress ? `${progress.currentStreakDays} d` : "—"}</dd></div>
        <div><dt>Active days</dt><dd>{progress?.totalActiveDays ?? "—"}</dd></div>
      </dl>
      <nav className="pf-tabs" role="tablist" aria-label="Profile sections">
        {TABS.map((tab) => (
          <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} className={activeTab === tab.id ? "is-active" : undefined} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
