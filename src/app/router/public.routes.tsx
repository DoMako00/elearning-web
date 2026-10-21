import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { SignInPage } from "../../features/auth/pages/SignInPage";
import { MyProgressEmpty } from "../../features/student/components/MyProgress";

export const publicRoutes: RouteObject[] = [
  ...(import.meta.env.DEV
    ? [
        {
          path: "/test-empty-progress",
          element: (
            <div style={{ padding: "40px", background: "#f4f6f8", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#101a2d", marginBottom: "4px" }}>My Progress Empty State Preview</h1>
                <p style={{ fontSize: "14px", color: "#7c8494", margin: 0 }}>Reference Canvas (335x155) & Bento Dashboard Slot (360x210)</p>
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "8px" }}>Reference Canvas (335px x 155px)</span>
                <div style={{ width: "335px", height: "155px" }}>
                  <MyProgressEmpty />
                </div>
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "8px" }}>Bento Dashboard Slot (360px x 210px)</span>
                <div style={{ width: "360px", height: "210px" }}>
                  <MyProgressEmpty />
                </div>
              </div>
            </div>
          ),
        },
      ]
    : []),
  { path: "/auth/sign-in", element: <SignInPage /> },
  // Student accounts are provisioned by Admin; public signup/password auth is not supported.
  { path: "/auth/register", element: <Navigate to="/auth/sign-in" replace /> },
  // Legacy self-registration and phone-OTP onboarding are intentionally not valid auth flows.
  { path: "/auth/verify-otp", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/complete-profile", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/choose-brand", element: <Navigate to="/auth/sign-in" replace /> },
  // Legacy self-signup/access-preview pages are not valid production identity or
  // entitlement flows. Return users to the real provisioned-account sign-in.
  { path: "/auth/access-pending", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/access-granted", element: <Navigate to="/auth/sign-in" replace /> },
];
