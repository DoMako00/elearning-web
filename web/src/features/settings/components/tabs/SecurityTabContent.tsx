import React, { useState } from "react";
import { ShieldCheck, KeyRound, History } from "lucide-react";

interface SecurityTabContentProps {
  onChangePasswordClick: () => void;
}

export const SecurityTabContent: React.FC<SecurityTabContentProps> = ({
  onChangePasswordClick,
}) => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  return (
    <div className="flex flex-col gap-3.5 max-w-3xl">
      {/* Two-Factor Authentication Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  Two-Factor Authentication (2FA)
                </h4>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    twoFactorEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Secure your student profile with an authenticator app (Google Authenticator, Authy) or SMS verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              twoFactorEnabled ? "bg-emerald-600" : "bg-gray-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                twoFactorEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Account Password
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Last modified 2 months ago. We recommend updating your credentials regularly.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangePasswordClick}
          className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          Change password
        </button>
      </div>

      {/* Login History */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
            Recent Login Activity
          </h4>
        </div>

        <div className="divide-y divide-gray-50 text-xs">
          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800">Chrome on Windows 11</span>
              <p className="text-[11px] text-gray-400">Cairo, Egypt • 197.35.120.45</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">Active Now</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800">Safari on iPhone 15 Pro</span>
              <p className="text-[11px] text-gray-400">Giza, Egypt • 156.204.88.19</p>
            </div>
            <span className="text-[11px] text-gray-400">Yesterday at 9:42 PM</span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800">GreenLearn App on iPad Air</span>
              <p className="text-[11px] text-gray-400">Cairo, Egypt • 197.35.120.89</p>
            </div>
            <span className="text-[11px] text-gray-400">Sep 7, 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
