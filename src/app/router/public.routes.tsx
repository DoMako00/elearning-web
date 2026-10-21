import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { SignInPage } from "../../features/auth/pages/SignInPage";
import { MyProgressEmpty } from "../../features/student/components/MyProgress";
import { WeeklyGoalCard } from "../../features/student/components/WeeklyGoalCard";

export const publicRoutes: RouteObject[] = [
  ...(import.meta.env.DEV
    ? [
        {
          path: "/test-empty-progress",
          element: (
            <div style={{ padding: "40px", background: "#f4f6f8", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#101a2d", marginBottom: "4px" }}>Card Empty State Previews</h1>
                <p style={{ fontSize: "14px", color: "#7c8494", margin: 0 }}>Weekly Goal Picker & My Progress Empty States</p>
              </div>

              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "8px" }}>Weekly Goal Empty State (Dashboard Bento Slot: 460px x 310px)</span>
                <div style={{ width: "460px", height: "310px" }}>
                  <WeeklyGoalCard
                    completedLessons={undefined}
                    targetLessons={null}
                    goalSet={false}
                    completedDays={undefined}
                    onGoalSet={(val) => console.log("Goal set to:", val)}
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "8px" }}>Weekly Goal Empty State (Reference Aspect ~ 480px x 320px)</span>
                <div style={{ width: "480px", height: "320px" }}>
                  <WeeklyGoalCard
                    completedLessons={undefined}
                    targetLessons={null}
                    goalSet={false}
                    completedDays={undefined}
                    onGoalSet={(val) => console.log("Goal set to:", val)}
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", display: "block", marginBottom: "8px" }}>My Progress - Reference Canvas (335px x 155px)</span>
                <div style={{ width: "335px", height: "155px" }}>
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
