import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { ProfileIdentity } from "./components/ProfileIdentity";
import { ProfileOverview } from "./components/ProfileOverview";
import { useStudentLearningPreferences, useStudentProfile, useStudentProgress } from "../student/api/useStudentLearning";
import "./profile.css";
import { AchievementsTab } from "./components/tabs/AchievementsTab";
import { SavedTab } from "./components/tabs/SavedTab";
import { ActivityAnalyticsTab } from "./components/tabs/ActivityAnalyticsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { useProfileTabs } from "./hooks/useProfileTabs";
import type { ProfileTabId } from "./types/profile.types";
import { studentLearningApi } from "../student/api/studentLearningApi";

export function Profile() {
  const [certificateActionId, setCertificateActionId] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as ProfileTabId | null;

  const {
    activeTab,
    setActiveTab,
    profile,
    enrolledCourses,
    upcomingEvents,
    recentActivities,
    milestoneBadges,
    certificates,
    savedCategory,
    setSavedCategory,
    filteredSavedItems,
    toggleSaveItem,
    studyDistribution,
    learningTrends,
    analyticsStats,
    activityDays,
    isLoading,
    error,
    retry,
  } = useProfileTabs(tabParam && ["overview", "achievements", "saved", "activity", "settings"].includes(tabParam) ? tabParam : "overview");
  const navigate = useNavigate();
  const profileQuery = useStudentProfile();
  const progressQuery = useStudentProgress();
  const preferencesQuery = useStudentLearningPreferences();
  const weeklyGoal = preferencesQuery.data?.weeklyLessonGoal ?? progressQuery.data?.weeklyGoalLessons ?? null;

  useEffect(() => {
    if (tabParam && ["overview", "achievements", "saved", "activity", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam, setActiveTab]);

  const handleTabChange = (newTab: ProfileTabId) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const { toastMessage, showToast } = useToast();

  const certificateAction = async (certificateId: string, mode: "open" | "download") => {
    setCertificateActionId(certificateId);
    setCertificateError(null);
    const tab = mode === "open" ? window.open("about:blank", "_blank") : null;
    if (tab) tab.opener = null;
    try {
      const documentBlob = await studentLearningApi.getCertificateDocument(certificateId);
      const objectUrl = URL.createObjectURL(documentBlob);
      if (mode === "open" && tab) {
        tab.location.assign(objectUrl);
      } else {
        tab?.close();
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `certificate-${certificateId}.svg`;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      tab?.close();
      setCertificateError(error instanceof Error ? error.message : "The issued certificate could not be opened.");
    } finally {
      setCertificateActionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="pf-page" aria-busy="true" aria-label="Loading your profile">
        <div className="pf-identity pf-identity--skeleton"><span className="pf-skel" style={{ width: 96, height: 96, borderRadius: 28 }} /><span className="pf-skel" style={{ width: 360, height: 40 }} /></div>
        <div className="pf-grid">{[0, 1, 2, 3].map((key) => <div key={key} className="pf-card"><span className="pf-skel" style={{ width: "50%", height: 18 }} /><span className="pf-skel" style={{ width: "100%", height: 64 }} /></div>)}</div>
      </div>
    );
  }

  return (
    <div className="pf-page profile-page">
      <ToastNotification message={toastMessage} />
      {error ? (
        <div className="pf-alert" role="alert">
          <AlertTriangle aria-hidden="true" />
          <span>Some profile details couldn&apos;t load. What&apos;s shown below may be incomplete.</span>
          <button type="button" onClick={retry}><RefreshCw aria-hidden="true" />Try again</button>
        </div>
      ) : null}

      <ProfileIdentity
        profile={profileQuery.data}
        progress={progressQuery.data}
        subjectCount={enrolledCourses.length}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onEditClick={() => navigate("/settings")}
      />

      <main className="pf-content">
        {activeTab === "overview" && (
          <ProfileOverview
            progress={progressQuery.data}
            weeklyGoal={weeklyGoal}
            courses={enrolledCourses}
            milestones={milestoneBadges}
            certificates={certificates}
            recent={recentActivities}
            upcoming={upcomingEvents}
            onOpenAchievements={() => handleTabChange("achievements")}
          />
        )}

        {activeTab === "achievements" && (
          <AchievementsTab
            profile={profile}
            milestones={milestoneBadges}
            stats={analyticsStats}
            certificates={certificates}
            certificateActionId={certificateActionId}
            certificateError={certificateError}
            onOpenCertificate={certificateId => void certificateAction(certificateId, "open")}
            onDownloadCertificate={certificateId => void certificateAction(certificateId, "download")}
          />
        )}

        {activeTab === "saved" && (
          <SavedTab
            items={filteredSavedItems}
            currentCategory={savedCategory}
            onCategoryChange={setSavedCategory}
            onRemoveItem={toggleSaveItem}
            onShowToast={showToast}
          />
        )}

        {activeTab === "activity" && (
          <ActivityAnalyticsTab
            studyDistribution={studyDistribution}
            learningTrends={learningTrends}
            stats={analyticsStats}
            activityDays={activityDays}
          />
        )}

        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

export default Profile;
