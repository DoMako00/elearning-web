import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { ProfileHeader } from "./components/ProfileHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
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
    goals,
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
    return <div className="profile-page flex h-full min-h-0 w-full max-w-550 mx-auto items-center justify-center text-sm font-semibold text-gray-500" role="status">Loading your profile…</div>;
  }

  if (error) {
    return <div className="profile-page flex h-full min-h-0 w-full max-w-550 mx-auto items-center justify-center p-5">
      <div className="w-full rounded-2xl border border-rose-200 bg-white p-6 text-center" role="alert">
        <h1 className="text-lg font-extrabold text-gray-900">Profile unavailable</h1>
        <p className="mt-2 text-sm text-gray-600">{error.message}</p>
        <button type="button" onClick={retry} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Try again</button>
      </div>
    </div>;
  }

  return (
    <div className="profile-page flex flex-col h-full min-h-0 w-full max-w-550 mx-auto overflow-y-auto overflow-x-hidden">
      <ToastNotification message={toastMessage} />
      {/* 1. Header & Navigation Structure */}
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onEditClick={() => navigate("/settings")}
      />

      {/* 2. Tab Content Architecture (scrollable whenever content overflows screen height) */}
      <main className="profile-tab-content flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col pt-2.5 pb-2">
        {activeTab === "overview" && (
          <OverviewTab
            profile={profile}
            enrolledCourses={enrolledCourses}
            goals={goals}
            upcomingEvents={upcomingEvents}
            recentActivities={recentActivities}
            onEditProfile={() => navigate("/settings")}
            onEditGoals={() => navigate("/settings")}
            onShowToast={showToast}
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
