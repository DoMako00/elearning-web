import React from "react";
import { X, Laptop, Smartphone, Tablet, LogOut } from "lucide-react";
import type { DeviceSession } from "../../../../types/settings";

interface ManageDevicesModalProps {
  isOpen: boolean;
  devices: DeviceSession[];
  onClose: () => void;
  onRevokeDevice: (deviceId: string) => void;
  onRevokeAllOther: () => void;
}

export const ManageDevicesModal: React.FC<ManageDevicesModalProps> = ({
  isOpen,
  devices,
  onClose,
  onRevokeDevice,
  onRevokeAllOther,
}) => {
  if (!isOpen) return null;

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

  const otherDevicesCount = devices.filter((d) => !d.isCurrent).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Manage Active Devices</h3>
            <p className="text-xs text-gray-500">View and revoke active session logins</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1">
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
                          This Device
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

                {!device.isCurrent && (
                  <button
                    type="button"
                    onClick={() => onRevokeDevice(device.id)}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          {otherDevicesCount > 0 ? (
            <button
              type="button"
              onClick={onRevokeAllOther}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out of all other devices</span>
            </button>
          ) : (
            <span className="text-xs text-gray-400">Only your current device is signed in</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
