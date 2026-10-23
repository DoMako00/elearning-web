import { useCallback, useState } from "react";
import { loadAppearancePreferences, saveAppearancePreferences } from "../appearancePreferences";
import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
  PaymentMethod,
  NotificationPreferences,
  AppearancePreferences,
  SettingsTabId,
} from "../../../types/settings";

export function useSettingsForm(initialTab: SettingsTabId = "profile") {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [profile, setProfile] = useState<StudentProfileData>({fullName:"",studentId:"",email:"",phoneCountryCode:"",phoneCountryFlag:"",phoneNumber:"",university:"",academicYear:"",major:"",avatarUrl:""});
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionPlan>({name:"",status:"Unavailable",seats:0,duration:"",renewDate:"",planType:"individual"});
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [notifications, setNotifications] = useState<NotificationPreferences>({learningAlerts:{assignmentDeadlines:false,lessonReminders:false,dailyStreakWarnings:false},socialCommunity:{directMessages:false,mentionsInCommunity:false,repliesToPosts:false},systemAlerts:{securityAlerts:false,billingUpdates:false}});
  const [appearance, setAppearance] = useState<AppearancePreferences>(loadAppearancePreferences);

  // Email/Phone change form state for backwards compatibility
  const [contactSubTab, setContactSubTab] = useState<"email" | "phone">("email");
  const [newContactValue, setNewContactValue] = useState("");

  const updateProfileField = <K extends keyof StudentProfileData>(
    field: K,
    value: StudentProfileData[K]
  ) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleNotification = (
    group: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setNotifications((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: value,
      },
    }));
  };

  const updateAppearanceField = useCallback(<K extends keyof AppearancePreferences>(
    field: K,
    value: AppearancePreferences[K]
  ) => {
    if (field !== "fontSize") return;
    setAppearance((prev) => {
      const next = { ...prev, fontSize: value as AppearancePreferences["fontSize"] };
      saveAppearancePreferences(next);
      return next;
    });
  }, []);

  return {
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
    setPaymentMethods,
    notifications,
    setNotifications,
    toggleNotification,
    appearance,
    updateAppearanceField,
    contactSubTab,
    setContactSubTab,
    newContactValue,
    setNewContactValue,
  };
}
