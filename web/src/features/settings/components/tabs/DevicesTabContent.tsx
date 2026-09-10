import React from "react";
import { Laptop, Smartphone, Tablet, LogOut } from "lucide-react";
import type { DeviceSession } from "../../../../types/settings";

interface DevicesTabContentProps {
  devices: DeviceSession[];
  onRevokeDevice: (id: string) => void;
  onRevokeAllOther: () => void;
}

export const DevicesTabContent: React.FC<DevicesTabContentProps> = ({
  devices,
  onRevokeDevice,
  onRevokeAllOther,
}) => {
  const getDeviceIcon = (type: DeviceSession["deviceType"]) => {
    switch (type) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Laptop;
    }
  };

  const hasOtherDevices = devices.some((d) => !d.isCurrent);

  return (
    <div className="flex flex-col gap-3.5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">
              Your Logged-in Devices
            </h3>
            <p className="text-xs text-gray-500">
              Manage all phones, computers, and tablets currently connected to your GreenLearn account.
            </p>
          </div>

          {hasOtherDevices && (
            <button
              type="button"
              onClick={onRevokeAllOther}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out all other devices</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.deviceType);
            return (
              <div
                key={device.id}
                className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center text-gray-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {device.name}
                      </h4>
                      {device.isCurrent && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                      {device.browser} • {device.os} • {device.location}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      IP: {device.ipAddress} • Last active: {device.lastActive}
                    </p>
                  </div>
                </div>

                {!device.isCurrent ? (
                  <button
                    type="button"
                    onClick={() => onRevokeDevice(device.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Revoke
                  </button>
                ) : (
                  <span className="text-xs text-gray-400 font-medium px-2">
                    Active now
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
