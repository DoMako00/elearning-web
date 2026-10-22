// import { useState } from "react";
import type { RouteObject } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { SignInPage } from "../../features/auth/pages/SignInPage";
import { MyProgressEmpty } from "../../features/student/components/MyProgress";
import { WeeklyGoalCard } from "../../features/student/components/WeeklyGoalCard";
// import { AssignmentsWorkspace } from "../../components/ui/Assignments";

// function DevAssignmentsPreview() {
//   const [devState, setDevState] = useState<
//     "true-empty" | "filtered-in-progress" | "filtered-submitted" | "filtered-graded" | "partial-rail"
//   >("true-empty");

//   return (
//     <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", background: "#f0f4f2", overflow: "hidden" }}>
//       <div style={{
//         display: "flex",
//         alignItems: "center",
//         gap: "10px",
//         padding: "8px 20px",
//         background: "#ffffff",
//         borderBottom: "1px solid #e2e8f0",
//         flexShrink: 0,
//         zIndex: 50,
//       }}>
//         <span style={{ fontSize: "12px", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em" }}>
//           QA Switcher:
//         </span>
//         <button
//           type="button"
//           onClick={() => setDevState("true-empty")}
//           style={{
//             padding: "5px 12px",
//             fontSize: "12px",
//             fontWeight: 650,
//             borderRadius: "6px",
//             border: "1px solid",
//             borderColor: devState === "true-empty" ? "#20a862" : "#cbd5e1",
//             background: devState === "true-empty" ? "#eefaf2" : "#ffffff",
//             color: devState === "true-empty" ? "#15803d" : "#475569",
//             cursor: "pointer",
//           }}
//         >
//           1. True Empty (0 Items)
//         </button>
//         <button
//           type="button"
//           onClick={() => setDevState("partial-rail")}
//           style={{
//             padding: "5px 12px",
//             fontSize: "12px",
//             fontWeight: 650,
//             borderRadius: "6px",
//             border: "1px solid",
//             borderColor: devState === "partial-rail" ? "#20a862" : "#cbd5e1",
//             background: devState === "partial-rail" ? "#eefaf2" : "#ffffff",
//             color: devState === "partial-rail" ? "#15803d" : "#475569",
//             cursor: "pointer",
//           }}
//         >
//           2. Partial Data (Rail Card Empties)
//         </button>
//         <button
//           type="button"
//           onClick={() => setDevState("filtered-in-progress")}
//           style={{
//             padding: "5px 12px",
//             fontSize: "12px",
//             fontWeight: 650,
//             borderRadius: "6px",
//             border: "1px solid",
//             borderColor: devState === "filtered-in-progress" ? "#20a862" : "#cbd5e1",
//             background: devState === "filtered-in-progress" ? "#eefaf2" : "#ffffff",
//             color: devState === "filtered-in-progress" ? "#15803d" : "#475569",
//             cursor: "pointer",
//           }}
//         >
//           3. Filtered (In Progress)
//         </button>
//         <button
//           type="button"
//           onClick={() => setDevState("filtered-submitted")}
//           style={{
//             padding: "5px 12px",
//             fontSize: "12px",
//             fontWeight: 650,
//             borderRadius: "6px",
//             border: "1px solid",
//             borderColor: devState === "filtered-submitted" ? "#20a862" : "#cbd5e1",
//             background: devState === "filtered-submitted" ? "#eefaf2" : "#ffffff",
//             color: devState === "filtered-submitted" ? "#15803d" : "#475569",
//             cursor: "pointer",
//           }}
//         >
//           4. Filtered (Submitted)
//         </button>
//         <button
//           type="button"
//           onClick={() => setDevState("filtered-graded")}
//           style={{
//             padding: "5px 12px",
//             fontSize: "12px",
//             fontWeight: 650,
//             borderRadius: "6px",
//             border: "1px solid",
//             borderColor: devState === "filtered-graded" ? "#20a862" : "#cbd5e1",
//             background: devState === "filtered-graded" ? "#eefaf2" : "#ffffff",
//             color: devState === "filtered-graded" ? "#15803d" : "#475569",
//             cursor: "pointer",
//           }}
//         >
//           5. Filtered (Graded)
//         </button>
//       </div>

//       <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, padding: "20px", gap: 0, overflow: "hidden" }}>
//         <AssignmentsWorkspace devState={devState} key={devState} />
//       </div>
//     </div>
//   );
// }
// import { PageBreadcrumb } from "../../components/ui/PageBreadcrumb";
// import { BreadcrumbEcg } from "../../components/ui/PageBreadcrumb/BreadcrumbEcg";

// function BreadcrumbPreview() {
//   return (
//     <div style={{ padding: "40px", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px", fontFamily: "system-ui, sans-serif" }}>
//       <div>
//         <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px" }}>
//           Signature Canvas ECG Breadcrumb Preview
//         </h1>
//         <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
//           Oscilloscope sweep animation with anatomical P-Q-R-S-T cardiac cycle beneath the active page heading.
//         </p>
//       </div>

//       {/* Mocked Student Dashboard Topbar (Light) */}
//       <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
//         <span style={{ fontSize: "13px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.08em" }}>
//           1. In-Context Student Topbar (Height: 76px) — Dashboard
//         </span>
//         <div style={{
//           height: "76px",
//           display: "flex",
//           alignItems: "center",
//           padding: "0 28px",
//           border: "1px solid #e5ebe7",
//           borderRadius: "12px",
//           background: "#ffffff"
//         }}>
//           <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Dashboard" />
//         </div>
//       </div>

//       {/* Multi-level Trail */}
//       <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
//         <span style={{ fontSize: "13px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.08em" }}>
//           2. Multi-level Trail (Lesson Player)
//         </span>
//         <div style={{
//           height: "76px",
//           display: "flex",
//           alignItems: "center",
//           padding: "0 28px",
//           border: "1px solid #e5ebe7",
//           borderRadius: "12px",
//           background: "#ffffff"
//         }}>
//           <PageBreadcrumb
//             trail={[
//               { label: "MY COURSES", to: "/my-courses" },
//               { label: "ANATOMY & PHYSIOLOGY", to: "/my-courses/bio-101" },
//             ]}
//             title="Lesson Player"
//           />
//         </div>
//       </div>

//       {/* Detail Trail */}
//       <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
//         <span style={{ fontSize: "13px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.08em" }}>
//           3. Section Detail (Settings & Assignments)
//         </span>
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           <div style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 24px", border: "1px solid #e5ebe7", borderRadius: "12px", background: "#ffffff" }}>
//             <PageBreadcrumb trail={[{ label: "LEARNING SPACE", to: "/" }]} title="Settings" />
//           </div>
//           <div style={{ height: "64px", display: "flex", alignItems: "center", padding: "0 24px", border: "1px solid #e5ebe7", borderRadius: "12px", background: "#ffffff" }}>
//             <PageBreadcrumb
//               trail={[
//                 { label: "LEARNING SPACE", to: "/" },
//                 { label: "ASSIGNMENTS", to: "/assignments" },
//               ]}
//               title="Assignment details"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Dark Mode Card */}
//       <div style={{ background: "#0b1329", borderRadius: "16px", border: "1px solid #1e293b", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
//         <span style={{ fontSize: "13px", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.08em" }}>
//           4. Dark Mode Variant (#34d399 trace)
//         </span>
//         <div style={{
//           height: "76px",
//           display: "flex",
//           alignItems: "center",
//           padding: "0 28px",
//           border: "1px solid #1e293b",
//           borderRadius: "12px",
//           background: "#0f172a"
//         }}>
//           <div style={{ color: "#34d399" }}>
//             <PageBreadcrumb
//               trail={[{ label: "LEARNING SPACE", to: "/" }]}
//               title="Cardiology & Vital Signs"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Raw Oscilloscope Canvas Component */}
//       <div style={{ background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
//         <span style={{ fontSize: "13px", fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.08em" }}>
//           5. Standalone BreadcrumbEcg Canvas (Various Rates)
//         </span>
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" }}>
//           <div>
//             <span style={{ fontSize: "12px", color: "#64748b" }}>Normal Sinus Rhythm (72 BPM)</span>
//             <div style={{ position: "relative", width: "100%", height: "24px", background: "#f8fafc", borderRadius: "6px", overflow: "hidden", color: "#047857", marginTop: "4px" }}>
//               <BreadcrumbEcg bpm={72} />
//             </div>
//           </div>
//           <div>
//             <span style={{ fontSize: "12px", color: "#64748b" }}>Bradycardia (52 BPM)</span>
//             <div style={{ position: "relative", width: "100%", height: "24px", background: "#f8fafc", borderRadius: "6px", overflow: "hidden", color: "#0284c7", marginTop: "4px" }}>
//               <BreadcrumbEcg bpm={52} />
//             </div>
//           </div>
//           <div>
//             <span style={{ fontSize: "12px", color: "#64748b" }}>Tachycardia (115 BPM)</span>
//             <div style={{ position: "relative", width: "100%", height: "24px", background: "#f8fafc", borderRadius: "6px", overflow: "hidden", color: "#e11d48", marginTop: "4px" }}>
//               <BreadcrumbEcg bpm={115} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export const publicRoutes: RouteObject[] = [
  ...(import.meta.env.DEV
    ? [
        // {
        //   path: "/test-breadcrumb",
        //   element: <BreadcrumbPreview />,
        // },
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
        // {
        //   path: "/test-assignments",
        //   element: <DevAssignmentsPreview />,
        // },
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
