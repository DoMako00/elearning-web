import React from "react";
import {
  Crown,
  CreditCard,
  Plus,
  Download,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import type { SubscriptionPlan, PaymentMethod } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";

interface AccountTabProps {
  subscription: SubscriptionPlan;
  paymentMethods?: PaymentMethod[];
  onUpgradePlanClick: () => void;
  onAddPaymentMethodClick?: () => void;
  onDownloadDataClick: () => void;
  onCloseAccountClick: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  subscription,
  paymentMethods = [
    {
      id: "pm-1",
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2028,
      isDefault: true,
    },
  ],
  onUpgradePlanClick,
  onAddPaymentMethodClick,
  onDownloadDataClick,
  onCloseAccountClick,
}) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Subscription Management Card */}
      <SettingsCard
        title="Subscription Management"
        subtitle="Review your plan status, seat allocations, and renewal cycles."
        icon={<Crown className="w-4 h-4 stroke-2" />}
      >
        <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-50/80 via-[#edfbf3] to-[#e2f7eb] border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Crown className="w-5 h-5 stroke-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900 leading-tight">
                  {subscription.name}
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300/80 rounded-full">
                  {subscription.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {subscription.seats} active seat • Renews on {subscription.renewDate} ({subscription.duration})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpgradePlanClick}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50/60 border border-emerald-300 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
          >
            <span>Upgrade to Friends Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </SettingsCard>

      {/* 2. Payment Methods Card */}
      <SettingsCard
        title="Payment Methods"
        subtitle="Manage billing credentials and active cards for auto-renewals."
        icon={<CreditCard className="w-4 h-4 stroke-2" />}
        headerAction={
          <button
            type="button"
            onClick={onAddPaymentMethodClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Payment Method</span>
          </button>
        }
      >
        <div className="space-y-2.5 pt-1">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 rounded-md bg-linear-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-[10px] tracking-wider uppercase shadow-2xs">
                  {pm.brand}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    Visa ending in {pm.last4}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Expires {pm.expMonth}/{pm.expYear}
                  </p>
                </div>
              </div>

              {pm.isDefault && (
                <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-600 bg-gray-200/70 rounded-md">
                  Default
                </span>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* 3. Danger Zone */}
      <div className="rounded-2xl p-4 sm:p-5 border border-rose-200 bg-rose-50/20 shadow-2xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-900 leading-snug">
              Danger Zone
            </h3>
            <p className="text-[11px] text-rose-700/70">
              Irreversible actions related to your learning archive and account identity.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-rose-100/80">
          <div>
            <h5 className="text-xs font-bold text-gray-900">
              Export Learning Portfolio & Account Archive
            </h5>
            <p className="text-[11px] text-gray-500">
              Download all completed assignments, progress analytics, and certificates.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadDataClick}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download My Data</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-rose-100/80">
          <div>
            <h5 className="text-xs font-bold text-rose-700">
              Close Account Permanently
            </h5>
            <p className="text-[11px] text-rose-600/80">
              Revoke course enrollments, erase streak records, and delete account profile.
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseAccountClick}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Close Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
