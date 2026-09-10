import { useState } from "react";
import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
  NotificationPreferences,
  PrivacyPreferences,
  AppearancePreferences,
  SettingsTabId,
} from "../../../types/settings";
import {
  INITIAL_PROFILE_DATA,
  INITIAL_DEVICES,
  INITIAL_SUBSCRIPTION,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRIVACY,
  INITIAL_APPEARANCE,
} from "../data/settingsMockData";

export function useSettingsForm(initialTab: SettingsTabId = "profile") {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [profile, setProfile] = useState<StudentProfileData>(INITIAL_PROFILE_DATA);
  const [devices, setDevices] = useState<DeviceSession[]>(INITIAL_DEVICES);
  const [subscription, setSubscription] = useState<SubscriptionPlan>(INITIAL_SUBSCRIPTION);
  const [notifications, setNotifications] = useState<NotificationPreferences>(INITIAL_NOTIFICATIONS);
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(INITIAL_PRIVACY);
  const [appearance, setAppearance] = useState<AppearancePreferences>(INITIAL_APPEARANCE);

  // Email/Phone change form state
  const [contactSubTab, setContactSubTab] = useState<"email" | "phone">("email");
  const [newContactValue, setNewContactValue] = useState("");

  const updateProfileField = <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const removeDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  const removeAllOtherDevices = () => {
    setDevices((prev) => prev.filter((d) => d.isCurrent));
  };

  const toggleNotification = (
    category: keyof NotificationPreferences,
    channel: "email" | "push" | "sms"
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const updatePrivacyField = <K extends keyof PrivacyPreferences>(
    field: K,
    value: PrivacyPreferences[K]
  ) => {
    setPrivacy((prev) => ({ ...prev, [field]: value }));
  };

  const updateAppearanceField = <K extends keyof AppearancePreferences>(
    field: K,
    value: AppearancePreferences[K]
  ) => {
    setAppearance((prev) => ({ ...prev, [field]: value }));
  };

  return {
    activeTab,
    setActiveTab,
    profile,
    updateProfileField,
    setProfile,
    devices,
    removeDevice,
    removeAllOtherDevices,
    subscription,
    setSubscription,
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
  };
}
