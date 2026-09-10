import React, { useState } from "react";
import {
  SettingsTabNav,
  ProfileTabContent,
  // SecurityTabContent,
  DevicesTabContent,
  NotificationsTabContent,
  PrivacyTabContent,
  AppearanceTabContent,
  ChangePhotoModal,
  ChangePasswordModal,
  CloseAccountModal,
  ManageDevicesModal,
} from "./components";
import { useSettingsForm } from "./hooks/useSettingsForm";
import { ToastNotification } from "../../components/ui/ToastNotification";
import { useToast } from "../../hooks/useToast";

export const Settings: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    profile,
    updateProfileField,
    devices,
    removeDevice,
    removeAllOtherDevices,
    subscription,
    notifications,
    toggleNotification,
    privacy,
    updatePrivacyField,
    appearance,
    updateAppearanceField,
    contactSubTab,
    setContactSubTab,
    newContactValue,
    setNewContactValue,
  } = useSettingsForm("profile");

  const { toastMessage, showToast } = useToast();

  // Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);

  const handleSendVerificationCode = () => {
    if (!newContactValue.trim()) {
      showToast(`Please enter a valid new ${contactSubTab}.`);
      return;
    }
    showToast(`Verification code sent to ${newContactValue}!`);
  };

  return (
    <div className="settings-root w-full h-full flex flex-col min-h-0">
      <ToastNotification message={toastMessage} />

      {/* Settings Page Header matching design reference:
          Left: "Settings" title + "Manage your account, security, devices, and preferences."
          Right: Motivational pill "A better learning experience starts with you"
      */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 shrink-0 border-b border-gray-100/80">
        {/* <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight leading-tight">
            Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your account, security, devices, and preferences.
          </p>
        </div> */}

        
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="py-2 shrink-0">
        <SettingsTabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Tab Content Container */}
      <div className="settings-tab-content flex-1 min-h-0 overflow-y-auto pt-1 pb-4">
        {activeTab === "profile" && (
          <ProfileTabContent
            profile={profile}
            onUpdateProfile={updateProfileField}
            devices={devices}
            subscription={subscription}
            contactSubTab={contactSubTab}
            setContactSubTab={setContactSubTab}
            newContactValue={newContactValue}
            setNewContactValue={setNewContactValue}
            onChangePhotoClick={() => setIsPhotoModalOpen(true)}
            onChangePasswordClick={() => setIsPasswordModalOpen(true)}
            onManageDevicesClick={() => setIsDevicesModalOpen(true)}
            onCloseAccountClick={() => setIsCloseModalOpen(true)}
            onSendVerificationCode={handleSendVerificationCode}
            onDownloadDataClick={() => showToast("Preparing your learning data export...")}
            onSwitchAccountClick={() => showToast("Redirecting to account switcher...")}
            onViewPlansClick={() => showToast("Opening subscription plans...")}
          />
        )}

        {/* {(activeTab === "account" || activeTab === "security") && (
          <SecurityTabContent
            onChangePasswordClick={() => setIsPasswordModalOpen(true)}
          />
        )} */}

        {activeTab === "devices" && (
          <DevicesTabContent
            devices={devices}
            onRevokeDevice={(id) => {
              removeDevice(id);
              showToast("Device session revoked successfully.");
            }}
            onRevokeAllOther={() => {
              removeAllOtherDevices();
              showToast("All other device sessions logged out.");
            }}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationsTabContent
            notifications={notifications}
            onToggle={(cat, channel) => {
              toggleNotification(cat, channel);
              showToast("Notification preferences updated.");
            }}
          />
        )}

        {activeTab === "privacy" && (
          <PrivacyTabContent
            privacy={privacy}
            onUpdate={(field, val) => {
              updatePrivacyField(field, val);
              showToast("Privacy settings saved.");
            }}
          />
        )}

        {activeTab === "appearance" && (
          <AppearanceTabContent
            appearance={appearance}
            onUpdate={(field, val) => {
              updateAppearanceField(field, val);
              showToast("Appearance preference updated.");
            }}
          />
        )}
      </div>

      {/* Modals */}
      <ChangePhotoModal
        isOpen={isPhotoModalOpen}
        currentAvatar={profile.avatarUrl}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={(newUrl) => {
          updateProfileField("avatarUrl", newUrl);
          showToast("Profile photo updated successfully!");
        }}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => showToast("Password updated successfully!")}
      />

      <ManageDevicesModal
        isOpen={isDevicesModalOpen}
        devices={devices}
        onClose={() => setIsDevicesModalOpen(false)}
        onRevokeDevice={(id) => {
          removeDevice(id);
          showToast("Device session revoked.");
        }}
        onRevokeAllOther={() => {
          removeAllOtherDevices();
          showToast("All other device sessions terminated.");
        }}
      />

      <CloseAccountModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirmClose={() => {
          showToast("Account deletion initiated. You will be signed out.");
        }}
      />
    </div>
  );
};
