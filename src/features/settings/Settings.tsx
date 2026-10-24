import React, { useEffect, useState } from "react";
import {
  SettingsLayout,
  ProfileTab,
  AccountTab,
  SecurityTab,
  DevicesTab,
  NotificationsTab,
  PrivacyTab,
  AppearanceTab,
  ProfileTabContent,
} from "./components";
import {
  ManageDevicesModal,
} from "./components/modals";
import { useSettingsForm } from "./hooks/useSettingsForm";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { useToast } from "../../hooks/useToast";
import { completeStudentEmailLink, getStudentAuthMethods, initiateOtpLogin, initiateStudentEmailLink, verifyOtpProof } from "../auth/api/identityApi";
import { useStudentProfile } from "../student/api/useStudentLearning";
import { useStudentScope } from "../student/scope/StudentScopeProvider";
import { useStudentSettingsDevices, useStudentCommercialSettings, useStudentLearningPreferences, useRevokeOtherStudentSessions } from "../student/api/useStudentSettings";
import { studentLearningApi } from "../student/api/studentLearningApi";
import { downloadStudentAccountData } from "./studentDataExport";
import { useAuth } from "../../app/providers/AuthProvider";
import { normalizeStudentPhone, splitStudentPhone } from "./profilePhone";

export const Settings: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    updateProfileField,
    setProfile,
    devices,
    setDevices,
    subscription,
    setSubscription,
    paymentMethods,
    notifications,
    setNotifications,
    toggleNotification,
    appearance,
    updateAppearanceField,
    contactSubTab,
    setContactSubTab,
    newContactValue,
    setNewContactValue,
  } = useSettingsForm("profile");

  const profileQuery=useStudentProfile();
  const devicesQuery=useStudentSettingsDevices();
  const revokeOtherSessions=useRevokeOtherStudentSessions();
  const commercialQuery=useStudentCommercialSettings();
  const preferencesQuery=useStudentLearningPreferences();
  const auth=useAuth();

  const { toastMessage, toastTone, showToast } = useToast();

  // Device revocation remains an Admin-authorized action; Students can end other sessions.
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState("");
  const [emailStage,setEmailStage]=useState<"idle"|"current"|"new">("idle");
  const [emailCode,setEmailCode]=useState("");
  const [isEmailBusy,setIsEmailBusy]=useState(false);
  const [emailChallengeId,setEmailChallengeId]=useState("");
  const [emailLinkTicket,setEmailLinkTicket]=useState("");
  // The verified, validated scope brand; never a guessed default.
  const {brand:studentBrand}=useStudentScope();

  useEffect(()=>{const dto=profileQuery.data;if(!dto)return;const phoneParts=splitStudentPhone(dto.phone);setProfile({fullName:dto.fullName,studentId:dto.studentCode??"—",email:dto.verifiedEmail??"",phoneCountryCode:phoneParts.countryCode,phoneCountryFlag:"",phoneNumber:phoneParts.nationalNumber,university:dto.institution.name,academicYear:dto.level.title,major:"—",avatarUrl:""});setLinkedEmail(dto.verifiedEmail??"");},[profileQuery.data,setProfile]);
  useEffect(()=>{const devices=devicesQuery.devices.data;if(!devices)return;const currentDeviceId=devicesQuery.session.data?.deviceId;setDevices(devices.filter(device=>!device.revokedAt).map(device=>({id:device.id,name:device.platform??"Registered device",os:device.platform??"",browser:device.browser??"",location:"",ipAddress:"",lastActive:new Date(device.lastSeenAt).toLocaleString(),isCurrent:device.id===currentDeviceId,deviceType:/mobile|phone/i.test(device.platform??"")?"mobile":/tablet|ipad/i.test(device.platform??"")?"tablet":"desktop"})));},[devicesQuery.devices.data,devicesQuery.session.data?.deviceId,setDevices]);
  useEffect(()=>{const value=commercialQuery.data;if(!value)return;setSubscription({name:value.semesterOffering?.title??"No active Offering",status:value.subscriptionStatus==="active"?"Active":value.subscriptionStatus==="expired"||value.subscriptionStatus==="cancelled"?"Expired":"Unavailable",seats:value.seatStatus==="assigned"?1:0,duration:"",renewDate:value.subscriptionEndsAt?new Date(value.subscriptionEndsAt).toLocaleDateString():"",planType:"individual"});},[commercialQuery.data,setSubscription]);
  useEffect(()=>{const value=preferencesQuery.data?.notificationPreferences;if(!value)return;setNotifications({learningAlerts:{assignmentDeadlines:value.assignmentDeadlines,lessonReminders:value.lessonReminders,dailyStreakWarnings:value.dailyStreakWarnings},socialCommunity:{directMessages:value.directMessages,mentionsInCommunity:value.mentionsInCommunity,repliesToPosts:value.repliesToPosts},systemAlerts:{securityAlerts:value.securityAlerts,billingUpdates:value.billingUpdates}});},[preferencesQuery.data,setNotifications]);

  const handleSaveProfile=async()=>{const dto=profileQuery.data;if(!dto)throw new Error("Student profile is still loading.");const phone=normalizeStudentPhone(profile.phoneCountryCode,profile.phoneNumber);try{await studentLearningApi.updateProfile({fullName:profile.fullName.trim(),phone,expectedVersion:dto.version});await profileQuery.refetch();showToast("Profile updated from your account.");}catch(error){showToast(error instanceof Error?error.message:"Profile update failed.","error");throw error;}};
  const handleSignOut=()=>auth.signOut({revokeServerSession:true});
  const handleDownloadData=async()=>{if(isExportingData)return;setIsExportingData(true);try{await downloadStudentAccountData();showToast("Your account data download is ready.");}catch(error){showToast(error instanceof Error?error.message:"Your account data could not be exported.");}finally{setIsExportingData(false);}};
  const handleRevokeOtherSessions=async()=>{try{await revokeOtherSessions.mutateAsync();await Promise.all([devicesQuery.devices.refetch(),devicesQuery.session.refetch()]);showToast("Other active sessions were revoked. This device remains signed in.");}catch(error){showToast(error instanceof Error?error.message:"Other sessions could not be revoked.");}};

  const handleNotificationToggle=async(group:keyof typeof notifications,key:string,value:boolean)=>{
    const current=preferencesQuery.data;
    if(!current?.version && current?.version!==null){showToast("Notification preferences are still loading.","info");return;}
    const field=key as keyof NonNullable<typeof current>['notificationPreferences'];
    const notificationPreferences={...current.notificationPreferences,[field]:value};
    try{
      const saved=await studentLearningApi.setNotificationPreferences({notificationPreferences,expectedVersion:current.version});
      toggleNotification(group,key,value);
      await preferencesQuery.refetch();
      showToast("Notification preference saved to your account.");
      void saved;
    }catch(error){showToast(error instanceof Error?error.message:"Notification preference could not be saved.","error");}
  };

  useEffect(()=>{void getStudentAuthMethods().then(methods=>{setLinkedEmail(methods.verifiedEmail??"");}).catch(()=>undefined);},[]);

  const handleSendVerificationCode = async () => {
    if (isEmailBusy) return;
    if (!newContactValue.trim()) {
      showToast(`Please enter a valid new ${contactSubTab}.`,"error");
      return;
    }
    if(contactSubTab==="phone") { showToast("Phone is optional contact information only; it is not a sign-in or OTP method.","info"); return; }
    setIsEmailBusy(true);
    try {
      const methods=await getStudentAuthMethods();
      setLinkedEmail(methods.verifiedEmail??"");
      if(methods.verifiedEmail){
        if(methods.verifiedEmail.toLowerCase()===newContactValue.trim().toLowerCase()){showToast("Enter a different email address to change your login email.","error");return;}
        const challenge=await initiateOtpLogin({email:methods.verifiedEmail,brand:methods.brandCode??studentBrand});
        setEmailChallengeId(challenge.challengeId);setEmailStage("current");setEmailCode("");
        showToast("A confirmation code was sent to your current verified email.");
      }else{
        const link=await initiateStudentEmailLink(newContactValue);
        setEmailLinkTicket(link.linkTicket);setEmailStage("new");setEmailCode("");
        showToast("A verification code was sent to the new email address.");
      }
    } catch(error) { showToast(error instanceof Error?error.message:"Unable to start email verification.","error"); }
    finally { setIsEmailBusy(false); }
  };

  const handleVerifyEmail=async()=>{
    if (isEmailBusy) return;
    if(!/^\d{6}$/.test(emailCode.trim())){showToast("Enter the 6-digit verification code from your email.","error");return;}
    setIsEmailBusy(true);
    try{
      if(emailStage==="current"){
        const proof=await verifyOtpProof({challengeId:emailChallengeId,code:emailCode});
        const link=await initiateStudentEmailLink(newContactValue,proof.accessToken);
        setEmailLinkTicket(link.linkTicket);setEmailStage("new");setEmailCode("");
        showToast("Your new email has a verification code. Enter it to finish changing your login email.");
      }else if(emailStage==="new"){
        await completeStudentEmailLink({linkTicket:emailLinkTicket,code:emailCode});
        setEmailStage("idle");setEmailCode("");setEmailLinkTicket("");
        setLinkedEmail(newContactValue.trim());showToast("Your email is verified and is now your login email.");
        window.location.reload();
      }
    }catch(error){showToast(error instanceof Error?error.message:"Email verification failed. Check the code and try again.","error");}
    finally { setIsEmailBusy(false); }
  };

  const profileContentProps: React.ComponentProps<typeof ProfileTabContent> = {
      profile,
      onUpdateProfile: updateProfileField,
      onSaveProfile: handleSaveProfile,
      devices,
      subscription,
      contactSubTab,
      setContactSubTab,
      newContactValue,
      setNewContactValue,
      subscriptionDataLoading: commercialQuery.isLoading,
      subscriptionDataUnavailable: commercialQuery.isError,
      onRetrySubscription: () => { void commercialQuery.refetch(); },
      onChangePhotoClick: () => showToast("Profile photo changes are not supported by the current account API.","info"),
      onManageDevicesClick: () => setIsDevicesModalOpen(true),
      onCloseAccountClick: () => showToast("Account closure is not available as a self-service action.","info"),
      onSendVerificationCode: handleSendVerificationCode,
      onVerifyEmail: handleVerifyEmail,
      emailCode,
      setEmailCode,
      emailFlowStep: emailStage,
      isEmailBusy,
      linkedEmail,
      onDownloadDataClick: () => { void handleDownloadData(); },
      onSwitchAccountClick: () => { void handleSignOut(); },
      onViewPlansClick: () => showToast("Subscription purchases and seat changes are managed by an authorized Admin.","info"),
  };

  // Right sidebar widget for Devices & Access, Subscription, and Quick actions
  const rightSidebarContent = <ProfileTabContent {...profileContentProps} rightColumnOnly />;

  return (
    <>
      <ToastNotification message={toastMessage} tone={toastTone} />

      {(profileQuery.isLoading || devicesQuery.devices.isLoading || devicesQuery.session.isLoading || preferencesQuery.isLoading) && <p role="status" className="px-3 py-2 text-xs text-gray-500">Loading saved account settings…</p>}
      {(profileQuery.isError || devicesQuery.devices.isError || devicesQuery.session.isError || preferencesQuery.isError) && <p role="alert" className="mx-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">Some saved settings could not be loaded. <button type="button" onClick={() => { void Promise.all([profileQuery.refetch(), devicesQuery.devices.refetch(), devicesQuery.session.refetch(), preferencesQuery.refetch()]); }}>Retry</button></p>}

      <SettingsLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightSidebar={rightSidebarContent}
      >
        {/* Tab 1: Profile (Identity & Demographics) */}
        {activeTab === "profile" && (
          profileQuery.isLoading ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading your saved Student profile…</p> : profileQuery.isError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{profileQuery.error instanceof Error ? profileQuery.error.message : "Your Student profile could not be loaded."}</p> : <ProfileTab
            profile={profile}
            verifiedEmail={linkedEmail}
            onUpdateProfile={updateProfileField}
          onChangePhotoClick={() => showToast("Profile photo changes are not supported by the current account API.","info")}
          onSave={handleSaveProfile}
          />
        )}

        {/* Tab 2: Account (Lifecycle & Billing) */}
        {activeTab === "account" && (
          commercialQuery.isLoading ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading your saved Offering and Seat…</p> : <AccountTab
            subscription={subscription}
            subscriptionDataUnavailable={commercialQuery.isError}
            onRetrySubscription={() => { void commercialQuery.refetch(); }}
            paymentMethods={paymentMethods}
            onUpgradePlanClick={() => showToast("Purchases are managed by an authorized Admin.","info")}
            onAddPaymentMethodClick={() => showToast("Stored card and payment-method management are not part of manual payment review.","info")}
            onDownloadDataClick={() => { void handleDownloadData(); }}
            isDownloadingData={isExportingData}
            onCloseAccountClick={() => showToast("Account closure is not available as a self-service action.","info")}
          />
        )}

        {/* Tab 3: Security (Access Control) */}
        {activeTab === "security" && (
          <div className="flex flex-col gap-4 max-w-4xl">
            {/* Verified login-email link/change, backed by the identity API. */}
            <ProfileTabContent {...profileContentProps} contactChangeOnly />
            <SecurityTab
              linkedEmail={linkedEmail}
              onSignOut={() => { void handleSignOut(); }}
            />
          </div>
        )}

        {/* Tab 4: Devices (Session Management) */}
        {activeTab === "devices" && (
          (devicesQuery.devices.isLoading || devicesQuery.session.isLoading) ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading registered devices and current session…</p> : (devicesQuery.devices.isError || devicesQuery.session.isError) ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">Registered devices or the current session could not be loaded.</p> : <DevicesTab
            devices={devices}
            onRevokeDevice={() => showToast("Ask an authorized Admin to revoke this device from Admin > Security.","info")}
            onRevokeAllOther={() => void handleRevokeOtherSessions()}
            canRevokeOtherSessions={!revokeOtherSessions.isPending}
          />
        )}

        {/* Tab 5: Notifications (Communication Preferences) */}
        {activeTab === "notifications" && (
          preferencesQuery.isLoading ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading saved notification preferences…</p> : preferencesQuery.isError ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{preferencesQuery.error instanceof Error ? preferencesQuery.error.message : "Notification preferences could not be loaded."}</p> : <NotificationsTab
            notifications={notifications}
            onToggle={(group, key, value) => {
              void handleNotificationToggle(group,key,value);
            }}
          />
        )}

        {/* Tab 6: Privacy (Visibility & Tracking) */}
        {activeTab === "privacy" && (
          <PrivacyTab />
        )}

        {/* Tab 7: Appearance (Accessibility & Theming) */}
        {activeTab === "appearance" && (
          <AppearanceTab
            appearance={appearance}
            onUpdate={(key, value) => {
              updateAppearanceField(key, value);
              showToast("Appearance preference changed for this view only.","info");
            }}
          />
        )}
      </SettingsLayout>

      {/* Modals */}
      <ManageDevicesModal
        isOpen={isDevicesModalOpen}
        devices={devices}
        canRevokeDevice={false}
        canRevokeOtherSessions={!revokeOtherSessions.isPending}
        onClose={() => setIsDevicesModalOpen(false)}
        onRevokeDevice={() => showToast("Ask an authorized Admin to revoke this device from Admin > Security.","info")}
        onRevokeAllOther={() => void handleRevokeOtherSessions()}
      />
    </>
  );
};
