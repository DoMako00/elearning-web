import React, { useState } from "react";
import { Lock, Shield, Mail, Check, Eye, EyeOff } from "lucide-react";
import type { SecuritySettings } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";
import { ToggleSwitch } from "../common/ToggleSwitch";

interface SecurityTabProps {
  security: SecuritySettings;
  onUpdateSecurity: (newSettings: Partial<SecuritySettings>) => void;
  onSavePassword?: (current: string, next: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  security,
  onUpdateSecurity,
  onSavePassword,
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  // Compute password strength (0 to 4)
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = calculateStrength(newPassword);

  const getStrengthLabel = () => {
    if (!newPassword) return "Enter a password";
    if (strength <= 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  const getStrengthColor = () => {
    if (!newPassword) return "bg-gray-200";
    if (strength <= 1) return "bg-rose-500";
    if (strength === 2) return "bg-amber-500";
    if (strength === 3) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordFeedback("Please fill out current and new passwords.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFeedback("Password must be at least 8 characters long.");
      return;
    }

    onSavePassword?.(currentPassword, newPassword);
    setPasswordFeedback("Password updated successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordFeedback(null), 3000);
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Change Password Form */}
      <SettingsCard
        title="Change Password"
        subtitle="Ensure your account is using a secure, unpredictable password."
        icon={<Lock className="w-4 h-4 stroke-2" />}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-1">
          {/* Current Password */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter existing password"
                className="w-full h-9 pl-3 pr-10 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100/90 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">Password strength:</span>
                <span className="font-bold text-gray-800">{getStrengthLabel()}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 h-full rounded-full transition-all duration-300 ${
                      step <= strength ? getStrengthColor() : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submission feedback */}
          {passwordFeedback && (
            <div
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                passwordFeedback.includes("successfully")
                  ? "text-emerald-700"
                  : "text-rose-600"
              }`}
            >
              {passwordFeedback.includes("successfully") && <Check className="w-3.5 h-3.5" />}
              {passwordFeedback}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </SettingsCard>

      {/* 2. Two-Factor Authentication (2FA) Card */}
      <SettingsCard
        title="Two-Factor Authentication (2FA)"
        subtitle="Add a strong defense layer to prevent unauthorized access to your student portal."
        icon={<Shield className="w-4 h-4 stroke-2" />}
      >
        <div className="pt-1">
          <ToggleSwitch
            checked={security.twoFactorEnabled}
            onChange={(checked) => onUpdateSecurity({ twoFactorEnabled: checked })}
            label="Enable Two-Factor Verification"
            description={
              security.twoFactorEnabled
                ? "Authenticator App Configured & Active (TOTP)"
                : "Authenticator App Not Configured"
            }
          />
        </div>
      </SettingsCard>

      {/* 3. Recovery Options Card */}
      <SettingsCard
        title="Recovery Options"
        subtitle="Specify a fallback email to regain access if your credentials or 2FA device are lost."
        icon={<Mail className="w-4 h-4 stroke-2" />}
      >
        <div className="pt-1 max-w-md">
          <label className="block text-[11px] font-semibold text-gray-700 mb-1">
            Backup Recovery Email Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={security.recoveryEmail}
              onChange={(e) => onUpdateSecurity({ recoveryEmail: e.target.value })}
              placeholder="e.g. backup.email@gmail.com"
              className="flex-1 h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="button"
              onClick={() => alert(`Recovery email set to ${security.recoveryEmail}`)}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Save
            </button>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};
