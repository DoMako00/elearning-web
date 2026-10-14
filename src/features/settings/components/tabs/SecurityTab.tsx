import React from "react";
import { Shield, Mail, Lock } from "lucide-react";
import { SettingsCard } from "../common/SettingsCard";

interface SecurityTabProps { linkedEmail: string; onSignOut: () => void; }

export const SecurityTab: React.FC<SecurityTabProps> = ({ linkedEmail, onSignOut }) => (
  <div className="flex flex-col gap-4 max-w-4xl">
    <SettingsCard title="Sign-in method" subtitle="Student authentication follows the provisioned-account and verified-email flow." icon={<Lock className="w-4 h-4 stroke-2" />}>
      <div className="pt-1 text-xs leading-relaxed text-gray-600">First access uses the Account Identifier and Setup Code. Future sign-in uses a verified linked email and OTP. Passwords, phone OTP, and Google OAuth are not used.</div>
    </SettingsCard>
    <SettingsCard title="Verified sign-in email" subtitle="A real email becomes your login identity only after email ownership verification." icon={<Mail className="w-4 h-4 stroke-2" />}>
      <div className="pt-1 max-w-md"><label className="block text-[11px] font-semibold text-gray-700 mb-1">Linked email</label><input type="email" value={linkedEmail} readOnly placeholder="No verified email linked" className="w-full h-9 px-3 text-xs bg-gray-50/80 border border-gray-200/90 rounded-xl text-gray-800" /></div>
    </SettingsCard>
    <SettingsCard title="Two-factor authentication" subtitle="Email OTP is the current verification method." icon={<Shield className="w-4 h-4 stroke-2" />}>
      <p className="pt-1 text-xs leading-relaxed text-gray-600">Authenticator-app/TOTP setup is not part of the current Student authentication contract.</p>
    </SettingsCard>
    <SettingsCard title="Current session" subtitle="End this authenticated Student session on this device." icon={<Shield className="w-4 h-4 stroke-2" />}>
      <div className="flex justify-end pt-1"><button type="button" onClick={onSignOut} className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">Sign out this device</button></div>
    </SettingsCard>
  </div>
);
