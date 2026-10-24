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
  subscriptionDataUnavailable?: boolean;
  onRetrySubscription?: () => void;
  paymentMethods?: PaymentMethod[];
  onUpgradePlanClick: () => void;
  onAddPaymentMethodClick?: () => void;
  onDownloadDataClick: () => void;
  isDownloadingData?: boolean;
  onCloseAccountClick: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
  subscription,
  subscriptionDataUnavailable = false,
  onRetrySubscription,
  paymentMethods = [],
  onUpgradePlanClick,
  onAddPaymentMethodClick,
  onDownloadDataClick,
  isDownloadingData = false,
  onCloseAccountClick,
}) => {
  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Subscription Management Card */}
      <SettingsCard
        title="Subscription Management"
        subtitle="Review your Semester Offering access and current term."
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
                {subscriptionDataUnavailable ? "Current Offering details" : subscription.name || "Subscription details"}
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300/80 rounded-full">
                  {subscriptionDataUnavailable ? "Details unavailable" : subscription.status === "Unavailable" ? "No subscription data" : subscription.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {subscriptionDataUnavailable
                  ? "We couldn't load your current Offering and seat details. This display issue does not change your access."
                  : subscription.status === "Unavailable"
                    ? "No current Semester Offering subscription is recorded."
                    : `${subscription.seats} assigned seat${subscription.seats === 1 ? "" : "s"}${subscription.renewDate ? ` · Term ends ${subscription.renewDate}` : ""}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {subscriptionDataUnavailable && onRetrySubscription ? (
              <button
                type="button"
                onClick={onRetrySubscription}
                className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Retry details
              </button>
            ) : null}
            <button
              type="button"
              onClick={onUpgradePlanClick}
              title="Purchases are managed by an authorized Admin."
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-50/60 border border-emerald-300 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
            >
              <span>Admin-managed purchases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </SettingsCard>

      {/* 2. Payment Methods Card */}
      <SettingsCard
        title="Payment Methods"
        subtitle="This product uses manual payment review; stored card and auto-renewal details are not part of the account."
        icon={<CreditCard className="w-4 h-4 stroke-2" />}
        headerAction={
          <button
            type="button"
            onClick={onAddPaymentMethodClick}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Payment methods</span>
          </button>
        }
      >
        <div className="space-y-2.5 pt-1">
          {paymentMethods.length === 0 ? <p className="p-3 text-xs text-gray-500 bg-gray-50 rounded-xl">No stored payment methods are available for this account.</p> : null}
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
              Download profile, progress, assignments, and issued-certificate records as JSON. Private file contents are not included.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadDataClick}
            disabled={isDownloadingData}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingData ? "Preparing download…" : "Download My Data"}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-3 border-t border-rose-100/80">
          <div>
            <h5 className="text-xs font-bold text-rose-700">
              Close Account Permanently
            </h5>
            <p className="text-[11px] text-rose-600/80">
              Self-service account closure is not available. Contact authorized support for account requests.
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
