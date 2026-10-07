import React, { useState } from "react";
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
  ChangePhotoModal,
  ChangePasswordModal,
  CloseAccountModal,
  ManageDevicesModal,
} from "./components/modals";
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
    paymentMethods,
    security,
    updateSecurity,
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

  // Modals state
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

  // Right sidebar widget for Devices & Access, Subscription, and Quick actions
  const rightSidebarContent = (
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
      rightColumnOnly
    />
  );

  return (
    <>
      <ToastNotification message={toastMessage} />

      <SettingsLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        rightSidebar={rightSidebarContent}
      >
        {/* Tab 1: Profile (Identity & Demographics) */}
        {activeTab === "profile" && (
          <ProfileTab
            profile={profile}
            onUpdateProfile={updateProfileField}
            onChangePhotoClick={() => setIsPhotoModalOpen(true)}
            onSave={() => showToast("Profile changes saved successfully!")}
          />
        )}

        {/* Tab 2: Account (Lifecycle & Billing) */}
        {activeTab === "account" && (
          <AccountTab
            subscription={subscription}
            paymentMethods={paymentMethods}
            onUpgradePlanClick={() => showToast("Opening subscription upgrade plans...")}
            onAddPaymentMethodClick={() => showToast("Opening payment method provider...")}
            onDownloadDataClick={() => showToast("Preparing learning portfolio download...")}
            onCloseAccountClick={() => setIsCloseModalOpen(true)}
          />
        )}

        {/* Tab 3: Security (Access Control) */}
        {activeTab === "security" && (
          <SecurityTab
            security={security}
            onUpdateSecurity={(newSettings) => {
              updateSecurity(newSettings);
              showToast("Security settings updated.");
            }}
            onSavePassword={() => showToast("Password updated successfully!")}
          />
        )}

        {/* Tab 4: Devices (Session Management) */}
        {activeTab === "devices" && (
          <DevicesTab
            devices={devices}
            onRevokeDevice={(id) => {
              removeDevice(id);
              showToast("Device session revoked.");
            }}
            onRevokeAllOther={() => {
              removeAllOtherDevices();
              showToast("All other device sessions terminated.");
            }}
          />
        )}

        {/* Tab 5: Notifications (Communication Preferences) */}
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            onToggle={(group, key, value) => {
              toggleNotification(group, key, value);
              showToast("Notification preferences saved.");
            }}
          />
        )}

        {/* Tab 6: Privacy (Visibility & Tracking) */}
        {activeTab === "privacy" && (
          <PrivacyTab
            privacy={privacy}
            onUpdate={(key, value) => {
              updatePrivacyField(key, value);
              showToast("Privacy preference updated.");
            }}
          />
        )}

        {/* Tab 7: Appearance (Accessibility & Theming) */}
        {activeTab === "appearance" && (
          <AppearanceTab
            appearance={appearance}
            onUpdate={(key, value) => {
              updateAppearanceField(key, value);
              showToast("Appearance preference updated.");
            }}
          />
        )}
      </SettingsLayout>

      {/* Modals */}
      <ChangePhotoModal
        isOpen={isPhotoModalOpen}
        currentAvatar={profile.avatarUrl}
        onClose={() => setIsPhotoModalOpen(false)}
        onSavePhoto={(newUrl: string) => {
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
        onRevokeDevice={(id: string) => {
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
    </>
  );
};
