import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  KeyRound,
  Smartphone,
  FileText,
  Mail,
  Phone,
  MapPin,
  Check,
  CheckCircle2,
  Info,
  User,
  ArrowRight,
} from "lucide-react";
import { useScreenStack } from "../ScreenStack";
import { TopAppBar } from "../TopAppBar";
import { BottomSheet } from "../shared/BottomSheet";
import { MobileToast } from "../shared/MobileToast";
import { useMobileMessages } from "../data/useMobileMessages";
import { MessagesListScreen } from "./MessagesListScreen";
import { CommunityScreen } from "./CommunityScreen";
import { HelpCenterScreen } from "./HelpCenterScreen";

export const SettingsScreen: React.FC = () => {
  const { push } = useScreenStack();
  const { unreadChatsCount } = useMobileMessages();

  // State for toasts and confirmation bottom sheet
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLogoutSheetOpen, setIsLogoutSheetOpen] = useState(false);

  // Editable profile state matching screenshot
  const [profile, setProfile] = useState({
    fullName: "Juliana Ahmed",
    studentId: "2024-10567",
    email: "juliana.ahmed@email.com",
    phoneNumber: "+1 (555) 123-4567",
    location: "New York, NY",
    plan: "Student • Free Plan",
    quote: "Keep learning, keep growing.",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
  });

  // Notification toggles state
  const [notifications, setNotifications] = useState({
    deadlines: true,
    lessonReminders: true,
    directMessages: true,
    mentions: false,
    systemSecurity: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Pushed Sub-screens (all variant="detail", tabRoot="settings")
  const handleOpenEditProfile = () => {
    push({
      id: "settings-edit-profile",
      title: "Edit Profile",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Settings",
      component: (
        <EditProfileSubScreen
          profile={profile}
          onSave={(newProfile) => {
            setProfile((p) => ({ ...p, ...newProfile }));
            showToast("Profile updated successfully");
          }}
        />
      ),
    });
  };

  const handleOpenNotifications = () => {
    push({
      id: "settings-notifications",
      title: "Notification Preferences",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Settings",
      component: (
        <NotificationPreferencesSubScreen
          prefs={notifications}
          onChange={(key, val) => {
            setNotifications((prev) => ({ ...prev, [key]: val }));
            showToast("Preferences saved");
          }}
        />
      ),
    });
  };

  const handleOpenChangePassword = () => {
    push({
      id: "settings-password",
      title: "Change Password",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Settings",
      component: <ChangePasswordSubScreen onComplete={() => showToast("Password changed successfully")} />,
    });
  };

  const handleOpenUpgradePlan = () => {
    push({
      id: "settings-upgrade",
      title: "Upgrade Plan",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Settings",
      component: <UpgradePlanSubScreen onSelectPlan={(plan) => showToast(`Selected ${plan} plan`)} />,
    });
  };

  // Quick Links navigation
  const handleOpenMessages = () => {
    push({
      id: "messages-list",
      title: "Messages",
      tabRoot: "settings",
      variant: "detail",
      backLabel: "Settings",
      component: <MessagesListScreen />,
    });
  };

  const handleOpenCommunity = () => {
    push({
      id: "community-hub",
      title: "Community",
      tabRoot: "settings",
      variant: "main",
      backLabel: "Settings",
      component: <CommunityScreen />,
    });
  };

  const handleOpenHelpCenter = () => {
    push({
      id: "help-center",
      title: "Help Center",
      tabRoot: "settings",
      variant: "main",
      backLabel: "Settings",
      component: <HelpCenterScreen />,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-[#f8fafc]">
      <MobileToast message={toastMessage} />

      {/* Mockup Header: Green Back Arrow + Bold "Settings" */}
      <header
        className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 select-none"
        style={{
          paddingTop: "max(0.4rem, env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="h-12 px-3.5 flex items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-1 -ml-1 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-[17px] font-extrabold text-slate-900 tracking-tight">
            Settings
          </h1>
        </div>
      </header>

      {/* Main scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-20 space-y-5 max-w-lg mx-auto w-full">
        {/* Profile Card with soft mint gradient and botanical leaf illustration */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#eafaf1] via-[#ebf9f2] to-[#ddf4e7] p-4 sm:p-5 border border-emerald-100/80 shadow-xs">
          {/* Subtle background botanical leaves watermark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 select-none">
            <svg width="180" height="150" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M130 10C100 40 70 80 80 130C90 100 120 70 150 50C140 30 135 20 130 10Z"
                fill="#10b981"
              />
              <path
                d="M90 60C70 80 50 110 60 140C70 120 90 95 110 80C105 70 95 65 90 60Z"
                fill="#059669"
              />
              <path
                d="M145 90C120 105 100 125 105 140C120 135 135 120 150 105C148 100 146 95 145 90Z"
                fill="#34d399"
              />
            </svg>
          </div>

          {/* Top Row: Avatar, Name/Plan, Edit Profile Button */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 bg-slate-100">
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold text-slate-900 leading-tight">
                  {profile.fullName}
                </h2>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                  {profile.plan}
                </p>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  {profile.quote}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-emerald-600 text-[11px] font-bold border border-emerald-100 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              Edit Profile
            </button>
          </div>

          {/* Bottom Details & Slogan */}
          <div className="mt-3.5 pt-2.5 border-t border-emerald-200/50 flex items-end justify-between gap-3 relative z-10">
            <div className="space-y-1 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{profile.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{profile.location}</span>
              </div>
            </div>

            <p className="text-[10.5px] italic text-emerald-800/60 max-w-32.5 text-right leading-tight select-none">
              &ldquo;A healthier tomorrow starts with what you learn today.&rdquo;
            </p>
          </div>
        </div>

        {/* Section: Account */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Account</h3>
            <p className="text-[11px] text-slate-400">Manage your account information.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                  Change Email or Phone
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Update your contact information
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Quick Links: Messages & nity */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">nication</h3>
            <p className="text-[11px] text-slate-400">Connect with instructors and study groups.</p>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenMessages}
              className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">Messages</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Direct chat with course instructors</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {unreadChatsCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                    {unreadChatsCount}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenCommunity}
              className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">Community</h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Discussion channels and study peers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>


        {/* Section: Security */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Security</h3>
            <p className="text-[11px] text-slate-400">Keep your account safe and secure.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenChangePassword}
            className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                  Change Password
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Create a new password
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Section: Devices & Access */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Devices & Access</h3>
            <p className="text-[11px] text-slate-400">Your account is active on one device by default.</p>
          </div>

          <div className="space-y-2.5">
            {/* Active Device Card with mint background & phone graphic */}
            <div className="relative overflow-hidden bg-linear-to-r from-[#eef9f2] via-[#e8f6ed] to-[#d8f1e2] rounded-xl p-3 border border-emerald-200/60 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 relative z-10">
                <div className="w-9 h-9 rounded-full bg-white/90 text-emerald-600 flex items-center justify-center shadow-2xs shrink-0">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="inline-block px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase tracking-wide">
                    Current Device
                  </span>
                  <h4 className="text-[13px] font-bold text-slate-900 leading-tight mt-0.5">
                    iPhone 15 Pro
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>New York, NY</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-emerald-700 font-semibold">Active now</span>
                  </p>
                </div>
              </div>

              {/* Right side phone graphic with checkmark */}
              <div className="flex items-center gap-2 relative z-10 shrink-0">
                <div className="w-9 h-13 rounded-lg border-2 border-emerald-500 bg-white shadow-xs flex items-center justify-center">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Friends Plan Promo Card */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                      Need to use more devices?
                    </h4>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">
                      Upgrade to <span className="font-semibold text-slate-700">Friends Plan</span> to add extra seats for your other devices or share with friends.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase shrink-0 border border-emerald-100">
                  Friends Plan
                </span>
              </div>

              {/* Feature pills & CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-50">
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-medium text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <span>Multiple devices</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <span>Extra seats</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <span>Learn together</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenUpgradePlan}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                >
                  <span>Upgrade Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Notifications */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Notifications</h3>
            <p className="text-[11px] text-slate-400">Choose what you want to be notified about.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Bell className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                  Notification Preferences
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Course updates, deadlines, and more
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Section: Data & Privacy */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Data & Privacy</h3>
            <p className="text-[11px] text-slate-400">Your data belongs to you.</p>
          </div>
          <button
            type="button"
            onClick={() => showToast("Preparing your learning data export...")}
            className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                  Download My Data
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Get a copy of your learning data
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* Section: Support */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Support</h3>
            <p className="text-[11px] text-slate-400">Get help or manage your session.</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenHelpCenter}
              className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                    Help Center
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Browse articles or contact support
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Log Out */}
            <button
              type="button"
              onClick={() => setIsLogoutSheetOpen(true)}
              className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-rose-50/40 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <LogOut className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12.5px] font-bold text-rose-600 leading-tight">
                    Log Out
                  </h4>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Sign out from this device
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Mobile app is docs-only disclaimer */}
            <div className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[12px] font-bold text-slate-900 leading-tight">
                    Mobile app is docs-only
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                    You can view and read documents and resources on mobile. Some interactive content is available on web.
                  </p>
                </div>
              </div>
              <Info className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Bottom Sheet for Log Out */}
      <BottomSheet
        isOpen={isLogoutSheetOpen}
        onClose={() => setIsLogoutSheetOpen(false)}
        title="Sign Out"
      >
        <div className="p-2 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Are you sure you want to log out?
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Your offline documents and reading progress will remain saved.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsLogoutSheetOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
            >
              Confirm Log Out
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

interface ProfileFields {
  fullName: string;
  email: string;
  phoneNumber: string;
  quote: string;
}

// Sub-screen 1: Edit Profile
const EditProfileSubScreen: React.FC<{
  profile: ProfileFields;
  onSave: (updates: Partial<ProfileFields>) => void;
}> = ({ profile, onSave }) => {
  const { pop } = useScreenStack();
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [quote, setQuote] = useState(profile.quote);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, email, phoneNumber, quote });
    pop();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="detail" title="Edit Profile" backLabel="Settings" onBack={pop} />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 shadow-2xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inspirational Quote</label>
            <textarea
              rows={2}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
        >
          Save Profile Changes
        </button>
      </form>
    </div>
  );
};

// Sub-screen 2: Notification Preferences
const NotificationPreferencesSubScreen: React.FC<{
  prefs: Record<string, boolean>;
  onChange: (key: string, val: boolean) => void;
}> = ({ prefs, onChange }) => {
  const { pop } = useScreenStack();

  const items = [
    { key: "deadlines", title: "Assignment Deadlines", desc: "Alerts 24 hours and 2 hours before due time" },
    { key: "lessonReminders", title: "Daily Reading Reminders", desc: "Nudges to keep your study streak alive" },
    { key: "directMessages", title: "Direct Messages", desc: "Instant notifications for messages from professors" },
    { key: "mentions", title: "Community Mentions", desc: "When someone mentions you in a study group thread" },
    { key: "systemSecurity", title: "Security Alerts", desc: "New login notices and critical platform updates" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="detail" title="Notification Preferences" backLabel="Settings" onBack={pop} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full pb-16">
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {items.map((it) => (
            <div key={it.key} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{it.title}</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">{it.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onChange(it.key, !prefs[it.key])}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  prefs[it.key] ? "bg-emerald-600" : "bg-slate-200"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    prefs[it.key] ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Sub-screen 3: Change Password
const ChangePasswordSubScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { pop } = useScreenStack();
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
    pop();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="detail" title="Change Password" backLabel="Settings" onBack={pop} />
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 shadow-2xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
        >
          Update Password
        </button>
      </form>
    </div>
  );
};

// Sub-screen 4: Upgrade Plan
const UpgradePlanSubScreen: React.FC<{ onSelectPlan: (plan: string) => void }> = ({ onSelectPlan }) => {
  const { pop } = useScreenStack();

  const plans = [
    {
      name: "Individual Plan",
      price: "Free",
      period: "Current Plan",
      features: ["Single device active session", "Standard document reader", "Community discussion access"],
      current: true,
    },
    {
      name: "Friends & Study Group",
      price: "$9.99",
      period: "/ month",
      features: ["Up to 4 concurrent devices", "Offline document downloading", "Priority mentor messaging", "Shared group notes"],
      current: false,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="detail" title="Upgrade Plan" backLabel="Settings" onBack={pop} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`p-4 rounded-3xl border transition-all ${
              p.current
                ? "bg-white border-slate-200/90 shadow-2xs"
                : "bg-linear-to-b from-emerald-50/60 to-white border-emerald-300 shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-base font-extrabold text-slate-900">{p.price}</span> {p.period}
                </p>
              </div>
              {p.current && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10.5px] font-bold">
                  Active
                </span>
              )}
            </div>

            <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600">
              {p.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {!p.current && (
              <button
                type="button"
                onClick={() => {
                  onSelectPlan(p.name);
                  pop();
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                Upgrade to {p.name}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
