import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { ProfileHeader } from "./components/ProfileHeader";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { AchievementsTab } from "./components/tabs/AchievementsTab";
import { SavedTab } from "./components/tabs/SavedTab";
import { ActivityAnalyticsTab } from "./components/tabs/ActivityAnalyticsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { EditProfileModal } from "./components/modals/EditProfileModal";
import { useProfileTabs } from "./hooks/useProfileTabs";

export function Profile() {
  const {
    activeTab,
    setActiveTab,
    profile,
    updateProfile,
    enrolledCourses,
    goals,
    toggleGoal,
    upcomingEvents,
    recentActivities,
    milestoneBadges,
    savedCategory,
    setSavedCategory,
    filteredSavedItems,
    toggleSaveItem,
    studyDistribution,
    learningTrends,
    analyticsStats,
  } = useProfileTabs("overview");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toastMessage, showToast } = useToast();

  const handleEditGoals = () => {
    showToast("Click any goal in the list to toggle its completion status!");
  };

  const handleAvatarUpload = (newUrl: string) => {
    updateProfile({ avatarUrl: newUrl });
    showToast("Profile photo updated successfully!");
  };

  return (
    <div className="profile-page flex flex-col h-full min-h-0 w-full max-w-550 mx-auto overflow-y-auto overflow-x-hidden">
      <ToastNotification message={toastMessage} />
      {/* 1. Header & Navigation Structure */}
      <ProfileHeader
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onEditClick={() => setIsEditModalOpen(true)}
        onAvatarUpload={handleAvatarUpload}
      />

      {/* 2. Tab Content Architecture (scrollable whenever content overflows screen height) */}
      <main className="profile-tab-content flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col pt-2.5 pb-2">
        {activeTab === "overview" && (
          <OverviewTab
            profile={profile}
            enrolledCourses={enrolledCourses}
            goals={goals}
            onToggleGoal={toggleGoal}
            upcomingEvents={upcomingEvents}
            recentActivities={recentActivities}
            onEditProfile={() => setIsEditModalOpen(true)}
            onEditGoals={handleEditGoals}
            onShowToast={showToast}
          />

        )}

        {activeTab === "achievements" && (
          <AchievementsTab
            profile={profile}
            milestones={milestoneBadges}
            stats={analyticsStats}
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
          />
        )}

        {activeTab === "settings" && <SettingsTab />}
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={(updates) => {
          updateProfile(updates);
          showToast("Profile details updated!");
        }}
      />
    </div>
  );
}

export default Profile;
