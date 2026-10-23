import React, { useEffect, useState } from "react";
import { useToast } from "../../../hooks/useToast";
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
  CheckCircle2,
  Info,
  User,
} from "lucide-react";
import { useScreenStack } from "../ScreenStack";
import { TopAppBar } from "../TopAppBar";
import { BottomSheet } from "../shared/BottomSheet";
import { MobileToast } from "../shared/MobileToast";
import { useMobileMessages } from "../data/useMobileMessages";
import { MessagesListScreen } from "./MessagesListScreen";
import { CommunityScreen } from "./CommunityScreenReal";
import { HelpCenterScreen } from "./HelpCenterScreen";
import { useStudentProfile } from "../../../features/student/api/useStudentLearning";
import { useStudentSettingsDevices, useStudentCommercialSettings, useStudentLearningPreferences } from "../../../features/student/api/useStudentSettings";
import { studentLearningApi } from "../../../features/student/api/studentLearningApi";
import { completeStudentEmailLink, getStudentAuthMethods, initiateOtpLogin, initiateStudentEmailLink, verifyOtpProof } from "../../../features/auth/api/identityApi";
import { downloadStudentAccountData } from "../../../features/settings/studentDataExport";
import { normalizeStudentPhone } from "../../../features/settings/profilePhone";
import { useAuth } from "../../../app/providers/AuthProvider";

export const SettingsScreen: React.FC = () => {
  const { push } = useScreenStack();
  const { unreadChatsCount } = useMobileMessages();
  const profileQuery=useStudentProfile();
  const devicesQuery=useStudentSettingsDevices();
  const commercialQuery=useStudentCommercialSettings();
  const auth=useAuth();
  const currentDevice=devicesQuery.devices.data?.find(device=>device.id===devicesQuery.session.data?.deviceId && !device.revokedAt);

  // State for toasts and confirmation bottom sheet
  const { toastMessage, toastTone, showToast } = useToast(2500);
  const [isLogoutSheetOpen, setIsLogoutSheetOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // Editable profile state matching screenshot
  const [profile, setProfile] = useState({fullName:"",studentId:"",email:"",phoneNumber:"",location:"",plan:"",quote:"",avatarUrl:""});
  useEffect(()=>{const dto=profileQuery.data;if(!dto)return;setProfile({fullName:dto.fullName,studentId:dto.studentCode??"",email:dto.verifiedEmail??"No verified email linked",phoneNumber:dto.phone??"",location:`${dto.institution.name} · ${dto.level.title} · ${dto.semester.title}`,plan:commercialQuery.data?.semesterOffering?`${commercialQuery.data.subscriptionStatus??"unknown"} · ${commercialQuery.data.semesterOffering.title}`:"No active Offering",quote:"",avatarUrl:""});},[profileQuery.data,commercialQuery.data]);


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
          onSave={async (newProfile) => {
            const current=profileQuery.data;
            if(!current) throw new Error("Student profile is still loading.");
            const phone=normalizeStudentPhone("+20",newProfile.phoneNumber??"");
            await studentLearningApi.updateProfile({fullName:(newProfile.fullName??current.fullName).trim(),phone,expectedVersion:current.version});
            await profileQuery.refetch();
            showToast("Profile updated from your account.");
          }}
          onEmailLinked={async()=>{await profileQuery.refetch();showToast("Verified login email updated.");}}
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
      // The sub-screen reads live preferences itself; an element pushed onto
      // the stack must not capture a snapshot of query data.
      component: <NotificationPreferencesSubScreen />,
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
      <MobileToast message={toastMessage} tone={toastTone} />

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
                {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700 font-bold">{profile.fullName.trim().charAt(0)||"?"}</span>}
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
                <span>{profile.phoneNumber||"No phone added · optional"}</span>
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
            <p className="text-[11px] text-slate-400">Message other Students or contact Admin support.</p>
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
                  <p className="text-[10.5px] text-slate-400 mt-0.5">Student conversations and Admin support</p>
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
            disabled
            className="w-full bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-2xs hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <KeyRound className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">
                  Verified-email OTP
                </h4>
                <p className="text-[10.5px] text-slate-400 mt-0.5">
                  Password sign-in is not supported for Student accounts.
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
            <p className="text-[11px] text-slate-400">Device slots and replacement eligibility come from your account access policy.</p>
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
                    {currentDevice?.platform ?? "No active device record"}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{currentDevice?.browser ?? "Device details unavailable"}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-emerald-700 font-semibold">{currentDevice ? `Last seen ${new Date(currentDevice.lastSeenAt).toLocaleString()}` : "No current session"}</span>
                  </p>
                </div>
              </div>

              {/* Right side phone graphic with checkmark */}
              <div className="flex items-center gap-2 relative z-10 shrink-0">
                <div className="w-9 h-13 rounded-lg border-2 border-emerald-500 bg-white shadow-xs flex items-center justify-center">
                  {currentDevice ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" /> : <Info className="w-4.5 h-4.5 text-slate-400" />}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Server-derived subscription and Seat summary */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-2xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[12.5px] font-bold text-slate-900 leading-tight">Current Semester Offering</h4>
                    <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">{profile.plan || "No current Offering or Seat data returned."}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase shrink-0 border border-emerald-100">
                  {commercialQuery.data?.canAccess ? "Access active" : "No active access"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-50">
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10.5px] font-medium text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>{currentDevice?.slot ? `${currentDevice.slot} slot` : "Device slot unavailable"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>{commercialQuery.data?.seatStatus ?? "No assigned Seat"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>{commercialQuery.data?.semesterOffering?.title ?? "No Offering"}</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-500">Seat changes are managed by Admin.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Notifications */}
        <div className="space-y-1.5">
          <div className="px-0.5">
            <h3 className="text-[13.5px] font-bold text-slate-900">Notifications</h3>
            <p className="text-[11px] text-slate-400">Persist your in-app notification preferences.</p>
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
                  Delivery depends on notifications enabled by the platform
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
            onClick={() => {
              if (isExportingData) return;
              setIsExportingData(true);
              void downloadStudentAccountData()
                .then(() => showToast("Your account data download is ready."))
                .catch((error) => showToast(error instanceof Error ? error.message : "Your account data could not be exported.", "error"))
                .finally(() => setIsExportingData(false));
            }}
            disabled={isExportingData}
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
                  Download profile, progress, assignments, and issued-certificate records as JSON.
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
              Your account records remain available when you sign in again.
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
                void auth.signOut({ revokeServerSession: true });
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
}

// Sub-screen 1: Edit Profile
const EditProfileSubScreen: React.FC<{
  profile: ProfileFields;
  onSave: (updates: Partial<ProfileFields>) => Promise<void>;
  onEmailLinked: () => Promise<void>;
}> = ({ profile, onSave, onEmailLinked }) => {
  const { pop } = useScreenStack();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [emailToLink,setEmailToLink]=useState("");
  const [emailCode,setEmailCode]=useState("");
  const [emailStage,setEmailStage]=useState<"idle"|"current"|"new">("idle");
  const [challengeId,setChallengeId]=useState("");
  const [linkTicket,setLinkTicket]=useState("");
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);setError("");
    try{await onSave({ fullName, phoneNumber });pop();}catch(value){setError(value instanceof Error?value.message:"Profile update failed.");}finally{setSaving(false);}
  };

  const startEmailVerification=async()=>{
    setError("");
    try{
      const methods=await getStudentAuthMethods();
      const currentEmail=methods.verifiedEmail;
      if(currentEmail&&currentEmail.toLowerCase()===emailToLink.trim().toLowerCase()){setError("Enter a different email address to change your login email.");return;}
      if(currentEmail){if(!methods.brandCode){setError("Your account brand could not be verified. Refresh your session and try again.");return;}const challenge=await initiateOtpLogin({email:currentEmail,brand:methods.brandCode});setChallengeId(challenge.challengeId);setEmailStage("current");}
      else{const link=await initiateStudentEmailLink(emailToLink.trim());setLinkTicket(link.linkTicket);setEmailStage("new");}
    }catch(value){setError(value instanceof Error?value.message:"Unable to start email verification.");}
  };

  const verifyEmailCode=async()=>{
    if(!/^\d{6}$/.test(emailCode)){setError("Enter the 6-digit code sent to your email.");return;}
    try{
      if(emailStage==="current"){
        const proof=await verifyOtpProof({challengeId,code:emailCode});
        const link=await initiateStudentEmailLink(emailToLink.trim(),proof.accessToken);
        setLinkTicket(link.linkTicket);setEmailStage("new");setEmailCode("");
      }else if(emailStage==="new"){
        await completeStudentEmailLink({linkTicket,code:emailCode});
        setEmailStage("idle");setEmailCode("");setEmailToLink("");await onEmailLinked();
      }
    }catch(value){setError(value instanceof Error?value.message:"Email verification failed.");}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Verified login email</label>
            <input
              type="email"
                value={profile.email}
                readOnly
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +20 10 1234 5678"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"
            />
          </div>
          <p className="text-[10px] text-slate-500">Academic placement and Student Code are managed by the institution.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-4 space-y-3 shadow-2xs">
          <div><h3 className="text-xs font-bold text-slate-800">Link or change verified email</h3><p className="text-[10.5px] text-slate-500 mt-1">Ownership is verified by email code. The email is not changed until verification succeeds.</p></div>
          {emailStage==="idle"?<div className="flex gap-2"><input type="email" value={emailToLink} onChange={event=>setEmailToLink(event.target.value)} placeholder="Your real email address" className="min-w-0 flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"/><button type="button" disabled={!emailToLink.trim()} onClick={()=>void startEmailVerification()} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">Send code</button></div>:<div className="flex gap-2"><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={emailCode} onChange={event=>setEmailCode(event.target.value.replace(/\D/g,"").slice(0,6))} placeholder={emailStage==="current"?"6-digit code to current email":"6-digit code to new email"} className="min-w-0 flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-emerald-500"/><button type="button" onClick={()=>void verifyEmailCode()} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">{emailStage==="current"?"Continue":"Verify email"}</button></div>}
          {error&&<p role="alert" className="text-xs text-rose-600">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
        >
          {saving?"Saving…":"Save Profile Changes"}
        </button>
      </form>
    </div>
  );
};
// Sub-screen 2: Notification Preferences
const NOTIFICATION_FIELDS = { deadlines: "assignmentDeadlines", lessonReminders: "lessonReminders", directMessages: "directMessages", mentions: "mentionsInCommunity", systemSecurity: "securityAlerts" } as const;
type NotificationKey = keyof typeof NOTIFICATION_FIELDS;

const NotificationPreferencesSubScreen: React.FC = () => {
  const { pop } = useScreenStack();
  const preferencesQuery = useStudentLearningPreferences();
  const { toastMessage, toastTone, showToast } = useToast(2500);
  const [savingKey, setSavingKey] = useState<NotificationKey | null>(null);
  const current = preferencesQuery.data;
  const prefs: Record<NotificationKey, boolean> = {
    deadlines: current?.notificationPreferences.assignmentDeadlines ?? false,
    lessonReminders: current?.notificationPreferences.lessonReminders ?? false,
    directMessages: current?.notificationPreferences.directMessages ?? false,
    mentions: current?.notificationPreferences.mentionsInCommunity ?? false,
    systemSecurity: current?.notificationPreferences.securityAlerts ?? false,
  };
  const onChange = async (key: NotificationKey, value: boolean) => {
    if (!current || savingKey) return;
    setSavingKey(key);
    try {
      // Always send the latest server version so a second toggle is not rejected as stale.
      await studentLearningApi.setNotificationPreferences({ notificationPreferences: { ...current.notificationPreferences, [NOTIFICATION_FIELDS[key]]: value }, expectedVersion: current.version });
      await preferencesQuery.refetch();
      showToast("Notification preference saved to your account.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Notification preference could not be saved.", "error");
    } finally {
      setSavingKey(null);
    }
  };

  const items = [
    { key: "deadlines", title: "Assignment Deadlines", desc: "Preference saved; notification delivery is not enabled by this setting alone." },
    { key: "lessonReminders", title: "Lesson Reminders", desc: "Preference saved; the platform does not currently generate study reminders." },
    { key: "directMessages", title: "Direct Messages", desc: "Preference saved for future in-app message notifications." },
    { key: "mentions", title: "Community Mentions", desc: "Preference saved for future in-app community notifications." },
    { key: "systemSecurity", title: "Security Alerts", desc: "Preference saved for future in-app security notifications." },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-50/50">
      <TopAppBar variant="detail" title="Notification Preferences" backLabel="Settings" onBack={pop} />
      <MobileToast message={toastMessage} tone={toastTone} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-lg mx-auto w-full pb-16">
        {preferencesQuery.isPending ? <p role="status" className="text-xs text-slate-500">Loading your preferences…</p> : null}
        {preferencesQuery.isError && !current ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
            <span>Your preferences couldn&apos;t be loaded.</span>
            <button type="button" onClick={() => void preferencesQuery.refetch()} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 font-bold">Try again</button>
          </div>
        ) : null}
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs">
          {items.map((it) => (
            <div key={it.key} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 leading-tight">{it.title}</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">{it.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[it.key]}
                aria-label={it.title}
                disabled={!current || savingKey !== null}
                onClick={() => void onChange(it.key, !prefs[it.key])}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
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
