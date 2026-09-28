import { useState } from "react";
import {
  HomeDashboardSkeleton,
  MyCoursesSkeleton,
  ExploreSkeleton,
  CalendarSkeleton,
  AssignmentsSkeleton,
  MessagesSkeleton,
  CommunitySkeleton,
  SettingsSkeleton,
  HelpCenterSkeleton,
  ProfileSkeleton,
} from "../../../../components/ui/Skeleton";
import { SearchBar } from "../../../../components/ui/SearchBar";

export function TestSkeletonPage() {
  const [selectedView, setSelectedView] = useState<string>("home");
  const [profileTab, setProfileTab] = useState<"overview" | "achievements" | "saved" | "activity" | "settings">("overview");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Skeleton Loading System Preview</h1>
          <p className="text-sm text-gray-500">Preview exact layout skeletons across every section & component</p>
        </div>

        {/* View Switcher */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "home", label: "Home" },
            { id: "my-courses", label: "My Courses" },
            { id: "explore", label: "Explore" },
            { id: "calendar", label: "Calendar" },
            { id: "assignments", label: "Assignments" },
            { id: "messages", label: "Messages" },
            { id: "community", label: "Community" },
            { id: "settings", label: "Settings" },
            { id: "help", label: "Help Center" },
            { id: "profile", label: "Profile" },
            { id: "searchbar", label: "Search Bar" },
          ].map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setSelectedView(view.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedView === view.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab Selector if profile view selected */}
      {selectedView === "profile" && (
        <div className="flex gap-2 p-3 bg-white rounded-xl border border-gray-200">
          <span className="text-xs font-bold text-gray-500 self-center mr-2">Profile Tab:</span>
          {(["overview", "achievements", "saved", "activity", "settings"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setProfileTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize ${
                profileTab === tab ? "bg-emerald-100 text-emerald-800" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Render Selected Skeleton View */}
      <div className="bg-[#f8faf9] p-4 rounded-2xl border border-gray-200 min-h-125">
        {selectedView === "home" && <HomeDashboardSkeleton />}
        {selectedView === "my-courses" && <MyCoursesSkeleton />}
        {selectedView === "explore" && <ExploreSkeleton />}
        {selectedView === "calendar" && <CalendarSkeleton />}
        {selectedView === "assignments" && <AssignmentsSkeleton />}
        {selectedView === "messages" && <div className="h-150"><MessagesSkeleton /></div>}
        {selectedView === "community" && <div className="h-150"><CommunitySkeleton /></div>}
        {selectedView === "settings" && <SettingsSkeleton />}
        {selectedView === "help" && <HelpCenterSkeleton />}
        {selectedView === "profile" && <ProfileSkeleton activeTab={profileTab} />}
        {selectedView === "searchbar" && (
          <div className="space-y-4 max-w-xl mx-auto pt-10">
            <h3 className="text-sm font-bold text-gray-700">Active vs Skeleton Search Bar</h3>
            <SearchBar placeholder="Regular active search bar..." />
            <SearchBar placeholder="Loading search..." isLoading={true} />
          </div>
        )}
      </div>
    </div>
  );
}
export default TestSkeletonPage;
