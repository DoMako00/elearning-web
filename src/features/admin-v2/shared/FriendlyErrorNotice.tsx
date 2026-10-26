import React, { useState } from "react";
import { FriendlyErrorInfo } from "../utils/friendlyError";

export interface FriendlyErrorNoticeProps {
  error: FriendlyErrorInfo | string | null;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const FriendlyErrorNotice: React.FC<FriendlyErrorNoticeProps> = ({
  error,
  className = "admin-v2__inline-notice",
  onRetry,
  onDismiss,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const info: FriendlyErrorInfo = typeof error === "string" ? { message: error } : error;

  return (
    <div role="alert" className={className} style={{ display: "grid", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span>{info.message}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {onRetry && (
            <button type="button" className="admin-v2__button" onClick={onRetry} style={{ minHeight: 24, padding: "2px 8px", fontSize: 10 }}>
              Retry
            </button>
          )}
          {onDismiss && (
            <button type="button" className="admin-v2__button" onClick={onDismiss} style={{ minHeight: 24, padding: "2px 8px", fontSize: 10 }}>
              Dismiss
            </button>
          )}
          {(info.details || info.reference) && (
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                color: "#18834b",
                cursor: "pointer",
                fontSize: 10,
                textDecoration: "underline",
                padding: 0,
              }}
            >
              {showDetails ? "Hide details" : "Show details"}
            </button>
          )}
        </div>
      </div>
      {showDetails && (info.details || info.reference) && (
        <div
          style={{
            marginTop: 4,
            padding: 8,
            borderRadius: 4,
            background: "#fff",
            border: "1px solid #e1e9e3",
            fontSize: 10,
            color: "#516057",
            fontFamily: "ui-monospace, monospace",
            wordBreak: "break-all",
          }}
        >
          {info.details && <div>{info.details}</div>}
          {info.reference && <div style={{ marginTop: 2, fontWeight: 600 }}>Reference: {info.reference}</div>}
        </div>
      )}
    </div>
  );
};
