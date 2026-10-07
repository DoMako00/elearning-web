import React from "react";
import { Laptop, Smartphone, Tablet, LogOut, ShieldCheck } from "lucide-react";
import type { DeviceSession } from "../../../../types/settings";
import { SettingsCard } from "../common/SettingsCard";

interface DevicesTabProps {
  devices: DeviceSession[];
  onRevokeDevice: (deviceId: string) => void;
  onRevokeAllOther: () => void;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  devices,
  onRevokeDevice,
  onRevokeAllOther,
}) => {
  const currentDevice = devices.find((d) => d.isCurrent) || devices[0];
  const otherDevices = devices.filter((d) => !d.isCurrent);

  const getDeviceIcon = (type: DeviceSession["deviceType"]) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="w-4 h-4" />;
      case "tablet":
        return <Tablet className="w-4 h-4" />;
      default:
        return <Laptop className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* 1. Current Session Card */}
      <SettingsCard
        title="Current Session"
        subtitle="The active browser and computer currently signed in to your portal."
        icon={<ShieldCheck className="w-4 h-4 stroke-2" />}
      >
        <div className="p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              {getDeviceIcon(currentDevice.deviceType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                  {currentDevice.name} — {currentDevice.browser}
                </h4>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Now
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentDevice.os} • {currentDevice.location} • IP: {currentDevice.ipAddress}
              </p>
            </div>
          </div>

          <span className="self-start sm:self-center text-[11px] font-semibold text-emerald-700 bg-white/90 border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs">
            This Device
          </span>
        </div>
      </SettingsCard>

      {/* 2. Other Devices List */}
      <SettingsCard
        title="Other Recognized Devices"
        subtitle="Manage historical and secondary sessions with active session tokens."
        icon={<Laptop className="w-4 h-4 stroke-2" />}
        headerAction={
          otherDevices.length > 0 && (
            <button
              type="button"
              onClick={onRevokeAllOther}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out of all other devices</span>
            </button>
          )
        }
      >
        {otherDevices.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
            No other active device sessions found. Your account is only active on this device.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {otherDevices.map((dev) => (
              <div
                key={dev.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                    {getDeviceIcon(dev.deviceType)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">
                      {dev.name} — {dev.browser} — {dev.location}
                    </h5>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {dev.os} • Last active: {dev.lastActive}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRevokeDevice(dev.id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer hover:underline"
                >
                  Revoke Access
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  );
};
